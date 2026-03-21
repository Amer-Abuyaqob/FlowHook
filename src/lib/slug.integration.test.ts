/**
 * Integration tests for ensureUniqueSlug.
 * Requires DATABASE_URL and a running Postgres with migrations applied.
 * Skipped when DATABASE_URL is not set.
 */
import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { assertDbConnection, db, pipelines } from "../db/index.js";
import { ensureUniqueSlug } from "./slug.js";

const hasDbUrl =
  Boolean(process.env.DATABASE_URL) || Boolean(process.env.DB_URL);

describe.skipIf(!hasDbUrl)("ensureUniqueSlug integration", () => {
  it("returns slug as-is when it does not exist", async () => {
    assertDbConnection(db);
    const uniqueSlug = `test-new-slug-${Date.now()}`;
    const result = await ensureUniqueSlug(uniqueSlug, db);
    expect(result).toBe(uniqueSlug);
  });

  it("returns suffixed slug when collision exists", async () => {
    assertDbConnection(db);
    const baseSlug = `test-collision-${Date.now()}`;
    await db.insert(pipelines).values({
      slug: baseSlug,
      name: "Test Pipeline",
      actionType: "template",
      actionConfig: { template: "{{payload}}" },
    });
    try {
      const result = await ensureUniqueSlug(baseSlug, db);
      expect(result).toBe(`${baseSlug}-1`);
    } finally {
      await db.delete(pipelines).where(eq(pipelines.slug, baseSlug));
    }
  });
});
