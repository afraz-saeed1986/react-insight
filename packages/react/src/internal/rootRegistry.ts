import type { InternalRoot } from "./root";

/**
 * Stores active React roots.
 *
 * This registry is an internal data structure and is
 * intentionally independent from React and Runtime.
 */
export class RootRegistry {
  private readonly roots = new Map<symbol, InternalRoot>();

  register(root: InternalRoot): void {
    if (this.roots.has(root.id)) {
      throw new Error(`Root "${String(root.id)}" is already registered.`);
    }

    this.roots.set(root.id, root);
  }

  unregister(id: symbol): void {
    this.roots.delete(id);
  }

  /**
   * Records a commit for a registered root, incrementing commitCount
   * and updating lastCommittedAt.
   *
   * Returns false (no-op) if the root is not currently registered.
   */
  recordCommit(id: symbol): boolean {
    const existing = this.roots.get(id);

    if (!existing) {
      return false;
    }

    this.roots.set(id, {
      ...existing,
      commitCount: existing.commitCount + 1,
      lastCommittedAt: Date.now(),
    });

    return true;
  }

  get(id: symbol): InternalRoot | undefined {
    return this.roots.get(id);
  }

  has(id: symbol): boolean {
    return this.roots.has(id);
  }

  list(): ReadonlyArray<InternalRoot> {
    return [...this.roots.values()];
  }

  clear(): void {
    this.roots.clear();
  }

  get size(): number {
    return this.roots.size;
  }
}
