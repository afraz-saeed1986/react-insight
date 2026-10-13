import type { ComponentTreeNode } from "./buildComponentTree";

export interface ComponentFocus {
  readonly node: ComponentTreeNode;
  /** Display names of the ancestors, root first. Excludes the node itself. */
  readonly ancestors: readonly string[];
}

/**
 * Finds the node with the given id and the names of its ancestors.
 * Returns undefined when the id is not present in the tree.
 *
 * Pure function: never mutates the input tree.
 */
export function focusComponentTree(
  nodes: readonly ComponentTreeNode[],
  id: string,
): ComponentFocus | undefined {
  return search(nodes, id, []);
}

function search(
  nodes: readonly ComponentTreeNode[],
  id: string,
  path: readonly string[],
): ComponentFocus | undefined {
  for (const node of nodes) {
    if (node.snapshot.id === id) {
      return { node, ancestors: path };
    }

    const found = search(node.children, id, [
      ...path,
      node.snapshot.displayName === "" ? "Anonymous" : node.snapshot.displayName,
    ]);

    if (found !== undefined) return found;
  }

  return undefined;
}