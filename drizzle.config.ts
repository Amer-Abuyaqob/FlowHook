/**
 * Drizzle Kit configuration for schema introspection, migrations, and code generation.
 * Used by drizzle-kit CLI (generate, push, introspect, etc.).
 *
 * Environment variables:
 * - DATABASE_URL - PostgreSQL connection string (defaults to local dev URL if unset)
 */
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? process.env.DB_URL ?? "",
  },
});
