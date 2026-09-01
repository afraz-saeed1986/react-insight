import { describe, expect, it, vi } from "vitest";
import type { ComponentSnapshot, Insight, InspectedHookName } from "@react-insight/react";

import { inspectComponent } from "./inspectComponent";

function fakeSnapshot(overrides: Partial<ComponentSnapshot> = {}): ComponentSnapshot {
  return {
    id: "app",
    displayName: "App",
    parentId: null,
    status: "mounted",
    renderCount: 1,
    mountedAt: 0,
    lastRenderedAt: 0,
    unmountedAt: null,
    hooks: [],
    contexts: [],
    ...overrides,
  };
}

function fakeInsight(overrides: Partial<Insight> = {}): Insight {
  return {
    use: vi.fn(),
    destroy: vi.fn(),
    getComponents: vi.fn(() => []),
    getComponent: vi.fn(() => undefined),
    onChange: vi.fn(() => () => {}),
    inspectHookNames: vi.fn(() => undefined),
    ...overrides,
  };
}

describe("inspectComponent", () => {
  it("returns undefined when the component isn't tracked", () => {
    const insight = fakeInsight({ getComponent: vi.fn(() => undefined) });

    expect(inspectComponent(insight, "missing")).toBeUndefined();
  });

  it("combines the snapshot and resolved hook names when both are available", () => {
    const snapshot = fakeSnapshot();
    const hookNames: InspectedHookName[] = [{ index: 0, hookName: "useState" }];

    const insight = fakeInsight({
      getComponent: vi.fn(() => snapshot),
      inspectHookNames: vi.fn(() => hookNames),
    });

    expect(inspectComponent(insight, "app")).toEqual({ snapshot, hookNames });
  });

  it("still returns a result with hookNames: undefined when hook name resolution isn't available", () => {
    const snapshot = fakeSnapshot();

    const insight = fakeInsight({
      getComponent: vi.fn(() => snapshot),
      inspectHookNames: vi.fn(() => undefined),
    });

    expect(inspectComponent(insight, "app")).toEqual({ snapshot, hookNames: undefined });
  });

  it("looks up hook names using the same id passed in", () => {
    const snapshot = fakeSnapshot({ id: "app" });
    const inspectHookNames = vi.fn(() => undefined);

    const insight = fakeInsight({
      getComponent: vi.fn(() => snapshot),
      inspectHookNames,
    });

    inspectComponent(insight, "app");

    expect(inspectHookNames).toHaveBeenCalledWith("app");
  });
});