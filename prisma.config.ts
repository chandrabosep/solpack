import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // For migrations, use the direct (non-pooled) Supabase connection.
  datasource: {
    url: env("DIRECT_URL"),
  },
});
