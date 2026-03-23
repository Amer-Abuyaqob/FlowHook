/**
 * Job-related database queries.
 *
 * Groups all jobs table queries; used by job service and future worker logic.
 */
import type { DbClient } from "../index.js";
import { jobs } from "../schema.js";
import type { JobStatus } from "../types.js";

export type JobRow = typeof jobs.$inferSelect;

export type JobInsert = {
  pipelineId: string;
  status: JobStatus;
  payload: unknown;
};

/**
 * Inserts a job row and returns the full inserted record.
 *
 * @throws Error when Drizzle does not return an inserted row.
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
