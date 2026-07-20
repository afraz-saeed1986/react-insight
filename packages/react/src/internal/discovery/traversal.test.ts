import { describe, expect, it } from "vitest";

import { traverse, getFiberId } from "./traversal";
import type { FiberNode } from "./fiberAdapter";

function App() {}
function Header() {}
function Footer() {}

function fiber(
  type: unknown,
  child: FiberNode | null = null,
  sibling: FiberNode | null = null,
  alternate: FiberNode | null = null,
): FiberNode {
  return { type, child, sibling, alternate };
}

describe("traverse", () => {
  it("collects only function/class component fibers", () => {
    const footerFiber = fiber(Footer);
    const headerFiber = fiber(Header, null, footerFiber);
    // "div" host fiber is skipped, but its child (Header) is still visited
    const hostFiber = fiber("div", headerFiber);
    const appFiber = fiber(App, hostFiber);

    const result = traverse(appFiber, "root-1");

    expect(result.map((c) => c.displayName)).toEqual(["App", "Header", "Footer"]);
    expect(result.every((c) => c.rootId === "root-1")).toBe(true);
  });

  it("assigns the nearest component ancestor as parentId, skipping host fibers", () => {
    const childFiber = fiber(Header);
    const hostFiber = fiber("div", childFiber);
    const appFiber = fiber(App, hostFiber);

    const result = traverse(appFiber, "root-1");
    // Length is asserted first so the non-null assertions below are safe
    // and documented, per the project's strictness policy.
    expect(result).toHaveLength(2);

    const app = result[0]!;
    const header = result[1]!;

    expect(app.parentId).toBeNull();
    expect(header.parentId).toBe(app.id);
  });

  it("returns stable ids for the same fiber across multiple traversals", () => {
    const appFiber = fiber(App);

    const firstResult = traverse(appFiber, "root-1");
    const secondResult = traverse(appFiber, "root-1");

    expect(firstResult).toHaveLength(1);
    expect(secondResult).toHaveLength(1);

    const first = firstResult[0]!;
    const second = secondResult[0]!;

    expect(first.id).toBe(second.id);
  });

  it("returns the same id for a Fiber's alternate (React's current/work-in-progress pair)", () => {
    const mountFiber = fiber(App);
    const firstResult = traverse(mountFiber, "root-1");

    // Simulates React's double buffering: on the first update, React
    // renders into a *new* Fiber object (the work-in-progress), linked
    // to the previous one via `alternate`, and that new object becomes
    // `root.current` after commit.
    const updateFiber = fiber(App, null, null, mountFiber);

    const secondResult = traverse(updateFiber, "root-1");

    expect(firstResult).toHaveLength(1);
    expect(secondResult).toHaveLength(1);
    expect(secondResult[0]!.id).toBe(firstResult[0]!.id);
  });

  it("getFiberId keeps working directly (not only through traverse)", () => {
    const mountFiber = fiber(App);
    const mountId = getFiberId(mountFiber);

    const updateFiber = fiber(App, null, null, mountFiber);
    const updateId = getFiberId(updateFiber);

    expect(updateId).toBe(mountId);
  });
});