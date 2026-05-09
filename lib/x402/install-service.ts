import { prisma } from "@/lib/prisma/client";
import { verifyPaymentOnChain } from "@/lib/payments/verify-onchain";
import type { Currency, PricingModel } from "@/types/constants";
import type {
  InstallStartInput,
  InstallStatusInput,
  InstallConfirmInput,
  InstallVerifyInput,
} from "@/types/schemas";
import type { Prisma } from "@/lib/generated/prisma/index";

/**
 * Mirrors hack-money-xpack's install-service shape (start / status / confirm
 * / verify) so the API surface stays identical. Only the on-chain
 * verification differs because we're on Solana (SPL token / system transfer)
 * instead of EVM ERC-20 transfers.
 */

export type InstallDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: string;
      payment: {
        price: number;
        address: string;
        currency: Currency;
        sessionToken: string;
        instructions: string;
      };
    };

const EMPTY_PAYMENT = {
  price: 0,
  address: "",
  currency: "USDC" as Currency,
  sessionToken: "",
  instructions: "",
};

function paymentInstructionsBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;
  if (url && typeof url === "string") {
    const trimmed = url.trim().replace(/\/$/, "");
    if (trimmed.length > 0) return trimmed;
  }
  return "http://localhost:3000";
}

function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 32; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function validateProjectApiKey(projectId: string, apiKey: string) {
  const key = await prisma.apiKey.findFirst({
    where: { projectId, value: apiKey, rotatedAt: null },
    include: {
      project: {
        include: {
          pricingRules: { orderBy: { id: "asc" }, take: 1 },
        },
      },
    },
  });
  if (!key?.project) return null;
  return { project: key.project, apiKey: key };
}

function paymentRequired(
  project: {
    paymentAddress: string;
    currency: string | null;
    pricingRules: { amount: number }[];
  },
  sessionToken: string,
): InstallDecision {
  const price = project.pricingRules[0]?.amount ?? 0;
  const currency = ((project.currency ?? "USDC") as Currency);
  const base = paymentInstructionsBaseUrl();
  const instructions = `${base}/pay?session=${encodeURIComponent(sessionToken)}`;
  return {
    allowed: false,
    reason: "Payment required to install this package",
    payment: {
      price,
      address: project.paymentAddress,
      currency,
      sessionToken,
      instructions,
    },
  };
}

// --- Public API ---------------------------------------------------------

export async function startInstall(
  body: InstallStartInput,
): Promise<InstallDecision> {
  const validated = await validateProjectApiKey(body.projectId, body.apiKey);
  if (!validated) {
    return {
      allowed: false,
      reason: "Invalid project or API key",
      payment: { ...EMPTY_PAYMENT },
    };
  }

  const { project } = validated;
  const sessionToken = generateSessionToken();
  await prisma.installAttempt.create({
    data: {
      projectId: project.id,
      status: "payment_required",
      sessionToken,
    },
  });

  return paymentRequired(project, sessionToken);
}

export async function checkInstallStatus(
  body: InstallStatusInput,
): Promise<InstallDecision> {
  const validated = await validateProjectApiKey(body.projectId, body.apiKey);
  if (!validated) {
    return {
      allowed: false,
      reason: "Invalid project or API key",
      payment: { ...EMPTY_PAYMENT },
    };
  }

  const { project } = validated;

  if (body.sessionToken) {
    const attempt = await prisma.installAttempt.findUnique({
      where: { sessionToken: body.sessionToken },
      select: { projectId: true, status: true },
    });
    if (attempt && attempt.projectId === body.projectId) {
      if (attempt.status === "allowed") return { allowed: true };
      return paymentRequired(project, body.sessionToken);
    }
  }

  // No (valid) session yet: open a new one.
  const sessionToken = generateSessionToken();
  await prisma.installAttempt.create({
    data: {
      projectId: project.id,
      status: "payment_required",
      sessionToken,
    },
  });
  return paymentRequired(project, sessionToken);
}

export async function confirmInstall(
  body: InstallConfirmInput,
): Promise<InstallDecision> {
  const validated = await validateProjectApiKey(body.projectId, body.apiKey);
  if (!validated) {
    return {
      allowed: false,
      reason: "Invalid project or API key",
      payment: { ...EMPTY_PAYMENT },
    };
  }

  const attempt = await prisma.installAttempt.findUnique({
    where: { sessionToken: body.sessionToken },
    select: { projectId: true, status: true },
  });
  if (!attempt || attempt.projectId !== body.projectId) {
    return {
      allowed: false,
      reason: "Invalid or expired session",
      payment: { ...EMPTY_PAYMENT },
    };
  }
  if (attempt.status === "allowed") return { allowed: true };
  return paymentRequired(validated.project, body.sessionToken);
}

/**
 * Pay-page submission. Loads the install attempt by sessionToken, verifies
 * the on-chain Solana transaction, and on success marks the attempt as
 * payment_completed → allowed.
 */
export async function verifyPaymentForSession(
  body: InstallVerifyInput,
): Promise<{ verified: true } | { verified: false; reason: string }> {
  const attempt = await prisma.installAttempt.findUnique({
    where: { sessionToken: body.sessionToken },
    include: {
      project: {
        include: { pricingRules: { orderBy: { id: "asc" }, take: 1 } },
      },
    },
  });
  if (!attempt || !attempt.project) {
    return { verified: false, reason: "Unknown session" };
  }
  if (attempt.status === "allowed") {
    return { verified: true };
  }

  const expectedAmount = attempt.project.pricingRules[0]?.amount ?? 0;
  const currency = ((attempt.project.currency ?? "USDC") as Currency);
  const recipient = attempt.project.paymentAddress;

  const result = await verifyPaymentOnChain({
    signature: body.signature,
    recipient,
    expectedAmount,
    currency,
  });
  if (!result.verified) {
    await prisma.installAttempt.update({
      where: { id: attempt.id },
      data: { status: "failed", signature: body.signature, amount: expectedAmount },
    });
    return { verified: false, reason: result.reason };
  }

  await prisma.installAttempt.update({
    where: { id: attempt.id },
    data: { status: "allowed", signature: body.signature, amount: expectedAmount },
  });
  return { verified: true };
}

// --- Listing / stats (unchanged shape from xpack-v2) --------------------

export async function listInstallAttempts(input: {
  walletAddress: string;
  projectId?: string;
  cursor?: string;
  limit?: number;
}) {
  const developer = await prisma.developer.findUnique({
    where: { walletAddress: input.walletAddress },
  });
  if (!developer) {
    return { items: [], nextCursor: null as string | null };
  }
  const limit = input.limit ?? 30;
  const where: Prisma.InstallAttemptWhereInput = input.projectId
    ? { projectId: input.projectId, project: { developerId: developer.id } }
    : { project: { developerId: developer.id } };

  const items = await prisma.installAttempt.findMany({
    where,
    include: { project: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = items.length > limit;
  const slice = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? slice[slice.length - 1]?.id ?? null : null;
  return { items: slice, nextCursor };
}

export async function getDashboardStats(input: {
  walletAddress: string;
  projectId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  const developer = await prisma.developer.findUnique({
    where: { walletAddress: input.walletAddress },
    include: { projects: { select: { id: true } } },
  });
  if (!developer) {
    return { activeProjects: 0, installs: 0, totalPayments: 0 };
  }

  const projectIds = developer.projects.map((p) => p.id);
  const filteredProjectIds = input.projectId
    ? projectIds.filter((id) => id === input.projectId)
    : projectIds;
  if (filteredProjectIds.length === 0) {
    return { activeProjects: 0, installs: 0, totalPayments: 0 };
  }

  const where: Prisma.InstallAttemptWhereInput = {
    projectId: { in: filteredProjectIds },
    ...(input.dateFrom || input.dateTo
      ? {
          createdAt: {
            ...(input.dateFrom ? { gte: input.dateFrom } : {}),
            ...(input.dateTo ? { lte: input.dateTo } : {}),
          },
        }
      : {}),
  };

  const installs = await prisma.installAttempt.count({
    where: { ...where, status: "allowed" },
  });
  const sumRow = await prisma.installAttempt.aggregate({
    where: { ...where, status: "allowed" },
    _sum: { amount: true },
  });

  return {
    activeProjects: filteredProjectIds.length,
    installs,
    totalPayments: sumRow._sum.amount ?? 0,
  };
}

/** Used by other code paths that just want to log a status row. */
export async function recordInstallAttempt(input: {
  projectId: string;
  status: string;
  amount?: number | null;
  signature?: string | null;
  sessionToken?: string | null;
}) {
  return prisma.installAttempt.create({
    data: {
      projectId: input.projectId,
      status: input.status,
      amount: input.amount ?? null,
      signature: input.signature ?? null,
      sessionToken: input.sessionToken ?? null,
    },
  });
}

// Avoid an unused-import lint warning for PricingModel in some build modes.
export type _PricingModelMarker = PricingModel;
