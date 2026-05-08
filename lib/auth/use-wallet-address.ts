"use client";

import { useWallet } from "@solana/wallet-adapter-react";

/** Returns the connected Solana wallet address (base58) or null. */
export function useWalletAddress(): string | null {
  const { publicKey, connected } = useWallet();
  if (!connected || !publicKey) return null;
  return publicKey.toBase58();
}
