/**
 * Unit tests for job service: enqueue and claim.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { claimNextJob, enqueueJob } from "./job.js";

const {
  mockDb,
  mockAssertDbConnection,
  mockInsertJob,
  mockClaimNextPendingJob,
} = vi.hoisted(() => {
  const mockInsertJob = vi.fn();
  const mockClaimNextPendingJob = vi.fn();

  return {
    mockDb: {
      // Placeholder object; only used for reference equality in mocks.
    },
    mockAssertDbConnection: vi.fn(),
    mockInsertJob,
    mockClaimNextPendingJob,
  };
});

vi.mock("../db/index.js", () => ({
  db: mockDb,
  assertDbConnection: mockAssertDbConnection,
}));

vi.mock("../db/queries/jobs.js", () => ({
  insertJob: (...args: unknown[]) => mockInsertJob(...args),
  claimNextPendingJob: (...args: unknown[]) => mockClaimNextPendingJob(...args),
}));

describe("enqueueJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asserts db connection and inserts a pending job", async () => {
    mockInsertJob.mockResolvedValue({ id: "job-uuid-1" });

    const jobId = await enqueueJob("pipeline-uuid-1", { hello: "world" });

    expect(mockAssertDbConnection).toHaveBeenCalledWith(mockDb);
    expect(mockInsertJob).toHaveBeenCalledWith(mockDb, {
      pipelineId: "pipeline-uuid-1",
      status: "pending",
      payload: { hello: "world" },
    });
    expect(jobId).toBe("job-uuid-1");
  });

  it("throws if returning yields no row", async () => {
    mockInsertJob.mockRejectedValue(new Error("insertJob: no row returned"));

    await expect(enqueueJob("pipeline-uuid-1", { x: 1 })).rejects.toThrow(
      "insertJob: no row returned"
    );
  });
});

describe("claimNextJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asserts db connection and returns claimed job", async () => {
    const jobRow = {
      id: "job-1",
      pipelineId: "pipeline-1",
      status: "processing",
      payload: { x: 1 },
      result: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      processingStartedAt: new Date(),
      processingEndedAt: null,
    };
    mockClaimNextPendingJob.mockResolvedValue(jobRow);

    const result = await claimNextJob();

    expect(mockAssertDbConnection).toHaveBeenCalledWith(mockDb);
    expect(mockClaimNextPendingJob).toHaveBeenCalledWith(mockDb);
    expect(result).toEqual(jobRow);
  });

  it("returns null when no pending jobs", async () => {
    mockClaimNextPendingJob.mockResolvedValue(null);

    const result = await claimNextJob();

    expect(result).toBeNull();
  });
});
