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
 *
 * Optional overrides (used by the LI.FI mainnet path):
 *   - rpcUrl:      hit a different cluster's RPC (e.g. mainnet) regardless
 *                  of the project's configured cluster.
 *   - tokenMint:   match a different USDC mint (mainnet vs devnet).
 *   - tolerance:   accept payments slightly under expectedAmount to absorb
 *                  bridge slippage (fraction in [0..1], e.g. 0.005 = 0.5%).
 */
export async function verifyPaymentOnChain(args: {
  signature: string;
  recipient: string;
  expectedAmount: number; // human units
  currency: "USDC" | "SOL";
  rpcUrl?: string;
  tokenMint?: string;
  tolerance?: number;
}): Promise<VerifyResult> {
  const {
    signature,
    recipient,
    expectedAmount,
    currency,
    rpcUrl,
    tokenMint,
    tolerance = 0,
  } = args;
  const connection = new Connection(rpcUrl ?? SOLANA_RPC_URL, "confirmed");
  const usdcMint = tokenMint ?? USDC_MINT;

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
  const expectedRawExact = BigInt(
    Math.round(expectedAmount * 10 ** USDC_DECIMALS),
  );
  // Apply tolerance (e.g. 0.5%) to absorb bridge slippage on the LI.FI path.
  const expectedRaw =
    tolerance > 0
      ? (expectedRawExact * BigInt(Math.round((1 - tolerance) * 10_000))) /
        10_000n
      : expectedRawExact;

  // Path A — explicit SPL transfer/transferChecked instructions. This catches
  // direct wallet payments where the source signs a transfer to the recipient
  // ATA.
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
    if (p.type === "transferChecked" && p.info?.mint !== usdcMint) continue;

    const destAta = p.info?.destination;
    if (!destAta) continue;

    const destOk = ataMatches(tx, destAta, recipientPk, usdcMint);
    if (!destOk) continue;

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

  // Path B — bridge-style fills that *don't* show up as parsed SPL transfer
  // instructions (mint, CPI from a custom program, etc.). Compare the
  // recipient ATA's post-tx balance vs pre-tx balance and accept if it
  // increased by at least the expected amount.
  const balanceDelta = ataBalanceDelta(tx, recipientPk, usdcMint);
  if (balanceDelta !== null && balanceDelta >= expectedRaw) {
    return { verified: true };
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

/**
 * Returns the net change in the recipient's USDC ATA token balance for this
 * transaction (post - pre, in raw base units). Used to verify bridge-style
 * fills where there's no parsed `transfer` instruction we can match — e.g.
 * Across releases on Solana, Wormhole/Mayan mint+settle CPIs, etc.
 *
 * Returns null if the recipient's USDC ATA isn't touched by the tx.
 */
function ataBalanceDelta(
  tx: ParsedTransactionWithMeta,
  expectedOwner: PublicKey,
  expectedMint: string,
): bigint | null {
  const ownerStr = expectedOwner.toString();
  const pre = tx.meta?.preTokenBalances ?? [];
  const post = tx.meta?.postTokenBalances ?? [];

  const findEntry = (
    list: typeof pre,
  ): { idx: number; raw: bigint } | null => {
    for (const tb of list) {
      if (tb.mint !== expectedMint) continue;
      if (tb.owner !== ownerStr) continue;
      const rawStr = tb.uiTokenAmount?.amount;
      if (typeof rawStr !== "string") continue;
      let raw: bigint;
      try {
        raw = BigInt(rawStr);
      } catch {
        continue;
      }
      return { idx: tb.accountIndex, raw };
    }
    return null;
  };

  const postEntry = findEntry(post);
  if (!postEntry) return null;

  const preEntry = findEntry(pre);
  const preRaw = preEntry?.raw ?? 0n;

  return postEntry.raw - preRaw;
}
