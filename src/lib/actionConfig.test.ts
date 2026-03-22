/**
 * Unit tests for actionConfig module: validateActionConfig, parseActionType.
 */
import { describe, expect, it } from "vitest";
import { BadRequestError } from "../errors.js";
import { parseActionType, validateActionConfig } from "./actionConfig.js";

describe("parseActionType", () => {
  it("returns transform for 'transform'", () => {
    expect(parseActionType("transform")).toBe("transform");
  });

  it("returns filter for 'filter'", () => {
    expect(parseActionType("filter")).toBe("filter");
  });

  it("returns template for 'template'", () => {
    expect(parseActionType("template")).toBe("template");
  });

  it("throws when value is not a string", () => {
    expect(() => parseActionType(123)).toThrow(BadRequestError);
    expect(() => parseActionType(123)).toThrow("action_type must be a string");
    expect(() => parseActionType(null)).toThrow("action_type must be a string");
    expect(() => parseActionType({})).toThrow("action_type must be a string");
  });

  it("throws when value is invalid action type string", () => {
    expect(() => parseActionType("invalid")).toThrow(BadRequestError);
    expect(() => parseActionType("invalid")).toThrow(
      "action_type must be one of: transform, filter, template"
    );
  });
});

describe("validateActionConfig", () => {
  describe("invalid action_type", () => {
    it("throws BadRequestError for unknown action type", () => {
      expect(() =>
        validateActionConfig("invalid" as "transform", { mappings: [] })
      ).toThrow(BadRequestError);
      expect(() =>
        validateActionConfig("invalid" as "transform", { mappings: [] })
      ).toThrow("Invalid action_type");
    });
  });

  describe("config must be object", () => {
    it("throws when config is null", () => {
      expect(() => validateActionConfig("transform", null)).toThrow(
        "action_config must be an object"
      );
    });

    it("throws when config is array", () => {
      expect(() => validateActionConfig("transform", [])).toThrow(
        "action_config must be an object"
      );
    });

    it("throws when config is string", () => {
      expect(() => validateActionConfig("template", "hello")).toThrow(
        "action_config must be an object"
      );
    });
  });

  describe("transform", () => {
    it("accepts valid transform config", () => {
      expect(() =>
        validateActionConfig("transform", {
          mappings: [
            { from: "a", to: "b" },
            { from: "x", to: "y", optional: true },
          ],
        })
      ).not.toThrow();
    });

    it("throws when mappings is missing", () => {
      expect(() => validateActionConfig("transform", {})).toThrow(
        "transform action_config must have a non-empty mappings array"
      );
    });

    it("throws when mappings is empty array", () => {
      expect(() => validateActionConfig("transform", { mappings: [] })).toThrow(
        "transform action_config must have a non-empty mappings array"
      );
    });

    it("throws when mappings is not array", () => {
      expect(() =>
        validateActionConfig("transform", { mappings: "invalid" })
      ).toThrow("transform action_config must have a non-empty mappings array");
    });

    it("throws when mapping missing from", () => {
      expect(() =>
        validateActionConfig("transform", {
          mappings: [{ to: "b" }],
        })
      ).toThrow("transform mappings[0].from must be a string");
    });

    it("throws when mapping from is not string", () => {
      expect(() =>
        validateActionConfig("transform", {
          mappings: [{ from: 1, to: "b" }],
        })
      ).toThrow("transform mappings[0].from must be a string");
    });

    it("throws when mapping missing to", () => {
      expect(() =>
        validateActionConfig("transform", {
          mappings: [{ from: "a" }],
        })
      ).toThrow("transform mappings[0].to must be a string");
    });

    it("throws when optional is not boolean", () => {
      expect(() =>
        validateActionConfig("transform", {
          mappings: [{ from: "a", to: "b", optional: "yes" }],
        })
      ).toThrow("transform mappings[0].optional must be a boolean");
    });
  });

  describe("filter", () => {
    it("accepts valid filter config with eq", () => {
      expect(() =>
        validateActionConfig("filter", {
          conditions: [
            { path: "event.type", operator: "eq", value: "order.created" },
          ],
        })
      ).not.toThrow();
    });

    it("accepts valid filter config with exists", () => {
      expect(() =>
        validateActionConfig("filter", {
          conditions: [{ path: "user.id", operator: "exists" }],
        })
      ).not.toThrow();
    });

    it("accepts valid filter config with neq and contains", () => {
      expect(() =>
        validateActionConfig("filter", {
          conditions: [
            { path: "status", operator: "neq", value: "draft" },
            { path: "tags", operator: "contains", value: "vip" },
          ],
        })
      ).not.toThrow();
    });

    it("accepts empty conditions array", () => {
      expect(() =>
        validateActionConfig("filter", { conditions: [] })
      ).not.toThrow();
    });

    it("throws when conditions is missing", () => {
      expect(() => validateActionConfig("filter", {})).toThrow(
        "filter action_config must have a conditions array"
      );
    });

    it("throws when conditions is not array", () => {
      expect(() =>
        validateActionConfig("filter", { conditions: "invalid" })
      ).toThrow("filter action_config must have a conditions array");
    });

    it("throws when condition has invalid operator", () => {
      expect(() =>
        validateActionConfig("filter", {
          conditions: [{ path: "x", operator: "gt", value: 1 }],
        })
      ).toThrow(
        "filter conditions[0].operator must be one of: eq, neq, exists, contains"
      );
    });

    it("throws when exists has value set", () => {
      expect(() =>
        validateActionConfig("filter", {
          conditions: [{ path: "x", operator: "exists", value: true }],
        })
      ).toThrow(
        'filter conditions[0]: value must not be set for operator "exists"'
      );
    });

    it("throws when eq missing value", () => {
      expect(() =>
        validateActionConfig("filter", {
          conditions: [{ path: "x", operator: "eq" }],
        })
      ).toThrow('filter conditions[0]: value is required for operator "eq"');
    });
  });

  describe("template", () => {
    it("accepts valid template config", () => {
      expect(() =>
        validateActionConfig("template", {
          template: "Hello {{name}}",
        })
      ).not.toThrow();
    });

    it("throws when template is missing", () => {
      expect(() => validateActionConfig("template", {})).toThrow(
        "template action_config must have a template string"
      );
    });

    it("throws when template is not string", () => {
      expect(() => validateActionConfig("template", { template: 123 })).toThrow(
        "template action_config must have a template string"
      );
    });

    it("throws when template is empty string", () => {
      expect(() => validateActionConfig("template", { template: "" })).toThrow(
        "template action_config.template must be non-empty"
      );
    });

    it("throws when template is whitespace only", () => {
      expect(() =>
        validateActionConfig("template", { template: "   \n\t  " })
      ).toThrow("template action_config.template must be non-empty");
    });
  });
});
