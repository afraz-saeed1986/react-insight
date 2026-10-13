import { describe, expect, it } from "vitest";
import type { ComponentSnapshot } from "@react-insight/react";
import type { ComponentTreeNode } from "./buildComponentTree";
import { focusComponentTree } from "./focusComponentTree";

function node(
  id: string,
  displayName: string,
  children: ComponentTreeNode[] = [],
): ComponentTreeNode {
  return {
    snapshot: { id, displayName } as unknown as ComponentSnapshot,
    children,
  };
}

describe("focusComponentTree", () => {
  const tree = [
    node("1", "Root", [
      node("2", "Layout", [node("3", "Counter")]),
      node("4", "Sidebar"),
    ]),
  ];

  it("finds a nested node with its ancestor names, root first", () => {
    const result = focusComponentTree(tree, "3");
    expect(result?.node.snapshot.id).toBe("3");
    expect(result?.ancestors).toEqual(["Root", "Layout"]);
  });

  it("returns no ancestors for a root node", () => {
    const result = focusComponentTree(tree, "1");
    expect(result?.ancestors).toEqual([]);
  });

  it("returns the node together with its whole subtree", () => {
    const result = focusComponentTree(tree, "2");
    expect(result?.node.children.map((c) => c.snapshot.id)).toEqual(["3"]);
  });

  it("returns undefined when the id is not in the tree", () => {
    expect(focusComponentTree(tree, "missing")).toBeUndefined();
  });

  it("labels an empty displayName as Anonymous in the ancestors", () => {
    const anon = [node("1", "", [node("2", "Child")])];
    expect(focusComponentTree(anon, "2")?.ancestors).toEqual(["Anonymous"]);
  });
});