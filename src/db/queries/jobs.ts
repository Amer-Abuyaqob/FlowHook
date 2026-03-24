/**
 * Job-related database queries.
 *
 * Groups all jobs table queries; used by job service and future worker logic.
 */
import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { DbClient } from "../index.js";
import { jobs } from "../schema.js";
import type { JobStatus } from "../types.js";

export type JobRow = typeof jobs.$inferSelect;

export type JobInsert = {
  pipelineId: string;
  status: JobStatus;
  payload: unknown;
};

export type JobUpdate = {
  status?: JobStatus;
  result?: unknown;
  processingStartedAt?: Date | null;
  processingEndedAt?: Date | null;
};

/**
 * Filters and pagination for listing jobs (GET /api/jobs).
 *
 * @property pipelineId - Restrict to this pipeline when set.
 * @property status - Restrict to this status when set.
 * @property limit - Maximum rows.
 * @property offset - Skip this many rows.
 */
export type ListJobsParams = {
  pipelineId?: string;
  status?: JobStatus;
  limit: number;
  offset: number;
};

/**
 * Inserts a job row and returns the full inserted record.
 *
 * @param db - Connected Drizzle client.
 * @param row - Job data to insert.
 * @returns The inserted job row.
 * @throws {Error} When Drizzle does not return an inserted row.
 */
export async function insertJob(db: DbClient, row: JobInsert): Promise<JobRow> {
  const [inserted] = await db
    .insert(jobs)
    .values({
      pipelineId: row.pipelineId,
      status: row.status,
      payload: row.payload,
    })
    .returning();

  if (!inserted) {
    throw new Error("insertJob: no row returned");
  }

  return inserted;
}

/**
 * Updates a job by id and returns the updated row.
 *
 * @param db - Connected Drizzle client.
 * @param jobId - Job UUID.
 * @param updates - Partial job fields to update.
 * @returns The updated job row if found, undefined otherwise.
 */
/**
 * Fetches a single job by id.
 *
 * @param db - Connected Drizzle client.
 * @param jobId - Job UUID.
 * @returns The job row if found, undefined otherwise.
 */
export async function getJobById(
  db: DbClient,
  jobId: string
): Promise<JobRow | undefined> {
  const rows = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  return rows.at(0);
}

/**
 * Lists jobs with optional filters, newest first.
 *
 * @param db - Connected Drizzle client.
 * @param params - Filter and pagination options.
 * @returns Matching job rows.
 */
export async function listJobs(
  db: DbClient,
  params: ListJobsParams
): Promise<JobRow[]> {
  const conditions = [];
  if (params.pipelineId !== undefined) {
    conditions.push(eq(jobs.pipelineId, params.pipelineId));
  }
  if (params.status !== undefined) {
    conditions.push(eq(jobs.status, params.status));
  }

  const whereClause =
    conditions.length === 0
      ? undefined
      : conditions.length === 1
        ? conditions[0]
        : and(...conditions);

  return db
    .select()
    .from(jobs)
    .where(whereClause ?? sql`true`)
    .orderBy(desc(jobs.createdAt))
    .limit(params.limit)
    .offset(params.offset);
}

export async function updateJob(
  db: DbClient,
  jobId: string,
  updates: JobUpdate
): Promise<JobRow | undefined> {
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  );
  const [updated] = await db
    .update(jobs)
    .set(filtered)
    .where(eq(jobs.id, jobId))
    .returning();
  return updated;
}

/**
 * Claims the next pending job atomically using FOR UPDATE SKIP LOCKED.
 *
 * @param db - Connected Drizzle client.
 * @returns The claimed job row, or null if no pending jobs.
 */
export async function claimNextPendingJob(
  db: DbClient
): Promise<JobRow | null> {
  return db.transaction(async (tx) => {
    const [job] = await tx
      .select()
      .from(jobs)
      .where(eq(jobs.status, "pending"))
      .orderBy(asc(jobs.createdAt))
      .limit(1)
      .for("update", { skipLocked: true });

    if (!job) return null;

    // tx has same update interface as db; cast needed for Drizzle's stricter DbClient type
    return (
      (await updateJob(tx as unknown as DbClient, job.id, {
        status: "processing",
        processingStartedAt: new Date(),
      })) ?? null
    );
  });
}
