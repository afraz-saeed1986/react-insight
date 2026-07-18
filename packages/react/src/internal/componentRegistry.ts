import type { ComponentId, ComponentNode } from "./component";
export type ComponentSyncInput = Pick<
  ComponentNode,
  "id" | "rootId" | "displayName" | "parentId"
>;

export class ComponentRegistry {
  private readonly components = new Map<ComponentId, ComponentNode>();

  register(component: ComponentNode): void {
    if (this.components.has(component.id)) {
      throw new Error(`Component "${component.id}" is already registered.`);
    }

    this.components.set(component.id, component);
  }

  /**
   * Synchronizes a discovered component with the registry.
   *
   * Unlike register(), this never throws on an existing id — it decides
   * mount vs. update by checking existing state, since ComponentRegistry
   * is the sole owner of lifecycle state (Principle 8, Domain Ownership).
   */
  sync(input: ComponentSyncInput): void {
    const existing = this.components.get(input.id);

    if (existing) {
      this.components.set(input.id, {
        ...existing,
        rootId: input.rootId,
        displayName: input.displayName,
        parentId: input.parentId,
      });
      return;
    }

    this.components.set(input.id, {
      ...input,
      children: new Set(),
      status: "mounted",
      mountedAt: Date.now(),
      unmountedAt: null,
    });
  }

  unregister(id: ComponentId): boolean {
    return this.components.delete(id);
  }

  has(id: ComponentId): boolean {
    return this.components.has(id);
  }

  get(id: ComponentId): ComponentNode | undefined {
    return this.components.get(id);
  }

  values(): IterableIterator<ComponentNode> {
    return this.components.values();
  }

  clear(): void {
    this.components.clear();
  }

  get size(): number {
    return this.components.size;
  }
}
