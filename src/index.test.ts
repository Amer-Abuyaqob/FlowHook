/**
 * Integration tests for the HTTP app factory and mounted API routes.
 */

import request from "supertest";
import { describe, expect, it } from "vitest";
import { APP_ROUTE, createApp } from "./index.js";

describe("createApp", () => {
  it("GET / redirects to APP_ROUTE/", async () => {
    const res = await request(createApp()).get("/").expect(302);
    expect(res.headers.location).toBe(`${APP_ROUTE}/`);
  });

  it("GET APP_ROUTE/ serves the web UI", async () => {
    const res = await request(createApp()).get(`${APP_ROUTE}/`).expect(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/i);
    expect(res.text).toContain("FlowHook");
  });

  it("GET /api/healthz returns 200 with plain text OK and UTF-8 content type", async () => {
    const res = await request(createApp()).get("/api/healthz").expect(200);

    expect(res.text).toBe("OK");
    expect(res.headers["content-type"]).toMatch(/text\/plain/i);
    expect(res.headers["content-type"]).toMatch(/charset=utf-8/i);
  });
});
