/**
 * Unit tests for validation module: assertIsRecord, assertIsObjectOrNull, getRequiredString.
 */
import { describe, expect, it } from "vitest";
import { BadRequestError } from "../errors.js";
import {
  assertIsObjectOrNull,
  assertIsRecord,
  assertValidUrl,
  getRequiredString,
} from "./validation.js";

describe("assertIsRecord", () => {
  it("returns object for plain object", () => {
    const obj = { a: 1 };
    expect(assertIsRecord(obj, "custom msg")).toBe(obj);
  });

  it("throws with custom message when value is null", () => {
    expect(() => assertIsRecord(null, "Invalid request")).toThrow(
      BadRequestError
    );
    expect(() => assertIsRecord(null, "Invalid request")).toThrow(
      "Invalid request"
    );
  });

  it("throws when value is array", () => {
    expect(() => assertIsRecord([], "Not an object")).toThrow("Not an object");
  });

  it("throws when value is string", () => {
    expect(() => assertIsRecord("hi", "Must be object")).toThrow(
      "Must be object"
    );
  });

  it("throws when value is number", () => {
    expect(() => assertIsRecord(42, "Error")).toThrow("Error");
  });
});

describe("assertIsObjectOrNull", () => {
  it("returns null when value is null", () => {
    expect(assertIsObjectOrNull(null, "msg")).toBeNull();
  });

  it("returns object for plain object", () => {
    const obj = { x: 1 };
    expect(assertIsObjectOrNull(obj, "msg")).toBe(obj);
  });

  it("throws with custom message when value is array", () => {
    expect(() => assertIsObjectOrNull([], "Must be object or null")).toThrow(
      "Must be object or null"
    );
  });

  it("throws when value is string", () => {
    expect(() => assertIsObjectOrNull("x", "Bad")).toThrow("Bad");
  });
});

describe("getRequiredString", () => {
  it("returns string when key exists and is string", () => {
    expect(getRequiredString({ name: "test" }, "name", "msg")).toBe("test");
  });

  it("throws when key is missing", () => {
    expect(() => getRequiredString({}, "name", "name is required")).toThrow(
      "name is required"
    );
  });

  it("throws when value is not string", () => {
    expect(() =>
      getRequiredString({ name: 123 }, "name", "name must be string")
    ).toThrow("name must be string");
  });

  it("throws when value is null", () => {
    expect(() => getRequiredString({ name: null }, "name", "Required")).toThrow(
      "Required"
    );
  });
});

describe("assertValidUrl", () => {
  it("returns url for valid https URL", () => {
    expect(
      assertValidUrl("https://example.com/webhook", "Invalid URL format")
    ).toBe("https://example.com/webhook");
  });

  it("returns url for valid http URL", () => {
    expect(assertValidUrl("http://localhost:8080/callback")).toBe(
      "http://localhost:8080/callback"
    );
  });

  it("throws with custom message for invalid protocol", () => {
    expect(() =>
      assertValidUrl("ftp://example.com/file", "Invalid URL format")
    ).toThrow(BadRequestError);
    expect(() =>
      assertValidUrl("ftp://example.com/file", "Invalid URL format")
    ).toThrow("Invalid URL format");
  });

  it("throws for malformed URL", () => {
    expect(() => assertValidUrl("not-a-url", "Invalid URL format")).toThrow(
      "Invalid URL format"
    );
  });

  it("throws for empty string", () => {
    expect(() => assertValidUrl("", "Invalid URL format")).toThrow(
      "Invalid URL format"
    );
  });
});
