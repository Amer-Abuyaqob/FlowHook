/**
 * Delivery-attempt database queries.
 *
 * Persists per-subscriber attempt history for job delivery retries.
 */
import { asc, eq } from "drizzle-orm";
import type { DbClient } from "../index.js";
import { deliveryAttempts } from "../schema.js";

export type DeliveryAttemptRow = typeof deliveryAttempts.$inferSelect;

export type DeliveryAttemptInsert = {
  jobId: string;
  subscriberId: string;
  attemptNumber: number;
  statusCode: number | null;
  success: boolean;
  errorMessage: string | null;
};

/**
 * Inserts one delivery attempt row and returns the inserted row.
 *
 * @param db - Connected Drizzle client.
 * @param row - Delivery attempt payload.
 * @returns Inserted delivery attempt row.
 * @throws {Error} When Drizzle does not return an inserted row.
 */
export async function insertDeliveryAttempt(
  db: DbClient,
  row: DeliveryAttemptInsert
): Promise<DeliveryAttemptRow> {
  const [inserted] = await db
    .insert(deliveryAttempts)
    .values({
      jobId: row.jobId,
      subscriberId: row.subscriberId,
      attemptNumber: row.attemptNumber,
      statusCode: row.statusCode,
      success: row.success,
      errorMessage: row.errorMessage,
    })
    .returning();

  if (!inserted) {
    throw new Error("insertDeliveryAttempt: no row returned");
  }

  return inserted;
}

/**
 * Returns all delivery attempts for a job, ordered by time then attempt number.
 *
 * @param db - Connected Drizzle client.
 * @param jobId - Job UUID.
 * @returns Attempt rows for that job.
 */
export async function listDeliveryAttemptsByJobId(
  db: DbClient,
  jobId: string
): Promise<DeliveryAttemptRow[]> {
  return db
    .select()
    .from(deliveryAttempts)
    .where(eq(deliveryAttempts.jobId, jobId))
    .orderBy(
      asc(deliveryAttempts.createdAt),
      asc(deliveryAttempts.attemptNumber)
    );
}
