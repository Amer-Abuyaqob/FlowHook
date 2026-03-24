/**
 * Action dispatcher — routes to transform, filter, or template by action type.
 *
 * Central entry point for running pipeline actions on job payloads.
 */
import type {
  ActionConfig,
  ActionType,
  FilterActionConfig,
  TemplateActionConfig,
  TransformActionConfig,
} from "../../db/types.js";
import { runFilter } from "./filter.js";
import { runTemplate } from "./template.js";
import { runTransform } from "./transform.js";

/** Result when action produces output (transform, or filter keeps event). */
export type ActionResult = { result: unknown } | { filtered: true };

/**
 * Runs the appropriate action by type and returns the outcome.
 *
 * @param actionType - One of transform, filter, or template.
 * @param actionConfig - Action-specific config; must not be null.
 * @param payload - Raw inbound webhook payload.
 * @returns Promise resolving to { result } or { filtered: true }.
 * @throws {Error} When actionConfig is null, action type is unknown, or the action throws.
 */
export async function runAction(
  actionType: ActionType,
  actionConfig: ActionConfig | null,
  payload: unknown
): Promise<ActionResult> {
  if (actionConfig === null) {
    throw new Error("Action config is required");
  }

  switch (actionType) {
    case "transform":
      return Promise.resolve(
        runTransform(actionConfig as TransformActionConfig, payload)
      );
    case "filter":
      return runFilter(actionConfig as FilterActionConfig, payload);
    case "template":
      return runTemplate(actionConfig as TemplateActionConfig, payload);
    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}

export { runFilter } from "./filter.js";
export { runTemplate } from "./template.js";
export { runTransform } from "./transform.js";
