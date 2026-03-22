/**
 * Unit tests for routeParams module: getRouteParam.
 */
import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { getRouteParam } from "./routeParams.js";

function mockRequest(params: Record<string, string | string[]>): Request {
  return { params } as Request;
}

describe("getRouteParam", () => {
  it("returns string when param is string", () => {
    const req = mockRequest({ id: "abc-123" });
    expect(getRouteParam(req, "id")).toBe("abc-123");
  });

  it("returns first element when param is array", () => {
    const req = mockRequest({ id: ["first", "second"] });
    expect(getRouteParam(req, "id")).toBe("first");
  });

  it("returns empty string when param is missing", () => {
    const req = mockRequest({});
    expect(getRouteParam(req, "id")).toBe("");
  });

  it("returns empty string when param is empty array", () => {
    const req = mockRequest({ id: [] });
    expect(getRouteParam(req, "id")).toBe("");
  });

  it("works with different param names", () => {
    const req = mockRequest({ slug: "my-pipeline", subscriberId: "sub-1" });
    expect(getRouteParam(req, "slug")).toBe("my-pipeline");
    expect(getRouteParam(req, "subscriberId")).toBe("sub-1");
  });
});
