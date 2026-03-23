/**
 * Unit tests for date formatting helpers.
 */
import { describe, expect, it } from "vitest";
import { toIsoString } from "./dateFormat.js";

describe("toIsoString", () => {
  it("converts Date to ISO 8601 string", () => {
    const d = new Date("2025-03-14T12:00:00.000Z");
    expect(toIsoString(d)).toBe("2025-03-14T12:00:00.000Z");
  });

  it("converts non-Date to string", () => {
    expect(toIsoString("2025-01-01")).toBe("2025-01-01");
    expect(toIsoString(null)).toBe("null");
  });
});
