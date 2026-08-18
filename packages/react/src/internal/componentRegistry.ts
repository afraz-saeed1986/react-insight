import type { ComponentId, ComponentNode } from "./component";
export type ComponentSyncInput = Pick<
  ComponentNode,
  "id" | "rootId" | "displayName" | "parentId"
> & {
  readonly rendered: boolean;
} & Pick<ComponentNode, "hooks" | "contexts">;



export class ComponentRegistry {
  private readonly components = new Map<ComponentId, ComponentNode>();

  private readonly listeners = new Set<() => void>();

  /**
   * Subscribes to changes in this registry's tracked components.
   *
   * The listener is called (with no arguments) after any call to
   * sync() or markUnmounted() that actually mutates state — never on
   * a no-op markUnmounted() call for an already-unmounted or unknown
   * id. Callers are expected to re-read current state via values()
   * (or, at the public API boundary, Insight.getComponents()) rather
   * than receiving a diff or payload.
   *
   * Returns an unsubscribe function.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

 private pendingNotify = false;

  /**
   * Batches notify() so that many sync()/markUnmounted() calls within
   * the same synchronous commit-processing loop (see
   * componentDiscoveryPlugin's onCommit, which calls sync() once per
   * discovered component) collapse into a single notification, rather
   * than firing once per component. Deferred via a microtask so it
   * still runs before the next paint / effect flush.
   */
  private scheduleNotify(): void {
    if (this.pendingNotify) return;
    this.pendingNotify = true;

    queueMicrotask(() => {
      this.pendingNotify = false;
      this.notify();
    });
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

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
        hooks: structural.hooks,
        contexts: structural.contexts,
        renderCount: rendered ? existing.renderCount + 1 : existing.renderCount,
        lastRenderedAt: rendered ? Date.now() : existing.lastRenderedAt,
      });
      this.scheduleNotify();
      return;
    }

    this.components.set(input.id, {
      ...structural,
      status: "mounted",
      mountedAt: Date.now(),
      unmountedAt: null,
      renderCount: 1,
      lastRenderedAt: Date.now(),
    });
    this.scheduleNotify();
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

   this.scheduleNotify();

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