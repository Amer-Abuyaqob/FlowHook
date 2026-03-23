/**
 * Unit tests for error middleware.
 */

import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UserForbiddenError,
  UserNotAuthenticatedError,
} from "../errors.js";
import { errorMiddleware } from "./errorMiddleware.js";

function mockRes(): { res: Response; send: ReturnType<typeof vi.fn> } {
  const send = vi.fn();
  const status = vi.fn().mockReturnValue({ send });
  const res = { status, set: vi.fn() } as unknown as Response;
  return { res, send };
}

describe("errorMiddleware", () => {
  it("maps UserNotAuthenticatedError to 401 with error body", () => {
    const { res, send } = mockRes();
    const req = {} as Request;
    const next = vi.fn();

    errorMiddleware(
      new UserNotAuthenticatedError("Unauthorized"),
      req,
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(send).toHaveBeenCalledWith(
      JSON.stringify({ error: "Unauthorized" })
    );
  });

  it("maps BadRequestError to 400", () => {
    const { res, send } = mockRes();
    const req = {} as Request;
    const next = vi.fn();

    errorMiddleware(new BadRequestError("invalid body"), req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(send).toHaveBeenCalledWith(
      JSON.stringify({ error: "invalid body" })
    );
  });

  it("maps SyntaxError (e.g. malformed JSON) to 400 Invalid JSON", () => {
    const { res, send } = mockRes();
    const req = {} as Request;
    const next = vi.fn();

    errorMiddleware(new SyntaxError("Unexpected token"), req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(send).toHaveBeenCalledWith(
      JSON.stringify({ error: "Invalid JSON" })
    );
  });

  it("maps UserForbiddenError to 403", () => {
    const { res } = mockRes();
    const req = {} as Request;
    const next = vi.fn();

    errorMiddleware(new UserForbiddenError("not allowed"), req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("maps NotFoundError to 404", () => {
    const { res } = mockRes();
    const req = {} as Request;
    const next = vi.fn();

    errorMiddleware(new NotFoundError("missing"), req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("maps ConflictError to 409", () => {
    const { res } = mockRes();
    const req = {} as Request;
    const next = vi.fn();

    errorMiddleware(new ConflictError("duplicate"), req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("returns 500 for unknown Error", () => {
    const { res, send } = mockRes();
    const req = {} as Request;
    const next = vi.fn();

    errorMiddleware(new Error("internal"), req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(send).toHaveBeenCalledWith(
      JSON.stringify({ error: "Internal Server Error" })
    );
  });

  it("returns 500 for non-Error value", () => {
    const { res } = mockRes();
    const req = {} as Request;
    const next = vi.fn();

    errorMiddleware("not an error", req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
