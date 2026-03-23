/**
 * Job-related database queries.
 *
 * Groups all jobs table queries; used by job service and future worker logic.
 */
import { asc, eq } from "drizzle-orm";
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
