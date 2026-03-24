/**
 * Unit tests for filter action evaluator.
 */
import { describe, expect, it } from "vitest";
import { runFilter } from "./filter.js";

describe("runFilter", () => {
  it("eq: keeps payload when value matches", () => {
    const payload = { event: { type: "order.created" } };
    const outcome = runFilter(
      {
        conditions: [
          { path: "event.type", operator: "eq", value: "order.created" },
        ],
      },
      payload
    );
    expect(outcome).toEqual({ result: payload });
  });

  it("eq: filters payload when value does not match", () => {
    const outcome = runFilter(
      {
        conditions: [
          { path: "event.type", operator: "eq", value: "order.created" },
        ],
      },
      { event: { type: "order.updated" } }
    );
    expect(outcome).toEqual({ filtered: true });
  });

  it("neq: keeps payload when value is different", () => {
    const payload = { amount: 50 };
    const outcome = runFilter(
      { conditions: [{ path: "amount", operator: "neq", value: 100 }] },
      payload
    );
    expect(outcome).toEqual({ result: payload });
  });

  it("neq: filters payload when value is equal", () => {
    const outcome = runFilter(
      { conditions: [{ path: "amount", operator: "neq", value: 100 }] },
      { amount: 100 }
    );
    expect(outcome).toEqual({ filtered: true });
  });

  it("exists: keeps payload when path exists", () => {
    const payload = { customer: { id: "c-1" } };
    const outcome = runFilter(
      { conditions: [{ path: "customer.id", operator: "exists" }] },
      payload
    );
    expect(outcome).toEqual({ result: payload });
  });

  it("exists: filters payload when path is missing", () => {
    const outcome = runFilter(
      { conditions: [{ path: "customer.id", operator: "exists" }] },
      { customer: {} }
    );
    expect(outcome).toEqual({ filtered: true });
  });

  it("contains: keeps payload when array contains value", () => {
    const payload = { tags: ["vip", "new"] };
    const outcome = runFilter(
      { conditions: [{ path: "tags", operator: "contains", value: "vip" }] },
      payload
    );
    expect(outcome).toEqual({ result: payload });
  });

  it("contains: filters payload when array does not contain value", () => {
    const outcome = runFilter(
      { conditions: [{ path: "tags", operator: "contains", value: "vip" }] },
      { tags: ["new"] }
    );
    expect(outcome).toEqual({ filtered: true });
  });

  it("contains: string matching is case-sensitive", () => {
    const outcome = runFilter(
      { conditions: [{ path: "title", operator: "contains", value: "order" }] },
      { title: "Order Created" }
    );
    expect(outcome).toEqual({ filtered: true });
  });

  it("multiple conditions: AND semantics require all to pass", () => {
    const outcome = runFilter(
      {
        conditions: [
          { path: "event.type", operator: "eq", value: "order.created" },
          { path: "tags", operator: "contains", value: "vip" },
        ],
      },
      { event: { type: "order.created" }, tags: ["new"] }
    );
    expect(outcome).toEqual({ filtered: true });
  });

  it("empty conditions: keeps payload (pass-through)", () => {
    const payload = { any: "value" };
    const outcome = runFilter({ conditions: [] }, payload);
    expect(outcome).toEqual({ result: payload });
  });
});
