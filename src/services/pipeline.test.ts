/**
 * Unit tests for pipeline service: orchestration, delegation, and error handling.
 */
import { describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../errors.js";
import {
  createPipeline,
  deletePipeline,
  getPipelineById,
  getPipelineBySlug,
  listPipelines,
  updatePipeline,
} from "./pipeline.js";

const {
  mockDb,
  mockInsertPipeline,
  mockListPipelinesQuery,
  mockGetPipelineByIdQuery,
  mockGetPipelineBySlugQuery,
  mockUpdatePipelineQuery,
  mockDeletePipelineQuery,
  mockEnsureUniqueSlug,
  mockGenerateSlug,
} = vi.hoisted(() => ({
  mockDb: {},
  mockInsertPipeline: vi.fn(),
  mockListPipelinesQuery: vi.fn(),
  mockGetPipelineByIdQuery: vi.fn(),
  mockGetPipelineBySlugQuery: vi.fn(),
  mockUpdatePipelineQuery: vi.fn(),
  mockDeletePipelineQuery: vi.fn(),
  mockEnsureUniqueSlug: vi.fn(),
  mockGenerateSlug: vi.fn(),
}));

vi.mock("../db/index.js", () => ({
  db: mockDb,
  assertDbConnection: vi.fn(),
}));

vi.mock("../db/queries/pipelines.js", () => ({
  insertPipeline: (...args: unknown[]) => mockInsertPipeline(...args),
  listPipelines: (...args: unknown[]) => mockListPipelinesQuery(...args),
  getPipelineById: (...args: unknown[]) => mockGetPipelineByIdQuery(...args),
  getPipelineBySlug: (...args: unknown[]) =>
    mockGetPipelineBySlugQuery(...args),
  updatePipeline: (...args: unknown[]) => mockUpdatePipelineQuery(...args),
  deletePipeline: (...args: unknown[]) => mockDeletePipelineQuery(...args),
}));

vi.mock("../lib/slug.js", () => ({
  generateSlug: (...args: unknown[]) => mockGenerateSlug(...args),
  ensureUniqueSlug: (...args: unknown[]) => mockEnsureUniqueSlug(...args),
  validateSlug: vi.fn(),
}));

function fakePipeline(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "pipeline-id-123",
    slug: "my-pipeline",
    name: "My Pipeline",
    actionType: "transform",
    actionConfig: { mappings: [{ from: "a", to: "b" }] },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("createPipeline", () => {
  it("generates slug, ensures uniqueness, and inserts", async () => {
    mockGenerateSlug.mockReturnValue("my-pipeline");
    mockEnsureUniqueSlug.mockResolvedValue("my-pipeline");
    const row = fakePipeline();
    mockInsertPipeline.mockResolvedValue(row);

    const result = await createPipeline("My Pipeline", "transform", {
      mappings: [{ from: "a", to: "b" }],
    });

    expect(mockGenerateSlug).toHaveBeenCalledWith("My Pipeline");
    expect(mockEnsureUniqueSlug).toHaveBeenCalledWith("my-pipeline", mockDb);
    expect(mockInsertPipeline).toHaveBeenCalledWith(mockDb, {
      slug: "my-pipeline",
      name: "My Pipeline",
      actionType: "transform",
      actionConfig: { mappings: [{ from: "a", to: "b" }] },
    });
    expect(result).toEqual(row);
  });

  it("uses ensureUniqueSlug result when collision occurs", async () => {
    mockGenerateSlug.mockReturnValue("my-pipeline");
    mockEnsureUniqueSlug.mockResolvedValue("my-pipeline-1");
    const row = fakePipeline({ slug: "my-pipeline-1" });
    mockInsertPipeline.mockResolvedValue(row);

    const result = await createPipeline("My Pipeline", "transform", {
      mappings: [{ from: "x", to: "y" }],
    });

    expect(mockInsertPipeline).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({ slug: "my-pipeline-1" })
    );
    expect(result.slug).toBe("my-pipeline-1");
  });
});

describe("listPipelines", () => {
  it("delegates to listPipelines query", async () => {
    const rows = [fakePipeline(), fakePipeline({ id: "other-id" })];
    mockListPipelinesQuery.mockResolvedValue(rows);

    const result = await listPipelines();

    expect(mockListPipelinesQuery).toHaveBeenCalledWith(mockDb);
    expect(result).toEqual(rows);
  });
});

describe("getPipelineById", () => {
  it("returns pipeline when found", async () => {
    const row = fakePipeline();
    mockGetPipelineByIdQuery.mockResolvedValue(row);

    const result = await getPipelineById("pipeline-id-123");

    expect(mockGetPipelineByIdQuery).toHaveBeenCalledWith(
      mockDb,
      "pipeline-id-123"
    );
    expect(result).toEqual(row);
  });

  it("returns undefined when not found", async () => {
    mockGetPipelineByIdQuery.mockResolvedValue(undefined);

    const result = await getPipelineById("missing-id");

    expect(result).toBeUndefined();
  });
});

describe("getPipelineBySlug", () => {
  it("returns pipeline when found", async () => {
    const row = fakePipeline();
    mockGetPipelineBySlugQuery.mockResolvedValue(row);

    const result = await getPipelineBySlug("my-pipeline");

    expect(mockGetPipelineBySlugQuery).toHaveBeenCalledWith(
      mockDb,
      "my-pipeline"
    );
    expect(result).toEqual(row);
  });
});

describe("updatePipeline", () => {
  it("throws NotFoundError when pipeline does not exist", async () => {
    mockGetPipelineByIdQuery.mockResolvedValue(undefined);

    await expect(
      updatePipeline("missing-id", { name: "New Name" })
    ).rejects.toThrow(NotFoundError);
    await expect(
      updatePipeline("missing-id", { name: "New Name" })
    ).rejects.toThrow("Pipeline not found");
  });

  it("updates and returns row when pipeline exists", async () => {
    const current = fakePipeline();
    const updated = fakePipeline({ name: "Updated Name" });
    mockGetPipelineByIdQuery.mockResolvedValue(current);
    mockUpdatePipelineQuery.mockResolvedValue(updated);

    const result = await updatePipeline("pipeline-id-123", {
      name: "Updated Name",
    });

    expect(mockUpdatePipelineQuery).toHaveBeenCalledWith(
      mockDb,
      "pipeline-id-123",
      { name: "Updated Name" }
    );
    expect(result).toEqual(updated);
  });

  it("throws NotFoundError when update returns no row", async () => {
    mockGetPipelineByIdQuery.mockResolvedValue(fakePipeline());
    mockUpdatePipelineQuery.mockResolvedValue(undefined);

    await expect(
      updatePipeline("pipeline-id-123", { name: "X" })
    ).rejects.toThrow(NotFoundError);
  });
});

describe("deletePipeline", () => {
  it("returns deleted row when found", async () => {
    const row = fakePipeline();
    mockDeletePipelineQuery.mockResolvedValue(row);

    const result = await deletePipeline("pipeline-id-123");

    expect(mockDeletePipelineQuery).toHaveBeenCalledWith(
      mockDb,
      "pipeline-id-123"
    );
    expect(result).toEqual(row);
  });

  it("returns undefined when pipeline does not exist", async () => {
    mockDeletePipelineQuery.mockResolvedValue(undefined);

    const result = await deletePipeline("missing-id");

    expect(result).toBeUndefined();
  });
});
