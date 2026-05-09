import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { USDC_MINT, SOLANA_CLUSTER } from "@/config";
import type { Currency } from "@/types/constants";

/**
 * GET /api/install/session?session=<sessionToken>
 *
 * Public: no apiKey required. The pay page reads payment details for a
 * session and renders the checkout. Mirrors xpack-v2's GET /api/install/session
 * shape so the pay-page contract stays the same — only the payment fields
 * are Solana-flavoured (mint instead of token contract, etc.).
 */
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.nextUrl.searchParams.get("session");
    if (!sessionToken?.trim()) {
      return NextResponse.json(
        { error: "Missing session parameter" },
        { status: 400 },
      );
    }

    const attempt = await prisma.installAttempt.findUnique({
      where: { sessionToken: sessionToken.trim() },
      include: {
        project: {
          include: { pricingRules: { orderBy: { id: "asc" }, take: 1 } },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Unknown or expired session" },
        { status: 404 },
      );
    }

    const status = attempt.status;
    const project = attempt.project;
    const price = project.pricingRules[0]?.amount ?? 0;
    const currency = (project.currency ?? "USDC") as Currency;

    return NextResponse.json({
      sessionToken: attempt.sessionToken,
      status,
      projectName: project.name,
      pricingModel: project.pricingModel,
      price,
      currency,
      address: project.paymentAddress,
      cluster: SOLANA_CLUSTER,
      tokenMint: currency === "USDC" ? USDC_MINT : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load session" },
      { status: 500 },
    );
  }
}
