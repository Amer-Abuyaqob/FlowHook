/**
 * Unit tests for action dispatcher: runAction.
 */
import type { ActionType, FilterActionConfig } from "../../db/types.js";
import { describe, expect, it } from "vitest";
import { runAction } from "./index.js";

describe("runAction", () => {
  it("transform: delegates and returns { result }", async () => {
    const config = { mappings: [{ from: "x", to: "y" }] };
    const payload = { x: 123 };
    const outcome = await runAction("transform", config, payload);
    expect(outcome).toEqual({ result: { y: 123 } });
  });

  it("filter: returns { result } when conditions match", async () => {
    const config: FilterActionConfig = {
      conditions: [{ path: "event.type", operator: "eq", value: "created" }],
    };
    const payload = { event: { type: "created" } };
    const outcome = await runAction("filter", config, payload);
    expect(outcome).toEqual({ result: payload });
  });

  it("filter: returns { filtered: true } when any condition fails", async () => {
    const config: FilterActionConfig = {
      conditions: [{ path: "event.type", operator: "eq", value: "created" }],
    };
    const payload = { event: { type: "updated" } };
    const outcome = await runAction("filter", config, payload);
    expect(outcome).toEqual({ filtered: true });
  });

  it("template: delegates and returns rendered body result", async () => {
    const config = { template: "Hello {{name}}" };
    const payload = { name: "World" };
    const outcome = await runAction("template", config, payload);
    expect(outcome).toEqual({ result: { body: "Hello World" } });
  });

  it("unknown action type: throws 'Unknown action type'", async () => {
    const config = { mappings: [{ from: "a", to: "b" }] };
    const payload = {};
    await expect(
      runAction("invalid" as ActionType, config, payload)
    ).rejects.toThrow("Unknown action type: invalid");
  });

  it("null actionConfig: throws 'Action config is required'", async () => {
    const payload = {};
    await expect(runAction("transform", null, payload)).rejects.toThrow(
      "Action config is required"
    );
  });
});
