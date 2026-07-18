import { describe, expect, it } from "vitest";

import { getFiberTraversalEntry } from "./fiberAdapter";

describe("getFiberTraversalEntry", () => {
  it("returns the current fiber from a FiberRoot-like object", () => {
    const fakeFiber = { type: null, child: null, sibling: null };
    const fakeRoot = { current: fakeFiber };

    expect(getFiberTraversalEntry(fakeRoot)).toBe(fakeFiber);
  });

  it("returns null for values that do not look like a FiberRoot", () => {
    expect(getFiberTraversalEntry(null)).toBeNull();
    expect(getFiberTraversalEntry(undefined)).toBeNull();
    expect(getFiberTraversalEntry({})).toBeNull();
  });
});