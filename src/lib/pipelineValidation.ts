/**
 * Request body validation for pipeline create and update endpoints.
 *
 * Parses and validates raw request bodies; converts snake_case to camelCase for the service layer.
 */
import type { ActionConfig, ActionType } from "../db/types.js";
import { BadRequestError } from "../errors.js";
import { parseActionType, validateActionConfig } from "./actionConfig.js";
import {
  assertIsObjectOrNull,
  assertIsRecord,
  getRequiredString,
} from "./validation.js";

/** Parsed create body for pipeline creation. */
export type CreatePipelineBody = {
  name: string;
  actionType: ActionType;
  actionConfig: ActionConfig | null;
};

/** Parsed update body for pipeline updates (all fields optional). */
export type UpdatePipelineBody = {
  name?: string;
  actionType?: ActionType;
  actionConfig?: ActionConfig | null;
  isActive?: boolean;
};

/**
 * Parses and validates the request body for POST /api/pipelines.
 *
 * @param body - Raw request body (typically req.body).
 * @returns Parsed body with camelCase keys.
 * @throws {BadRequestError} When body is invalid or required fields are missing.
 */
export function parseCreateBody(body: unknown): CreatePipelineBody {
  const obj = assertIsRecord(body, "Invalid request");

  const name = getRequiredString(obj, "name", "name is required");
  if (name.trim().length === 0) {
    throw new BadRequestError("name must be non-empty");
  }

  const actionTypeRaw = obj.action_type;
  if (actionTypeRaw === undefined || actionTypeRaw === null) {
    throw new BadRequestError("action_type is required");
  }
  const actionType = parseActionType(actionTypeRaw);

  const actionConfigRaw = obj.action_config;
  if (actionConfigRaw === undefined || actionConfigRaw === null) {
    throw new BadRequestError("action_config is required");
  }
  const actionConfigObj = assertIsObjectOrNull(
    actionConfigRaw,
    "action_config must be an object"
  );
  validateActionConfig(actionType, actionConfigObj ?? {});

  return {
    name: name.trim(),
    actionType,
    actionConfig: actionConfigObj as ActionConfig,
  };
}

/**
 * Parses and validates the request body for PUT /api/pipelines/:id.
 *
 * @param body - Raw request body (typically req.body).
 * @returns Parsed body with camelCase keys; only includes present fields.
 * @throws {BadRequestError} When body or any present field is invalid.
 */
export function parseUpdateBody(body: unknown): UpdatePipelineBody {
  const obj = assertIsRecord(body, "Invalid request");
  const result: UpdatePipelineBody = {};

  if ("name" in obj && obj.name !== undefined) {
    const name = getRequiredString(obj, "name", "name must be a string");
    if (name.trim().length === 0) {
      throw new BadRequestError("name must be non-empty");
    }
    result.name = name.trim();
  }

  if ("action_type" in obj && obj.action_type !== undefined) {
    result.actionType = parseActionType(obj.action_type);
  }

  if ("action_config" in obj) {
    const raw = obj.action_config;
    if (raw === null) {
      result.actionConfig = null;
    } else {
      const configObj = assertIsObjectOrNull(
        raw,
        "action_config must be an object"
      );
      if (configObj !== null) {
        const actionType = result.actionType ?? ("transform" as ActionType);
        validateActionConfig(actionType, configObj);
        result.actionConfig = configObj as ActionConfig;
      } else {
        result.actionConfig = null;
      }
    }
  }

  if ("is_active" in obj && obj.is_active !== undefined) {
    if (typeof obj.is_active !== "boolean") {
      throw new BadRequestError("is_active must be a boolean");
    }
    result.isActive = obj.is_active;
  }

  return result;
}
