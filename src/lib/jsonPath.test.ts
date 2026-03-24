/**
 * Unit tests for jsonPath module: getValueAtPath and setValueAtPath.
 */
import { describe, expect, it } from "vitest";
import { getValueAtPath, setValueAtPath } from "./jsonPath.js";

describe("getValueAtPath", () => {
  it("returns value at flat key", () => {
    expect(getValueAtPath({ a: 1 }, "a")).toBe(1);
  });

  it("returns value at nested path", () => {
    expect(getValueAtPath({ a: { b: 2 } }, "a.b")).toBe(2);
  });

  it("returns undefined when path does not exist", () => {
    expect(getValueAtPath({}, "x")).toBeUndefined();
  });

  it("returns undefined when intermediate value is null", () => {
    expect(getValueAtPath({ a: null }, "a.b")).toBeUndefined();
  });

  it("returns undefined when intermediate value is undefined", () => {
    expect(getValueAtPath({ a: undefined }, "a.b")).toBeUndefined();
  });

  it("returns value at deeply nested path", () => {
    expect(getValueAtPath({ a: { b: { c: "nested" } } }, "a.b.c")).toBe(
      "nested"
    );
  });
});

describe("setValueAtPath", () => {
  it("sets value at flat key and mutates object", () => {
    const obj: Record<string, unknown> = {};
    setValueAtPath(obj, "foo", 42);
    expect(obj).toEqual({ foo: 42 });
  });

  it("overwrites existing key", () => {
    const obj: Record<string, unknown> = { foo: 1 };
    setValueAtPath(obj, "foo", 99);
    expect(obj).toEqual({ foo: 99 });
  });
});
