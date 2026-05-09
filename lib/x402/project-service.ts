import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma/client";
import type { ProjectSummary } from "@/types/projects";
import type { ProjectCreateInput, ProjectUpdateInput } from "@/types/schemas";
import type { Currency, PricingModel } from "@/types/constants";

function newApiKey(): string {
  return "sk_solpack_" + randomBytes(20).toString("hex");
}

function toSummary(p: {
  id: string;
  name: string;
  pricingModel: string;
  paymentAddress: string;
  currency: string;
  createdAt: Date;
  apiKeys: { value: string }[];
  pricingRules: { amount: number }[];
}): ProjectSummary {
  return {
    id: p.id,
    name: p.name,
    pricingModel: p.pricingModel as PricingModel,
    paymentAddress: p.paymentAddress,
    currency: (p.currency as Currency) ?? "USDC",
    price: p.pricingRules[0]?.amount ?? null,
    apiKeyValue: p.apiKeys[0]?.value ?? null,
    createdAt: p.createdAt.toISOString(),
    receiveMode: "solana",
  };
}

export async function listProjects(walletAddress: string): Promise<ProjectSummary[]> {
  const developer = await prisma.developer.findUnique({
    where: { walletAddress },
    include: {
      projects: {
        include: {
          apiKeys: { orderBy: { createdAt: "desc" }, take: 1 },
          pricingRules: { orderBy: { id: "asc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!developer) return [];
  return developer.projects.map(toSummary);
}

export async function getProjectById(
  projectId: string,
  walletAddress: string,
): Promise<ProjectSummary | null> {
  const developer = await prisma.developer.findUnique({
    where: { walletAddress },
  });
  if (!developer) return null;
  const project = await prisma.project.findFirst({
    where: { id: projectId, developerId: developer.id },
    include: {
      apiKeys: { orderBy: { createdAt: "desc" }, take: 1 },
      pricingRules: { orderBy: { id: "asc" }, take: 1 },
    },
  });
  if (!project) return null;
  return toSummary(project);
}

export async function getProjectByApiKey(projectId: string, apiKey: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId },
    include: {
      apiKeys: true,
      pricingRules: { orderBy: { id: "asc" }, take: 1 },
    },
  });
  if (!project) return null;
  const matched = project.apiKeys.find(
    (k) => k.value === apiKey && k.rotatedAt == null,
  );
  if (!matched) return null;
  return {
    id: project.id,
    name: project.name,
    paymentAddress: project.paymentAddress,
    currency: (project.currency as Currency) ?? "USDC",
    price: project.pricingRules[0]?.amount ?? 0,
  };
}

export async function createProject(
  body: ProjectCreateInput,
  walletAddress: string,
): Promise<ProjectSummary> {
  const developer = await prisma.developer.upsert({
    where: { walletAddress },
    create: { walletAddress },
    update: {},
  });

  const project = await prisma.project.create({
    data: {
      name: body.name,
      pricingModel: body.pricingModel,
      currency: body.currency ?? "USDC",
      paymentAddress: body.paymentAddress.trim(),
      developerId: developer.id,
    },
  });

  await prisma.pricingRule.create({
    data: {
      projectId: project.id,
      model: body.pricingModel,
      amount: body.price,
    },
  });

  const apiKey = await prisma.apiKey.create({
    data: {
      projectId: project.id,
      developerId: developer.id,
      value: newApiKey(),
    },
  });

  return {
    id: project.id,
    name: project.name,
    pricingModel: project.pricingModel as PricingModel,
    paymentAddress: project.paymentAddress,
    currency: project.currency as Currency,
    price: body.price,
    apiKeyValue: apiKey.value,
    createdAt: project.createdAt.toISOString(),
    receiveMode: "solana",
  };
}

export async function rotateApiKey(projectId: string, walletAddress: string) {
  const developer = await prisma.developer.findUnique({
    where: { walletAddress },
  });
  if (!developer) throw new Error("Developer not found");

  const project = await prisma.project.findFirst({
    where: { id: projectId, developerId: developer.id },
  });
  if (!project) throw new Error("Project not found");

  const [current] = await prisma.apiKey.findMany({
    where: { projectId, developerId: developer.id, rotatedAt: null },
    orderBy: { createdAt: "desc" },
    take: 1,
  });
  if (current) {
    await prisma.apiKey.update({
      where: { id: current.id },
      data: { rotatedAt: new Date() },
    });
  }

  const fresh = await prisma.apiKey.create({
    data: {
      projectId: project.id,
      developerId: developer.id,
      value: newApiKey(),
    },
  });

  return { id: fresh.id, value: fresh.value };
}

export async function updateProject(
  projectId: string,
  walletAddress: string,
  patch: Partial<Omit<ProjectUpdateInput, "projectId">>,
): Promise<ProjectSummary> {
  const developer = await prisma.developer.findUnique({
    where: { walletAddress },
  });
  if (!developer) throw new Error("Developer not found");
  const project = await prisma.project.findFirst({
    where: { id: projectId, developerId: developer.id },
  });
  if (!project) throw new Error("Project not found");

  const data: {
    paymentAddress?: string;
    currency?: string;
    pricingModel?: string;
  } = {};
  if (patch.paymentAddress) data.paymentAddress = patch.paymentAddress.trim();
  if (patch.currency) data.currency = patch.currency;
  if (patch.pricingModel) data.pricingModel = patch.pricingModel;

  if (Object.keys(data).length > 0) {
    await prisma.project.update({ where: { id: projectId }, data });
  }
  if (typeof patch.price === "number") {
    const [rule] = await prisma.pricingRule.findMany({
      where: { projectId },
      orderBy: { id: "asc" },
      take: 1,
    });
    if (rule) {
      await prisma.pricingRule.update({
        where: { id: rule.id },
        data: { amount: patch.price },
      });
    } else {
      await prisma.pricingRule.create({
        data: {
          projectId,
          model: patch.pricingModel ?? project.pricingModel,
          amount: patch.price,
        },
      });
    }
  }

  return (await getProjectById(projectId, walletAddress))!;
}

export async function deleteProject(projectId: string, walletAddress: string) {
  const developer = await prisma.developer.findUnique({
    where: { walletAddress },
  });
  if (!developer) throw new Error("Developer not found");
  const project = await prisma.project.findFirst({
    where: { id: projectId, developerId: developer.id },
  });
  if (!project) throw new Error("Project not found");

  await prisma.apiKey.deleteMany({ where: { projectId } });
  await prisma.pricingRule.deleteMany({ where: { projectId } });
  await prisma.installAttempt.deleteMany({ where: { projectId } });
  await prisma.project.delete({ where: { id: projectId } });
  return { id: projectId };
}
