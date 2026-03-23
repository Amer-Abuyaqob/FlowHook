/**
 * Unit tests for job service enqueue behavior.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { enqueueJob } from "./job.js";

const { mockDb, mockAssertDbConnection, mockInsertJob } = vi.hoisted(() => {
  const mockInsertJob = vi.fn();

  return {
    mockDb: {
      // Placeholder object; only used for reference equality in mocks.
    },
    mockAssertDbConnection: vi.fn(),
    mockInsertJob,
  };
});

vi.mock("../db/index.js", () => ({
  db: mockDb,
  assertDbConnection: mockAssertDbConnection,
}));

vi.mock("../db/queries/jobs.js", () => ({
  insertJob: (...args: unknown[]) => mockInsertJob(...args),
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
