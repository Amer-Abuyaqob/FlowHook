/**
 * Unit tests for action dispatcher: runAction.
 */
import type { ActionType } from "../../db/types.js";
import { describe, expect, it } from "vitest";
import { runAction } from "./index.js";

describe("runAction", () => {
  it("transform: delegates and returns { result }", async () => {
    const config = { mappings: [{ from: "x", to: "y" }] };
    const payload = { x: 123 };
    const outcome = await runAction("transform", config, payload);
    expect(outcome).toEqual({ result: { y: 123 } });
  });

  it("filter: throws 'Filter action is not implemented'", async () => {
    const config = { conditions: [] };
    const payload = {};
    await expect(runAction("filter", config, payload)).rejects.toThrow(
      "Filter action is not implemented"
    );
  });

  it("template: throws 'Template action is not implemented'", async () => {
    const config = { template: "Hello {{name}}" };
    const payload = { name: "World" };
    await expect(runAction("template", config, payload)).rejects.toThrow(
      "Template action is not implemented"
    );
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
