/**
 * Integration tests for db module.
 * Requires DATABASE_URL and a running Postgres with migrations applied.
 * Skipped when DATABASE_URL is not set.
 */
import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db, pipelines } from "./index.js";

const hasDbUrl =
  Boolean(process.env.DATABASE_URL) || Boolean(process.env.DB_URL);

describe.skipIf(!hasDbUrl)("db integration", () => {
  it("connects and runs a simple query", async () => {
    const result = await db.execute(sql`SELECT 1 as num`);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({ num: 1 });
  });

  it("can query pipelines table (empty)", async () => {
    const rows = await db.select().from(pipelines);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows).toHaveLength(0);
  });
});
