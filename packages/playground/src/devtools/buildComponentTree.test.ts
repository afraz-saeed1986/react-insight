import { describe, expect, it } from "vitest";
import type { ComponentSnapshot } from "@react-insight/react";

import { buildComponentTree } from "./buildComponentTree";

function snap(
  id: string,
  parentId: string | null,
  overrides: Partial<ComponentSnapshot> = {},
): ComponentSnapshot {
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
    ...overrides,
  };
}

describe("buildComponentTree", () => {
  it("returns an empty array for no snapshots", () => {
    expect(buildComponentTree([])).toEqual([]);
  });

  it("nests children under their parent and preserves sibling order", () => {
    const tree = buildComponentTree([
      snap("app", null),
      snap("b", "app"),
      snap("a", "app"),
      snap("leaf", "a"),
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.children.map((c) => c.snapshot.id)).toEqual(["b", "a"]);
    expect(tree[0]?.children[1]?.children.map((c) => c.snapshot.id)).toEqual([
      "leaf",
    ]);
  });

  it("supports multiple roots", () => {
    const tree = buildComponentTree([snap("r1", null), snap("r2", null)]);

    expect(tree.map((n) => n.snapshot.id)).toEqual(["r1", "r2"]);
  });

  it("treats a component whose parent is not in the input as a root", () => {
    const tree = buildComponentTree([snap("child", "missing")]);

    expect(tree.map((n) => n.snapshot.id)).toEqual(["child"]);
  });

  it("treats a self-referencing parentId as a root", () => {
    const tree = buildComponentTree([snap("x", "x")]);

    expect(tree.map((n) => n.snapshot.id)).toEqual(["x"]);
  });

  it("includes unmounted components by default", () => {
    const tree = buildComponentTree([
      snap("app", null),
      snap("gone", "app", { status: "unmounted", unmountedAt: 5 }),
    ]);

    expect(tree[0]?.children.map((c) => c.snapshot.id)).toEqual(["gone"]);
  });

  it("omits unmounted components when includeUnmounted is false", () => {
    const tree = buildComponentTree(
      [
        snap("app", null),
        snap("gone", "app", { status: "unmounted", unmountedAt: 5 }),
      ],
      { includeUnmounted: false },
    );

    expect(tree[0]?.children).toEqual([]);
  });

  it("promotes children of an omitted parent to roots", () => {
    const tree = buildComponentTree(
      [
        snap("gone", null, { status: "unmounted", unmountedAt: 5 }),
        snap("orphan", "gone"),
      ],
      { includeUnmounted: false },
    );

    expect(tree.map((n) => n.snapshot.id)).toEqual(["orphan"]);
  });

  it("does not mutate the input snapshots", () => {
    const input = Object.freeze([snap("app", null), snap("b", "app")]);

    expect(() => buildComponentTree(input)).not.toThrow();
  });
});