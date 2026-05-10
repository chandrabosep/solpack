import { NextRequest, NextResponse } from "next/server";
import { clusterApiUrl } from "@solana/web3.js";
import { prisma } from "@/lib/prisma/client";
import { verifyPaymentOnChain } from "@/lib/payments/verify-onchain";
import { LIFI_DEST_USDC_MINT } from "@/config";

/**
 * POST /api/install/verify-lifi
 * Body: { sessionToken, signature }
 *
 * Verification path used by the LI.FI cross-chain flow.
 *
 * Differences from /api/install/verify:
 *   - Always queries Solana **mainnet** RPC, regardless of the project's
 *     configured cluster. LI.FI is mainnet-only, so the destination tx
 *     lives on mainnet even when the rest of the app is running against
 *     devnet for local testing.
 *   - Matches the **mainnet USDC mint** (EPjFWdd5…) instead of whatever
 *     the project has configured.
 *   - Allows a 0.5% slippage tolerance on the delivered amount, since
 *     bridges can finalize slightly under the requested toAmount.
 *   - Recognises bridge-style fills that don't emit a parsed SPL
 *     transfer instruction (Across releases, CCTP mints, Mayan settle
 *     CPIs) by reading the recipient ATA's pre/post balance delta.
 */

const SOLANA_MAINNET_RPC =
  process.env.SOLANA_MAINNET_RPC_URL?.trim() ||
  process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC_URL?.trim() ||
  clusterApiUrl("mainnet-beta");

const SLIPPAGE_TOLERANCE = 0.005; // 0.5%

export async function POST(request: NextRequest) {
  let body: { sessionToken?: string; signature?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.sessionToken || !body?.signature) {
    return NextResponse.json(
      { error: "sessionToken and signature are required" },
      { status: 400 },
    );
  }

  const attempt = await prisma.installAttempt.findUnique({
    where: { sessionToken: body.sessionToken },
    include: {
      project: {
        include: { pricingRules: { orderBy: { id: "asc" }, take: 1 } },
      },
    },
  });
  if (!attempt || !attempt.project) {
    return NextResponse.json(
      { verified: false, reason: "Unknown session" },
      { status: 404 },
    );
  }
  if (attempt.status === "allowed") {
    return NextResponse.json({ verified: true });
  }

  const expectedAmount = attempt.project.pricingRules[0]?.amount ?? 0;
  const recipient = attempt.project.paymentAddress;

  const result = await verifyPaymentOnChain({
    signature: body.signature,
    recipient,
    expectedAmount,
    currency: "USDC",
    rpcUrl: SOLANA_MAINNET_RPC,
    tokenMint: LIFI_DEST_USDC_MINT,
    tolerance: SLIPPAGE_TOLERANCE,
  });

  if (!result.verified) {
    await prisma.installAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "failed",
        signature: body.signature,
        amount: expectedAmount,
      },
    });
    return NextResponse.json(
      { verified: false, reason: result.reason },
      { status: 400 },
    );
  }

  await prisma.installAttempt.update({
    where: { id: attempt.id },
    data: {
      status: "allowed",
      signature: body.signature,
      amount: expectedAmount,
    },
  });
  return NextResponse.json({ verified: true });
}
