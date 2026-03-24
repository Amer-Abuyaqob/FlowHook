/**
 * Unit tests for job service: enqueue, claim, and read APIs.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  claimNextJob,
  enqueueJob,
  getJobWithAttempts,
  listJobsByParams,
} from "./job.js";

const {
  mockDb,
  mockAssertDbConnection,
  mockInsertJob,
  mockClaimNextPendingJob,
  mockGetJobById,
  mockListJobs,
  mockListDeliveryAttemptsByJobId,
} = vi.hoisted(() => {
  const mockInsertJob = vi.fn();
  const mockClaimNextPendingJob = vi.fn();
  const mockGetJobById = vi.fn();
  const mockListJobs = vi.fn();
  const mockListDeliveryAttemptsByJobId = vi.fn();

  return {
    mockDb: {
      // Placeholder object; only used for reference equality in mocks.
    },
    mockAssertDbConnection: vi.fn(),
    mockInsertJob,
    mockClaimNextPendingJob,
    mockGetJobById,
    mockListJobs,
    mockListDeliveryAttemptsByJobId,
  };
});

vi.mock("../db/index.js", () => ({
  db: mockDb,
  assertDbConnection: mockAssertDbConnection,
}));

vi.mock("../db/queries/deliveryAttempts.js", () => ({
  listDeliveryAttemptsByJobId: (...args: unknown[]) =>
    mockListDeliveryAttemptsByJobId(...args),
}));

vi.mock("../db/queries/jobs.js", () => ({
  insertJob: (...args: unknown[]) => mockInsertJob(...args),
  claimNextPendingJob: (...args: unknown[]) => mockClaimNextPendingJob(...args),
  getJobById: (...args: unknown[]) => mockGetJobById(...args),
  listJobs: (...args: unknown[]) => mockListJobs(...args),
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

describe("getJobWithAttempts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const jobRow = {
    id: "job-1",
    pipelineId: "pipeline-1",
    status: "completed" as const,
    payload: { x: 1 },
    result: { y: 2 },
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:01:00.000Z"),
    processingStartedAt: new Date("2025-01-01T00:00:01.000Z"),
    processingEndedAt: new Date("2025-01-01T00:00:02.000Z"),
  };

  it("returns null when job missing", async () => {
    mockGetJobById.mockResolvedValue(undefined);

    const result = await getJobWithAttempts(
      "550e8400-e29b-41d4-a716-446655440000"
    );

    expect(result).toBeNull();
    expect(mockListDeliveryAttemptsByJobId).not.toHaveBeenCalled();
  });

  it("returns job and attempts when found", async () => {
    mockGetJobById.mockResolvedValue(jobRow);
    const attemptRow = {
      id: "att-1",
      jobId: "job-1",
      subscriberId: "sub-1",
      attemptNumber: 1,
      statusCode: 200,
      success: true,
      errorMessage: null,
      createdAt: new Date("2025-01-01T00:00:03.000Z"),
    };
    mockListDeliveryAttemptsByJobId.mockResolvedValue([attemptRow]);

    const result = await getJobWithAttempts("job-1");

    expect(mockAssertDbConnection).toHaveBeenCalledWith(mockDb);
    expect(mockGetJobById).toHaveBeenCalledWith(mockDb, "job-1");
    expect(mockListDeliveryAttemptsByJobId).toHaveBeenCalledWith(
      mockDb,
      "job-1"
    );
    expect(result).toEqual({ job: jobRow, attempts: [attemptRow] });
  });
});

describe("listJobsByParams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes params to listJobs", async () => {
    mockListJobs.mockResolvedValue([]);

    const params = {
      pipelineId: "550e8400-e29b-41d4-a716-446655440000",
      status: "pending" as const,
      limit: 10,
      offset: 5,
    };

    const rows = await listJobsByParams(params);

    expect(mockAssertDbConnection).toHaveBeenCalledWith(mockDb);
    expect(mockListJobs).toHaveBeenCalledWith(mockDb, params);
    expect(rows).toEqual([]);
  });
});
