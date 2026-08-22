import { describe, expect, it, vi } from "vitest";
import { ComponentRegistry } from "./componentRegistry";
import type { ComponentNode } from "./component";

// ComponentRegistry batches notify() via a microtask (see
// componentRegistry.ts) — flush() lets a test wait for any pending
// notification to actually fire before asserting on it.
function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

function createComponent(id: string): ComponentNode {
  return {
    id,
    rootId: "root",
    displayName: id,
    parentId: null,
    status: "mounted",
    mountedAt: Date.now(),
    unmountedAt: null,
    renderCount: 1,
    lastRenderedAt: Date.now(),
    hooks: [],
     contexts: [],
  };
}

describe("ComponentRegistry", () => {
  it("registers a component", () => {
    const registry = new ComponentRegistry();

    const component = createComponent("app");

    registry.register(component);

    expect(registry.size).toBe(1);
    expect(registry.get("app")).toBe(component);
  });

  it("throws when registering the same component twice", () => {
    const registry = new ComponentRegistry();

    const component = createComponent("app");

    registry.register(component);

    expect(() => registry.register(component)).toThrow();
  });

  it("unregisters a component", () => {
    const registry = new ComponentRegistry();

    registry.register(createComponent("app"));

    expect(registry.unregister("app")).toBe(true);

    expect(registry.size).toBe(0);
  });

  it("clears the registry", () => {
    const registry = new ComponentRegistry();

    registry.register(createComponent("a"));
    registry.register(createComponent("b"));

    registry.clear();

    expect(registry.size).toBe(0);
  });

  it("registers a new component on first sync", () => {
    const registry = new ComponentRegistry();

    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: true , hooks: [], contexts: []});
    
    const component = registry.get("app");

    expect(component?.status).toBe("mounted");
    expect(component?.unmountedAt).toBeNull();
  });

it("updates structural fields without resetting mountedAt on repeated sync", () => {
    const registry = new ComponentRegistry();

    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: true , hooks: [], contexts: []});
    const firstMountedAt = registry.get("app")?.mountedAt;

    registry.sync({ id: "app", rootId: "root-1", displayName: "AppRenamed", parentId: null, rendered: true, hooks: [], contexts: [] });

    expect(registry.get("app")?.displayName).toBe("AppRenamed");
    expect(registry.get("app")?.mountedAt).toBe(firstMountedAt);
  });

  it("marks a component as unmounted without removing it", () => {
    const registry = new ComponentRegistry();

    registry.register(createComponent("app"));

    expect(registry.markUnmounted("app")).toBe(true);

    const component = registry.get("app");
    expect(component?.status).toBe("unmounted");
    expect(component?.unmountedAt).not.toBeNull();
    expect(registry.size).toBe(1);
  });

  it("returns false when marking an untracked component as unmounted", () => {
    const registry = new ComponentRegistry();

    expect(registry.markUnmounted("missing")).toBe(false);
  });

  it("returns false when marking an already-unmounted component again", () => {
    const registry = new ComponentRegistry();

    registry.register(createComponent("app"));
    registry.markUnmounted("app");

    expect(registry.markUnmounted("app")).toBe(false);
  });

  it("counts the mount itself as the first render", () => {
    const registry = new ComponentRegistry();
    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: true , hooks: [], contexts: []});

    expect(registry.get("app")?.renderCount).toBe(1);
    expect(registry.get("app")?.lastRenderedAt).not.toBeNull();
  });

it("increments renderCount only when rendered is true", () => {
    const registry = new ComponentRegistry();
    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: true , hooks: [], contexts: []});

    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: false, hooks: [], contexts: [] });
    expect(registry.get("app")?.renderCount).toBe(1);

    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: true, hooks: [] , contexts: []});
    expect(registry.get("app")?.renderCount).toBe(2);
  });

  it("notifies subscribers when sync() mounts a new component", async () => {
    const registry = new ComponentRegistry();
    const listener = vi.fn();
    registry.subscribe(listener);

    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: true, hooks: [], contexts: [] });
    await flush();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith();
  });

  it("notifies subscribers when sync() updates an existing component", async () => {
    const registry = new ComponentRegistry();
    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: true, hooks: [], contexts: [] });
    await flush();

    const listener = vi.fn();
    registry.subscribe(listener);

    registry.sync({ id: "app", rootId: "root-1", displayName: "AppRenamed", parentId: null, rendered: false, hooks: [], contexts: [] });
    await flush();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("notifies subscribers when markUnmounted() actually mutates state", async () => {
    const registry = new ComponentRegistry();
    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: true, hooks: [], contexts: [] });
    await flush();

    const listener = vi.fn();
    registry.subscribe(listener);

    registry.markUnmounted("app");
    await flush();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("collapses multiple sync() calls within the same tick into a single notification", async () => {
    // This is the exact scenario that caused a real feedback-loop bug
    // in Playground: componentDiscoveryPlugin calls sync() once per
    // discovered component within a single commit. Without batching,
    // one commit touching N components fired N notifications.
    const registry = new ComponentRegistry();
    const listener = vi.fn();
    registry.subscribe(listener);

    registry.sync({ id: "a", rootId: "root-1", displayName: "A", parentId: null, rendered: true, hooks: [], contexts: [] });
    registry.sync({ id: "b", rootId: "root-1", displayName: "B", parentId: null, rendered: true, hooks: [], contexts: [] });
    registry.sync({ id: "c", rootId: "root-1", displayName: "C", parentId: null, rendered: true, hooks: [], contexts: [] });
    await flush();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("does not notify subscribers when sync() reports no render and nothing structural changed", async () => {
    const registry = new ComponentRegistry();
    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: true, hooks: [], contexts: [] });
    await flush();

    const listener = vi.fn();
    registry.subscribe(listener);

    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: false, hooks: [], contexts: [] });
    await flush();

    expect(listener).not.toHaveBeenCalled();
  });

  it("still notifies when rendered is true even if structural fields are unchanged", async () => {
    const registry = new ComponentRegistry();
    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: true, hooks: [], contexts: [] });
    await flush();

    const listener = vi.fn();
    registry.subscribe(listener);

    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: true, hooks: [], contexts: [] });
    await flush();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("notifies when only hooks/contexts differ, even if rendered is false", async () => {
    const registry = new ComponentRegistry();
    registry.sync({
      id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: true,
      hooks: [{ index: 0, kind: "state", value: 0 }], contexts: [],
    });
    await flush();

    const listener = vi.fn();
    registry.subscribe(listener);

    registry.sync({
      id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: false,
      hooks: [{ index: 0, kind: "state", value: 1 }], contexts: [],
    });
    await flush();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("does not notify subscribers on a no-op markUnmounted() call", async () => {
    const registry = new ComponentRegistry();
    const listener = vi.fn();
    registry.subscribe(listener);

    // Unknown id — no-op.
    registry.markUnmounted("does-not-exist");
    await flush();
    expect(listener).not.toHaveBeenCalled();

    // Already unmounted — no-op.
    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: true, hooks: [], contexts: [] });
    registry.markUnmounted("app");
    await flush();
    listener.mockClear();

    registry.markUnmounted("app");
    await flush();
    expect(listener).not.toHaveBeenCalled();
  });

  it("stops notifying after unsubscribe", async () => {
    const registry = new ComponentRegistry();
    const listener = vi.fn();
    const unsubscribe = registry.subscribe(listener);

    unsubscribe();

    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: true, hooks: [], contexts: [] });
    await flush();

    expect(listener).not.toHaveBeenCalled();
  });

  it("supports multiple independent subscribers", async () => {
    const registry = new ComponentRegistry();
    const listenerA = vi.fn();
    const listenerB = vi.fn();

    registry.subscribe(listenerA);
    const unsubscribeB = registry.subscribe(listenerB);
    unsubscribeB();

    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: true, hooks: [], contexts: [] });
    await flush();

    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).not.toHaveBeenCalled();
  });

});

