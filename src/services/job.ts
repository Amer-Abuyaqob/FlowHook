/**
 * Job service: enqueues inbound webhook payloads as `pending` rows.
 *
 * Worker processing and delivery live in a later phase; this file is intentionally
 * "enqueue only" to keep the base system simple.
 */
import { assertDbConnection, db } from "../db/index.js";
import { insertJob } from "../db/queries/jobs.js";

/**
 * Enqueues a new job for later processing.
 *
 * @param pipelineId - Pipeline UUID.
 * @param payload - Raw inbound webhook payload (stored as JSONB).
 * @returns Inserted job UUID as a string.
 */
export async function enqueueJob(
  pipelineId: string,
  payload: unknown
): Promise<string> {
  assertDbConnection(db);
  const inserted = await insertJob(db, {
    pipelineId,
    status: "pending",
    payload,
  });

  return inserted.id;
}
