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
  memoizedProps: unknown = null,
  memoizedState: unknown = null,
  dependencies: unknown = null,
): FiberNode {
  return { type, child, sibling, alternate, memoizedProps, memoizedState, dependencies };
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

  it("marks a bailed-out fiber (same object reused as current) as not rendered", () => {
    const appFiber = fiber(App);

    const firstResult = traverse(appFiber, "root-1");
    // React reused the exact same object as root.current again — no
    // new alternate — meaning it bailed out and didn't re-render it.
    const secondResult = traverse(appFiber, "root-1");

    expect(firstResult[0]!.rendered).toBe(true); // mount
    expect(secondResult[0]!.rendered).toBe(false); // bailout
  });

it("marks an updated fiber as rendered when its props or state actually changed", () => {
    const mountFiber = fiber(App, null, null, null, { count: 0 });
    traverse(mountFiber, "root-1");

    const updateFiber = fiber(App, null, null, mountFiber, { count: 1 });
    const result = traverse(updateFiber, "root-1");

    expect(result[0]!.rendered).toBe(true);
  });

  it("marks a cloned ancestor fiber with unchanged props/state as not rendered (overcounting fix)", () => {
    const stableProps = { label: "unchanged" };
    const mountFiber = fiber(App, null, null, null, stableProps);
    traverse(mountFiber, "root-1");

    // Simulates React cloning an ancestor fiber along the reconciliation
    // path to reach a real update further down the tree, without the
    // ancestor's own function body re-running: memoizedProps/memoizedState
    // are copied by reference from `current` during a bailout, not
    // reallocated. This is the exact scenario validated in the
    // Playground controlled experiment — see DECISIONS.md.
    const clonedButBailedOutFiber = fiber(App, null, null, mountFiber, stableProps);
    const result = traverse(clonedButBailedOutFiber, "root-1");

    expect(result[0]!.rendered).toBe(false);
  });

  it("marks a recycled fiber (direct hit on a third-plus commit) as rendered when it changed again", () => {
    const mountFiber = fiber(App, null, null, null, { count: 0 });
    traverse(mountFiber, "root-1"); // mount: establishes id for object A

    const updateFiber = fiber(App, null, null, mountFiber, { count: 1 });
    traverse(updateFiber, "root-1"); // first update: establishes alternate id for object B

    // React's double buffering keeps the alternate link bidirectional and
    // permanent once established — object A needs to point back at B too,
    // exactly like real React does after the first update.
    mountFiber.alternate = updateFiber;

    // React recycles the ORIGINAL object (A) as the next work-in-progress,
    // mutating its fields in place — this is a directHit, but the fiber
    // genuinely re-rendered again.
    mountFiber.memoizedProps = { count: 2 };
    const result = traverse(mountFiber, "root-1");

    expect(result[0]!.rendered).toBe(true);
  });

  it("marks a recycled fiber (direct hit) as not rendered when nothing changed since last time", () => {
    const stableProps = { label: "same" };
    const mountFiber = fiber(App, null, null, null, stableProps);
    traverse(mountFiber, "root-1");

    const updateFiber = fiber(App, null, null, mountFiber, stableProps);
    traverse(updateFiber, "root-1");

    // Same bidirectional-alternate correction as above.
    mountFiber.alternate = updateFiber;

    // Recycled back to the original object without any real change.
    const result = traverse(mountFiber, "root-1");

    expect(result[0]!.rendered).toBe(false);
  });

  it("does not keep marking a fiber as rendered on repeated unrelated commits after its own last real update (stale-alternate regression)", () => {
    const mountFiber = fiber(App, null, null, null, { count: 0 });
    traverse(mountFiber, "root-1"); // mount

    const updateFiber = fiber(App, null, null, mountFiber, { count: 1 });
    const afterRealUpdate = traverse(updateFiber, "root-1"); // its one real update

    // Simulates many later commits elsewhere in the tree that never
    // touch this fiber again — React reuses the exact same object,
    // completely unchanged, on every one of them.
    const laterCommit1 = traverse(updateFiber, "root-1");
    const laterCommit2 = traverse(updateFiber, "root-1");
    const laterCommit3 = traverse(updateFiber, "root-1");

    expect(afterRealUpdate[0]!.rendered).toBe(true);
    expect(laterCommit1[0]!.rendered).toBe(false);
    expect(laterCommit2[0]!.rendered).toBe(false);
    expect(laterCommit3[0]!.rendered).toBe(false);
  });


});