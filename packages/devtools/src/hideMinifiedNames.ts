import type { ComponentTreeNode } from "./buildComponentTree";

/**
 * Heuristic: 1-2 character identifiers (`b`, `l_`, `eY`, `e$`) are
 * treated as names mangled by a minifier. Real components with very
 * short names (e.g. `UI`) match too, which is why callers expose this
 * as an opt-in filter.
 */
const MINIFIED_NAME = /^[A-Za-z_$][A-Za-z0-9_$]?$/;

/**
 * Hides nodes whose displayName looks minified. Children of a hidden
 * node are promoted to its position (in order), so the tree stays
 * connected. Empty names are kept (they render as "Anonymous").
 *
 * Pure function: never mutates the input tree.
 */
export function hideMinifiedNames(
  nodes: readonly ComponentTreeNode[],
): ComponentTreeNode[] {
  return nodes.flatMap(hideNode);
}

function hideNode(node: ComponentTreeNode): ComponentTreeNode[] {
  const children = hideMinifiedNames(node.children);

  if (MINIFIED_NAME.test(node.snapshot.displayName)) {
    return children;
  }

  return [{ snapshot: node.snapshot, children }];
}