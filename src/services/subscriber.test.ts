/**
 * Unit tests for subscriber service: add, remove, and list subscribers.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../errors.js";
import {
  addSubscriber,
  getSubscribersByPipelineId,
  removeSubscriber,
} from "./subscriber.js";

const {
  mockDb,
  mockInsertSubscriber,
  mockDeleteSubscriber,
  mockGetSubscribersByPipelineIdQuery,
  mockGetPipelineByIdQuery,
} = vi.hoisted(() => ({
  mockDb: {},
  mockInsertSubscriber: vi.fn(),
  mockDeleteSubscriber: vi.fn(),
  mockGetSubscribersByPipelineIdQuery: vi.fn(),
  mockGetPipelineByIdQuery: vi.fn(),
}));

vi.mock("../db/index.js", () => ({
  db: mockDb,
  assertDbConnection: vi.fn(),
}));

vi.mock("../db/queries/subscribers.js", () => ({
  insertSubscriber: (...args: unknown[]) => mockInsertSubscriber(...args),
  deleteSubscriber: (...args: unknown[]) => mockDeleteSubscriber(...args),
  getSubscribersByPipelineId: (...args: unknown[]) =>
    mockGetSubscribersByPipelineIdQuery(...args),
}));

vi.mock("../db/queries/pipelines.js", () => ({
  getPipelineById: (...args: unknown[]) => mockGetPipelineByIdQuery(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function fakeSubscriber(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "sub-id-123",
    pipelineId: "pipeline-id-456",
    url: "https://example.com/webhook",
    headers: { Authorization: "Bearer token" },
    createdAt: new Date(),
    ...overrides,
  };
}

describe("addSubscriber", () => {
  it("checks pipeline exists, then inserts subscriber", async () => {
    const pipeline = { id: "pipeline-id-456" };
    const subscriber = fakeSubscriber();
    mockGetPipelineByIdQuery.mockResolvedValue(pipeline);
    mockInsertSubscriber.mockResolvedValue(subscriber);

    const result = await addSubscriber(
      "pipeline-id-456",
      "https://example.com/webhook",
      { Authorization: "Bearer token" }
    );

    expect(mockGetPipelineByIdQuery).toHaveBeenCalledWith(
      mockDb,
      "pipeline-id-456"
    );
    expect(mockInsertSubscriber).toHaveBeenCalledWith(mockDb, {
      pipelineId: "pipeline-id-456",
      url: "https://example.com/webhook",
      headers: { Authorization: "Bearer token" },
    });
    expect(result).toEqual(subscriber);
  });

  it("throws NotFoundError when pipeline does not exist", async () => {
    mockGetPipelineByIdQuery.mockResolvedValue(undefined);

    await expect(
      addSubscriber("missing-pipeline", "https://example.com")
    ).rejects.toThrow(NotFoundError);
    await expect(
      addSubscriber("missing-pipeline", "https://example.com")
    ).rejects.toThrow("Pipeline not found");

    expect(mockInsertSubscriber).not.toHaveBeenCalled();
  });

  it("passes null headers when omitted", async () => {
    const pipeline = { id: "p" };
    const subscriber = fakeSubscriber({ headers: null });
    mockGetPipelineByIdQuery.mockResolvedValue(pipeline);
    mockInsertSubscriber.mockResolvedValue(subscriber);

    await addSubscriber("p", "https://x.com");

    expect(mockInsertSubscriber).toHaveBeenCalledWith(mockDb, {
      pipelineId: "p",
      url: "https://x.com",
      headers: null,
    });
  });
});

describe("removeSubscriber", () => {
  it("returns deleted row when found", async () => {
    const row = fakeSubscriber();
    mockDeleteSubscriber.mockResolvedValue(row);

    const result = await removeSubscriber("pipeline-id-456", "sub-id-123");

    expect(mockDeleteSubscriber).toHaveBeenCalledWith(
      mockDb,
      "pipeline-id-456",
      "sub-id-123"
    );
    expect(result).toEqual(row);
  });

  it("returns undefined when subscriber does not exist", async () => {
    mockDeleteSubscriber.mockResolvedValue(undefined);

    const result = await removeSubscriber("pipeline-id-456", "missing-sub");

    expect(result).toBeUndefined();
  });
});

describe("getSubscribersByPipelineId", () => {
  it("returns array of subscribers", async () => {
    const rows = [fakeSubscriber(), fakeSubscriber({ id: "sub-2" })];
    mockGetSubscribersByPipelineIdQuery.mockResolvedValue(rows);

    const result = await getSubscribersByPipelineId("pipeline-id-456");

    expect(mockGetSubscribersByPipelineIdQuery).toHaveBeenCalledWith(
      mockDb,
      "pipeline-id-456"
    );
    expect(result).toEqual(rows);
  });
});
