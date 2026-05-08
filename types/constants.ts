export type PricingModel = "per_device" | "subscription" | "per_user";

export type Currency = "USDC" | "SOL";

/** x402 HTTP headers for payment-required responses */
export const X402_HEADERS = {
  price: "X-Payment-Price",
  address: "X-Payment-Address",
  session: "X-Payment-Session",
  instructions: "X-Payment-Instructions",
  currency: "X-Payment-Currency",
} as const;
