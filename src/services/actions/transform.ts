/**
 * Transform action — rename or reshape JSON fields per mappings.
 *
 * Uses getValueAtPath and setValueAtPath for field extraction and assignment.
 */
import type { TransformActionConfig } from "../../db/types.js";
import { getValueAtPath, setValueAtPath } from "../../lib/jsonPath.js";

/**
 * Runs the transform action: maps source fields to target keys in output.
 *
 * Config is assumed valid (validated on pipeline create). For optional mappings,
 * missing source values are omitted from the output.
 *
 * @param config - Transform action config with mappings array.
 * @param payload - Raw inbound webhook payload.
 * @returns Object with result containing the transformed output.
 * @throws {Error} When a required field is missing (value undefined and not optional).
 */
export function runTransform(
  config: TransformActionConfig,
  payload: unknown
): { result: Record<string, unknown> } {
  const output: Record<string, unknown> = {};

  for (const mapping of config.mappings) {
    const value = getValueAtPath(payload, mapping.from);

    if (value === undefined && !mapping.optional) {
      throw new Error(`Required field missing: ${mapping.from}`);
    }

    if (value !== undefined) {
      setValueAtPath(output, mapping.to, value);
    }
  }

  return { result: output };
}
