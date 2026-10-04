import type { ComponentTreeNode } from "./buildComponentTree";

/**
 * Keeps only components whose renderCount is at least `minRenders`.
 *
 * - A node below the threshold is kept only as an ancestor of a
 *   qualifying node, so the path through the tree stays intact.
 * - Children of a qualifying node are filtered too: sub-threshold
 *   children are dropped (the point is to surface hot components).
 * - A non-finite value or one <= 1 returns the input unchanged, since
 *   every tracked component has rendered at least once.
 *
 * Pure function: never mutates the input tree.
 */
export function filterByMinRenders(
  nodes: readonly ComponentTreeNode[],
  minRenders: number,
): readonly ComponentTreeNode[] {
  if (!Number.isFinite(minRenders) || minRenders <= 1) return nodes;

  return filterNodes(nodes, minRenders);
}

function filterNodes(
  nodes: readonly ComponentTreeNode[],
  minRenders: number,
): ComponentTreeNode[] {
  const result: ComponentTreeNode[] = [];

  for (const node of nodes) {
    const children = filterNodes(node.children, minRenders);

    if (node.snapshot.renderCount >= minRenders || children.length > 0) {
      result.push({ snapshot: node.snapshot, children });
    }
  }

  return result;
}