/**
 * Generic request validation helpers.
 *
 * Reusable assertion and extraction utilities for validating API request bodies.
 * All helpers throw BadRequestError with caller-supplied messages.
 */
import { BadRequestError } from "../errors.js";

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
