/**
 * Unit tests for delivery retry behavior, request formatting, and attempt persistence.
 */
import { describe, expect, it, vi } from "vitest";
import { deliverToSubscribers, noOpSigner } from "./delivery.js";
import type { SubscriberRow } from "../db/queries/subscribers.js";

const subscriber: SubscriberRow = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  pipelineId: "660e8400-e29b-41d4-a716-446655440001",
  url: "https://example.com/webhook",
  headers: { Authorization: "Bearer token" },
  createdAt: new Date(),
};

describe("noOpSigner", () => {
  it("returns empty string for any payload", () => {
    expect(noOpSigner.sign("payload")).toBe("");
    expect(noOpSigner.sign("")).toBe("");
  });
});

describe("deliverToSubscribers", () => {
  it("returns allSucceeded true for empty subscriber list", async () => {
    const summary = await deliverToSubscribers([], {}, "job-id", {
      fetchFn: vi.fn(),
      insertAttempt: vi.fn().mockResolvedValue(undefined),
    });

    expect(summary).toEqual({ allSucceeded: true, results: [] });
  });

  it("delivers successfully on first attempt with headers and JSON body", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const insertAttempt = vi.fn().mockResolvedValue(undefined);

    const summary = await deliverToSubscribers(
      [subscriber],
      { foo: "bar" },
      "job-id",
      {
        fetchFn,
        insertAttempt,
      }
    );

    expect(summary.allSucceeded).toBe(true);
    expect(summary.results).toEqual([
      {
        subscriberId: subscriber.id,
        success: true,
        attemptsUsed: 1,
      },
    ]);

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [, options] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe("POST");
    expect(options.body).toBe(JSON.stringify({ foo: "bar" }));
    expect(options.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer token",
    });

    expect(insertAttempt).toHaveBeenCalledTimes(1);
    expect(insertAttempt.mock.calls[0][1]).toMatchObject({
      jobId: "job-id",
      subscriberId: subscriber.id,
      attemptNumber: 1,
      statusCode: 200,
      success: true,
      errorMessage: null,
    });
  });

  it("retries and succeeds on a later attempt", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    const insertAttempt = vi.fn().mockResolvedValue(undefined);
    const sleepFn = vi.fn().mockResolvedValue(undefined);

    const summary = await deliverToSubscribers(
      [subscriber],
      { foo: "bar" },
      "job-id",
      {
        fetchFn,
        sleepFn,
        insertAttempt,
      }
    );

    expect(summary.allSucceeded).toBe(true);
    expect(summary.results[0]).toMatchObject({
      subscriberId: subscriber.id,
      success: true,
      attemptsUsed: 2,
    });
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(sleepFn).toHaveBeenCalledTimes(1);
    expect(insertAttempt).toHaveBeenCalledTimes(2);
    expect(insertAttempt.mock.calls[0][1]).toMatchObject({
      attemptNumber: 1,
      success: false,
      statusCode: 500,
    });
    expect(insertAttempt.mock.calls[1][1]).toMatchObject({
      attemptNumber: 2,
      success: true,
      statusCode: 200,
    });
  });

  it("exhausts retries and returns failure summary", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    const insertAttempt = vi.fn().mockResolvedValue(undefined);
    const sleepFn = vi.fn().mockResolvedValue(undefined);

    const summary = await deliverToSubscribers(
      [subscriber],
      { foo: "bar" },
      "job-id",
      {
        fetchFn,
        sleepFn,
        insertAttempt,
      }
    );

    expect(summary.allSucceeded).toBe(false);
    expect(summary.results[0]).toMatchObject({
      subscriberId: subscriber.id,
      success: false,
      attemptsUsed: 3,
    });
    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(sleepFn).toHaveBeenCalledTimes(2);
    expect(insertAttempt).toHaveBeenCalledTimes(3);
    expect(insertAttempt.mock.calls[2][1]).toMatchObject({
      attemptNumber: 3,
      success: false,
      statusCode: 503,
    });
  });
});
