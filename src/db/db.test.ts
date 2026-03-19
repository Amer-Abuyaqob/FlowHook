/**
 * Unit tests for db module: schema structure and assertDbConnection.
 */
import { describe, expect, it } from "vitest";
import { getTableName } from "drizzle-orm";
import {
  assertDbConnection,
  pipelines,
  subscribers,
  jobs,
  deliveryAttempts,
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

describe("assertDbConnection", () => {
  it("throws when passed undefined", () => {
    expect(() => assertDbConnection(undefined)).toThrow(
      "Database connection is not available"
    );
  });
});
