/**
 * Unit tests for subscriber request body validation.
 */
import { describe, expect, it } from "vitest";
import { BadRequestError } from "../errors.js";
import { parseAddSubscriberBody } from "./subscriberValidation.js";

describe("parseAddSubscriberBody", () => {
  it("parses url and null headers when headers omitted", () => {
    const result = parseAddSubscriberBody({
      url: "https://example.com/webhook",
    });
    expect(result.url).toBe("https://example.com/webhook");
    expect(result.headers).toBeNull();
  });

  it("parses url and headers when both provided", () => {
    const result = parseAddSubscriberBody({
      url: "https://example.com/callback",
      headers: {
        Authorization: "Bearer token",
        "X-Custom": "value",
      },
    });
    expect(result.url).toBe("https://example.com/callback");
    expect(result.headers).toEqual({
      Authorization: "Bearer token",
      "X-Custom": "value",
    });
  });

  it("accepts null headers", () => {
    const result = parseAddSubscriberBody({
      url: "http://localhost:8080/webhook",
      headers: null,
    });
    expect(result.url).toBe("http://localhost:8080/webhook");
    expect(result.headers).toBeNull();
  });

  it("throws when body is not object", () => {
    expect(() => parseAddSubscriberBody(null)).toThrow(BadRequestError);
    expect(() => parseAddSubscriberBody(null)).toThrow("Invalid request");
    expect(() => parseAddSubscriberBody([])).toThrow("Invalid request");
    expect(() => parseAddSubscriberBody("string")).toThrow("Invalid request");
  });

  it("throws when url is missing", () => {
    expect(() => parseAddSubscriberBody({})).toThrow("URL is required");
    expect(() => parseAddSubscriberBody({ headers: {} })).toThrow(
      "URL is required"
    );
  });

  it("throws when url is not string", () => {
    expect(() => parseAddSubscriberBody({ url: 123 })).toThrow(
      "URL is required"
    );
  });

  it("throws when url is invalid format", () => {
    expect(() => parseAddSubscriberBody({ url: "not-a-url" })).toThrow(
      "Invalid URL format"
    );
  });

  it("throws when url has invalid protocol", () => {
    expect(() =>
      parseAddSubscriberBody({ url: "ftp://example.com/file" })
    ).toThrow("Invalid URL format");
  });

  it("throws when headers contains non-string value", () => {
    expect(() =>
      parseAddSubscriberBody({
        url: "https://example.com",
        headers: { Authorization: 123 },
      })
    ).toThrow("Invalid request");
  });

  it("throws when headers is array", () => {
    expect(() =>
      parseAddSubscriberBody({
        url: "https://example.com",
        headers: [],
      })
    ).toThrow("Invalid request");
  });
});
