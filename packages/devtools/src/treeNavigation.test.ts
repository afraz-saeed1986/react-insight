import { describe, expect, it } from "vitest";

import { flattenVisibleTree, resolveTreeKey } from "./treeNavigation";

interface TestNode {
  readonly snapshot: { readonly id: string };
  readonly children: readonly TestNode[];
}

function node(id: string, children: readonly TestNode[] = []): TestNode {
  return { snapshot: { id }, children };
}

// a
// ├─ b
// │  └─ c
// └─ d
// e
const tree = [node("a", [node("b", [node("c")]), node("d")]), node("e")];
const none = new Set<string>();

describe("flattenVisibleTree", () => {
  it("lists nodes in visible order with levels and parents", () => {
    const items = flattenVisibleTree(tree, none);

    expect(items.map((i) => i.id)).toEqual(["a", "b", "c", "d", "e"]);
    expect(items.map((i) => i.level)).toEqual([1, 2, 3, 2, 1]);
    expect(items.map((i) => i.parentId)).toEqual([null, "a", "b", "a", null]);
  });

  it("skips the descendants of a collapsed node and marks it collapsed", () => {
    const items = flattenVisibleTree(tree, new Set(["a"]));

    expect(items.map((i) => i.id)).toEqual(["a", "e"]);
    expect(items[0]).toMatchObject({ hasChildren: true, collapsed: true });
  });

  it("collapses only the given subtree", () => {
    const items = flattenVisibleTree(tree, new Set(["b"]));

    expect(items.map((i) => i.id)).toEqual(["a", "b", "d", "e"]);
  });

  it("never marks a leaf as collapsed, even if its id is in the set", () => {
    const items = flattenVisibleTree(tree, new Set(["e"]));

    expect(items.find((i) => i.id === "e")).toMatchObject({
      hasChildren: false,
      collapsed: false,
    });
  });
});

describe("resolveTreeKey", () => {
  const items = flattenVisibleTree(tree, none);

  it("ArrowDown focuses the next visible item and stops at the end", () => {
    expect(resolveTreeKey(items, "a", "ArrowDown")).toEqual({ type: "focus", id: "b" });
    expect(resolveTreeKey(items, "e", "ArrowDown")).toBeNull();
  });

  it("ArrowDown skips the hidden children of a collapsed node", () => {
    const collapsed = flattenVisibleTree(tree, new Set(["a"]));

    expect(resolveTreeKey(collapsed, "a", "ArrowDown")).toEqual({ type: "focus", id: "e" });
  });

  it("ArrowUp focuses the previous visible item and stops at the start", () => {
    expect(resolveTreeKey(items, "d", "ArrowUp")).toEqual({ type: "focus", id: "c" });
    expect(resolveTreeKey(items, "a", "ArrowUp")).toBeNull();
  });

  it("Home and End focus the first and last visible items", () => {
    expect(resolveTreeKey(items, "d", "Home")).toEqual({ type: "focus", id: "a" });
    expect(resolveTreeKey(items, "a", "End")).toEqual({ type: "focus", id: "e" });
  });

  it("ArrowRight expands a collapsed parent", () => {
    const collapsed = flattenVisibleTree(tree, new Set(["a"]));

    expect(resolveTreeKey(collapsed, "a", "ArrowRight")).toEqual({ type: "expand", id: "a" });
  });

  it("ArrowRight on an expanded parent focuses its first child", () => {
    expect(resolveTreeKey(items, "a", "ArrowRight")).toEqual({ type: "focus", id: "b" });
  });

  it("ArrowRight on a leaf does nothing", () => {
    expect(resolveTreeKey(items, "c", "ArrowRight")).toBeNull();
  });

  it("ArrowLeft collapses an expanded parent", () => {
    expect(resolveTreeKey(items, "b", "ArrowLeft")).toEqual({ type: "collapse", id: "b" });
  });

  it("ArrowLeft on a leaf or a collapsed child focuses its parent", () => {
    expect(resolveTreeKey(items, "d", "ArrowLeft")).toEqual({ type: "focus", id: "a" });

    const collapsed = flattenVisibleTree(tree, new Set(["b"]));
    expect(resolveTreeKey(collapsed, "b", "ArrowLeft")).toEqual({ type: "focus", id: "a" });
  });

  it("ArrowLeft on a root without an open subtree does nothing", () => {
    expect(resolveTreeKey(items, "e", "ArrowLeft")).toBeNull();

    const collapsed = flattenVisibleTree(tree, new Set(["a"]));
    expect(resolveTreeKey(collapsed, "a", "ArrowLeft")).toBeNull();
  });

  it("ignores other keys and unknown ids", () => {
    expect(resolveTreeKey(items, "a", "Enter")).toBeNull();
    expect(resolveTreeKey(items, "a", "x")).toBeNull();
    expect(resolveTreeKey(items, "missing", "ArrowDown")).toBeNull();
  });
});