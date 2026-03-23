/**
 * Integration tests for webhook ingestion.
 *
 * Requires DATABASE_URL, API_KEY, and a running Postgres with migrations applied.
 * Skipped when DATABASE_URL or API_KEY is not set.
 */
import request from "supertest";
import { describe, expect, it, beforeAll, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { assertDbConnection, db, jobs, pipelines } from "../db/index.js";
import { createApp } from "../index.js";

const hasDbUrl =
  Boolean(process.env.DATABASE_URL) || Boolean(process.env.DB_URL);
const hasApiKey = Boolean(process.env.API_KEY);

function authHeader(): { Authorization: string } {
  const key = process.env.API_KEY ?? "";
  return { Authorization: `Bearer ${key}` };
}

describe.skipIf(!hasDbUrl || !hasApiKey)("webhooks integration", () => {
  async function createTestPipeline(): Promise<{
    id: string;
    slug: string;
  }> {
    const res = await request(createApp())
      .post("/api/pipelines")
      .set(authHeader())
      .send({
        name: "Webhook Ingest Test Pipeline",
        action_type: "transform",
        action_config: { mappings: [{ from: "foo", to: "bar" }] },
      })
      .expect(201);

    return { id: res.body.id, slug: res.body.slug };
  }

  it("POST /webhooks/:slug enqueues a pending job and returns 202", async () => {
    const { id: pipelineId, slug } = await createTestPipeline();
    const payload = { foo: "bar", nested: { n: 1 } };

    const res = await request(createApp())
      .post(`/webhooks/${slug}`)
      .send(payload)
      .expect(202);

    const jobIdFromHeader = res.headers["job-id"];
    expect(jobIdFromHeader).toBeDefined();
    expect(typeof jobIdFromHeader).toBe("string");
    expect(res.body).toEqual({ jobId: jobIdFromHeader });

    assertDbConnection(db!);
    const rows = await db!
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobIdFromHeader));
    expect(rows).toHaveLength(1);

    expect(rows[0].pipelineId).toBe(pipelineId);
    expect(rows[0].status).toBe("pending");
    expect(rows[0].payload).toEqual(payload);
  });

  it("POST /webhooks/nonexistent returns 404", async () => {
    const payload = { hello: "world" };

    const res = await request(createApp())
      .post("/webhooks/nonexistent")
      .send(payload)
      .expect(404);

    expect(res.body.error).toBe("Pipeline not found");
  });

  it("POST /webhooks/:slug with malformed JSON returns 400 Invalid JSON", async () => {
    const { slug } = await createTestPipeline();

    const res = await request(createApp())
      .post(`/webhooks/${slug}`)
      .set("Content-Type", "application/json")
      .send("{invalid")
      .expect(400);

    expect(res.body.error).toBe("Invalid JSON");
  });

  it("POST /webhooks/:slug returns 400 when pipeline is inactive", async () => {
    const { id: pipelineId, slug } = await createTestPipeline();

    await request(createApp())
      .put(`/api/pipelines/${pipelineId}`)
      .set(authHeader())
      .send({ is_active: false })
      .expect(200);

    const res = await request(createApp())
      .post(`/webhooks/${slug}`)
      .send({ foo: "bar" })
      .expect(400);

    expect(res.body.error).toBe("Pipeline is inactive");
  });
});
