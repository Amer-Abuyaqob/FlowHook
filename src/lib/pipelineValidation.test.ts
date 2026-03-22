/**
 * Unit tests for pipeline request body validation: parseCreateBody, parseUpdateBody.
 */
import { describe, expect, it } from "vitest";
import { BadRequestError } from "../errors.js";
import { parseCreateBody, parseUpdateBody } from "./pipelineValidation.js";

describe("parseCreateBody", () => {
  it("parses valid create body and returns camelCase", () => {
    const body = {
      name: "My Stripe Orders",
      action_type: "transform",
      action_config: {
        mappings: [{ from: "firstName", to: "first_name" }],
      },
    };
    const result = parseCreateBody(body);

    expect(result).toEqual({
      name: "My Stripe Orders",
      actionType: "transform",
      actionConfig: { mappings: [{ from: "firstName", to: "first_name" }] },
    });
  });

  it("trims name", () => {
    const result = parseCreateBody({
      name: "  Trimmed  ",
      action_type: "template",
      action_config: { template: "Hello {{name}}" },
    });
    expect(result.name).toBe("Trimmed");
  });

  it("throws when body is not object", () => {
    expect(() => parseCreateBody(null)).toThrow(BadRequestError);
    expect(() => parseCreateBody(null)).toThrow("Invalid request");
    expect(() => parseCreateBody([])).toThrow("Invalid request");
    expect(() => parseCreateBody("string")).toThrow("Invalid request");
  });

  it("throws when name is missing", () => {
    expect(() =>
      parseCreateBody({
        action_type: "transform",
        action_config: { mappings: [{ from: "a", to: "b" }] },
      })
    ).toThrow("name is required");
  });

  it("throws when name is empty after trim", () => {
    expect(() =>
      parseCreateBody({
        name: "   ",
        action_type: "transform",
        action_config: { mappings: [{ from: "a", to: "b" }] },
      })
    ).toThrow("name must be non-empty");
  });

  it("throws when action_type is missing", () => {
    expect(() =>
      parseCreateBody({
        name: "Test",
        action_config: { mappings: [] },
      })
    ).toThrow("action_type is required");
  });

  it("throws when action_type is invalid", () => {
    expect(() =>
      parseCreateBody({
        name: "Test",
        action_type: "invalid",
        action_config: {},
      })
    ).toThrow("action_type must be one of: transform, filter, template");
  });

  it("throws when action_config is missing", () => {
    expect(() =>
      parseCreateBody({
        name: "Test",
        action_type: "transform",
      })
    ).toThrow("action_config is required");
  });

  it("throws when action_config has invalid shape", () => {
    expect(() =>
      parseCreateBody({
        name: "Test",
        action_type: "transform",
        action_config: { mappings: [] },
      })
    ).toThrow();
  });

  it("accepts filter and template action types", () => {
    const filterResult = parseCreateBody({
      name: "Filter",
      action_type: "filter",
      action_config: {
        conditions: [{ path: "event.type", operator: "eq", value: "order" }],
      },
    });
    expect(filterResult.actionType).toBe("filter");

    const templateResult = parseCreateBody({
      name: "Template",
      action_type: "template",
      action_config: { template: "{{greeting}}" },
    });
    expect(templateResult.actionType).toBe("template");
  });
});

describe("parseUpdateBody", () => {
  it("parses partial update body", () => {
    const result = parseUpdateBody({ name: "Updated Name" });
    expect(result).toEqual({ name: "Updated Name" });
  });

  it("parses action_type to actionType", () => {
    const result = parseUpdateBody({ action_type: "filter" });
    expect(result).toEqual({ actionType: "filter" });
  });

  it("parses is_active to isActive", () => {
    const result = parseUpdateBody({ is_active: false });
    expect(result).toEqual({ isActive: false });
  });

  it("allows action_config null", () => {
    const result = parseUpdateBody({ action_config: null });
    expect(result).toEqual({ actionConfig: null });
  });

  it("parses action_config object", () => {
    const result = parseUpdateBody({
      action_config: { mappings: [{ from: "a", to: "b" }] },
    });
    expect(result.actionConfig).toEqual({ mappings: [{ from: "a", to: "b" }] });
  });

  it("throws when body is not object", () => {
    expect(() => parseUpdateBody(null)).toThrow(BadRequestError);
    expect(() => parseUpdateBody(null)).toThrow("Invalid request");
  });

  it("throws when name is empty string", () => {
    expect(() => parseUpdateBody({ name: "   " })).toThrow(
      "name must be non-empty"
    );
  });

  it("throws when is_active is not boolean", () => {
    expect(() => parseUpdateBody({ is_active: "true" })).toThrow(
      "is_active must be a boolean"
    );
  });

  it("returns empty object for empty body", () => {
    const result = parseUpdateBody({});
    expect(result).toEqual({});
  });
});
