/**
 * Integration tests for job query routes.
 *
 * Requires DATABASE_URL, API_KEY, and Postgres with migrations applied.
 */
import request from "supertest";
import { describe, expect, it, beforeAll, afterEach } from "vitest";
import { assertDbConnection, db, pipelines } from "../db/index.js";
import { createApp } from "../index.js";

const hasDbUrl =
  Boolean(process.env.DATABASE_URL) || Boolean(process.env.DB_URL);
const hasApiKey = Boolean(process.env.API_KEY);

function authHeader(): { Authorization: string } {
  const key = process.env.API_KEY ?? "";
  return { Authorization: `Bearer ${key}` };
}

describe.skipIf(!hasDbUrl || !hasApiKey)("jobs integration", () => {
  beforeAll(async () => {
    assertDbConnection(db);
    await db.delete(pipelines);
  });

  afterEach(async () => {
    assertDbConnection(db);
    await db.delete(pipelines);
  });

  async function createTestPipeline(): Promise<{
    id: string;
    slug: string;
  }> {
    const res = await request(createApp())
      .post("/api/pipelines")
      .set(authHeader())
      .send({
        name: "Jobs API Test Pipeline",
        action_type: "transform",
        action_config: { mappings: [{ from: "foo", to: "bar" }] },
      })
      .expect(201);

    return { id: res.body.id, slug: res.body.slug };
  }

  it("GET /api/jobs without API key returns 401", async () => {
    const res = await request(createApp()).get("/api/jobs").expect(401);

    expect(res.body.error).toBe("Unauthorized");
  });

  it("GET /api/jobs/:id with invalid UUID returns 400", async () => {
    const res = await request(createApp())
      .get("/api/jobs/not-a-uuid")
      .set(authHeader())
      .expect(400);

    expect(res.body.error).toBe("Invalid request");
  });

  it("GET /api/jobs/:id with unknown UUID returns 404", async () => {
    const res = await request(createApp())
      .get("/api/jobs/550e8400-e29b-41d4-a716-446655440099")
      .set(authHeader())
      .expect(404);

    expect(res.body.error).toBe("Job not found");
  });

  it("GET /api/jobs?pipelineId=invalid returns 400", async () => {
    const res = await request(createApp())
      .get("/api/jobs")
      .query({ pipelineId: "x" })
      .set(authHeader())
      .expect(400);

    expect(res.body.error).toBe("Invalid pipelineId");
  });

  it("lists jobs after webhook ingest (snake_case, newest first)", async () => {
    const { id: pipelineId, slug } = await createTestPipeline();

    const ingest = await request(createApp())
      .post(`/webhooks/${slug}`)
      .send({ hello: "world" })
      .expect(202);

    const jobId = ingest.body.jobId as string;
    expect(jobId).toBeDefined();

    const listRes = await request(createApp())
      .get("/api/jobs")
      .set(authHeader())
      .expect(200);

    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0]).toMatchObject({
      id: jobId,
      pipeline_id: pipelineId,
      status: "pending",
      payload: { hello: "world" },
    });
    expect(listRes.body[0].created_at).toBeDefined();
    expect(listRes.body[0].result).toBeNull();
    expect(listRes.body[0].delivery_attempts).toBeUndefined();
  });

  it("GET /api/jobs/:id includes delivery_attempts array", async () => {
    const { slug } = await createTestPipeline();

    const ingest = await request(createApp())
      .post(`/webhooks/${slug}`)
      .send({ a: 1 })
      .expect(202);

    const jobId = ingest.body.jobId as string;

    const res = await request(createApp())
      .get(`/api/jobs/${jobId}`)
      .set(authHeader())
      .expect(200);

    expect(res.body.id).toBe(jobId);
    expect(res.body.delivery_attempts).toEqual([]);
  });

  it("filters by pipelineId and status", async () => {
    const { id: pipelineId, slug } = await createTestPipeline();

    await request(createApp())
      .post(`/webhooks/${slug}`)
      .send({ x: 1 })
      .expect(202);

    const pending = await request(createApp())
      .get("/api/jobs")
      .query({ pipelineId, status: "pending" })
      .set(authHeader())
      .expect(200);

    expect(pending.body.length).toBe(1);

    const completed = await request(createApp())
      .get("/api/jobs")
      .query({ pipelineId, status: "completed" })
      .set(authHeader())
      .expect(200);

    expect(completed.body.length).toBe(0);
  });
});
