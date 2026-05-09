import type { PrismaClient as GeneratedPrismaClient } from "../generated/prisma/index";
import { PrismaClient } from "../generated/prisma/index";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolConfig } from "pg";

/**
 * Singleton Prisma client backed by `pg` Pool via the Prisma adapter.
 *
 * Supabase connection strings:
 *   DATABASE_URL  - pooled (Transaction mode, port 6543) — used by the runtime
 *   DIRECT_URL    - direct (port 5432)                   — used by migrations
 *
 * NOTE: We don't pass `connectionString` to `new Pool()`. node-postgres's
 * connection-string parser has been known to throw "Invalid URL" on Supabase
 * pooler URLs (the `postgres.<ref>` username + `?pgbouncer=true` flag).
 * Parsing the URL ourselves with WHATWG `URL` and passing individual fields
 * is the boring, reliable path.
 */

function poolConfigFromUrl(raw: string | undefined): PoolConfig {
  if (!raw || !raw.trim()) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and fill in the Supabase connection strings.",
    );
  }
  // Strip surrounding quotes if .env was edited with quotes that didn't get
  // unwrapped (rare, but cheap to defend against).
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, "");

  let u: URL;
  try {
    u = new URL(trimmed);
  } catch (e) {
    throw new Error(
      `DATABASE_URL is not a valid URL: ${(e as Error).message}. Got: ${trimmed.slice(0, 60)}…`,
    );
  }

  const config: PoolConfig = {
    host: u.hostname,
    port: u.port ? Number(u.port) : 5432,
    user: u.username ? decodeURIComponent(u.username) : undefined,
    password: u.password ? decodeURIComponent(u.password) : undefined,
    database: u.pathname.replace(/^\//, "") || undefined,
    // Supabase pooler requires TLS; `rejectUnauthorized: false` matches the
    // common "no custom CA" setup most managed providers expect.
    ssl: { rejectUnauthorized: false },
    // Conservative pool sizing for the Next.js dev server.
    max: 5,
    idleTimeoutMillis: 30_000,
  };
  return config;
}

const globalForPrisma = global as unknown as {
  prisma?: GeneratedPrismaClient;
  pool?: Pool;
};

const pool = globalForPrisma.pool || new Pool(poolConfigFromUrl(process.env.DATABASE_URL));

if (process.env.NODE_ENV !== "production") globalForPrisma.pool = pool;

const adapter = new PrismaPg(pool);

export const prisma: GeneratedPrismaClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
