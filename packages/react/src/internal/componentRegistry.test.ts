import { describe, expect, it } from "vitest";

import { ComponentRegistry } from "./componentRegistry";
import type { ComponentNode } from "./component";

function createComponent(id: string): ComponentNode {
  return {
    id,
    rootId: "root",
    displayName: id,
    parentId: null,
    children: new Set(),
    status: "mounted",
    mountedAt: Date.now(),
    unmountedAt: null,
    renderCount: 1,
    lastRenderedAt: Date.now(),
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

    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: true });
    
    const component = registry.get("app");

    expect(component?.status).toBe("mounted");
    expect(component?.unmountedAt).toBeNull();
  });

it("updates structural fields without resetting mountedAt on repeated sync", () => {
    const registry = new ComponentRegistry();

    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: true });
    const firstMountedAt = registry.get("app")?.mountedAt;

    registry.sync({ id: "app", rootId: "root-1", displayName: "AppRenamed", parentId: null, rendered: true });

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
    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: true });

    expect(registry.get("app")?.renderCount).toBe(1);
    expect(registry.get("app")?.lastRenderedAt).not.toBeNull();
  });

  it("increments renderCount only when rendered is true", () => {
    const registry = new ComponentRegistry();
    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: true });

    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: false });
    expect(registry.get("app")?.renderCount).toBe(1);

    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null, rendered: true });
    expect(registry.get("app")?.renderCount).toBe(2);
  });

});
