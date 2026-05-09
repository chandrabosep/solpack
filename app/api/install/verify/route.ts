import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { installVerifySchema } from "@/types/schemas";
import { verifyPaymentForSession } from "@/lib/x402/install-service";

/**
 * POST /api/install/verify
 * Body: { sessionToken, signature }
 *
 * The pay page calls this with the Solana transaction signature after the
 * user signs and the cluster confirms. We look up the install attempt by
 * sessionToken, verify the signature on-chain via getParsedTransaction, and
 * mark the attempt as `allowed` on success.
 */
export async function POST(request: NextRequest) {
  try {
    const body = installVerifySchema.parse(await request.json());
    const result = await verifyPaymentForSession(body);
    if (!result.verified) {
      return NextResponse.json(
        { verified: false, reason: result.reason },
        { status: 400 },
      );
    }
    return NextResponse.json({ verified: true });
  } catch (error) {
    if (error instanceof ZodError) {
      const first = error.errors[0];
      const msg = first
        ? `${first.path.join(".")}: ${first.message}`
        : "Validation failed";
      return NextResponse.json(
        { error: `Invalid request: ${msg}` },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    );
  }
}
