import { describe, expect, it } from "vitest";

import { describeRenderReasons } from "./describeRenderReasons";

const label = (index: number): string => `#${index} useState`;

describe("describeRenderReasons", () => {
  it("describes the first render", () => {
    expect(describeRenderReasons([{ type: "mount" }], label)).toEqual(["First render"]);
  });

  it("lists changed prop names", () => {
    expect(describeRenderReasons([{ type: "props", keys: ["a", "b"] }], label)).toEqual([
      "Props changed: a, b",
    ]);
  });

  it("names changed state hooks through the label function", () => {
    expect(describeRenderReasons([{ type: "state", hookIndices: [0, 2] }], label)).toEqual([
      "State changed: #0 useState, #2 useState",
    ]);
  });

  it("lists changed context names", () => {
    expect(describeRenderReasons([{ type: "context", names: ["Theme", "User"] }], label)).toEqual([
      "Context changed: Theme, User",
    ]);
  });

  it("describes parent and unknown reasons", () => {
    expect(describeRenderReasons([{ type: "parent" }], label)[0]).toContain("Parent re-rendered");
    expect(describeRenderReasons([{ type: "unknown" }], label)).toEqual(["No cause detected"]);
  });

  it("keeps the order of several reasons", () => {
    expect(
      describeRenderReasons(
        [
          { type: "props", keys: ["a"] },
          { type: "context", names: ["Theme"] },
        ],
        label,
      ),
    ).toEqual(["Props changed: a", "Context changed: Theme"]);
  });
});