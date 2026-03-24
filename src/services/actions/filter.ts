/**
 * Filter action evaluator for conditional keep/drop logic.
 *
 * Evaluates all configured conditions with AND semantics.
 */
import type { FilterActionConfig } from "../../db/types.js";
import { getValueAtPath } from "../../lib/jsonPath.js";

/**
 * Returns whether an actual value contains an expected value.
 *
 * Supports:
 * - string contains string (case-sensitive)
 * - array contains value (strict equality via Array.includes)
 *
 * @param actual - Value extracted from payload at condition path.
 * @param expected - Condition value to look for.
 * @returns True when containment rule matches; otherwise false.
 */
function matchesContains(actual: unknown, expected: unknown): boolean {
  if (typeof actual === "string" && typeof expected === "string") {
    return actual.includes(expected);
  }
  if (Array.isArray(actual)) {
    return actual.includes(expected);
  }
  return false;
}

/**
 * Evaluates one filter condition against the payload.
 *
 * @param condition - Filter condition (path, operator, optional value).
 * @param payload - Incoming payload.
 * @returns True when condition matches; otherwise false.
 */
function evaluateCondition(
  condition: FilterActionConfig["conditions"][number],
  payload: unknown
): boolean {
  const actualValue = getValueAtPath(payload, condition.path);
  switch (condition.operator) {
    case "eq":
      return actualValue === condition.value;
    case "neq":
      return actualValue !== condition.value;
    case "exists":
      return actualValue !== undefined;
    case "contains":
      return matchesContains(actualValue, condition.value);
    default:
      return false;
  }
}

/**
 * Checks whether all conditions match for the payload.
 *
 * @param conditions - Filter condition list; empty means pass-through.
 * @param payload - Incoming payload.
 * @returns True when all conditions match.
 */
function allConditionsMatch(
  conditions: FilterActionConfig["conditions"],
  payload: unknown
): boolean {
  return conditions.every((condition) => evaluateCondition(condition, payload));
}

/**
 * Filter action runner.
 *
 * @param config - Filter action config.
 * @param payload - Inbound payload.
 * @returns Action outcome: keep payload as result, or mark as filtered.
 */
export function runFilter(
  config: FilterActionConfig,
  payload: unknown
): { result: unknown } | { filtered: true } {
  if (allConditionsMatch(config.conditions, payload)) {
    return { result: payload };
  }
  return { filtered: true };
}
