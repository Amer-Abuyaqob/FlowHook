/**
 * Helpers for sending JSON and JSON error bodies on Express responses.
 *
 * Uses UTF-8 content-type helpers from `./headers.js` so clients get a consistent `Content-Type`.
 */

import type { Response } from "express";
import { setJsonUtf8Header } from "./headers.js";

/**
 * Sends a JSON response with the proper Content-Type.
 *
 * @param res - Express response.
 * @param status - HTTP status code.
 * @param payload - Object to serialize as JSON.
 * @returns void
 */
export function respondWithJSON(
  res: Response,
  status: number,
  payload: object
): void {
  setJsonUtf8Header(res);
  res.status(status).send(JSON.stringify(payload));
}

/**
 * Sends a JSON error response with { error: message } and proper Content-Type.
 *
 * @param res - Express response.
 * @param status - HTTP status code.
 * @param message - Error message string for the error field in the response body.
 * @returns void
 */
export function respondWithError(
  res: Response,
  status: number,
  message: string
): void {
  respondWithJSON(res, status, { error: message });
}
