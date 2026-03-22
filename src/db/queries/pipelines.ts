/**
 * Pipeline-related database queries.
 *
 * Groups all pipeline table queries; used by services and the slug library.
 */
import { eq } from "drizzle-orm";
import type { ActionConfig, ActionType } from "../types.js";
import type { DbClient } from "../index.js";
import { pipelines } from "../schema.js";

export type PipelineRow = typeof pipelines.$inferSelect;

export type PipelineInsert = {
  slug: string;
  name: string;
  actionType: ActionType;
  actionConfig: ActionConfig | null;
};

export type PipelineUpdate = {
  name?: string;
  actionType?: ActionType;
  actionConfig?: ActionConfig | null;
  isActive?: boolean;
};

/**
 * Inserts a pipeline and returns the full row.
 *
 * @param db - Connected Drizzle client.
 * @param row - Pipeline data to insert.
 * @returns The inserted pipeline row.
 */
export async function insertPipeline(
  db: DbClient,
  row: PipelineInsert
): Promise<PipelineRow> {
  const [inserted] = await db
    .insert(pipelines)
    .values({
      slug: row.slug,
      name: row.name,
      actionType: row.actionType,
      actionConfig: row.actionConfig ?? null,
    })
    .returning();
  if (!inserted) {
    throw new Error("insertPipeline: no row returned");
  }
  return inserted;
}

/**
 * Fetches all pipelines.
 *
 * @param db - Connected Drizzle client.
 * @returns Array of all pipeline rows.
 */
export async function listPipelines(db: DbClient): Promise<PipelineRow[]> {
  return db.select().from(pipelines);
}

/**
 * Fetches a pipeline by its id.
 *
 * @param db - Connected Drizzle client.
 * @param id - Pipeline UUID.
 * @returns The pipeline row if found, undefined otherwise.
 */
export async function getPipelineById(
  db: DbClient,
  id: string
): Promise<PipelineRow | undefined> {
  const rows = await db
    .select()
    .from(pipelines)
    .where(eq(pipelines.id, id))
    .limit(1);
  return rows.at(0);
}

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
): Promise<PipelineRow | undefined> {
  const rows = await db
    .select()
    .from(pipelines)
    .where(eq(pipelines.slug, slug))
    .limit(1);
  return rows.at(0);
}

/**
 * Updates a pipeline by id and returns the updated row.
 *
 * @param db - Connected Drizzle client.
 * @param id - Pipeline UUID.
 * @param updates - Partial pipeline fields to update.
 * @returns The updated pipeline row if found, undefined otherwise.
 */
export async function updatePipeline(
  db: DbClient,
  id: string,
  updates: PipelineUpdate
): Promise<PipelineRow | undefined> {
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  );
  const setValues = { ...filtered, updatedAt: new Date() };
  const [updated] = await db
    .update(pipelines)
    .set(setValues)
    .where(eq(pipelines.id, id))
    .returning();
  return updated;
}

/**
 * Deletes a pipeline by id and returns the deleted row.
 *
 * @param db - Connected Drizzle client.
 * @param id - Pipeline UUID.
 * @returns The deleted pipeline row if found, undefined otherwise.
 */
export async function deletePipeline(
  db: DbClient,
  id: string
): Promise<PipelineRow | undefined> {
  const [deleted] = await db
    .delete(pipelines)
    .where(eq(pipelines.id, id))
    .returning();
  return deleted;
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
