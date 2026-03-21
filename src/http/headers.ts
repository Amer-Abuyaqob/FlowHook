/**
 * Helpers for setting common `Content-Type` headers on Express responses.
 *
 * Prefer these over ad hoc `res.set` calls so MIME types and `charset=utf-8` stay consistent.
 */

import type { Response } from "express";

/**
 * Sets the response headers for plain UTF-8 encoded text.
 *
 * @param res - HTTP response whose headers will be modified.
 * @returns void
 */
export function setPlainTextUtf8Header(res: Response): void {
  res.set("Content-Type", "text/plain; charset=utf-8");
}

/**
 * Sets the response headers for JSON UTF-8 encoded responses.
 *
 * @param res - HTTP response whose headers will be modified.
 * @returns void
 */
export function setJsonUtf8Header(res: Response): void {
  res.set("Content-Type", "application/json; charset=utf-8");
}

/**
 * Sets the response headers for html UTF-8 encoded text.
 *
 * @param res - HTTP response whose headers will be modified.
 * @returns void
 */
export function setHTMLTextUtf8Header(res: Response): void {
  res.set("Content-Type", "text/html; charset=utf-8");
}
