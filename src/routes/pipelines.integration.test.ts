/**
 * Integration tests for pipeline CRUD routes.
 *
 * Requires DATABASE_URL, API_KEY, and a running Postgres with migrations applied.
 * Skipped when DATABASE_URL or API_KEY is not set.
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

describe.skipIf(!hasDbUrl || !hasApiKey)("pipelines integration", () => {
  beforeAll(async () => {
    assertDbConnection(db);
    await db.delete(pipelines);
  });

  afterEach(async () => {
    assertDbConnection(db);
    await db.delete(pipelines);
  });

  it("POST /api/pipelines creates pipeline and returns 201 with snake_case and webhookUrl", async () => {
    const body = {
      name: "Test Pipeline",
      action_type: "transform",
      action_config: {
        mappings: [{ from: "firstName", to: "first_name" }],
      },
    };
    const res = await request(createApp())
      .post("/api/pipelines")
      .set(authHeader())
      .send(body)
      .expect(201);

    expect(res.body).toMatchObject({
      name: "Test Pipeline",
      slug: "test-pipeline",
      action_type: "transform",
      action_config: { mappings: [{ from: "firstName", to: "first_name" }] },
      is_active: true,
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.webhookUrl).toMatch(/\/webhooks\/test-pipeline$/);
    expect(res.body.created_at).toBeDefined();
    expect(res.body.updated_at).toBeDefined();
  });

  it("POST /api/pipelines with missing name returns 400", async () => {
    const res = await request(createApp())
      .post("/api/pipelines")
      .set(authHeader())
      .send({
        action_type: "transform",
        action_config: { mappings: [{ from: "a", to: "b" }] },
      })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  it("POST /api/pipelines with invalid action_type returns 400", async () => {
    const res = await request(createApp())
      .post("/api/pipelines")
      .set(authHeader())
      .send({
        name: "Test",
        action_type: "invalid",
        action_config: {},
      })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  it("GET /api/pipelines returns array", async () => {
    const res = await request(createApp())
      .get("/api/pipelines")
      .set(authHeader())
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/pipelines/:id returns pipeline by id", async () => {
    const createRes = await request(createApp())
      .post("/api/pipelines")
      .set(authHeader())
      .send({
        name: "Get By Id Test",
        action_type: "template",
        action_config: { template: "{{x}}" },
      })
      .expect(201);

    const id = createRes.body.id;

    const res = await request(createApp())
      .get(`/api/pipelines/${id}`)
      .set(authHeader())
      .expect(200);

    expect(res.body.id).toBe(id);
    expect(res.body.slug).toBe("get-by-id-test");
    expect(res.body.name).toBe("Get By Id Test");
    expect(res.body.action_type).toBe("template");
  });

  it("GET /api/pipelines/:id with nonexistent id returns 404", async () => {
    const res = await request(createApp())
      .get("/api/pipelines/550e8400-e29b-41d4-a716-446655440000")
      .set(authHeader())
      .expect(404);

    expect(res.body.error).toBe("Pipeline not found");
  });

  it("PUT /api/pipelines/:id updates pipeline and returns 200", async () => {
    const createRes = await request(createApp())
      .post("/api/pipelines")
      .set(authHeader())
      .send({
        name: "Update Test",
        action_type: "transform",
        action_config: { mappings: [{ from: "a", to: "b" }] },
      })
      .expect(201);

    const id = createRes.body.id;

    const res = await request(createApp())
      .put(`/api/pipelines/${id}`)
      .set(authHeader())
      .send({ name: "Updated Name" })
      .expect(200);

    expect(res.body.id).toBe(id);
    expect(res.body.name).toBe("Updated Name");
  });

  it("PUT /api/pipelines/:id with nonexistent id returns 404", async () => {
    const res = await request(createApp())
      .put("/api/pipelines/550e8400-e29b-41d4-a716-446655440000")
      .set(authHeader())
      .send({ name: "Updated" })
      .expect(404);

    expect(res.body.error).toBe("Pipeline not found");
  });

  it("DELETE /api/pipelines/:id returns 204", async () => {
    const createRes = await request(createApp())
      .post("/api/pipelines")
      .set(authHeader())
      .send({
        name: "Delete Test",
        action_type: "filter",
        action_config: { conditions: [] },
      })
      .expect(201);

    const id = createRes.body.id;

    await request(createApp())
      .delete(`/api/pipelines/${id}`)
      .set(authHeader())
      .expect(204);

    const getRes = await request(createApp())
      .get(`/api/pipelines/${id}`)
      .set(authHeader())
      .expect(404);

    expect(getRes.body.error).toBe("Pipeline not found");
  });

  it("DELETE /api/pipelines/:id with nonexistent id returns 404", async () => {
    const res = await request(createApp())
      .delete("/api/pipelines/550e8400-e29b-41d4-a716-446655440000")
      .set(authHeader())
      .expect(404);

    expect(res.body.error).toBe("Pipeline not found");
  });

  it("returns 401 when Authorization header is missing", async () => {
    const res = await request(createApp()).get("/api/pipelines").expect(401);

    expect(res.body.error).toBeDefined();
  });

  it("returns 401 when X-API-Key is missing", async () => {
    const res = await request(createApp())
      .post("/api/pipelines")
      .send({
        name: "Test",
        action_type: "transform",
        action_config: { mappings: [{ from: "a", to: "b" }] },
      })
      .expect(401);

    expect(res.body.error).toBeDefined();
  });
});
