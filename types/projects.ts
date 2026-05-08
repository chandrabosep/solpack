import type { Currency, PricingModel } from "./constants";

export interface ProjectSummary {
  id: string;
  name: string;
  pricingModel: PricingModel;
  paymentAddress: string; // Solana base58
  currency: Currency;
  price: number | null;
  apiKeyValue: string | null;
  createdAt: string;
  /** Kept for compatibility with shared row/card components. Always "solana" for now. */
  receiveMode?: string | null;
}
