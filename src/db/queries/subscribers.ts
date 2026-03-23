/**
 * Subscriber-related database queries.
 *
 * Groups all subscriber table queries; used by subscriber service and future delivery logic.
 */
import { and, eq } from "drizzle-orm";
import type { DbClient } from "../index.js";
import { subscribers } from "../schema.js";

export type SubscriberRow = typeof subscribers.$inferSelect;

export type SubscriberInsert = {
  pipelineId: string;
  url: string;
  headers?: Record<string, string> | null;
};

/**
 * Inserts a subscriber and returns the full row.
 *
 * @param db - Connected Drizzle client.
 * @param row - Subscriber data to insert.
 * @returns The inserted subscriber row.
 */
export async function insertSubscriber(
  db: DbClient,
  row: SubscriberInsert
): Promise<SubscriberRow> {
  const [inserted] = await db
    .insert(subscribers)
    .values({
      pipelineId: row.pipelineId,
      url: row.url,
      headers: row.headers ?? null,
    })
    .returning();
  if (!inserted) {
    throw new Error("insertSubscriber: no row returned");
  }
  return inserted;
}

/**
 * Deletes a subscriber by id and pipeline id (ensures ownership).
 *
 * @param db - Connected Drizzle client.
 * @param pipelineId - Pipeline UUID (ownership check).
 * @param subscriberId - Subscriber UUID to delete.
 * @returns The deleted subscriber row if found, undefined otherwise.
 */
export async function deleteSubscriber(
  db: DbClient,
  pipelineId: string,
  subscriberId: string
): Promise<SubscriberRow | undefined> {
  const [deleted] = await db
    .delete(subscribers)
    .where(
      and(
        eq(subscribers.id, subscriberId),
        eq(subscribers.pipelineId, pipelineId)
      )
    )
    .returning();
  return deleted;
}

/**
 * Fetches all subscribers for a pipeline.
 *
 * @param db - Connected Drizzle client.
 * @param pipelineId - Pipeline UUID.
 * @returns Array of subscriber rows.
 */
export async function getSubscribersByPipelineId(
  db: DbClient,
  pipelineId: string
): Promise<SubscriberRow[]> {
  return db
    .select()
    .from(subscribers)
    .where(eq(subscribers.pipelineId, pipelineId));
}
