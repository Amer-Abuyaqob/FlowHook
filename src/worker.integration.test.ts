/**
 * Integration tests for worker processing.
 *
 * Requires DATABASE_URL, API_KEY, and a running Postgres with migrations applied.
 * Skipped when DATABASE_URL or API_KEY is not set.
 */
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import {
  assertDbConnection,
  db,
  deliveryAttempts,
  jobs,
  pipelines,
} from "./db/index.js";
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
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
        action_config: {
          conditions: [{ path: "event.type", operator: "eq", value: "keep" }],
        },
      })
      .expect(201);

    return { slug: res.body.slug };
  }

  async function createTemplatePipeline(): Promise<{ slug: string }> {
    const res = await request(createApp())
      .post("/api/pipelines")
      .set(authHeader())
      .send({
        name: "Worker Template Integration Pipeline",
        action_type: "template",
        action_config: {
          template: "New order from {{customer.name}}: {{amount}}",
        },
      })
      .expect(201);

    return { slug: res.body.slug };
  }

  async function addSubscriber(
    pipelineId: string,
    url = "https://subscriber.example/webhook"
  ): Promise<void> {
    await request(createApp())
      .post(`/api/pipelines/${pipelineId}/subscribers`)
      .set(authHeader())
      .send({
        url,
        headers: { "X-Custom-Header": "value" },
      })
      .expect(201);
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

  it("processOneJob marks filter jobs as completed when conditions match", async () => {
    const { slug } = await createFilterPipeline();

    const enqueueRes = await request(createApp())
      .post(`/webhooks/${slug}`)
      .send({ event: { type: "keep" } })
      .expect(202);

    const jobId = enqueueRes.body.jobId as string;
    expect(jobId).toBeTruthy();

    const processed = await processOneJob();
    expect(processed).toBe(true);

    assertDbConnection(db);
    const rows = await db.select().from(jobs).where(eq(jobs.id, jobId));
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("completed");
    expect(rows[0].result).toEqual({ event: { type: "keep" } });
    expect(rows[0].processingStartedAt).toBeTruthy();
    expect(rows[0].processingEndedAt).toBeTruthy();
  });

  it("processOneJob marks filter jobs as filtered when any condition fails", async () => {
    const { slug } = await createFilterPipeline();

    const enqueueRes = await request(createApp())
      .post(`/webhooks/${slug}`)
      .send({ event: { type: "drop" } })
      .expect(202);

    const jobId = enqueueRes.body.jobId as string;
    expect(jobId).toBeTruthy();

    const processed = await processOneJob();
    expect(processed).toBe(true);

    assertDbConnection(db);
    const rows = await db.select().from(jobs).where(eq(jobs.id, jobId));
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("filtered");
    expect(rows[0].result).toBeNull();
    expect(rows[0].processingStartedAt).toBeTruthy();
    expect(rows[0].processingEndedAt).toBeTruthy();
  });

  it("processOneJob completes a template job and stores result.body", async () => {
    const { slug } = await createTemplatePipeline();

    const enqueueRes = await request(createApp())
      .post(`/webhooks/${slug}`)
      .send({ customer: { name: "Amer" }, amount: 99 })
      .expect(202);

    const jobId = enqueueRes.body.jobId as string;
    expect(jobId).toBeTruthy();

    const processed = await processOneJob();
    expect(processed).toBe(true);

    assertDbConnection(db);
    const rows = await db.select().from(jobs).where(eq(jobs.id, jobId));
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("completed");
    expect(rows[0].result).toEqual({
      body: "New order from Amer: 99",
    });
    expect(rows[0].processingStartedAt).toBeTruthy();
    expect(rows[0].processingEndedAt).toBeTruthy();
  });

  it("processOneJob completes when subscriber delivery succeeds and stores attempts", async () => {
    const createRes = await request(createApp())
      .post("/api/pipelines")
      .set(authHeader())
      .send({
        name: "Worker Delivery Success Pipeline",
        action_type: "transform",
        action_config: { mappings: [{ from: "x", to: "y" }] },
      })
      .expect(201);

    const pipelineId = createRes.body.id as string;
    const slug = createRes.body.slug as string;
    await addSubscriber(pipelineId);

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    const enqueueRes = await request(createApp())
      .post(`/webhooks/${slug}`)
      .send({ x: 555 })
      .expect(202);
    const jobId = enqueueRes.body.jobId as string;

    const processed = await processOneJob();
    expect(processed).toBe(true);

    assertDbConnection(db);
    const jobRows = await db.select().from(jobs).where(eq(jobs.id, jobId));
    expect(jobRows).toHaveLength(1);
    expect(jobRows[0].status).toBe("completed");
    expect(jobRows[0].result).toEqual({ y: 555 });

    const attemptRows = await db
      .select()
      .from(deliveryAttempts)
      .where(eq(deliveryAttempts.jobId, jobId));
    expect(attemptRows).toHaveLength(1);
    expect(attemptRows[0]).toMatchObject({
      attemptNumber: 1,
      statusCode: 200,
      success: true,
      errorMessage: null,
    });
  });

  it("processOneJob fails strictly when subscriber delivery exhausts retries", async () => {
    const createRes = await request(createApp())
      .post("/api/pipelines")
      .set(authHeader())
      .send({
        name: "Worker Delivery Failure Pipeline",
        action_type: "transform",
        action_config: { mappings: [{ from: "x", to: "y" }] },
      })
      .expect(201);

    const pipelineId = createRes.body.id as string;
    const slug = createRes.body.slug as string;
    await addSubscriber(pipelineId);

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);

    const enqueueRes = await request(createApp())
      .post(`/webhooks/${slug}`)
      .send({ x: 999 })
      .expect(202);
    const jobId = enqueueRes.body.jobId as string;

    const processed = await processOneJob();
    expect(processed).toBe(true);

    assertDbConnection(db);
    const jobRows = await db.select().from(jobs).where(eq(jobs.id, jobId));
    expect(jobRows).toHaveLength(1);
    expect(jobRows[0].status).toBe("failed");
    expect(jobRows[0].result).toEqual({ y: 999 });

    const attemptRows = await db
      .select()
      .from(deliveryAttempts)
      .where(eq(deliveryAttempts.jobId, jobId));
    expect(attemptRows).toHaveLength(3);
    expect(attemptRows.map((row) => row.attemptNumber)).toEqual([1, 2, 3]);
    expect(attemptRows.every((row) => row.success === false)).toBe(true);
    expect(attemptRows[0].statusCode).toBe(503);
  });
});
