/**
 * Date and time formatting helpers for API serialization.
 *
 * Provides ISO 8601 string conversion for timestamps in API responses.
 */

/**
 * Converts a value to an ISO 8601 string.
 *
 * @param value - Date instance or value that can be stringified.
 * @returns ISO 8601 string.
 */
export function toIsoString(value: Date | unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}
