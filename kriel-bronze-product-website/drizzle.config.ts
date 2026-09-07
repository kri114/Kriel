import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * Optional tooling only — NOT used by the static site.
 * Lets you run `npx drizzle-kit push` against your Supabase Postgres
 * (Settings → Database → Connection string) if you prefer that over
 * running supabase/schema.sql. RLS policies are still only in schema.sql.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
  },
});
