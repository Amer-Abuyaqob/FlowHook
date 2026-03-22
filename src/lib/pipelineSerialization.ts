/**
 * Pipeline API response serialization: maps internal camelCase rows to snake_case API format.
 *
 * Used by pipeline routes to produce consistent JSON responses per API.md.
 */
import type { PipelineRow } from "../db/queries/pipelines.js";

/**
 * API response shape for a pipeline (snake_case, per API.md).
 *
 * @property id - Pipeline UUID.
 * @property slug - Webhook URL slug (e.g. "my-stripe-orders").
 * @property name - User-facing pipeline name.
 * @property action_type - One of transform, filter, or template.
 * @property action_config - Action-specific config object.
 * @property is_active - Whether the pipeline accepts webhooks.
 * @property created_at - ISO 8601 creation timestamp.
 * @property updated_at - ISO 8601 last-update timestamp.
 * @property webhookUrl - Full webhook ingestion URL.
 */
export type PipelineApiResponse = {
  id: string;
  slug: string;
  name: string;
  action_type: string;
  action_config: unknown;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  webhookUrl: string;
};

/**
 * Converts a pipeline row to the API response format (snake_case with webhookUrl).
 *
 * @param row - Pipeline row from the database (camelCase).
 * @param baseUrl - Base URL for the service (e.g. "https://example.com").
 * @returns API response object with snake_case keys.
 */
export function toApiPipeline(
  row: PipelineRow,
  baseUrl: string
): PipelineApiResponse {
  const base = baseUrl.replace(/\/$/, "");
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    action_type: row.actionType,
    action_config: row.actionConfig ?? null,
    is_active: row.isActive,
    created_at: toIsoString(row.createdAt),
    updated_at: toIsoString(row.updatedAt),
    webhookUrl: `${base}/webhooks/${row.slug}`,
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
  