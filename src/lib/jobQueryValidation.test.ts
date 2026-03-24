/**
 * Unit tests for GET /api/jobs query parsing.
 */
import { describe, expect, it } from "vitest";
import { BadRequestError } from "../errors.js";
import {
  JOB_LIST_DEFAULT_LIMIT,
  JOB_LIST_MAX_LIMIT,
  parseJobListQuery,
} from "./jobQueryValidation.js";

describe("parseJobListQuery", () => {
  it("defaults limit and offset when omitted", () => {
    expect(parseJobListQuery({})).toEqual({
      limit: JOB_LIST_DEFAULT_LIMIT,
      offset: 0,
    });
  });

  it("parses pipelineId and status when valid", () => {
    const pid = "550e8400-e29b-41d4-a716-446655440000";
    expect(
      parseJobListQuery({
        pipelineId: pid,
        status: "completed",
      })
    ).toEqual({
      pipelineId: pid,
      status: "completed",
      limit: JOB_LIST_DEFAULT_LIMIT,
      offset: 0,
    });
  });

  it("throws on invalid pipelineId", () => {
    expect(() => parseJobListQuery({ pipelineId: "nope" })).toThrow(
      BadRequestError
    );
    expect(() => parseJobListQuery({ pipelineId: "nope" })).toThrow(
      "Invalid pipelineId"
    );
  });

  it("throws on invalid status", () => {
    expect(() => parseJobListQuery({ status: "done" })).toThrow(
      BadRequestError
    );
    expect(() => parseJobListQuery({ status: "done" })).toThrow(
      "Invalid status"
    );
  });

  it("throws on negative offset", () => {
    expect(() => parseJobListQuery({ offset: "-1" })).toThrow(BadRequestError);
    expect(() => parseJobListQuery({ offset: "-1" })).toThrow("Invalid offset");
  });

  it("throws on limit less than 1", () => {
    expect(() => parseJobListQuery({ limit: "0" })).toThrow(BadRequestError);
    expect(() => parseJobListQuery({ limit: "0" })).toThrow("Invalid limit");
  });

  it("caps limit at JOB_LIST_MAX_LIMIT", () => {
    expect(parseJobListQuery({ limit: "500" }).limit).toBe(JOB_LIST_MAX_LIMIT);
  });

  it("uses first value when query param is an array", () => {
    expect(
      parseJobListQuery({
        limit: ["200", "1"],
      }).limit
    ).toBe(JOB_LIST_MAX_LIMIT);
  });
});
