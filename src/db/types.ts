/**
 * FlowHook database and domain types.
 * Shared by schema definitions and services.
 */

/**
 * Single field mapping for the transform action.
 *
 * @property from - Source JSON path or key name.
 * @property to - Target key name in the output.
 * @property optional - If true, missing source does not fail the transform.
 */
export type TransformMapping = {
  from: string;
  to: string;
  optional?: boolean;
};

/**
 * Config for the transform action: rename or reshape JSON fields.
 *
 * @property mappings - Array of field mappings from source to target.
 */
export type TransformActionConfig = {
  mappings: TransformMapping[];
};

/**
 * Single condition for the filter action.
 *
 * @property path - Dot-notation path into the payload (e.g. "event.type").
 * @property operator - Comparison operator.
 * @property value - Value to compare against (not used for "exists").
 */
export type FilterCondition = {
  path: string;
  operator: "eq" | "neq" | "exists" | "contains";
  value?: unknown;
};

/**
 * Config for the filter action: keep or drop events based on conditions.
 *
 * @property conditions - All conditions are ANDed; event is dropped if any fails.
 */
export type FilterActionConfig = {
  conditions: FilterCondition[];
};

/**
 * Config for the template action: render a string from payload placeholders.
 *
 * @property template - String with {{path}} placeholders (Mustache-style).
 */
export type TemplateActionConfig = {
  template: string;
};

/**
 * Union of all action config shapes.
 */
export type ActionConfig =
  | TransformActionConfig
  | FilterActionConfig
  | TemplateActionConfig;

/**
 * Supported pipeline action types.
 */
export type ActionType = "transform" | "filter" | "template";

/**
 * Job lifecycle status: pending → processing → completed | filtered | failed.
 */
export type JobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "filtered"
  | "failed";
