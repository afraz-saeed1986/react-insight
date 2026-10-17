import { describe, expect, it } from "vitest";
import type { ComponentSnapshot } from "@react-insight/react";
import type { ComponentTreeNode } from "./buildComponentTree";
import { hideByName, parseNamePatterns } from "./hideByName";
import { NEXTJS_INTERNAL_NAMES } from "./presets";

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

describe("parseNamePatterns", () => {
  it("splits on commas, trims, and drops empty entries", () => {
    expect(parseNamePatterns(" Foo, Bar* ,, ")).toEqual(["Foo", "Bar*"]);
  });
});

describe("hideByName", () => {
  it("returns the input unchanged when there are no patterns", () => {
    const tree = [node("1", "Foo")];
    expect(hideByName(tree, [])).toBe(tree);
  });

  it("hides exact matches and promotes their children in order", () => {
    const tree = [
      node("s1", "First"),
      node("x", "Wrapper", [node("a", "Alpha"), node("c", "Gamma")]),
      node("s2", "Last"),
    ];
    expect(ids(hideByName(tree, ["Wrapper"]))).toEqual(["s1", "a", "c", "s2"]);
  });

  it("supports a trailing wildcard", () => {
    const tree = [
      node("1", "__next_viewport_boundary__"),
      node("2", "__next_metadata_boundary__"),
      node("3", "Counter"),
    ];
    expect(ids(hideByName(tree, ["__next_*"]))).toEqual(["3"]);
  });

  it("supports a wildcard in the middle", () => {
    const tree = [node("1", "FooBarBaz"), node("2", "FooBaz")];
    expect(ids(hideByName(tree, ["Foo*Baz"]))).toEqual([]);
  });

  it("is case-sensitive", () => {
    const tree = [node("1", "Foo"), node("2", "foo")];
    expect(ids(hideByName(tree, ["Foo"]))).toEqual(["2"]);
  });

  it("matches the whole name, not a substring", () => {
    const tree = [node("1", "Foo"), node("2", "FooBar")];
    expect(ids(hideByName(tree, ["Foo"]))).toEqual(["2"]);
  });

  it("treats regex special characters literally", () => {
    const tree = [node("1", "A.B"), node("2", "AxB")];
    expect(ids(hideByName(tree, ["A.B"]))).toEqual(["2"]);
  });

  it("does not mutate the input tree", () => {
    const tree = [node("1", "Wrapper", [node("2", "Counter")])];
    hideByName(tree, ["Wrapper"]);
    expect(ids(tree)).toEqual(["1"]);
    expect(ids(tree[0]!.children)).toEqual(["2"]);
  });
});

describe("NEXTJS_INTERNAL_NAMES", () => {
  it("does not include generic names a user component could share", () => {
    for (const generic of ["Root", "Router", "Head", "ErrorBoundary"]) {
      expect(NEXTJS_INTERNAL_NAMES).not.toContain(generic);
    }
  });
});