/**
 * Unit tests for slug module: generateSlug and validateSlug.
 */
import { describe, expect, it } from "vitest";
import { generateSlug, validateSlug } from "./slug.js";

describe("generateSlug", () => {
  it('converts "My Stripe Orders" to "my-stripe-orders"', () => {
    expect(generateSlug("My Stripe Orders")).toBe("my-stripe-orders");
  });

  it('collapses spaces in "  Hello   World  " to "hello-world"', () => {
    expect(generateSlug("  Hello   World  ")).toBe("hello-world");
  });

  it('strips invalid chars: "Test@#$%" becomes "test"', () => {
    expect(generateSlug("Test@#$%")).toBe("test");
  });

  it('returns "unnamed" when all chars stripped: "$$$$"', () => {
    expect(generateSlug("$$$$")).toBe("unnamed");
  });
});

describe("validateSlug", () => {
  it('returns true for valid slug "my-pipeline"', () => {
    expect(validateSlug("my-pipeline")).toBe(true);
  });

  it("returns false for uppercase: My-Pipeline", () => {
    expect(validateSlug("My-Pipeline")).toBe(false);
  });

  it("returns false for space: invalid slug", () => {
    expect(validateSlug("invalid slug")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(validateSlug("")).toBe(false);
  });
});
