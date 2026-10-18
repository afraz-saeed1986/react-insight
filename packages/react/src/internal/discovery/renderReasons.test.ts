import { describe, expect, it } from "vitest";

import type { ContextSummary } from "./contextInspector";
import type { HookSummary } from "./hookInspector";
import { computeRenderReasons, diffPropKeys, type RenderReasonInput } from "./renderReasons";

function stateHook(index: number, value: number): HookSummary {
  return { index, kind: "state", value };
}

function context(index: number, displayName: string, value: string): ContextSummary {
  return { index, displayName, value };
}

const base: RenderReasonInput = {
  isMount: false,
  changedPropKeys: [],
  previousHooks: [],
  hooks: [],
  previousContexts: [],
  contexts: [],
  parentRendered: false,
};

describe("diffPropKeys", () => {
  it("returns the names of props whose value changed", () => {
    expect(diffPropKeys({ a: 1, b: 2 }, { a: 1, b: 3 })).toEqual(["b"]);
  });

  it("returns [] when the same props object is seen again", () => {
    const props = { a: 1 };
    expect(diffPropKeys(props, props)).toEqual([]);
  });

  it("returns [] for equal values in a new object", () => {
    expect(diffPropKeys({ a: 1 }, { a: 1 })).toEqual([]);
  });

  it("reports added and removed props", () => {
    expect(diffPropKeys({ a: 1, gone: 1 }, { a: 1, added: 1 })).toEqual(["added", "gone"]);
  });

  it("compares with Object.is, so NaN is not a change", () => {
    expect(diffPropKeys({ a: Number.NaN }, { a: Number.NaN })).toEqual([]);
  });

  it("reports a function prop that got a new identity", () => {
    expect(diffPropKeys({ onClick: () => 1 }, { onClick: () => 1 })).toEqual(["onClick"]);
  });

  it("returns [] when either side is not an object", () => {
    expect(diffPropKeys(null, { a: 1 })).toEqual([]);
    expect(diffPropKeys({ a: 1 }, undefined)).toEqual([]);
  });
});

describe("computeRenderReasons", () => {
  it("reports only mount on first sighting", () => {
    expect(computeRenderReasons({ ...base, isMount: true, changedPropKeys: ["a"] })).toEqual([
      { type: "mount" },
    ]);
  });

  it("reports changed props", () => {
    expect(computeRenderReasons({ ...base, changedPropKeys: ["a", "b"] })).toEqual([
      { type: "props", keys: ["a", "b"] },
    ]);
  });

  it("reports the state hook whose value changed", () => {
    const result = computeRenderReasons({
      ...base,
      previousHooks: [stateHook(0, 1), stateHook(1, 5)],
      hooks: [stateHook(0, 1), stateHook(1, 6)],
    });

    expect(result).toEqual([{ type: "state", hookIndices: [1] }]);
  });

  it("ignores ref, memo-like and effect hooks as causes", () => {
    const result = computeRenderReasons({
      ...base,
      previousHooks: [
        { index: 0, kind: "ref", value: 1 },
        { index: 1, kind: "memo-like", value: 1 },
        { index: 2, kind: "effect" },
      ],
      hooks: [
        { index: 0, kind: "ref", value: 2 },
        { index: 1, kind: "memo-like", value: 2 },
        { index: 2, kind: "effect" },
      ],
    });

    expect(result).toEqual([{ type: "unknown" }]);
  });

  it("reports the context whose value changed", () => {
    const result = computeRenderReasons({
      ...base,
      previousContexts: [context(0, "Theme", "a"), context(1, "User", "x")],
      contexts: [context(0, "Theme", "b"), context(1, "User", "x")],
    });

    expect(result).toEqual([{ type: "context", names: ["Theme"] }]);
  });

  it("reports a context that was added", () => {
    const result = computeRenderReasons({
      ...base,
      previousContexts: [],
      contexts: [context(0, "Theme", "a")],
    });

    expect(result).toEqual([{ type: "context", names: ["Theme"] }]);
  });

  it("reports every cause that applies, in a stable order", () => {
    const result = computeRenderReasons({
      ...base,
      changedPropKeys: ["a"],
      previousHooks: [stateHook(0, 1)],
      hooks: [stateHook(0, 2)],
      previousContexts: [context(0, "Theme", "a")],
      contexts: [context(0, "Theme", "b")],
    });

    expect(result).toEqual([
      { type: "props", keys: ["a"] },
      { type: "state", hookIndices: [0] },
      { type: "context", names: ["Theme"] },
    ]);
  });

  it("reports parent when nothing else changed but the parent rendered", () => {
    expect(computeRenderReasons({ ...base, parentRendered: true })).toEqual([{ type: "parent" }]);
  });

  it("does not add parent when a concrete cause was found", () => {
    expect(
      computeRenderReasons({ ...base, parentRendered: true, changedPropKeys: ["a"] }),
    ).toEqual([{ type: "props", keys: ["a"] }]);
  });

  it("reports unknown when no cause can be detected", () => {
    expect(computeRenderReasons(base)).toEqual([{ type: "unknown" }]);
  });
});