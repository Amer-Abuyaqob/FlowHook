/**
 * Unit tests for db module: schema structure and getConnectionString.
 */
import { describe, expect, it, vi } from "vitest";
import { getTableName } from "drizzle-orm";
import {
  pipelines,
  subscribers,
  jobs,
  deliveryAttempts,
  getConnectionString,
} from "./index.js";

describe("db schema", () => {
  it("exports pipelines table with correct name", () => {
    expect(getTableName(pipelines)).toBe("pipelines");
  });

  it("exports subscribers table with correct name", () => {
    expect(getTableName(subscribers)).toBe("subscribers");
  });

  it("exports jobs table with correct name", () => {
    expect(getTableName(jobs)).toBe("jobs");
  });

  it("exports deliveryAttempts table with correct name", () => {
    expect(getTableName(deliveryAttempts)).toBe("delivery_attempts");
  });

  it("pipelines has expected columns", () => {
    const cols = Object.keys(pipelines);
    expect(cols).toContain("id");
    expect(cols).toContain("slug");
    expect(cols).toContain("name");
    expect(cols).toContain("actionType");
    expect(cols).toContain("actionConfig");
    expect(cols).toContain("isActive");
    expect(cols).toContain("createdAt");
    expect(cols).toContain("updatedAt");
  });

  it("jobs has status column", () => {
    expect(Object.keys(jobs)).toContain("status");
  });
});

describe("getConnectionString", () => {
  it("returns DATABASE_URL when set", () => {
    vi.stubEnv("DATABASE_URL", "postgres://custom:5432/db");
    vi.stubEnv("DB_URL", "ignored");
    expect(getConnectionString()).toBe("postgres://custom:5432/db");
    vi.unstubAllEnvs();
  });

  it("returns DB_URL when DATABASE_URL is unset", () => {
    vi.stubEnv("DATABASE_URL", undefined as unknown as string);
    vi.stubEnv("DB_URL", "postgres://fallback:5432/db");
    expect(getConnectionString()).toBe("postgres://fallback:5432/db");
    vi.unstubAllEnvs();
  });

  it("returns empty string when both env vars are unset", () => {
    vi.stubEnv("DATABASE_URL", undefined as unknown as string);
    vi.stubEnv("DB_URL", undefined as unknown as string);
    expect(getConnectionString()).toBe("");
    vi.unstubAllEnvs();
  });
});
