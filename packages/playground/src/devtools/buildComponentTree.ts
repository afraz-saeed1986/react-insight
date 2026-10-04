import type { ComponentSnapshot } from "@react-insight/react";

export interface ComponentTreeNode {
  readonly snapshot: ComponentSnapshot;
  readonly children: readonly ComponentTreeNode[];
}

export interface BuildComponentTreeOptions {
  /**
   * Whether unmounted components (kept by the registry for history)
   * appear in the tree. Defaults to true.
   */
  readonly includeUnmounted?: boolean;
}

interface MutableNode {
  snapshot: ComponentSnapshot;
  children: MutableNode[];
}

/**
 * Builds a parent/child tree from the flat getComponents() snapshot
 * list, using each snapshot's parentId.
 *
 * - Sibling order follows input order.
 * - A component becomes a root when its parentId is null, refers to a
 *   component that isn't in the (filtered) input, or refers to itself.
 *   This keeps every component visible instead of silently dropping
 *   nodes whose parent was filtered out.
 *
 * Pure function: no React, no Insight instance, never mutates input.
 */
export function buildComponentTree(
  snapshots: ReadonlyArray<ComponentSnapshot>,
  options: BuildComponentTreeOptions = {},
): readonly ComponentTreeNode[] {
  const includeUnmounted = options.includeUnmounted ?? true;

  const nodes = new Map<string, MutableNode>();

  for (const snapshot of snapshots) {
    if (!includeUnmounted && snapshot.status === "unmounted") continue;
    nodes.set(snapshot.id, { snapshot, children: [] });
  }

  const roots: MutableNode[] = [];

  for (const node of nodes.values()) {
    const { id, parentId } = node.snapshot;
    const parent =
      parentId !== null && parentId !== id ? nodes.get(parentId) : undefined;

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}