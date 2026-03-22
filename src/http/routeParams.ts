/**
 * Helpers for extracting route parameters from Express requests.
 *
 * Handles Express's string | string[] param typing for consistent string extraction.
 */
import type { Request } from "express";

/**
 * Extracts a route param as a string.
 *
 * Express params are typed as string | string[]; this normalizes to string.
 * For single-segment params (e.g. :id, :slug), returns the value or empty string.
 *
 * @param req - Express request.
 * @param name - Param name (e.g. "id", "slug", "subscriberId").
 * @returns The param value as string, or empty string if missing.
 */
export function getRouteParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) return value[0];
  return "";
}
