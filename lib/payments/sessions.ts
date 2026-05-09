/**
 * @deprecated In-memory session store has been removed. Session tokens are
 * persisted on `InstallAttempt.sessionToken` in Postgres and managed by
 * `lib/x402/install-service.ts`. This file remains only as a stub so older
 * imports of `Currency` continue to compile. Remove once nothing imports it.
 */
export type Currency = "USDC" | "SOL";
export type PaymentSession = never;
