/**
 * Subscriber service: add and remove destination URLs for a pipeline.
 *
 * Orchestrates db queries, validation, and pipeline existence checks.
 */
import { assertDbConnection, db } from "../db/index.js";
import {
  deleteSubscriber as deleteSubscriberQuery,
  getSubscribersByPipelineId as getSubscribersByPipelineIdQuery,
  insertSubscriber,
  type SubscriberRow,
} from "../db/queries/subscribers.js";
import { getPipelineById as getPipelineByIdQuery } from "../db/queries/pipelines.js";
import { NotFoundError } from "../errors.js";

/**
 * Adds a subscriber (destination URL) to a pipeline.
 *
 * @param pipelineId - Pipeline UUID.
 * @param url - Valid http(s) URL.
 * @param headers - Optional headers to send with delivery.
 * @returns The created subscriber row.
 * @throws {Error} When database connection is not available.
 * @throws {NotFoundError} When pipeline does not exist.
 */
export async function addSubscriber(
  pipelineId: string,
  url: string,
  headers?: Record<string, string> | null
): Promise<SubscriberRow> {
  assertDbConnection(db);

  const pipeline = await getPipelineByIdQuery(db, pipelineId);
  if (!pipeline) {
    throw new NotFoundError("Pipeline not found");
  }

  return insertSubscriber(db, {
    pipelineId,
    url,
    headers: headers ?? null,
  });
}

/**
 * Removes a subscriber from a pipeline.
 *
 * @param pipelineId - Pipeline UUID (ownership check).
 * @param subscriberId - Subscriber UUID to remove.
 * @returns The deleted subscriber row if found, undefined otherwise.
 * @throws {Error} When database connection is not available.
 */
export async function removeSubscriber(
  pipelineId: string,
  subscriberId: string
): Promise<SubscriberRow | undefined> {
  assertDbConnection(db);
  return deleteSubscriberQuery(db, pipelineId, subscriberId);
}

/**
 * Fetches all subscribers for a pipeline.
 * Used by the worker for delivery; not exposed via API.
 *
 * @param pipelineId - Pipeline UUID.
 * @returns Array of subscriber rows.
 * @throws {Error} When database connection is not available.
 */
export async function getSubscribersByPipelineId(
  pipelineId: string
): Promise<SubscriberRow[]> {
  assertDbConnection(db);
  return getSubscribersByPipelineIdQuery(db, pipelineId);
}
