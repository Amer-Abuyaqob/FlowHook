/**
 * Subscriber API response serialization: maps internal camelCase rows to snake_case API format.
 *
 * Used by subscriber routes to produce consistent JSON responses per API.md.
 */
import type { SubscriberRow } from "../db/queries/subscribers.js";

/**
 * API response shape for a subscriber (snake_case, per API.md).
 *
 * @property id - Subscriber UUID.
 * @property pipeline_id - Pipeline UUID.
 * @property url - Destination URL.
 * @property headers - Optional headers object.
 * @property created_at - ISO 8601 creation timestamp.
 */
export type SubscriberApiResponse = {
  id: string;
  pipeline_id: string;
  url: string;
  headers: Record<string, string> | null;
  created_at: string;
};

/**
 * Converts a subscriber row to the API response format (snake_case).
 *
 * @param row - Subscriber row from the database (camelCase).
 * @returns API response object with snake_case keys.
 */
export function toApiSubscriber(row: SubscriberRow): SubscriberApiResponse {
  return {
    id: row.id,
    pipeline_id: row.pipelineId,
    url: row.url,
    headers: row.headers ?? null,
    created_at: toIsoString(row.createdAt),
  };
}

/**
 * Converts a value to an ISO 8601 string.
 *
 * @param value - Date instance or value that can be stringified.
 * @returns ISO 8601 string.
 */
function toIsoString(value: Date | unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}
