/**
 * Unit tests for validateAuth.
 */

import type { Request } from "express";
import { describe, expect, it, vi } from "vitest";
import { validateAuth } from "./validate.js";

vi.mock("../config.js", () => ({
  config: { apiKey: "test-key", port: 3000, db: { url: undefined } },
}));

function mockRequest(headers: Record<string, string | undefined>): Request {
  return { headers } as Request;
}

describe("validateAuth", () => {
  it("returns valid: true for Authorization: Bearer test-key", async () => {
    const req = mockRequest({ authorization: "Bearer test-key" });
    const result = await validateAuth(req);
    expect(result).toEqual({ valid: true, identity: { type: "api_key" } });
  });

  it("returns valid: true for X-API-Key: test-key", async () => {
    const req = mockRequest({ "x-api-key": "test-key" });
    const result = await validateAuth(req);
    expect(result).toEqual({ valid: true, identity: { type: "api_key" } });
  });

  it("returns valid: false when no credential header is present", async () => {
    const req = mockRequest({});
    const result = await validateAuth(req);
    expect(result).toEqual({ valid: false });
  });

  it("returns valid: false when Authorization is empty", async () => {
    const req = mockRequest({ authorization: "" });
    const result = await validateAuth(req);
    expect(result).toEqual({ valid: false });
  });

  it("returns valid: false when key does not match", async () => {
    const req = mockRequest({ authorization: "Bearer wrong-key" });
    const result = await validateAuth(req);
    expect(result).toEqual({ valid: false });
  });

  it("returns valid: false for malformed Authorization without Bearer scheme", async () => {
    const req = mockRequest({ authorization: "InvalidFormat" });
    const result = await validateAuth(req);
    expect(result).toEqual({ valid: false });
  });

  it("returns valid: true for bearer (lowercase) scheme", async () => {
    const req = mockRequest({ authorization: "bearer test-key" });
    const result = await validateAuth(req);
    expect(result).toEqual({ valid: true, identity: { type: "api_key" } });
  });
});
