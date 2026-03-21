/**
 * Unit tests for HTTP-oriented error classes.
 */

import { describe, expect, it } from "vitest";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UserForbiddenError,
  UserNotAuthenticatedError,
} from "./errors.js";

describe("BadRequestError", () => {
  it("extends Error and carries the message", () => {
    const err = new BadRequestError("invalid body");
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("invalid body");
  });
});

describe("UserNotAuthenticatedError", () => {
  it("extends Error and carries the message", () => {
    const err = new UserNotAuthenticatedError("no token");
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("no token");
  });
});

describe("UserForbiddenError", () => {
  it("extends Error and carries the message", () => {
    const err = new UserForbiddenError("not allowed");
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("not allowed");
  });
});

describe("NotFoundError", () => {
  it("extends Error and carries the message", () => {
    const err = new NotFoundError("missing");
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("missing");
  });
});

describe("ConflictError", () => {
  it("extends Error and carries the message", () => {
    const err = new ConflictError("duplicate");
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("duplicate");
  });
});
