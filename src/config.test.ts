/**
 * Unit tests for config module: parsePort, requireEnv, getOptionalEnv, and loadConfig.
 */
import { describe, expect, it } from "vitest";
import { config, getOptionalEnv, parsePort, requireEnv } from "./config.js";

describe("parsePort", () => {
  it("returns 3000 when value is undefined", () => {
    expect(parsePort(undefined)).toBe(3000);
  });

  it("returns 3000 when value is empty string", () => {
    expect(parsePort("")).toBe(3000);
  });

  it("parses valid port number", () => {
    expect(parsePort("8080")).toBe(8080);
  });

  it("returns 3000 when value is invalid", () => {
    expect(parsePort("invalid")).toBe(3000);
  });

  it("returns 3000 when port is out of range (0)", () => {
    expect(parsePort("0")).toBe(3000);
  });

  it("returns 3000 when port is out of range (>65535)", () => {
    expect(parsePort("70000")).toBe(3000);
  });
});

describe("requireEnv", () => {
  it("returns trimmed value when non-empty", () => {
    expect(requireEnv("  value  ", "X")).toBe("value");
  });

  it("throws when value is empty string", () => {
    expect(() => requireEnv("", "DATABASE_URL")).toThrow(
      "Missing required env var: DATABASE_URL",
    );
  });

  it("throws when value is undefined", () => {
    expect(() => requireEnv(undefined, "API_KEY")).toThrow(
      "Missing required env var: API_KEY",
    );
  });

  it("throws when value is whitespace only", () => {
    expect(() => requireEnv("   ", "X")).toThrow("Missing required env var: X");
  });
});

describe("getOptionalEnv", () => {
  it("returns trimmed value when non-empty", () => {
    expect(getOptionalEnv("  value  ")).toBe("value");
  });

  it("returns undefined when value is empty string", () => {
    expect(getOptionalEnv("")).toBeUndefined();
  });

  it("returns undefined when value is undefined", () => {
    expect(getOptionalEnv(undefined)).toBeUndefined();
  });

  it("returns undefined when value is whitespace only", () => {
    expect(getOptionalEnv("   ")).toBeUndefined();
  });
});

describe("config", () => {
  it("exports config with port, db.url, and apiKey", () => {
    expect(config).toHaveProperty("port");
    expect(config).toHaveProperty("db");
    expect(config).toHaveProperty("apiKey");
    expect(typeof config.port).toBe("number");
    expect(config.db).toHaveProperty("url");
    expect(typeof config.apiKey).toBe("string");
  });
});
