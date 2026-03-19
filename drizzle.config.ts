/**
 * Drizzle Kit configuration for schema introspection, migrations, and code generation.
 * Used by drizzle-kit CLI (generate, push, introspect, etc.).
 *
 * Environment variables:
 * - DATABASE_URL - PostgreSQL connection string (required for migrations)
 */
import { defineConfig } from "drizzle-kit";
import { config } from "./src/config.js";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: config.db.url ?? "",
  },
});
