/**
 * Unit tests for JSON response helpers.
 */

import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { respondWithError, respondWithJSON } from "./json.js";

describe("respondWithJSON", () => {
  it("sets JSON UTF-8 header, status, and stringified body", () => {
    const send = vi.fn();
    const status = vi.fn().mockReturnValue({ send });
    const set = vi.fn();
    const res = { set, status } as unknown as Response;

    respondWithJSON(res, 201, { a: 1 });

    expect(set).toHaveBeenCalledWith(
      "Content-Type",
      "application/json; charset=utf-8"
    );
    expect(status).toHaveBeenCalledWith(201);
    expect(send).toHaveBeenCalledWith(JSON.stringify({ a: 1 }));
  });
});

describe("respondWithError", () => {
  it("sends JSON body with error field", () => {
    const send = vi.fn();
    const status = vi.fn().mockReturnValue({ send });
    const set = vi.fn();
    const res = { set, status } as unknown as Response;

    respondWithError(res, 400, "bad");

    expect(status).toHaveBeenCalledWith(400);
    expect(send).toHaveBeenCalledWith(JSON.stringify({ error: "bad" }));
  });
});
