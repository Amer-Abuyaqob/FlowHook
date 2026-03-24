/**
 * Validates API key credentials from incoming requests.
 *
 * Compares Bearer or X-API-Key header values against config; returns a result
 * suitable for auth middleware.
 */

import crypto from "node:crypto";
import type { Request } from "express";
import { extractCredentialFromRequest } from "../http/requestAuth.js";
import { config } from "../config.js";

/**
 * Identity produced when authentication succeeds.
 *
 * @property type - Authentication mechanism; "api_key" for API key validation.
 */
export interface Identity {
  type: "api_key";
}

/**
 * Result of validateAuth.
 *
 * @property valid - Whether the request is authenticated.
 * @property identity - Set when valid is true; describes the authenticated identity.
 */
export type ValidateResult =
  | { valid: true; identity: Identity }
  | { valid: false };

/**
 * Compares two strings in constant time to avoid timing attacks.
 *
 * @param a - First string.
 * @param b - Second string.
 * @returns True when both strings are equal.
 * @internal
 */
function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  if (bufA.length === 0) return bufB.length === 0;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Validates the request against the configured API key.
 *
 * Extracts the credential from Authorization (Bearer) or X-API-Key headers.
 * Returns a resolved Promise for future extensibility (e.g. other auth strategies).
 *
 * @param req - Express request whose headers are inspected.
 * @returns Promise resolving to valid/identity or valid: false.
 */
export async function validateAuth(req: Request): Promise<ValidateResult> {
  const credential = extractCredentialFromRequest(req);
  if (credential === undefined) {
    return { valid: false };
  }
  if (!timingSafeEqualStrings(credential, config.apiKey)) {
    return { valid: false };
  }
  return { valid: true, identity: { type: "api_key" } };
}
