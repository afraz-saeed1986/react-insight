import { describe, expect, it } from "vitest";
import type { ComponentSnapshot } from "@react-insight/react";

import { summarizeComponent } from "./summarizeComponent";

const hook = (index: number): ComponentSnapshot["hooks"][number] => ({
  index,
  kind: "state",
});

const context = (index: number): ComponentSnapshot["contexts"][number] => ({
  index,
  displayName: `Ctx${index}`,
  value: null,
});

describe("summarizeComponent", () => {
  it("returns an empty string when there are no hooks or contexts", () => {
    expect(summarizeComponent({ hooks: [], contexts: [] })).toBe("");
  });

  it("uses singular and plural for hooks", () => {
    expect(summarizeComponent({ hooks: [hook(0)], contexts: [] })).toBe(
      "1 hook",
    );
    expect(
      summarizeComponent({ hooks: [hook(0), hook(1)], contexts: [] }),
    ).toBe("2 hooks");
  });

  it("summarizes contexts only", () => {
    expect(summarizeComponent({ hooks: [], contexts: [context(0)] })).toBe(
      "1 context",
    );
  });

  it("joins hooks and contexts", () => {
    expect(
      summarizeComponent({
        hooks: [hook(0), hook(1)],
        contexts: [context(0), context(1)],
      }),
    ).toBe("2 hooks · 2 contexts");
  });
});