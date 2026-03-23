/**
 * Job service: enqueues inbound webhook payloads and claims pending jobs.
 *
 * Worker processing and delivery live in a later phase; this file handles
 * enqueue and claim operations.
 */
import type { JobRow } from "../db/queries/jobs.js";
import { assertDbConnection, db } from "../db/index.js";
import { claimNextPendingJob, insertJob } from "../db/queries/jobs.js";

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

/**
 * Claims the next pending job for processing.
 *
 * @returns The claimed job row, or null if no pending jobs.
 */
export async function claimNextJob(): Promise<JobRow | null> {
  assertDbConnection(db);
  return claimNextPendingJob(db);
}
