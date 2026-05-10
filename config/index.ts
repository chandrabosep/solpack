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

// ---- LI.FI cross-chain payments -------------------------------------------
// Integrator key registered with LI.FI (https://portal.li.fi). Optional —
// without it the widget still works in unbranded mode.
export const LIFI_INTEGRATOR =
  process.env.NEXT_PUBLIC_LIFI_INTEGRATOR?.trim() || "solpack";

// LI.FI's numeric chain id for Solana (SVM).
export const LIFI_SOLANA_CHAIN_ID = 1151111081099710;

// USDC mint on Solana mainnet — LI.FI is mainnet-only, so even when the
// rest of the app is pointed at devnet we route LI.FI bridges into the
// mainnet USDC mint. The author's payout wallet receives the funds there;
// the verifier needs to be configured against mainnet RPC to confirm.
export const LIFI_DEST_USDC_MINT =
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
