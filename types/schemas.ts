import { z } from "zod";
import type { PricingModel } from "./constants";

const pricingModelSchema = z.enum([
  "per_device",
  "subscription",
  "per_user",
] as const satisfies readonly PricingModel[]);

const currencySchema = z.enum(["USDC", "SOL"]);

// Solana base58 addresses are 32-44 chars.
const solanaAddressSchema = z
  .string()
  .min(32)
  .max(44)
  .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Must be a Solana base58 address");

// --- Project CRUD --------------------------------------------------------

export const projectCreateSchema = z.object({
  name: z.string().min(1).max(120),
  pricingModel: pricingModelSchema,
  price: z.number().min(0),
  paymentAddress: solanaAddressSchema,
  currency: currencySchema.default("USDC"),
});

export const projectUpdateSchema = z.object({
  projectId: z.string().min(1),
  paymentAddress: solanaAddressSchema.optional(),
  currency: currencySchema.optional(),
  price: z.number().min(0).optional(),
  pricingModel: pricingModelSchema.optional(),
});

export const projectRotateSchema = z.object({
  projectId: z.string().min(1),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type ProjectRotateInput = z.infer<typeof projectRotateSchema>;

// --- Install flow (Solana x402) -----------------------------------------

const installAuthSchema = z.object({
  projectId: z.coerce.string().trim().min(1).max(64),
  apiKey: z.coerce.string().trim().min(1).max(256),
});

const optionalString = (maxLen: number) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) =>
      v === undefined || v === null ? undefined : String(v).trim() || undefined,
    )
    .pipe(z.string().max(maxLen).optional());

export const installStartSchema = installAuthSchema.extend({
  deviceId: optionalString(256),
  version: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === undefined || v === null ? "0.0.0" : String(v)))
    .pipe(z.string().max(64)),
});
export type InstallStartInput = z.infer<typeof installStartSchema>;

export const installStatusSchema = installAuthSchema.extend({
  deviceId: z.string().max(256).optional(),
  version: z.string().max(64).optional(),
  sessionToken: z.string().min(1).max(256).optional(),
});
export type InstallStatusInput = z.infer<typeof installStatusSchema>;

export const installConfirmSchema = z.object({
  projectId: z.string().min(1).max(64),
  apiKey: z.string().min(1).max(256),
  sessionToken: z.string().min(1).max(256),
});
export type InstallConfirmInput = z.infer<typeof installConfirmSchema>;

/**
 * Verify payment from the pay page. On Solana the payment is a single tx
 * submitted by the user's wallet, identified by its base58 signature.
 */
export const installVerifySchema = z.object({
  sessionToken: z.string().min(1).max(256),
  signature: z.string().min(32).max(128),
});
export type InstallVerifyInput = z.infer<typeof installVerifySchema>;
