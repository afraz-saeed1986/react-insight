import { describe, expect, it } from "vitest";
import type { ComponentSnapshot } from "@react-insight/react";

import { buildComponentTree } from "./buildComponentTree";
import { filterByMinRenders } from "./filterByMinRenders";

function snap(
  id: string,
  parentId: string | null,
  renderCount: number,
): ComponentSnapshot {
  return {
    id,
    displayName: id,
    parentId,
    status: "mounted",
    renderCount,
    mountedAt: 0,
    lastRenderedAt: 0,
    unmountedAt: null,
    hooks: [],
    contexts: [],
  };
}

// App(5) -> Counter(3) -> Display(3)
//        -> Greeting(1)
const tree = buildComponentTree([
  snap("App", null, 5),
  snap("Counter", "App", 3),
  snap("Display", "Counter", 3),
  snap("Greeting", "App", 1),
]);

describe("filterByMinRenders", () => {
  it("returns the same tree for a non-finite value or <= 1", () => {
    expect(filterByMinRenders(tree, Number.NaN)).toBe(tree);
    expect(filterByMinRenders(tree, 0)).toBe(tree);
    expect(filterByMinRenders(tree, 1)).toBe(tree);
  });

  it("drops components below the threshold", () => {
    const result = filterByMinRenders(tree, 3);

    expect(result[0]?.children.map((c) => c.snapshot.id)).toEqual(["Counter"]);
    expect(result[0]?.children[0]?.children.map((c) => c.snapshot.id)).toEqual([
      "Display",
    ]);
  });

  it("keeps a below-threshold ancestor of a qualifying node", () => {
    const hot = buildComponentTree([
      snap("Wrapper", null, 1),
      snap("Hot", "Wrapper", 10),
    ]);
    const result = filterByMinRenders(hot, 5);

    expect(result.map((n) => n.snapshot.id)).toEqual(["Wrapper"]);
    expect(result[0]?.children.map((c) => c.snapshot.id)).toEqual(["Hot"]);
  });

  it("drops sub-threshold children of a qualifying node", () => {
    const result = filterByMinRenders(tree, 5);

    expect(result.map((n) => n.snapshot.id)).toEqual(["App"]);
    expect(result[0]?.children).toEqual([]);
  });

  it("returns an empty array when nothing qualifies", () => {
    expect(filterByMinRenders(tree, 99)).toEqual([]);
  });

  it("does not mutate the input tree", () => {
    filterByMinRenders(tree, 5);

    expect(tree[0]?.children.map((c) => c.snapshot.id)).toEqual([
      "Counter",
      "Greeting",
    ]);
  });
});