import {
  Connection,
  PublicKey,
  type ParsedTransactionWithMeta,
} from "@solana/web3.js";
import { SOLANA_RPC_URL, USDC_DECIMALS, USDC_MINT } from "@/config";

export type VerifyResult =
  | { verified: true }
  | { verified: false; reason: string };

const LAMPORTS_PER_SOL = 1_000_000_000;

/**
 * Verify a Solana payment by signature. Confirms the tx succeeded and
 * contains a transfer of at least `expectedAmount` of `currency` to `recipient`.
 *
 * For USDC: looks at parsed SPL token transfers (transfer / transferChecked)
 *           where mint == USDC_MINT and destination ATA owner == recipient.
 * For SOL:  looks at parsed system program transfers to recipient.
 */
export async function verifyPaymentOnChain(args: {
  signature: string;
  recipient: string;
  expectedAmount: number; // human units
  currency: "USDC" | "SOL";
}): Promise<VerifyResult> {
  const { signature, recipient, expectedAmount, currency } = args;
  const connection = new Connection(SOLANA_RPC_URL, "confirmed");

  let tx: ParsedTransactionWithMeta | null = null;
  try {
    tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
  } catch (e) {
    return {
      verified: false,
      reason: e instanceof Error ? e.message : "RPC error",
    };
  }

  if (!tx) return { verified: false, reason: "Transaction not found" };
  if (tx.meta?.err) {
    return {
      verified: false,
      reason: `Transaction failed: ${JSON.stringify(tx.meta.err)}`,
    };
  }

  const recipientPk = safePubkey(recipient);
  if (!recipientPk) return { verified: false, reason: "Bad recipient address" };

  const instructions = tx.transaction.message.instructions ?? [];

  if (currency === "SOL") {
    const expectedLamports = Math.round(expectedAmount * LAMPORTS_PER_SOL);
    for (const ix of instructions) {
      if (!("parsed" in ix)) continue;
      const p = ix.parsed as
        | { type?: string; info?: { destination?: string; lamports?: number } }
        | undefined;
      if (ix.program !== "system") continue;
      if (p?.type !== "transfer") continue;
      if (p.info?.destination !== recipient) continue;
      if (typeof p.info.lamports !== "number") continue;
      if (p.info.lamports >= expectedLamports) return { verified: true };
    }
    return {
      verified: false,
      reason: "No SOL system-program transfer of required amount to recipient",
    };
  }

  // USDC (SPL token)
  const expectedRaw = BigInt(
    Math.round(expectedAmount * 10 ** USDC_DECIMALS),
  );

  for (const ix of instructions) {
    if (!("parsed" in ix)) continue;
    if (ix.program !== "spl-token") continue;
    const p = ix.parsed as
      | {
          type?: string;
          info?: {
            mint?: string;
            destination?: string;
            amount?: string;
            tokenAmount?: { amount?: string; decimals?: number };
          };
        }
      | undefined;
    if (!p) continue;
    if (p.type !== "transfer" && p.type !== "transferChecked") continue;

    // For transferChecked, mint is on info.mint. For plain transfer, we have
    // to resolve via postTokenBalances. Cheap path: just check the post balance
    // change against the destination ATA below.
    if (p.type === "transferChecked" && p.info?.mint !== USDC_MINT) continue;

    const destAta = p.info?.destination;
    if (!destAta) continue;

    // Confirm destination ATA belongs to recipient and is for USDC mint.
    const destOk = ataMatches(tx, destAta, recipientPk, USDC_MINT);
    if (!destOk) continue;

    // Amount: prefer info.tokenAmount.amount (transferChecked), fall back to
    // info.amount (plain transfer).
    const rawStr =
      p.info?.tokenAmount?.amount ??
      (typeof p.info?.amount === "string" ? p.info.amount : undefined);
    if (!rawStr) continue;
    let raw: bigint;
    try {
      raw = BigInt(rawStr);
    } catch {
      continue;
    }
    if (raw >= expectedRaw) return { verified: true };
  }

  return {
    verified: false,
    reason: "No SPL USDC transfer of required amount to recipient",
  };
}

function safePubkey(s: string): PublicKey | null {
  try {
    return new PublicKey(s);
  } catch {
    return null;
  }
}

function ataMatches(
  tx: ParsedTransactionWithMeta,
  ataAddress: string,
  expectedOwner: PublicKey,
  expectedMint: string,
): boolean {
  const post = tx.meta?.postTokenBalances ?? [];
  const accountKeys = tx.transaction.message.accountKeys ?? [];
  for (const tb of post) {
    const idx = tb.accountIndex;
    const acct = accountKeys[idx];
    if (!acct) continue;
    const acctStr =
      typeof acct === "string"
        ? acct
        : "pubkey" in acct
          ? acct.pubkey.toString()
          : "";
    if (acctStr !== ataAddress) continue;
    if (tb.mint !== expectedMint) return false;
    if (tb.owner !== expectedOwner.toString()) return false;
    return true;
  }
  return false;
}
