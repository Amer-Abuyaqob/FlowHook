/**
 * Dot-notation path helpers for action payloads.
 *
 * Provides getValueAtPath and setValueAtPath used by transform and filter actions.
 */

/**
 * Gets the value at a dot-notation path in an object.
 *
 * @param obj - Source object (may be nested).
 * @param path - Dot-separated path (e.g. "a.b.c").
 * @returns Value at path, or undefined if not found or intermediate value is null/undefined.
 * @example
 * getValueAtPath({ a: 1 }, "a") // 1
 * getValueAtPath({ a: { b: 2 } }, "a.b") // 2
 * getValueAtPath({}, "x") // undefined
 */
export function getValueAtPath(obj: unknown, path: string): unknown {
  if (path === "") return obj;
  const segments = path.split(".");
  let current: unknown = obj;
  for (const seg of segments) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object" || Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[seg];
  }
  return current;
}

/**
 * Sets a value at a flat key on an object.
 *
 * v1: Only flat keys (no dots); use obj[key] = value.
 *
 * @param obj - Target object to mutate.
 * @param key - Property name (flat; no dot notation in v1).
 * @param value - Value to set.
 * @returns void
 * @example
 * const o = {}; setValueAtPath(o, "foo", 42); // o is { foo: 42 }
 */
export function setValueAtPath(
  obj: Record<string, unknown>,
  key: string,
  value: unknown
): void {
  obj[key] = value;
}
