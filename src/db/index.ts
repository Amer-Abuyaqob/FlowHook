/**
 * FlowHook database client and exports.
 * Provides Drizzle client (when DATABASE_URL is set), schema, and domain types.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "../config.js";
import * as schema from "./schema.js";

let conn: ReturnType<typeof drizzle> | undefined;

if (config.db.url) {
  const pool = new Pool({ connectionString: config.db.url });
  conn = drizzle(pool, { schema });
  console.log("Connected to database!");
} else {
  console.log("DATABASE_URL environment variable is not set");
  console.log("Running without CRUD endpoints");
}

/** Drizzle ORM client with schema for typed queries; undefined when DATABASE_URL is not set. */
export const db = conn;

/**
 * Asserts that the database connection is available.
 * Call with the db export to narrow its type for subsequent use.
 *
 * @param dbRef - The db export (e.g. db from this module).
 * @throws {Error} When dbRef is undefined (DATABASE_URL not set).
 */
export function assertDbConnection(
  dbRef: typeof db,
): asserts dbRef is NonNullable<typeof db> {
  if (!dbRef) {
    throw new Error("Database connection is not available");
  }
}

export * from "./schema.js";
export * from "./types.js";
