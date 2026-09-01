import { describe, expect, it } from "vitest";

import type { FiberNode } from "./fiberAdapter";
import { deleteFiberHandle, getFiberHandle, setFiberHandle } from "./fiberHandleRegistry";

function fiber(type: unknown): FiberNode {
  return { type, child: null, sibling: null, alternate: null, memoizedProps: null, memoizedState: null, dependencies: null };
}

describe("fiberHandleRegistry", () => {
  it("returns undefined for an id that was never set", () => {
    expect(getFiberHandle("missing")).toBeUndefined();
  });

  it("stores and retrieves a fiber by id", () => {
    const f = fiber(function App() {});
    setFiberHandle("app", f);

    expect(getFiberHandle("app")).toBe(f);
  });

  it("overwrites the handle on repeated set() for the same id", () => {
    const first = fiber(function App() {});
    const second = fiber(function App() {});

    setFiberHandle("app", first);
    setFiberHandle("app", second);

    expect(getFiberHandle("app")).toBe(second);
  });

  it("removes the handle on delete()", () => {
    setFiberHandle("app", fiber(function App() {}));
    deleteFiberHandle("app");

    expect(getFiberHandle("app")).toBeUndefined();
  });
});