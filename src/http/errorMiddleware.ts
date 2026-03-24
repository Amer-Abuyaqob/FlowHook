/**
 * Central error handler that maps HTTP error classes to JSON responses.
 *
 * Registered last in the Express app; handles errors passed via next(err).
 */

import type { Request, Response, NextFunction } from "express";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UserForbiddenError,
  UserNotAuthenticatedError,
} from "../errors.js";
import { respondWithError } from "./json.js";
import { getClientErrorMessage } from "./errorMessagePolicy.js";

/** Maps known HTTP error classes to status codes. */
const ERROR_STATUS_MAP: ReadonlyMap<new (msg: string) => Error, number> =
  new Map([
    [BadRequestError, 400],
    [UserNotAuthenticatedError, 401],
    [UserForbiddenError, 403],
    [NotFoundError, 404],
    [ConflictError, 409],
  ]);

/**
 * Determines the appropriate HTTP status code for a given error.
 *
 * @param err - Error instance thrown by route handlers or middleware.
 * @returns HTTP status code corresponding to the error type.
 */
function getStatusOfError(err: unknown): number {
  // `express.json()` throws a SyntaxError for malformed JSON bodies.
  // We treat it as a client error and return a stable error message.
  if (err instanceof SyntaxError) return 400;
  if (!(err instanceof Error)) return 500;
  for (const [ErrorClass, status] of ERROR_STATUS_MAP) {
    if (err instanceof ErrorClass) return status;
  }
  return 500;
}

/**
 * Extracts a safe error message from an unknown value.
 *
 * @param err - Caught error (may be Error or any value).
 * @returns Human-readable message string.
 */
function getErrorMessageForLogging(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Express error-handling middleware. Maps custom errors to appropriate status
 * codes, logs 5xx errors, and sends a JSON error response.
 *
 * Custom errors: BadRequestError→400, UserNotAuthenticatedError→401,
 * UserForbiddenError→403, NotFoundError→404, ConflictError→409.
 * Unknown errors→500. Client message is the error's message for custom errors;
 * otherwise generic. 5xx errors are logged to stderr.
 *
 * @param err - Caught error passed by Express.
 * @param _req - Express request (unused).
 * @param res - HTTP response.
 * @param _next - Required by Express error middleware signature (unused).
 * @returns void
 */
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = getStatusOfError(err);
  const logMessage = getErrorMessageForLogging(err);
  const clientMessage = getClientErrorMessage(err, status);

  if (status >= 500) {
    console.error("Error:", logMessage);
  }

  respondWithError(res, status, clientMessage);
}
