/**
 * Action config validation for pipeline action types.
 *
 * Validates that raw objects conform to the expected shape for transform, filter, and template actions.
 * Uses Template Method: common validation steps, then type-specific item validation.
 */
import type { ActionType } from "../db/types.js";
import { BadRequestError } from "../errors.js";
import { assertIsRecord } from "./validation.js";

const VALID_ACTION_TYPES: readonly ActionType[] = [
  "transform",
  "filter",
  "template",
];

const FILTER_OPERATORS = ["eq", "neq", "exists", "contains"] as const;

/**
 * Validates that a config object conforms to the expected shape for the given action type.
 * Throws BadRequestError on invalid input.
 *
 * Template Method: (1) validate action type, (2) assert config is object, (3) delegate to type-specific validator.
 *
 * @param actionType - One of transform, filter, or template.
 * @param config - Raw config object (typically from request body).
 * @returns void
 * @throws {BadRequestError} When action_type is invalid or config shape does not match.
 */
export function validateActionConfig(
  actionType: ActionType,
  config: unknown
): void {
  assertValidActionType(actionType);
  const obj = assertIsRecord(config, "action_config must be an object");

  switch (actionType) {
    case "transform":
      validateTransformConfig(obj);
      break;
    case "filter":
      validateFilterConfig(obj);
      break;
    case "template":
      validateTemplateConfig(obj);
      break;
  }
}

/**
 * Throws if actionType is not one of transform, filter, or template.
 *
 * @param actionType - Value to check.
 * @throws {BadRequestError} When invalid.
 */
function assertValidActionType(actionType: string): void {
  if (!VALID_ACTION_TYPES.includes(actionType as ActionType)) {
    throw new BadRequestError("Invalid action_type");
  }
}

/**
 * Parses and validates action_type from a raw request value.
 *
 * @param value - Raw value from request body.
 * @returns Valid ActionType.
 * @throws {BadRequestError} When value is not a string or not a valid action type.
 */
export function parseActionType(value: unknown): ActionType {
  if (typeof value !== "string") {
    throw new BadRequestError("action_type must be a string");
  }
  if (!VALID_ACTION_TYPES.includes(value as ActionType)) {
    throw new BadRequestError(
      "action_type must be one of: transform, filter, template"
    );
  }
  return value as ActionType;
}

/**
 * Returns the array at obj[key], or throws if missing or not an array.
 *
 * @param obj - Parent object.
 * @param key - Property name.
 * @param message - Error message when invalid.
 * @param options - Optional constraints (e.g. nonEmpty).
 * @returns The array value.
 * @throws {BadRequestError} When invalid.
 */
function getRequiredArray(
  obj: Record<string, unknown>,
  key: string,
  message: string,
  options?: { nonEmpty?: boolean }
): unknown[] {
  const arr = obj[key];
  if (!Array.isArray(arr)) {
    throw new BadRequestError(message);
  }
  if (options?.nonEmpty && arr.length === 0) {
    throw new BadRequestError(message);
  }
  return arr;
}

/**
 * Throws if item is not a plain object.
 *
 * @param item - Value to check.
 * @param index - Index (for error message).
 * @param arrayName - Name of the array (for error message).
 * @throws {BadRequestError} When not a plain object.
 */
function assertItemIsObject(
  item: unknown,
  index: number,
  arrayName: string
): asserts item is Record<string, unknown> {
  if (item === null || typeof item !== "object" || Array.isArray(item)) {
    throw new BadRequestError(
      `${arrayName}[${index}] must be an object with required properties`
    );
  }
}

/**
 * Throws if value is not a string.
 *
 * @param value - Value to check.
 * @param message - Error message.
 * @throws {BadRequestError} When not a string.
 */
function assertString(value: unknown, message: string): void {
  if (typeof value !== "string") {
    throw new BadRequestError(message);
  }
}

/**
 * Throws if value is defined and not a boolean.
 *
 * @param obj - Parent object.
 * @param key - Property name.
 * @param message - Error message when invalid.
 * @throws {BadRequestError} When key exists and value is not boolean.
 */
function assertOptionalBoolean(
  obj: Record<string, unknown>,
  key: string,
  message: string
): void {
  if (key in obj && obj[key] !== undefined && typeof obj[key] !== "boolean") {
    throw new BadRequestError(message);
  }
}

/**
 * Validates each element of an array: ensures each is an object, then calls validator.
 *
 * @param arr - Array to validate.
 * @param arrayName - Name for error messages.
 * @param validateItem - Called for each item; may throw BadRequestError.
 * @throws {BadRequestError} When any item is invalid.
 */
function validateArrayItems(
  arr: unknown[],
  arrayName: string,
  validateItem: (item: Record<string, unknown>, index: number) => void
): void {
  for (let i = 0; i < arr.length; i++) {
    assertItemIsObject(arr[i], i, arrayName);
    validateItem(arr[i] as Record<string, unknown>, i);
  }
}

/**
 * Validates transform action config: mappings array with from/to strings.
 *
 * @param obj - Raw config object.
 * @throws {BadRequestError} When invalid.
 */
function validateTransformConfig(obj: Record<string, unknown>): void {
  const mappings = getRequiredArray(
    obj,
    "mappings",
    "transform action_config must have a non-empty mappings array",
    { nonEmpty: true }
  );
  validateArrayItems(mappings, "transform mappings", (mapping, i) => {
    assertString(
      mapping.from,
      `transform mappings[${i}].from must be a string`
    );
    assertString(mapping.to, `transform mappings[${i}].to must be a string`);
    assertOptionalBoolean(
      mapping,
      "optional",
      `transform mappings[${i}].optional must be a boolean`
    );
  });
}

/**
 * Validates filter action config: conditions array with path, operator, optional value.
 *
 * @param obj - Raw config object.
 * @throws {BadRequestError} When invalid.
 */
function validateFilterConfig(obj: Record<string, unknown>): void {
  const conditions = getRequiredArray(
    obj,
    "conditions",
    "filter action_config must have a conditions array"
  );
  validateArrayItems(conditions, "filter conditions", (cond, i) => {
    assertString(cond.path, `filter conditions[${i}].path must be a string`);
    const op = cond.operator;
    if (!FILTER_OPERATORS.includes(op as (typeof FILTER_OPERATORS)[number])) {
      throw new BadRequestError(
        `filter conditions[${i}].operator must be one of: eq, neq, exists, contains`
      );
    }
    if (op === "exists") {
      if ("value" in cond && cond.value !== undefined) {
        throw new BadRequestError(
          `filter conditions[${i}]: value must not be set for operator "exists"`
        );
      }
    } else if (!("value" in cond)) {
      throw new BadRequestError(
        `filter conditions[${i}]: value is required for operator "${op}"`
      );
    }
  });
}

/**
 * Validates template action config: template must be non-empty string.
 *
 * @param obj - Raw config object.
 * @throws {BadRequestError} When invalid.
 */
function validateTemplateConfig(obj: Record<string, unknown>): void {
  const template = obj.template;
  assertString(template, "template action_config must have a template string");
  if ((template as string).trim().length === 0) {
    throw new BadRequestError(
      "template action_config.template must be non-empty"
    );
  }
}
