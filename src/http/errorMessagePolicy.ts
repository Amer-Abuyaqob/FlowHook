/**
 * Central client-facing API error-message policy.
 *
 * All API routes are expected to funnel errors through `errorMiddleware`,
 * which applies this mapping to produce the `{ "error": "..." }` response.
 */

import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UserForbiddenError,
  UserNotAuthenticatedError,
} from "../errors.js";

const INTERNAL_ERROR_MESSAGE = "Internal Server Error";
const INVALID_JSON_MESSAGE = "Invalid JSON";
const UNAUTHORIZED_MESSAGE = "Unauthorized";
const FORBIDDEN_MESSAGE = "Forbidden";

/**
 * Returns the client-safe `{ error: string }` message.
 *
 * Policy (by status, as derived from the error type):
 * - 400: use the error's message for known bad-request errors; malformed JSON
 *   becomes a stable `"Invalid JSON"` message.
 * - 401: always `"Unauthorized"` (avoid leaking auth details).
 * - 403: always `"Forbidden"` (avoid leaking permission details).
 * - 404/409: use the error's message.
 * - 500: always `"Internal Server Error"` for unknown/internal errors.
 */
export function getClientErrorMessage(err: unknown, status: number): string {
  if (err instanceof SyntaxError) return INVALID_JSON_MESSAGE;

  if (err instanceof UserNotAuthenticatedError) return UNAUTHORIZED_MESSAGE;
  if (err instanceof UserForbiddenError) return FORBIDDEN_MESSAGE;

  // Unknown errors and all 5xx paths should never leak details.
  if (status >= 500) return INTERNAL_ERROR_MESSAGE;

  if (
    err instanceof BadRequestError ||
    err instanceof NotFoundError ||
    err instanceof ConflictError
  ) {
    return err.message;
  }

  // Fallback: if we reached here with a non-500 status but the error isn't one
  // of our known classes, respond with the stable internal message.
  return INTERNAL_ERROR_MESSAGE;
}
