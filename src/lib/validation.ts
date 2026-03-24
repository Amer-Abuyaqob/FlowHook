/**
 * Generic request validation helpers.
 *
 * Reusable assertion and extraction utilities for validating API request bodies
 * and other inputs (URLs, UUIDs). All helpers throw BadRequestError with caller-supplied messages.
 */
import { BadRequestError } from "../errors.js";

/** Lowercase UUID string pattern (matches Postgres textual UUID form). */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Returns true when the string matches a canonical UUID format.
 *
 * @param value - String to test.
 * @returns Whether value looks like a UUID.
 */
export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Asserts that the string is a well-formed UUID (RFC-style hex segments).
 *
 * @param value - String to validate.
 * @param message - Error message when invalid.
 * @returns The same string.
 * @throws {BadRequestError} When value is not a UUID string.
 */
export function assertValidUuid(value: string, message: string): string {
  if (!isValidUuid(value)) {
    throw new BadRequestError(message);
  }
  return value;
}

/**
 * Asserts that value is a plain object (excludes null, arrays, primitives).
 *
 * @param value - Value to check.
 * @param message - Error message when invalid.
 * @returns Value cast as Record.
 * @throws {BadRequestError} When not a plain object.
 */
export function assertIsRecord(
  value: unknown,
  message: string
): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new BadRequestError(message);
  }
  return value as Record<string, unknown>;
}

/**
 * Asserts that value is a plain object or null.
 *
 * @param value - Value to check.
 * @param message - Error message when invalid (applies when value is array or primitive).
 * @returns The object, or null.
 * @throws {BadRequestError} When value is array or primitive (null returns null).
 */
export function assertIsObjectOrNull(
  value: unknown,
  message: string
): Record<string, unknown> | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new BadRequestError(message);
  }
  return value as Record<string, unknown>;
}

/**
 * Returns the string at obj[key], or throws if missing or not a string.
 *
 * @param obj - Parent object.
 * @param key - Property name.
 * @param message - Error message when invalid.
 * @returns The string value.
 * @throws {BadRequestError} When key is missing or value is not a string.
 */
export function getRequiredString(
  obj: Record<string, unknown>,
  key: string,
  message: string
): string {
  const value = obj[key];
  if (typeof value !== "string") {
    throw new BadRequestError(message);
  }
  return value;
}

/**
 * Asserts that the given string is a valid http or https URL.
 *
 * @param url - String to validate as URL.
 * @param message - Error message when invalid (default: "Invalid URL format").
 * @returns The URL string unchanged.
 * @throws {BadRequestError} When url is not a valid http(s) URL.
 */
export function assertValidUrl(
  url: string,
  message: string = "Invalid URL format"
): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new BadRequestError(message);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new BadRequestError(message);
  }
  return url;
}
