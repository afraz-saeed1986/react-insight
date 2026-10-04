import { describe, expect, it } from "vitest";
import type { ComponentSnapshot } from "@react-insight/react";

import { mergeHookInfo } from "./mergeHookInfo";

const hooks: ComponentSnapshot["hooks"] = [
  { index: 0, kind: "state", value: 1 },
  { index: 1, kind: "effect" },
];

describe("mergeHookInfo", () => {
  it("joins resolved names to hooks by index", () => {
    const rows = mergeHookInfo(hooks, [
      { index: 0, hookName: "useState" },
      { index: 1, hookName: "useEffect" },
    ]);

    expect(rows.map((r) => r.hookName)).toEqual(["useState", "useEffect"]);
  });

  it("leaves names undefined when no inspection result exists", () => {
    const rows = mergeHookInfo(hooks, undefined);

    expect(rows.map((r) => r.hookName)).toEqual([undefined, undefined]);
    expect(rows.map((r) => r.kind)).toEqual(["state", "effect"]);
  });

  it("ignores names whose index has no structural hook", () => {
    const rows = mergeHookInfo(hooks, [{ index: 7, hookName: "useRef" }]);

    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.hookName === undefined)).toBe(true);
  });

  it("passes through customHookName and value", () => {
    const rows = mergeHookInfo(hooks, [
      { index: 0, hookName: "useState", customHookName: "useCounter" },
    ]);

    expect(rows[0]?.customHookName).toBe("useCounter");
    expect(rows[0]?.value).toBe(1);
  });
});