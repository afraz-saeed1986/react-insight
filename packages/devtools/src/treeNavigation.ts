interface TreeNodeLike {
  readonly snapshot: { readonly id: string };
  readonly children: readonly TreeNodeLike[];
}

export interface VisibleTreeItem {
  readonly id: string;
  readonly parentId: string | null;
  readonly level: number;
  readonly hasChildren: boolean;
  readonly collapsed: boolean;
}

export type TreeKeyAction =
  | { readonly type: "focus"; readonly id: string }
  | { readonly type: "expand"; readonly id: string }
  | { readonly type: "collapse"; readonly id: string };

/**
 * Flattens the tree into the order the rows are shown, skipping the
 * descendants of collapsed nodes. Levels start at 1 (aria-level).
 */
export function flattenVisibleTree(
  nodes: readonly TreeNodeLike[],
  collapsedIds: ReadonlySet<string>,
): VisibleTreeItem[] {
  const items: VisibleTreeItem[] = [];

  const visit = (
    list: readonly TreeNodeLike[],
    parentId: string | null,
    level: number,
  ) => {
    for (const node of list) {
      const id = node.snapshot.id;
      const hasChildren = node.children.length > 0;
      const collapsed = hasChildren && collapsedIds.has(id);

      items.push({ id, parentId, level, hasChildren, collapsed });

      if (hasChildren && !collapsed) visit(node.children, id, level + 1);
    }
  };

  visit(nodes, null, 1);
  return items;
}

/**
 * Maps a key press on `currentId` to a tree action (WAI-ARIA tree pattern).
 * Returns null when the key does nothing. Moving focus never selects.
 */
export function resolveTreeKey(
  items: readonly VisibleTreeItem[],
  currentId: string,
  key: string,
): TreeKeyAction | null {
  const index = items.findIndex((item) => item.id === currentId);
  const current = items[index];
  if (current === undefined) return null;

  const focusAt = (target: VisibleTreeItem | undefined): TreeKeyAction | null =>
    target === undefined ? null : { type: "focus", id: target.id };

  switch (key) {
    case "ArrowDown":
      return focusAt(items[index + 1]);
    case "ArrowUp":
      return focusAt(items[index - 1]);
    case "Home":
      return focusAt(items[0]);
    case "End":
      return focusAt(items[items.length - 1]);
    case "ArrowRight":
      if (!current.hasChildren) return null;
      // An expanded parent is followed by its first child in visible order.
      return current.collapsed
        ? { type: "expand", id: current.id }
        : focusAt(items[index + 1]);
    case "ArrowLeft":
      if (current.hasChildren && !current.collapsed) {
        return { type: "collapse", id: current.id };
      }
      return current.parentId === null
        ? null
        : { type: "focus", id: current.parentId };
    default:
      return null;
  }
}