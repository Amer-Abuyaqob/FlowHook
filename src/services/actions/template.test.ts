/**
 * Unit tests for template action rendering.
 */
import { describe, expect, it } from "vitest";
import { runTemplate } from "./template.js";

describe("runTemplate", () => {
  it("replaces a simple placeholder", () => {
    const outcome = runTemplate(
      { template: "Hello {{name}}" },
      { name: "Amer" }
    );

    expect(outcome).toEqual({ result: { body: "Hello Amer" } });
  });

  it("replaces nested placeholders", () => {
    const outcome = runTemplate(
      { template: "Email: {{user.email}}" },
      { user: { email: "x@example.com" } }
    );

    expect(outcome).toEqual({ result: { body: "Email: x@example.com" } });
  });

  it("replaces repeated placeholders", () => {
    const outcome = runTemplate(
      { template: "{{name}} likes {{name}}" },
      { name: "FlowHook" }
    );

    expect(outcome).toEqual({ result: { body: "FlowHook likes FlowHook" } });
  });

  it("replaces missing placeholders with empty string", () => {
    const outcome = runTemplate(
      { template: "Hello {{name}} {{missing.value}}" },
      { name: "Amer" }
    );

    expect(outcome).toEqual({ result: { body: "Hello Amer " } });
  });

  it("renders number, boolean, object, and array values", () => {
    const outcome = runTemplate(
      { template: "{{count}}|{{enabled}}|{{meta}}|{{tags}}" },
      {
        count: 42,
        enabled: false,
        meta: { a: 1 },
        tags: ["x", "y"],
      }
    );

    expect(outcome).toEqual({
      result: { body: '42|false|{"a":1}|["x","y"]' },
    });
  });

  it("returns unchanged text when there are no placeholders", () => {
    const outcome = runTemplate({ template: "static text" }, { name: "Amer" });

    expect(outcome).toEqual({ result: { body: "static text" } });
  });
});
