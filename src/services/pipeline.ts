/**
 * Pipeline service: CRUD operations and business logic for pipelines.
 *
 * Orchestrates db queries, slug generation, and action config validation.
 */
import type { ActionConfig, ActionType } from "../db/types.js";
import { assertDbConnection, db } from "../db/index.js";
import {
  deletePipeline as deletePipelineQuery,
  getPipelineById as getPipelineByIdQuery,
  getPipelineBySlug as getPipelineBySlugQuery,
  insertPipeline,
  listPipelines as listPipelinesQuery,
  type PipelineRow,
  type PipelineUpdate,
  updatePipeline as updatePipelineQuery,
} from "../db/queries/pipelines.js";
import { NotFoundError } from "../errors.js";
import { validateActionConfig } from "../lib/actionConfig.js";
import { ensureUniqueSlug, generateSlug } from "../lib/slug.js";

/**
 * Creates a pipeline with the given name, action type, and config.
 * Generates a unique slug from the name and validates the action config.
 *
 * @param name - User-facing pipeline name.
 * @param actionType - One of transform, filter, or template.
 * @param actionConfig - Action-specific config (shape depends on actionType).
 * @returns The created pipeline row.
 * @throws {Error} When database connection is not available.
 * @throws {BadRequestError} When action config is invalid.
 */
export async function createPipeline(
  name: string,
  actionType: ActionType,
  actionConfig: ActionConfig | null
): Promise<PipelineRow> {
  assertDbConnection(db);
  validateActionConfig(actionType, actionConfig ?? {});

  const baseSlug = generateSlug(name);
  const slug = await ensureUniqueSlug(baseSlug, db);

  return insertPipeline(db, {
    slug,
    name,
    actionType,
    actionConfig: actionConfig ?? null,
  });
}

/**
 * Returns all pipelines.
 *
 * @returns Array of all pipeline rows.
 * @throws {Error} When database connection is not available.
 */
export async function listPipelines(): Promise<PipelineRow[]> {
  assertDbConnection(db);
  return listPipelinesQuery(db);
}

/**
 * Fetches a pipeline by id.
 *
 * @param id - Pipeline UUID.
 * @returns The pipeline row if found, undefined otherwise.
 * @throws {Error} When database connection is not available.
 */
export async function getPipelineById(
  id: string
): Promise<PipelineRow | undefined> {
  assertDbConnection(db);
  return getPipelineByIdQuery(db, id);
}

/**
 * Fetches a pipeline by slug.
 *
 * @param slug - Pipeline slug.
 * @returns The pipeline row if found, undefined otherwise.
 * @throws {Error} When database connection is not available.
 */
export async function getPipelineBySlug(
  slug: string
): Promise<PipelineRow | undefined> {
  assertDbConnection(db);
  return getPipelineBySlugQuery(db, slug);
}

/**
 * Updates a pipeline by id.
 * When only actionType is changed (without actionConfig), validates the existing
 * actionConfig against the new type.
 *
 * @param id - Pipeline UUID.
 * @param updates - Partial pipeline fields to update.
 * @returns The updated pipeline row.
 * @throws {Error} When database connection is not available.
 * @throws {NotFoundError} When pipeline does not exist.
 * @throws {BadRequestError} When action config is invalid.
 */
export async function updatePipeline(
  id: string,
  updates: PipelineUpdate
): Promise<PipelineRow> {
  assertDbConnection(db);

  const current = await getPipelineByIdQuery(db, id);
  if (!current) {
    throw new NotFoundError("Pipeline not found");
  }

  if (updates.actionType !== undefined && updates.actionConfig === undefined) {
    validateActionConfig(updates.actionType, current.actionConfig ?? {});
  }
  if (updates.actionConfig !== undefined) {
    const actionType = updates.actionType ?? current.actionType;
    validateActionConfig(actionType, updates.actionConfig);
  }

  const updated = await updatePipelineQuery(db, id, updates);
  if (!updated) {
    throw new NotFoundError("Pipeline not found");
  }
  return updated;
}

/**
 * Deletes a pipeline by id.
 * Cascade deletes subscribers and jobs.
 *
 * @param id - Pipeline UUID.
 * @returns The deleted pipeline row if found, undefined otherwise.
 * @throws {Error} When database connection is not available.
 */
export async function deletePipeline(
  id: string
): Promise<PipelineRow | undefined> {
  assertDbConnection(db);
  return deletePipelineQuery(db, id);
}
