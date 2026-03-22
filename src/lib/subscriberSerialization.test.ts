/**
 * Unit tests for subscriber API response serialization.
 */
import { describe, expect, it } from "vitest";
import { toApiSubscriber } from "./subscriberSerialization.js";

describe("toApiSubscriber", () => {
  it("converts row to snake_case API response", () => {
    const row = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      pipelineId: "660e8400-e29b-41d4-a716-446655440001",
      url: "https://example.com/webhook",
      headers: { Authorization: "Bearer secret" },
      createdAt: new Date("2025-03-14T12:00:00.000Z"),
    };
    const result = toApiSubscriber(row);
    expect(result).toEqual({
      id: "550e8400-e29b-41d4-a716-446655440000",
      pipeline_id: "660e8400-e29b-41d4-a716-446655440001",
      url: "https://example.com/webhook",
      headers: { Authorization: "Bearer secret" },
      created_at: "2025-03-14T12:00:00.000Z",
    });
  });

  it("converts null headers to null", () => {
    const row = {
      id: "a",
      pipelineId: "b",
      url: "https://x.com",
      headers: null,
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
    };
    const result = toApiSubscriber(row);
    expect(result.headers).toBeNull();
  });
});
