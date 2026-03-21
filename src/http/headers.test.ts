/**
 * Unit tests for Express response Content-Type helpers.
 */

import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import {
  setHTMLTextUtf8Header,
  setJsonUtf8Header,
  setPlainTextUtf8Header,
} from "./headers.js";

function mockResponse(): Response {
  const set = vi.fn();
  return { set } as unknown as Response;
}

describe("setPlainTextUtf8Header", () => {
  it("sets text/plain with UTF-8 charset", () => {
    const res = mockResponse();
    setPlainTextUtf8Header(res);
    expect(res.set).toHaveBeenCalledWith(
      "Content-Type",
      "text/plain; charset=utf-8"
    );
  });
});

describe("setJsonUtf8Header", () => {
  it("sets application/json with UTF-8 charset", () => {
    const res = mockResponse();
    setJsonUtf8Header(res);
    expect(res.set).toHaveBeenCalledWith(
      "Content-Type",
      "application/json; charset=utf-8"
    );
  });
});

describe("setHTMLTextUtf8Header", () => {
  it("sets text/html with UTF-8 charset", () => {
    const res = mockResponse();
    setHTMLTextUtf8Header(res);
    expect(res.set).toHaveBeenCalledWith(
      "Content-Type",
      "text/html; charset=utf-8"
    );
  });
});
