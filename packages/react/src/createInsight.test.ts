import { describe, expect, it, vi } from "vitest";

import { createInsight } from "./createInsight";

describe("createInsight", () => {
  it("creates an Insight instance", () => {
    const insight = createInsight();

    expect(insight).toBeDefined();
  });

  it("exposes the public API", () => {
    const insight = createInsight();

    expect(insight.use).toBeTypeOf("function");
    expect(insight.destroy).toBeTypeOf("function");
  });

  it("does not expose the Runtime", () => {
    const insight = createInsight();

    expect("runtime" in insight).toBe(false);
  });

  it("destroys successfully", async () => {
    const insight = createInsight();

    await expect(insight.destroy()).resolves.toBeUndefined();
  });
  
  it("returns an empty snapshot before any component is discovered", () => {
    const insight = createInsight();

    expect(insight.getComponents()).toEqual([]);
  });

it("discovers components as soon as a commit happens, without any InsightProvider mount", () => {
    const insight = createInsight();

    const hook = (globalThis as { __REACT_DEVTOOLS_GLOBAL_HOOK__?: {
      onCommitFiberRoot?: (rendererId: number, root: unknown) => void;
    } }).__REACT_DEVTOOLS_GLOBAL_HOOK__;

    function App() { return null; }
    const appFiber = { type: App, child: null, sibling: null, alternate: null };

    hook?.onCommitFiberRoot?.(1, { current: appFiber });

    // No InsightProvider/root registered yet — proves the hook adapter
    // is connected the moment createInsight() returns (the earliest
    // possible point), and that discovery no longer silently drops
    // pre-root commits (see DECISIONS.md, "pending root" fix).
    const components = insight.getComponents();
    expect(components).toHaveLength(1);
    expect(components[0]).toMatchObject({ displayName: "App", parentId: null });
  });

  
  it("returns undefined from getComponent() for an unknown id", () => {
    const insight = createInsight();

    expect(insight.getComponent("does-not-exist")).toBeUndefined();
  });

  it("getComponent() returns the exact same snapshot getComponents() returns for that id", () => {
    const insight = createInsight();

    const hook = (globalThis as { __REACT_DEVTOOLS_GLOBAL_HOOK__?: {
      onCommitFiberRoot?: (rendererId: number, root: unknown) => void;
    } }).__REACT_DEVTOOLS_GLOBAL_HOOK__;

    function App() { return null; }
    const appFiber = { type: App, child: null, sibling: null, alternate: null };

    hook?.onCommitFiberRoot?.(1, { current: appFiber });

    const [discovered] = insight.getComponents();
    expect(discovered).toBeDefined();

    expect(insight.getComponent(discovered!.id)).toEqual(discovered);
  });


  it("notifies onChange listeners when a real commit discovers a component", async () => {
    const insight = createInsight();

    const listener = vi.fn();
    insight.onChange(listener);

    const hook = (globalThis as { __REACT_DEVTOOLS_GLOBAL_HOOK__?: {
      onCommitFiberRoot?: (rendererId: number, root: unknown) => void;
    } }).__REACT_DEVTOOLS_GLOBAL_HOOK__;

    function App() { return null; }
    const appFiber = { type: App, child: null, sibling: null, alternate: null };

    hook?.onCommitFiberRoot?.(1, { current: appFiber });

    // ComponentRegistry batches notify() via a microtask (see
    // componentRegistry.ts) to collapse multiple sync() calls within
    // the same commit into a single notification.
   await new Promise<void>((resolve) => queueMicrotask(resolve));

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("stops notifying after onChange's unsubscribe function is called", async () => {
    const insight = createInsight();

    const listener = vi.fn();
    const unsubscribe = insight.onChange(listener);
    unsubscribe();

    const hook = (globalThis as { __REACT_DEVTOOLS_GLOBAL_HOOK__?: {
      onCommitFiberRoot?: (rendererId: number, root: unknown) => void;
    } }).__REACT_DEVTOOLS_GLOBAL_HOOK__;

    function App() { return null; }
    const appFiber = { type: App, child: null, sibling: null, alternate: null };

    hook?.onCommitFiberRoot?.(1, { current: appFiber });

    await new Promise<void>((resolve) => queueMicrotask(resolve));

    expect(listener).not.toHaveBeenCalled();
  });

});

describe("inspectHookNames", () => {
  it("returns undefined for an unknown id", () => {
    const insight = createInsight();

    expect(insight.inspectHookNames("does-not-exist")).toBeUndefined();
  });
});