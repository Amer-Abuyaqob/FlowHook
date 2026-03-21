/**
 * Integration tests for the HTTP app factory and mounted API routes.
 */

import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./index.js";

describe("createApp", () => {
  it("GET /api/healthz returns 200 with plain text OK and UTF-8 content type", async () => {
    const res = await request(createApp()).get("/api/healthz").expect(200);

    expect(res.text).toBe("OK");
    expect(res.headers["content-type"]).toMatch(/text\/plain/i);
    expect(res.headers["content-type"]).toMatch(/charset=utf-8/i);
  });
});
