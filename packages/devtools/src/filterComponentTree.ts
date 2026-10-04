import type { ComponentTreeNode } from "./buildComponentTree";

/**
 * Filters a component tree by a case-insensitive substring of
 * displayName.
 *
 * - A node whose own name matches is kept together with its full
 *   subtree (so searching "Counter" still shows what's under it).
 * - A node that doesn't match is kept only as an ancestor of a match,
 *   with just the matching branches beneath it.
 * - An empty / whitespace-only query returns the input unchanged.
 *
 * Pure function: never mutates the input tree.
 */
export function filterComponentTree(
  nodes: readonly ComponentTreeNode[],
  query: string,
): readonly ComponentTreeNode[] {
  const needle = query.trim().toLowerCase();

  if (needle === "") return nodes;

  return filterNodes(nodes, needle);
}

function filterNodes(
  nodes: readonly ComponentTreeNode[],
  needle: string,
): ComponentTreeNode[] {
  const result: ComponentTreeNode[] = [];

  for (const node of nodes) {
    if (node.snapshot.displayName.toLowerCase().includes(needle)) {
      result.push(node);
      continue;
    }

    const children = filterNodes(node.children, needle);

    if (children.length > 0) {
      result.push({ snapshot: node.snapshot, children });
    }
  }

  return result;
}