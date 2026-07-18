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

    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null });

    const component = registry.get("app");

    expect(component?.status).toBe("mounted");
    expect(component?.unmountedAt).toBeNull();
  });

  it("updates structural fields without resetting mountedAt on repeated sync", () => {
    const registry = new ComponentRegistry();

    registry.sync({ id: "app", rootId: "root-1", displayName: "App", parentId: null });
    const firstMountedAt = registry.get("app")?.mountedAt;

    registry.sync({ id: "app", rootId: "root-1", displayName: "AppRenamed", parentId: null });

    expect(registry.get("app")?.displayName).toBe("AppRenamed");
    expect(registry.get("app")?.mountedAt).toBe(firstMountedAt);
  });
});
