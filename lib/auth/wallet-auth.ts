import type { NextRequest } from "next/server";

/**
 * Pull a Solana wallet address from request headers.
 * Note: this is identification, not authentication — there's no signature
 * verification yet. Production should require a signed message header.
 */
export function requireWalletAddressFromHeaders(req: NextRequest): string {
  const value = req.headers.get("x-wallet-address");
  if (!value) {
    throw new Error("Missing x-wallet-address header");
  }
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Empty wallet address");
  // Don't lowercase — Solana addresses are base58 and case-sensitive.
  return trimmed;
}
