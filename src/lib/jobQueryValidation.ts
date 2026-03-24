/**
 * Query-string validation for GET /api/jobs.
 *
 * Parses pipelineId, status, limit, and offset from Express query objects and
 * produces a typed filter for the job service.
 */
import type { JobStatus } from "../db/types.js";
import { BadRequestError } from "../errors.js";
import { assertValidUuid } from "./validation.js";

const VALID_JOB_STATUSES: readonly JobStatus[] = [
  "pending",
  "processing",
  "completed",
  "filtered",
  "failed",
];

/** Default and maximum page size for job listing (aligned with API.md). */
export const JOB_LIST_DEFAULT_LIMIT = 50;
export const JOB_LIST_MAX_LIMIT = 100;

/**
 * Parsed filters for listing jobs (all validated).
 *
 * @property pipelineId - Optional pipeline UUID filter.
 * @property status - Optional job status filter.
 * @property limit - Page size (capped at {@link JOB_LIST_MAX_LIMIT}).
 * @property offset - Pagination offset (non-negative).
 */
export type JobListFilters = {
  pipelineId?: string;
  status?: JobStatus;
  limit: number;
  offset: number;
};

/**
 * Extracts the first string value for a query key (Express may supply arrays).
 *
 * @param query - Express `req.query` object.
 * @param key - Query parameter name.
 * @returns The string, or undefined when absent.
 */
function getQueryString(
  query: Record<string, unknown>,
  key: string
): string | undefined {
  const v = query[key];
  if (v === undefined || v === null) {
    return undefined;
  }
  if (Array.isArray(v)) {
    const first = v[0];
    return typeof first === "string" ? first : undefined;
  }
  if (typeof v === "string") {
    return v;
  }
  return undefined;
}

/**
 * Parses offset (non-negative integer); defaults when omitted.
 *
 * @param raw - Raw string from query or undefined.
 * @returns Parsed offset.
 * @throws {BadRequestError} When raw is present but invalid.
 */
function parseOffset(raw: string | undefined): number {
  if (raw === undefined || raw === "") {
    return 0;
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    throw new BadRequestError("Invalid offset");
  }
  return n;
}

/**
 * Parses limit (positive integer, capped); defaults when omitted.
 *
 * @param raw - Raw string from query or undefined.
 * @returns Parsed limit.
 * @throws {BadRequestError} When raw is present but invalid.
 */
function parseLimit(raw: string | undefined): number {
  if (raw === undefined || raw === "") {
    return JOB_LIST_DEFAULT_LIMIT;
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    throw new BadRequestError("Invalid limit");
  }
  return Math.min(n, JOB_LIST_MAX_LIMIT);
}

/**
 * Parses and validates `status` as a {@link JobStatus}.
 *
 * @param raw - Raw string or undefined.
 * @returns Status or undefined when omitted.
 * @throws {BadRequestError} When present but not a known status.
 */
function parseOptionalJobStatus(
  raw: string | undefined
): JobStatus | undefined {
  if (raw === undefined || raw === "") {
    return undefined;
  }
  if (!VALID_JOB_STATUSES.includes(raw as JobStatus)) {
    throw new BadRequestError("Invalid status");
  }
  return raw as JobStatus;
}

/**
 * Parses `req.query` for GET /api/jobs.
 *
 * @param query - Express `req.query` (typed loosely as record).
 * @returns Validated filter object.
 * @throws {BadRequestError} When any parameter is invalid.
 */
export function parseJobListQuery(
  query: Record<string, unknown>
): JobListFilters {
  const pipelineIdRaw = getQueryString(query, "pipelineId");
  let pipelineId: string | undefined;
  if (pipelineIdRaw !== undefined && pipelineIdRaw !== "") {
    pipelineId = assertValidUuid(pipelineIdRaw, "Invalid pipelineId");
  }

  const status = parseOptionalJobStatus(getQueryString(query, "status"));

  const limit = parseLimit(getQueryString(query, "limit"));
  const offset = parseOffset(getQueryString(query, "offset"));

  return {
    ...(pipelineId !== undefined ? { pipelineId } : {}),
    ...(status !== undefined ? { status } : {}),
    limit,
    offset,
  };
}
