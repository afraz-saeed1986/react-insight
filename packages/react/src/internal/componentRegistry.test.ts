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
});
