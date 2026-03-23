/**
 * Integration tests for subscriber CRUD routes.
 *
 * Requires DATABASE_URL, API_KEY, and a running Postgres with migrations applied.
 * Skipped when DATABASE_URL or API_KEY is not set.
 */
import request from "supertest";
import { describe, expect, it, beforeAll, afterEach } from "vitest";
import { assertDbConnection, db, pipelines, subscribers } from "../db/index.js";
import { createApp } from "../index.js";

const hasDbUrl =
  Boolean(process.env.DATABASE_URL) || Boolean(process.env.DB_URL);
const hasApiKey = Boolean(process.env.API_KEY);

function authHeader(): { Authorization: string } {
  const key = process.env.API_KEY ?? "";
  return { Authorization: `Bearer ${key}` };
}

describe.skipIf(!hasDbUrl || !hasApiKey)("subscribers integration", () => {
  let pipelineId: string;

  beforeAll(async () => {
    assertDbConnection(db);
    await db.delete(subscribers);
    await db.delete(pipelines);
  });

  afterEach(async () => {
    assertDbConnection(db);
    await db.delete(subscribers);
    await db.delete(pipelines);
  });

  async function createTestPipeline(): Promise<string> {
    const res = await request(createApp())
      .post("/api/pipelines")
      .set(authHeader())
      .send({
        name: "Subscriber Test Pipeline",
        action_type: "transform",
        action_config: { mappings: [{ from: "a", to: "b" }] },
      })
      .expect(201);
    return res.body.id;
  }

  it("POST /api/pipelines/:id/subscribers creates subscriber and returns 201 with snake_case", async () => {
    pipelineId = await createTestPipeline();

    const res = await request(createApp())
      .post(`/api/pipelines/${pipelineId}/subscribers`)
      .set(authHeader())
      .send({
        url: "https://example.com/webhook",
        headers: {
          Authorization: "Bearer your-secret",
          "X-Custom-Header": "value",
        },
      })
      .expect(201);

    expect(res.body).toMatchObject({
      pipeline_id: pipelineId,
      url: "https://example.com/webhook",
      headers: {
        Authorization: "Bearer your-secret",
        "X-Custom-Header": "value",
      },
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.created_at).toBeDefined();
  });

  it("POST /api/pipelines/:id/subscribers with invalid pipeline id returns 404", async () => {
    const res = await request(createApp())
      .post("/api/pipelines/550e8400-e29b-41d4-a716-446655440000/subscribers")
      .set(authHeader())
      .send({ url: "https://example.com/webhook" })
      .expect(404);

    expect(res.body.error).toBe("Pipeline not found");
  });

  it("POST /api/pipelines/:id/subscribers with missing url returns 400", async () => {
    pipelineId = await createTestPipeline();

    const res = await request(createApp())
      .post(`/api/pipelines/${pipelineId}/subscribers`)
      .set(authHeader())
      .send({})
      .expect(400);

    expect(res.body.error).toBe("URL is required");
  });

  it("POST /api/pipelines/:id/subscribers with invalid URL returns 400", async () => {
    pipelineId = await createTestPipeline();

    const res = await request(createApp())
      .post(`/api/pipelines/${pipelineId}/subscribers`)
      .set(authHeader())
      .send({ url: "not-a-valid-url" })
      .expect(400);

    expect(res.body.error).toBe("Invalid URL format");
  });

  it("DELETE /api/pipelines/:id/subscribers/:subscriberId returns 204", async () => {
    pipelineId = await createTestPipeline();

    const addRes = await request(createApp())
      .post(`/api/pipelines/${pipelineId}/subscribers`)
      .set(authHeader())
      .send({ url: "https://example.com/webhook" })
      .expect(201);

    const subscriberId = addRes.body.id;

    await request(createApp())
      .delete(`/api/pipelines/${pipelineId}/subscribers/${subscriberId}`)
      .set(authHeader())
      .expect(204);
  });

  it("DELETE /api/pipelines/:id/subscribers/:subscriberId with nonexistent subscriber returns 404", async () => {
    pipelineId = await createTestPipeline();

    const res = await request(createApp())
      .delete(
        `/api/pipelines/${pipelineId}/subscribers/550e8400-e29b-41d4-a716-446655440000`
      )
      .set(authHeader())
      .expect(404);

    expect(res.body.error).toBe("Subscriber not found");
  });

  it("DELETE with wrong pipeline id returns 404", async () => {
    pipelineId = await createTestPipeline();

    const addRes = await request(createApp())
      .post(`/api/pipelines/${pipelineId}/subscribers`)
      .set(authHeader())
      .send({ url: "https://example.com/webhook" })
      .expect(201);

    const subscriberId = addRes.body.id;
    const wrongPipelineId = "550e8400-e29b-41d4-a716-446655440000";

    const res = await request(createApp())
      .delete(`/api/pipelines/${wrongPipelineId}/subscribers/${subscriberId}`)
      .set(authHeader())
      .expect(404);

    expect(res.body.error).toBe("Subscriber not found");
  });

  it("returns 401 when Authorization header is missing", async () => {
    pipelineId = await createTestPipeline();

    await request(createApp())
      .post(`/api/pipelines/${pipelineId}/subscribers`)
      .send({ url: "https://example.com/webhook" })
      .expect(401);
  });
});
