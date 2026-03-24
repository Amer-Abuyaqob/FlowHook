/**
 * Job API response serialization: maps internal rows to snake_case JSON per API.md.
 *
 * Used by job routes for list and detail responses.
 */
import type { DeliveryAttemptRow } from "../db/queries/deliveryAttempts.js";
import type { JobRow } from "../db/queries/jobs.js";
import { toIsoString } from "./dateFormat.js";

/**
 * Job fields returned by GET /api/jobs and the base object for GET /api/jobs/:id.
 *
 * @property id - Job UUID.
 * @property pipeline_id - Owning pipeline UUID.
 * @property status - Job lifecycle status.
 * @property payload - Raw inbound webhook body.
 * @property result - Processed output, or null when filtered or not yet done.
 * @property created_at - When the job was enqueued.
 * @property updated_at - Last update time.
 * @property processing_started_at - When a worker claimed the job, or null.
 * @property processing_ended_at - When processing finished, or null.
 */
export type JobApiResponse = {
  id: string;
  pipeline_id: string;
  status: string;
  payload: unknown;
  result: unknown;
  created_at: string;
  updated_at: string;
  processing_started_at: string | null;
  processing_ended_at: string | null;
};

/**
 * One row in the delivery_attempts array on GET /api/jobs/:id.
 *
 * @property id - Attempt row UUID.
 * @property subscriber_id - Target subscriber UUID.
 * @property attempt_number - Attempt index (1-based).
 * @property status_code - HTTP status from subscriber, or null if network error.
 * @property success - Whether delivery succeeded (2xx).
 * @property error_message - Failure detail, or null.
 * @property created_at - When this attempt was recorded.
 */
export type DeliveryAttemptApiResponse = {
  id: string;
  subscriber_id: string;
  attempt_number: number;
  status_code: number | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
};

/**
 * GET /api/jobs/:id response: job plus delivery attempt history.
 *
 * @property delivery_attempts - List of attempts ordered by time then attempt number.
 */
export type JobDetailApiResponse = JobApiResponse & {
  delivery_attempts: DeliveryAttemptApiResponse[];
};

/**
 * Maps a job row to the public API job object (without delivery attempts).
 *
 * @param row - Job row from the database.
 * @returns API-shaped job object.
 */
export function toApiJob(row: JobRow): JobApiResponse {
  return {
    id: row.id,
    pipeline_id: row.pipelineId,
    status: row.status,
    payload: row.payload,
    result: row.result ?? null,
    created_at: toIsoString(row.createdAt),
    updated_at: toIsoString(row.updatedAt),
    processing_started_at: row.processingStartedAt
      ? toIsoString(row.processingStartedAt)
      : null,
    processing_ended_at: row.processingEndedAt
      ? toIsoString(row.processingEndedAt)
      : null,
  };
}

/**
 * Maps a delivery attempt row to the public API shape.
 *
 * @param row - Delivery attempt row.
 * @returns API-shaped attempt object.
 */
export function toApiDeliveryAttempt(
  row: DeliveryAttemptRow
): DeliveryAttemptApiResponse {
  return {
    id: row.id,
    subscriber_id: row.subscriberId,
    attempt_number: row.attemptNumber,
    status_code: row.statusCode,
    success: row.success,
    error_message: row.errorMessage,
    created_at: toIsoString(row.createdAt),
  };
}

/**
 * Builds the GET /api/jobs/:id response body.
 *
 * @param job - Job row.
 * @param attempts - Delivery attempts for this job.
 * @returns Full detail response including delivery_attempts.
 */
export function toApiJobDetail(
  job: JobRow,
  attempts: DeliveryAttemptRow[]
): JobDetailApiResponse {
  return {
    ...toApiJob(job),
    delivery_attempts: attempts.map(toApiDeliveryAttempt),
  };
}
