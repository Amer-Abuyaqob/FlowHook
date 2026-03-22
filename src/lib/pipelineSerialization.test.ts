/**
 * Unit tests for pipeline serialization: toApiPipeline.
 */
import { describe, expect, it } from "vitest";
import type { PipelineRow } from "../db/queries/pipelines.js";
import { toApiPipeline } from "./pipelineSerialization.js";

function fakeRow(overrides: Partial<PipelineRow> = {}): PipelineRow {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    slug: "my-stripe-orders",
    name: "My Stripe Orders",
    actionType: "transform",
    actionConfig: { mappings: [{ from: "firstName", to: "first_name" }] },
    isActive: true,
    createdAt: new Date("2025-03-14T12:00:00.000Z"),
    updatedAt: new Date("2025-03-14T12:00:00.000Z"),
    ...overrides,
  };
}

describe("toApiPipeline", () => {
  it("maps camelCase row to snake_case API response with webhookUrl", () => {
    const row = fakeRow();
    const result = toApiPipeline(row, "http://localhost:3000");

    expect(result).toEqual({
      id: "550e8400-e29b-41d4-a716-446655440000",
      slug: "my-stripe-orders",
      name: "My Stripe Orders",
      action_type: "transform",
      action_config: { mappings: [{ from: "firstName", to: "first_name" }] },
      is_active: true,
      created_at: "2025-03-14T12:00:00.000Z",
      updated_at: "2025-03-14T12:00:00.000Z",
      webhookUrl: "http://localhost:3000/webhooks/my-stripe-orders",
    });
  });

  it("strips trailing slash from baseUrl", () => {
    const row = fakeRow({ slug: "test" });
    const result = toApiPipeline(row, "https://api.example.com/");

    expect(result.webhookUrl).toBe("https://api.example.com/webhooks/test");
  });

  it("uses null for action_config when row has null", () => {
    const row = fakeRow({ actionConfig: null });
    const result = toApiPipeline(row, "http://localhost:3000");

    expect(result.action_config).toBeNull();
  });

  it("handles is_active false", () => {
    const row = fakeRow({ isActive: false });
    const result = toApiPipeline(row, "http://localhost:3000");

    expect(result.is_active).toBe(false);
  });
});
