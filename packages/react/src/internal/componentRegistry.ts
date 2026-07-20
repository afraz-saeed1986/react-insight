import type { ComponentId, ComponentNode } from "./component";
export type ComponentSyncInput = Pick<
  ComponentNode,
  "id" | "rootId" | "displayName" | "parentId"
> & {
  /**
   * Whether this sync corresponds to React actually rendering the
   * component in this commit (vs. merely being present in the tree).
   * Only affects renderCount / lastRenderedAt, never structural fields.
   */
  readonly rendered: boolean;
};

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
    const { rendered, ...structural } = input;
    const existing = this.components.get(input.id);

    if (existing) {
      this.components.set(input.id, {
        ...existing,
        rootId: structural.rootId,
        displayName: structural.displayName,
        parentId: structural.parentId,
        renderCount: rendered ? existing.renderCount + 1 : existing.renderCount,
        lastRenderedAt: rendered ? Date.now() : existing.lastRenderedAt,
      });
      return;
    }

    this.components.set(input.id, {
      ...structural,
      children: new Set(),
      status: "mounted",
      mountedAt: Date.now(),
      unmountedAt: null,
      renderCount: 1,
      lastRenderedAt: Date.now(),
    });
  }

  unregister(id: ComponentId): boolean {
    return this.components.delete(id);
  }

  /**
   * Marks a tracked component as unmounted without removing it from
   * the registry.
   *
   * Preserves component history (status, unmountedAt) for future
   * consumers such as Timeline / Inspector, rather than discarding
   * the record the way unregister() does.
   *
   * No-op (returns false) if the component is not currently tracked,
   * or is already unmounted.
   */
  markUnmounted(id: ComponentId): boolean {
    const existing = this.components.get(id);

    if (!existing || existing.status === "unmounted") {
      return false;
    }

    this.components.set(id, {
      ...existing,
      status: "unmounted",
      unmountedAt: Date.now(),
    });

    return true;
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
