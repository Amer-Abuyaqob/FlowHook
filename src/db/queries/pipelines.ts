/**
 * Pipeline-related database queries.
 *
 * Groups all pipeline table queries; used by services and the slug library.
 */
import { eq } from "drizzle-orm";
import type { DbClient } from "../index.js";
import { pipelines } from "../schema.js";

/**
 * Fetches a pipeline by its slug.
 *
 * @param db - Connected Drizzle client.
 * @param slug - Slug to look up.
 * @returns The pipeline row if found, undefined otherwise.
 */
export async function getPipelineBySlug(
  db: DbClient,
  slug: string
): Promise<typeof pipelines.$inferSelect | undefined> {
  const rows = await db
    .select()
    .from(pipelines)
    .where(eq(pipelines.slug, slug))
    .limit(1);
  return rows.at(0);
}

/**
 * Checks whether a pipeline with the given slug exists.
 *
 * @param db - Connected Drizzle client.
 * @param slug - Slug to look up.
 * @returns True if a pipeline with that slug exists, false otherwise.
 */
export async function existsPipelineWithSlug(
  db: DbClient,
  slug: string
): Promise<boolean> {
  const pipeline = await getPipelineBySlug(db, slug);
  return pipeline !== undefined;
}
