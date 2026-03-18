/**
 * FlowHook database client and exports.
 * Provides Drizzle client, schema, and domain types.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

/**
 * Resolves the PostgreSQL connection string from environment.
 *
 * @returns Connection string; falls back to local dev default if env vars unset.
 */
export function getConnectionString(): string {
  return (
    process.env.DATABASE_URL ??
    process.env.DB_URL ??
    ""
  );
}

const pool = new Pool({ connectionString: getConnectionString() });

/** Drizzle ORM client with schema for typed queries. */
export const db = drizzle(pool, { schema });

export * from "./schema.js";
export * from "./types.js";
