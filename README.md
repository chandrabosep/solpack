# Solpack

Solana payments infrastructure for npm package authors. Solpack lets authors of **clearly-labeled paid packages** accept on-chain USDC or SOL payments, verified server-side against the Solana RPC.

> **Responsible deployment.** Solpack is intended for packages that openly advertise themselves as paid. Authors using Solpack must:
>
> - Mark the package as paid in its name (e.g. `-paid` suffix), registry description, and README opener.
> - Print the cost and a refusal path in any preinstall message **before** opening a payment URL.
> - Never gate a package that was previously distributed for free without a major version bump and a clear NOTICE.
>
> Surprising users mid-install with a payment demand is not a supported use case. The included `config/package/preinstall.js` template prints the cost and a `Press Ctrl-C now to refuse` line up front — keep that messaging intact.

## Stack

- Next.js 15 (App Router)
- `@solana/wallet-adapter-react` + Phantom / Solflare adapters
- `@solana/web3.js` and `@solana/spl-token`
- Tailwind CSS v4
- TanStack Query for client state
- **Prisma 7 + Supabase Postgres** (via `@prisma/adapter-pg`)

## Quick start

```bash
npm install
cp .env.example .env
# fill in DATABASE_URL and DIRECT_URL from Supabase

npm run db:generate    # generate the Prisma client into lib/generated/prisma
npm run db:migrate     # apply migrations against your Supabase DB

npm run dev
```

Get devnet SOL from `solana airdrop` or [faucet.solana.com](https://faucet.solana.com), and devnet USDC from the [Circle faucet](https://faucet.circle.com).

### Supabase setup

1. Create a Supabase project.
2. **Project Settings → Database → Connection string** has two forms you need:
   - **Transaction (port 6543, pooler)** → `DATABASE_URL`. Used by the Next.js runtime. Append `?pgbouncer=true&connection_limit=1`.
   - **URI / Direct (port 5432)** → `DIRECT_URL`. Used by Prisma migrations.
3. Set both in `.env`. Then `npm run db:migrate` to apply schema.

If you'd rather run a local Postgres for dev, set both URLs to the same `postgresql://...:5432/...` string and skip Supabase.

## Pages

- `/` — Marketing landing
- `/dashboard` — Stats overview, package list, create package
- `/projects` — Project grid + create
- `/projects/[id]` — Project details, API key (rotate), inline-edit payout address, integration guide
- `/logs` — Install / payment event log (cursor pagination)
- `/pay/[sessionId]` — Payer-facing checkout

## Architecture

```
app/
  page.tsx                       Landing
  dashboard/page.tsx             Author dashboard (wallet-gated)
  projects/page.tsx              Project grid
  projects/[id]/page.tsx         Project detail (server reads preinstall.js)
  logs/page.tsx                  Install events
  pay/[sessionId]/page.tsx       Payer-facing checkout
  api/
    install/
      session/route.ts             POST  - create payment session
      session/[sessionId]/route    GET   - read session for pay page
      verify/route.ts              POST  - verify on-chain signature
      status/route.ts              GET   - poll session status
    projects/route.ts              GET POST PATCH DELETE - project CRUD
    projects/[id]/route.ts         GET   - one project
    dashboard/stats/route.ts       GET   - dashboard stats
    logs/route.ts                  GET   - install events (cursor pagination)
config/
  index.ts                       Cluster + USDC mint config
  package/preinstall.js          Preinstall script template (with cost banner)
context/index.tsx                Wallet adapter + RPC + react-query providers
controllers/                     React-Query hooks (queries + mutations)
components/
  common/                        Sidebar, layout shell, connect button
  landing-ui/                    Hero + reusable card
  projects/                      Project CRUD UI (cards, rows, form, detail)
  ui/                            shadcn-style primitives (radix-ui based)
lib/
  api/client.ts                  axios instance + per-request wallet header
  auth/
    use-wallet-address.ts          Solana wallet → base58 string
    wallet-auth.ts                 Server-side header parse (TODO: signature auth)
  generated/prisma/              Prisma generated client (gitignored)
  payments/sessions.ts           In-memory payment session store (15min TTL)
  payments/verify-onchain.ts     Solana RPC verification of SPL / SOL transfers
  prisma/client.ts               Prisma singleton (pg Pool + adapter)
  x402/
    project-service.ts             Prisma-backed project CRUD
    install-service.ts             Install-attempt logging + dashboard stats
  utils.ts
prisma/
  schema.prisma                  Developer / Project / ApiKey / PricingRule / InstallAttempt
prisma.config.ts                 Prisma config (uses DIRECT_URL for migrations)
query-keys/query-keys.ts         TanStack Query keys
types/                           Shared TS types + Zod schemas
```

## Schema

Modeled after hack-money-xpack but trimmed for Solana:

- **Developer** — by Solana wallet address (base58, case-sensitive)
- **Project** — `paymentAddress` (Solana base58), `currency` (`USDC` | `SOL`), `pricingModel`
- **ApiKey** — `value` (with `rotatedAt` for old keys)
- **PricingRule** — current price for the project
- **InstallAttempt** — `status` ∈ `attempt` / `payment_required` / `payment_completed` / `allowed` / `failed`, with optional `amount`, `signature`, `sessionToken`

Dropped from xpack-v2's schema (added back when needed): `Receipt`, `Device`, `Entitlement`, `receiveMode`, `unifiedReceiveAddress`, `suiAddress`.

## Payment flow

1. **Author** creates a project on `/projects`, copies the API key + project ID.
2. **Package** declares a `solpack` block in its `package.json` (projectId, apiKey, baseUrl) and ships the preinstall script.
3. **Installer** runs `npm install`. The preinstall script prints a cost banner, POSTs to `/api/install/session`, and opens the pay URL.
4. **Pay page** connects a Solana wallet, builds a `transferChecked` (USDC) or system-program transfer (SOL) to the project's payout address, and submits the signature to `/api/install/verify`.
5. The server fetches the parsed transaction via `getParsedTransaction` and confirms the transfer matches `amount`, `recipient`, `currency`. Session flips to `verified` and an `InstallAttempt(allowed)` is recorded.
6. The preinstall script (polling `/api/install/status`) sees `verified`, exits 0, install resumes.

## Verification

`lib/payments/verify-onchain.ts` checks:

- Transaction succeeded (no `meta.err`).
- For USDC: a parsed `spl-token` `transfer` / `transferChecked` instruction whose destination ATA belongs to the recipient and whose mint matches the configured USDC mint, with `amount >= expectedRaw`.
- For SOL: a parsed `system` `transfer` instruction whose destination matches the recipient, with `lamports >= expectedLamports`.

## Status

- [x] Wallet connect (Phantom + Solflare)
- [x] Pay page with USDC + SOL
- [x] On-chain verification
- [x] Project CRUD (Prisma + Supabase)
- [x] API key rotation, inline payout-address edit
- [x] Dashboard stats + filters
- [x] Logs page with cursor pagination
- [x] Preinstall script template with responsible-deployment defaults
- [ ] Wallet-signature auth (currently `x-wallet-address` header — identification only)
- [ ] `@solpack/preinstall` published as its own npm package
- [ ] Solana program for on-chain payment receipts (would also satisfy the Solana hackathon's "unique Rust program" requirement)

## License

MIT.
