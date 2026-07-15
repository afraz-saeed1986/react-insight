import type { ComponentId, ComponentNode } from "./component";

export class ComponentRegistry {
  private readonly components = new Map<ComponentId, ComponentNode>();

  register(component: ComponentNode): void {
    if (this.components.has(component.id)) {
      throw new Error(`Component "${component.id}" is already registered.`);
    }

    this.components.set(component.id, component);
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
