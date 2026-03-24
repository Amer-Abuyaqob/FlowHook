/**
 * Job service: enqueues webhook payloads, claims pending jobs, and queries job state.
 *
 * Worker processing runs in the worker entry; read APIs support the Job API routes.
 */
import {
  listDeliveryAttemptsByJobId,
  type DeliveryAttemptRow,
} from "../db/queries/deliveryAttempts.js";
import type { JobRow, ListJobsParams } from "../db/queries/jobs.js";
import { assertDbConnection, db } from "../db/index.js";
import {
  claimNextPendingJob,
  getJobById,
  insertJob,
  listJobs,
} from "../db/queries/jobs.js";

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

/**
 * Loads a job and its delivery attempts, or null if the job does not exist.
 *
 * @param jobId - Job UUID.
 * @returns Job row with attempts, or null when no row matches.
 */
export async function getJobWithAttempts(jobId: string): Promise<{
  job: JobRow;
  attempts: DeliveryAttemptRow[];
} | null> {
  assertDbConnection(db);
  const job = await getJobById(db, jobId);
  if (!job) {
    return null;
  }
  const attempts = await listDeliveryAttemptsByJobId(db, jobId);
  return { job, attempts };
}

/**
 * Lists jobs with filters and pagination (newest first at the database layer).
 *
 * @param params - Validated list parameters.
 * @returns Job rows for the current page.
 */
export async function listJobsByParams(
  params: ListJobsParams
): Promise<JobRow[]> {
  assertDbConnection(db);
  return listJobs(db, params);
}
