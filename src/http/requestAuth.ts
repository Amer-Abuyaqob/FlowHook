/**
 * Extracts API credentials from HTTP request headers.
 *
 * Supports Bearer tokens and X-API-Key for use by auth validation logic.
 */

import type { Request } from "express";

/**
 * Extracts the token from an Authorization header when it uses the Bearer scheme.
 *
 * Scheme matching is case-insensitive per RFC 7235. Returns undefined when the
 * header is missing, empty, or does not start with "Bearer " (after trimming).
 *
 * @param authorization - Raw Authorization header value (e.g. req.headers.authorization).
 * @returns The token string after "Bearer ", or undefined.
 * @example
 * extractBearerToken("Bearer my-token") // "my-token"
 * extractBearerToken("bearer xyz")      // "xyz"
 * extractBearerToken("InvalidFormat")   // undefined
 */
export function extractBearerToken(
  authorization: string | undefined
): string | undefined {
  if (authorization === undefined || authorization === "") return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  if (!match) return undefined;
  const token = match[1].trim();
  return token === "" ? undefined : token;
}

/**
 * Extracts the API key from the X-API-Key header.
 *
 * Express normalizes header names to lowercase, so use "x-api-key".
 *
 * @param xApiKey - Raw X-API-Key header value.
 * @returns Trimmed value or undefined when missing or empty.
 */
export function extractXApiKey(
  xApiKey: string | undefined
): string | undefined {
  if (xApiKey === undefined || xApiKey === "") return undefined;
  const trimmed = xApiKey.trim();
  return trimmed === "" ? undefined : trimmed;
}

/**
 * Extracts the raw credential from request headers.
 *
 * Checks Authorization (Bearer) first, then X-API-Key. Returns undefined when
 * neither yields a non-empty value.
 *
 * @param req - Express request whose headers are inspected.
 * @returns The credential string, or undefined.
 */
export function extractCredentialFromRequest(req: Request): string | undefined {
  const bearer = extractBearerToken(req.headers.authorization);
  if (bearer !== undefined) return bearer;
  const xApiKey = req.headers["x-api-key"];
  const value = Array.isArray(xApiKey) ? xApiKey[0] : xApiKey;
  return extractXApiKey(value);
}
