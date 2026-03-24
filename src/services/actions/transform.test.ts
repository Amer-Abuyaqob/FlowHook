/**
 * Unit tests for transform action: runTransform.
 */
import { describe, expect, it } from "vitest";
import { runTransform } from "./transform.js";

describe("runTransform", () => {
  it("simple rename: { from: 'a', to: 'b' } + { a: 1 } → { result: { b: 1 } }", () => {
    const config = { mappings: [{ from: "a", to: "b" }] };
    const payload = { a: 1 };
    expect(runTransform(config, payload)).toEqual({ result: { b: 1 } });
  });

  it("optional missing: { from: 'x', to: 'y', optional: true } + {} → { result: {} }", () => {
    const config = {
      mappings: [{ from: "x", to: "y", optional: true }],
    };
    const payload = {};
    expect(runTransform(config, payload)).toEqual({ result: {} });
  });

  it("required missing: { from: 'x', to: 'y' } + {} → throws", () => {
    const config = { mappings: [{ from: "x", to: "y" }] };
    const payload = {};
    expect(() => runTransform(config, payload)).toThrow(
      "Required field missing: x"
    );
  });

  it("nested from path: { from: 'a.b', to: 'val' } + { a: { b: 42 } } → { result: { val: 42 } }", () => {
    const config = { mappings: [{ from: "a.b", to: "val" }] };
    const payload = { a: { b: 42 } };
    expect(runTransform(config, payload)).toEqual({ result: { val: 42 } });
  });

  it("multiple mappings: both present → both in output", () => {
    const config = {
      mappings: [
        { from: "firstName", to: "first_name" },
        { from: "lastName", to: "last_name" },
      ],
    };
    const payload = { firstName: "Jane", lastName: "Doe" };
    expect(runTransform(config, payload)).toEqual({
      result: { first_name: "Jane", last_name: "Doe" },
    });
  });
});
