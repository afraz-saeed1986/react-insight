import { describe, expect, it } from "vitest";
import type { ComponentSnapshot } from "@react-insight/react";
import type { ComponentTreeNode } from "./buildComponentTree";
import { hideMinifiedNames } from "./hideMinifiedNames";

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

const ids = (nodes: readonly ComponentTreeNode[]): string[] =>
  nodes.map((n) => n.snapshot.id);

describe("hideMinifiedNames", () => {
  it("keeps nodes with normal names", () => {
    const tree = [node("1", "Router", [node("2", "Counter")])];
    const result = hideMinifiedNames(tree);
    expect(ids(result)).toEqual(["1"]);
    expect(ids(result[0]!.children)).toEqual(["2"]);
  });

  it("hides 1-2 character names including _ and $", () => {
    const tree = [
      node("1", "b"),
      node("2", "l_"),
      node("3", "eY"),
      node("4", "e$"),
      node("5", "Foo"),
    ];
    expect(ids(hideMinifiedNames(tree))).toEqual(["5"]);
  });

  it("promotes children of a hidden node to its position, in order", () => {
    const tree = [
      node("s1", "First"),
      node("x", "b", [node("a", "Alpha"), node("c", "Gamma")]),
      node("s2", "Last"),
    ];
    expect(ids(hideMinifiedNames(tree))).toEqual(["s1", "a", "c", "s2"]);
  });

  it("collapses a chain of hidden ancestors", () => {
    const tree = [node("1", "b", [node("2", "N", [node("3", "Counter")])])];
    expect(ids(hideMinifiedNames(tree))).toEqual(["3"]);
  });

  it("keeps nodes with an empty displayName", () => {
    expect(ids(hideMinifiedNames([node("1", "")]))).toEqual(["1"]);
  });

  it("does not mutate the input tree", () => {
    const tree = [node("1", "b", [node("2", "Counter")])];
    hideMinifiedNames(tree);
    expect(ids(tree)).toEqual(["1"]);
    expect(ids(tree[0]!.children)).toEqual(["2"]);
  });
});