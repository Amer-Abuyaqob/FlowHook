/**
 * Filter action stub — not implemented in Phase 2.
 *
 * Will evaluate conditions against payload; Phase 2 throws on any call.
 */
import type { FilterActionConfig } from "../../db/types.js";

/**
 * Filter action runner (stub). Throws when called.
 *
 * @param _config - Filter action config (unused in Phase 2).
 * @param _payload - Inbound payload (unused in Phase 2).
 * @returns never
 * @throws {Error} Always — "Filter action is not implemented"
 */
export function runFilter(
  _config: FilterActionConfig,
  _payload: unknown
): never {
  throw new Error("Filter action is not implemented");
}
