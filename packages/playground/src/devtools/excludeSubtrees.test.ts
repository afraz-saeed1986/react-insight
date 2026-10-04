import { describe, expect, it } from "vitest";
import type { ComponentSnapshot } from "@react-insight/react";

import { excludeSubtrees } from "./excludeSubtrees";

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

const ids = (list: ComponentSnapshot[]) => list.map((s) => s.id);
const isPanel = (s: ComponentSnapshot) => s.displayName === "panel";

describe("excludeSubtrees", () => {
  it("returns every snapshot when nothing matches", () => {
    const input = [snap("app", null), snap("a", "app")];

    expect(ids(excludeSubtrees(input, isPanel))).toEqual(["app", "a"]);
  });

  it("removes the matching root and all of its descendants", () => {
    const input = [
      snap("app", null),
      snap("panel", "app"),
      snap("tree", "panel"),
      snap("row", "tree"),
    ];

    expect(ids(excludeSubtrees(input, isPanel))).toEqual(["app"]);
  });

  it("keeps siblings and unrelated components", () => {
    const input = [
      snap("app", null),
      snap("counter", "app"),
      snap("panel", "app"),
      snap("tree", "panel"),
    ];

    expect(ids(excludeSubtrees(input, isPanel))).toEqual(["app", "counter"]);
  });

  it("does not remove ancestors of a match", () => {
    const input = [snap("root", null), snap("panel", "root")];

    expect(ids(excludeSubtrees(input, isPanel))).toEqual(["root"]);
  });

  it("terminates on a parentId cycle", () => {
    const input = [snap("a", "b"), snap("b", "a")];

    expect(ids(excludeSubtrees(input, isPanel))).toEqual(["a", "b"]);
  });
});