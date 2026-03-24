/**
 * Unit tests for delivery module: noOpSigner and deliverToSubscribers stub.
 */
import { describe, expect, it } from "vitest";
import { deliverToSubscribers, noOpSigner } from "./delivery.js";

describe("noOpSigner", () => {
  it("returns empty string for any payload", () => {
    expect(noOpSigner.sign("payload")).toBe("");
    expect(noOpSigner.sign("")).toBe("");
  });
});

describe("deliverToSubscribers", () => {
  it("resolves without throwing with empty subscribers", async () => {
    await expect(
      deliverToSubscribers([], {}, "job-id")
    ).resolves.toBeUndefined();
  });

  it("resolves without throwing with non-empty subscribers", async () => {
    const subscribers = [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        pipelineId: "660e8400-e29b-41d4-a716-446655440001",
        url: "https://example.com/webhook",
        headers: null,
        createdAt: new Date(),
      },
    ];
    await expect(
      deliverToSubscribers(subscribers, { foo: "bar" }, "job-id")
    ).resolves.toBeUndefined();
  });
});
