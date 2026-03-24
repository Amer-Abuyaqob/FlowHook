/**
 * Template action stub — not implemented in Phase 2.
 *
 * Will render strings with {{path}} placeholders; Phase 2 throws on any call.
 */
import type { TemplateActionConfig } from "../../db/types.js";

/**
 * Template action runner (stub). Throws when called.
 *
 * @param _config - Template action config (unused in Phase 2).
 * @param _payload - Inbound payload (unused in Phase 2).
 * @returns never
 * @throws {Error} Always — "Template action is not implemented"
 */
export function runTemplate(
  _config: TemplateActionConfig,
  _payload: unknown
): never {
  throw new Error("Template action is not implemented");
}
