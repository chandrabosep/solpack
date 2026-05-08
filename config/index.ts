import { clusterApiUrl, type Cluster } from "@solana/web3.js";

export const SOLANA_CLUSTER: Cluster =
  (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as Cluster) || "devnet";

export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() ||
  clusterApiUrl(SOLANA_CLUSTER);

// USDC mint on whichever cluster we're pointed at.
// Devnet: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
// Mainnet: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
export const USDC_MINT =
  process.env.NEXT_PUBLIC_USDC_MINT?.trim() ||
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

// USDC has 6 decimals on Solana.
export const USDC_DECIMALS = 6;
