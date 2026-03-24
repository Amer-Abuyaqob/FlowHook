/**
 * Template action implementation for rendering payload data into text.
 *
 * Replaces {{path.to.value}} placeholders using dot-notation lookup.
 */
import type { TemplateActionConfig } from "../../db/types.js";
import { getValueAtPath } from "../../lib/jsonPath.js";

const PLACEHOLDER_REGEX = /\{\{\s*([^{}]+?)\s*\}\}/g;

/**
 * Converts a placeholder value to a safe output string.
 *
 * @param value - Placeholder value resolved from payload.
 * @returns Render-safe string representation.
 */
function formatTemplateValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Renders a template string using payload placeholders.
 *
 * @param config - Template action config with a template string.
 * @param payload - Inbound webhook payload.
 * @returns Object containing rendered body text.
 */
export function runTemplate(
  config: TemplateActionConfig,
  payload: unknown
): { result: { body: string } } {
  const renderedBody = config.template.replace(
    PLACEHOLDER_REGEX,
    (_match, rawPath: string) => {
      const path = rawPath.trim();
      const value = getValueAtPath(payload, path);
      return formatTemplateValue(value);
    }
  );

  return { result: { body: renderedBody } };
}
