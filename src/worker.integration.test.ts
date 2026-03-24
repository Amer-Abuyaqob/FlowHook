/**
 * Integration tests for worker processing.
 *
 * Requires DATABASE_URL, API_KEY, and a running Postgres with migrations applied.
 * Skipped when DATABASE_URL or API_KEY is not set.
 */
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { assertDbConnection, db, jobs, pipelines } from "./db/index.js";
import { createApp } from "./index.js";
import { processOneJob } from "./services/worker.js";

const hasDbUrl =
  Boolean(process.env.DATABASE_URL) || Boolean(process.env.DB_URL);
const hasApiKey = Boolean(process.env.API_KEY);

function authHeader(): { Authorization: string } {
  const key = process.env.API_KEY ?? "";
  return { Authorization: `Bearer ${key}` };
}

describe.skipIf(!hasDbUrl || !hasApiKey)("worker integration", () => {
  beforeEach(async () => {
    assertDbConnection(db);
    await db.delete(pipelines);
  });

  async function createTransformPipeline(): Promise<{ slug: string }> {
    const res = await request(createApp())
      .post("/api/pipelines")
      .set(authHeader())
      .send({
        name: "Worker Transform Integration Pipeline",
        action_type: "transform",
        action_config: { mappings: [{ from: "x", to: "y" }] },
      })
      .expect(201);

    return { slug: res.body.slug };
  }

  async function createFilterPipeline(): Promise<{ slug: string }> {
    const res = await request(createApp())
      .post("/api/pipelines")
      .set(authHeader())
      .send({
        name: "Worker Filter Integration Pipeline",
        action_type: "filter",
        action_config: { conditions: [{ path: "x", operator: "exists" }] },
      })
      .expect(201);

    return { slug: res.body.slug };
  }

  it("processOneJob completes a transform job and stores the result", async () => {
    const { slug } = await createTransformPipeline();

    const enqueueRes = await request(createApp())
      .post(`/webhooks/${slug}`)
      .send({ x: 123, other: "ignored" })
      .expect(202);

    const jobId = enqueueRes.body.jobId as string;
    expect(jobId).toBeTruthy();

    const processed = await processOneJob();
    expect(processed).toBe(true);

    assertDbConnection(db);
    const rows = await db.select().from(jobs).where(eq(jobs.id, jobId));
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("completed");
    expect(rows[0].result).toEqual({ y: 123 });
    expect(rows[0].processingStartedAt).toBeTruthy();
    expect(rows[0].processingEndedAt).toBeTruthy();
  });

  it("processOneJob marks filter jobs as failed while filter action is a stub", async () => {
    const { slug } = await createFilterPipeline();

    const enqueueRes = await request(createApp())
      .post(`/webhooks/${slug}`)
      .send({ x: 1 })
      .expect(202);

    const jobId = enqueueRes.body.jobId as string;
    expect(jobId).toBeTruthy();

    const processed = await processOneJob();
    expect(processed).toBe(true);

    assertDbConnection(db);
    const rows = await db.select().from(jobs).where(eq(jobs.id, jobId));
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("failed");
    expect(rows[0].processingStartedAt).toBeTruthy();
    expect(rows[0].processingEndedAt).toBeTruthy();
  });
});
