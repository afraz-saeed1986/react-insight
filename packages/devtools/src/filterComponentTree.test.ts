import { describe, expect, it } from "vitest";
import type { ComponentSnapshot } from "@react-insight/react";

import { buildComponentTree } from "./buildComponentTree";
import { filterComponentTree } from "./filterComponentTree";

function snap(id: string, parentId: string | null): ComponentSnapshot {
  return {
    id,
    displayName: id,
    parentId,
    status: "mounted",
    renderCount: 1,
    mountedAt: 0,
    lastRenderedAt: 0,
    unmountedAt: null,
    hooks: [],
    contexts: [],
  };
}

// App -> Counter -> Display
//     -> Greeting
const tree = buildComponentTree([
  snap("App", null),
  snap("Counter", "App"),
  snap("Display", "Counter"),
  snap("Greeting", "App"),
]);

describe("filterComponentTree", () => {
  it("returns the same tree for an empty or whitespace query", () => {
    expect(filterComponentTree(tree, "")).toBe(tree);
    expect(filterComponentTree(tree, "   ")).toBe(tree);
  });

  it("matches displayName case-insensitively by substring", () => {
    const result = filterComponentTree(tree, "GREET");

    expect(result[0]?.children.map((c) => c.snapshot.id)).toEqual(["Greeting"]);
  });

  it("keeps ancestors of a deep match and drops non-matching siblings", () => {
    const result = filterComponentTree(tree, "display");

    expect(result.map((n) => n.snapshot.id)).toEqual(["App"]);
    expect(result[0]?.children.map((c) => c.snapshot.id)).toEqual(["Counter"]);
    expect(result[0]?.children[0]?.children.map((c) => c.snapshot.id)).toEqual([
      "Display",
    ]);
  });

  it("keeps the full subtree of a matching node", () => {
    const result = filterComponentTree(tree, "counter");
    const counter = result[0]?.children[0];

    expect(counter?.snapshot.id).toBe("Counter");
    expect(counter?.children.map((c) => c.snapshot.id)).toEqual(["Display"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterComponentTree(tree, "zzz")).toEqual([]);
  });

  it("does not mutate the input tree", () => {
    filterComponentTree(tree, "display");

    expect(tree[0]?.children.map((c) => c.snapshot.id)).toEqual([
      "Counter",
      "Greeting",
    ]);
  });
});