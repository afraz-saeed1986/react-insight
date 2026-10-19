import { describe, expect, it } from "vitest";

import { traverse, getFiberId, forgetObservedValues } from "./traversal";
import type { FiberNode } from "./fiberAdapter";
import { REACT_FORWARD_REF_TYPE, REACT_MEMO_TYPE } from "./fiberAdapter";
import { getFiberHandle } from "./fiberHandleRegistry";

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

  
  interface TestContextNode {
    context: unknown;
    memoizedValue: unknown;
    next: TestContextNode | null;
  }

  function contextDependencies(...values: readonly unknown[]): {
    firstContext: TestContextNode | null;
  } {
    let next: TestContextNode | null = null;

    for (let i = values.length - 1; i >= 0; i -= 1) {
      next = { context: { displayName: `Ctx${i}` }, memoizedValue: values[i], next };
    }

    return { firstContext: next };
  }

  it("marks a hookless fiber as rendered when only a context value changed", () => {
    const stableProps = { label: "same" };
    const mountFiber = fiber(App, null, null, null, stableProps, null, contextDependencies("a"));
    traverse(mountFiber, "root-1");

    const updateFiber = fiber(App, null, null, mountFiber, stableProps, null, contextDependencies("b"));
    const result = traverse(updateFiber, "root-1");

    expect(result[0]!.rendered).toBe(true);
  });

  it("does not mark a fiber as rendered when its context values are unchanged", () => {
    const stableProps = { label: "same" };
    const value = { theme: "dark" };
    const mountFiber = fiber(App, null, null, null, stableProps, null, contextDependencies(value));
    traverse(mountFiber, "root-1");

    const updateFiber = fiber(App, null, null, mountFiber, stableProps, null, contextDependencies(value));
    const result = traverse(updateFiber, "root-1");

    expect(result[0]!.rendered).toBe(false);
  });

  it("marks a fiber as rendered when it starts reading an additional context", () => {
    const stableProps = { label: "same" };
    const mountFiber = fiber(App, null, null, null, stableProps, null, contextDependencies("a"));
    traverse(mountFiber, "root-1");

    const updateFiber = fiber(App, null, null, mountFiber, stableProps, null, contextDependencies("a", "b"));
    const result = traverse(updateFiber, "root-1");

    expect(result[0]!.rendered).toBe(true);
  });

  it("does not treat a NaN context value as changed on every commit", () => {
    const stableProps = { label: "same" };
    const mountFiber = fiber(App, null, null, null, stableProps, null, contextDependencies(Number.NaN));
    traverse(mountFiber, "root-1");

    const updateFiber = fiber(App, null, null, mountFiber, stableProps, null, contextDependencies(Number.NaN));
    const result = traverse(updateFiber, "root-1");

    expect(result[0]!.rendered).toBe(false);
  });

  it("forgets observed values for an id so a later sighting is treated as new", () => {
    const appFiber = fiber(App, null, null, null, { label: "same" });
    const [first] = traverse(appFiber, "root-1");

    // Unchanged on the second sighting: remembered values are compared.
    expect(traverse(appFiber, "root-1")[0]!.rendered).toBe(false);

    forgetObservedValues(first!.id);

    // The remembered values are gone, so the same fiber looks new again.
    expect(traverse(appFiber, "root-1")[0]!.rendered).toBe(true);
  });

  it("lists the props that changed on an update", () => {
    const mountFiber = fiber(App, null, null, null, { a: 1, b: 1 });
    traverse(mountFiber, "root-1");

    const updateFiber = fiber(App, null, null, mountFiber, { a: 1, b: 2 });
    const [app] = traverse(updateFiber, "root-1");

    expect(app!.rendered).toBe(true);
    expect(app!.changedPropKeys).toEqual(["b"]);
  });

  it("reports no changed props on first sight", () => {
    const [app] = traverse(fiber(App, null, null, null, { a: 1 }), "root-1");

    expect(app!.changedPropKeys).toEqual([]);
  });

  it("reports no changed props when only state changed (same props object)", () => {
    const props = { a: 1 };
    const mountFiber = fiber(App, null, null, null, props, { s: 0 });
    traverse(mountFiber, "root-1");

    const updateFiber = fiber(App, null, null, mountFiber, props, { s: 1 });
    const [app] = traverse(updateFiber, "root-1");

    expect(app!.rendered).toBe(true);
    expect(app!.changedPropKeys).toEqual([]);
  });

  it("reports no changed props for a component that bailed out", () => {
    const props = { a: 1 };
    const appFiber = fiber(App, null, null, null, props);
    traverse(appFiber, "root-1");

    const [app] = traverse(appFiber, "root-1");

    expect(app!.rendered).toBe(false);
    expect(app!.changedPropKeys).toEqual([]);
  });

  it("marks parentRendered for a child whose parent rendered in the same commit", () => {
    const headerMount = fiber(Header, null, null, null, { x: 1 });
    const appMount = fiber(App, headerMount, null, null, { n: 1 });
    traverse(appMount, "root-1");

    // Header gets a new props object with equal contents, as happens
    // when its parent re-renders.
    const headerUpdate = fiber(Header, null, null, headerMount, { x: 1 });
    const appUpdate = fiber(App, headerUpdate, null, appMount, { n: 2 });
    const [app, header] = traverse(appUpdate, "root-1");

    expect(app!.parentRendered).toBe(false);
    expect(app!.changedPropKeys).toEqual(["n"]);
    expect(header!.rendered).toBe(true);
    expect(header!.changedPropKeys).toEqual([]);
    expect(header!.parentRendered).toBe(true);
  });

  it("does not mark parentRendered when the parent bailed out and only a context changed", () => {
    const appProps = { n: 1 };
    const headerProps = { x: 1 };
    const headerMount = fiber(Header, null, null, null, headerProps, null, contextDependencies("a"));
    const appMount = fiber(App, headerMount, null, null, appProps);
    traverse(appMount, "root-1");

    const headerUpdate = fiber(Header, null, null, headerMount, headerProps, null, contextDependencies("b"));
    const appUpdate = fiber(App, headerUpdate, null, appMount, appProps);
    const [app, header] = traverse(appUpdate, "root-1");

    expect(app!.rendered).toBe(false);
    expect(header!.rendered).toBe(true);
    expect(header!.parentRendered).toBe(false);
  });

  it("records a fiber handle for every discovered component", () => {
    const appFiber = fiber(App);

    const [discovered] = traverse(appFiber, "root-1");
    expect(discovered).toBeDefined();

    expect(getFiberHandle(discovered!.id)).toBe(appFiber);
  });


  
describe("memo/forwardRef discovery", () => {
  function memoType(inner: unknown, displayName?: string) {
    return { $$typeof: REACT_MEMO_TYPE, type: inner, displayName };
  }

  function forwardRefType(render: (...args: unknown[]) => unknown, displayName?: string) {
    return { $$typeof: REACT_FORWARD_REF_TYPE, render, displayName };
  }

  it("discovers a memo-wrapped component and resolves its inner function name", () => {
    function Inner() {}
    const wrapped = memoType(Inner);
    const wrappedFiber = fiber(wrapped);

    const [result] = traverse(wrappedFiber, "root-1");

    expect(result?.displayName).toBe("Inner");
  });

  it("discovers a forwardRef-wrapped component and resolves its render function name", () => {
    function InnerRender() {}
    const wrapped = forwardRefType(InnerRender);
    const wrappedFiber = fiber(wrapped);

    const [result] = traverse(wrappedFiber, "root-1");

    expect(result?.displayName).toBe("InnerRender");
  });

  it("discovers memo(forwardRef(...)) and resolves the innermost render function name", () => {
    function InnerRender() {}
    const combo = memoType(forwardRefType(InnerRender));
    const wrappedFiber = fiber(combo);

    const [result] = traverse(wrappedFiber, "root-1");

    expect(result?.displayName).toBe("InnerRender");
  });

  it("prefers an explicit displayName over the inner function name, for both memo and forwardRef", () => {
    function Inner() {}
    const wrapped = memoType(Inner, "ExplicitMemoName");
    const wrappedFiber = fiber(wrapped);

    const [result] = traverse(wrappedFiber, "root-1");

    expect(result?.displayName).toBe("ExplicitMemoName");
  });

  it("reads an explicit displayName from fiber.elementType when fiber.type is the unnamed inner function of a simple memo", () => {
    // Simple memo(fn): React sets fiber.type to the inner function and keeps
    // the memo wrapper in fiber.elementType. After minification the inner
    // function can have an empty name.
    const Inner = () => null;
    Object.defineProperty(Inner, "name", { value: "" });
    const wrapper = memoType(Inner, "MemoChild");
    const wrappedFiber = Object.assign(fiber(Inner), { elementType: wrapper });

    const [result] = traverse(wrappedFiber, "root-1");

    expect(result?.displayName).toBe("MemoChild");
  });

  it("falls back to the inner function name when the elementType wrapper has no displayName", () => {
    function Inner() {}
    const wrapper = memoType(Inner);
    const wrappedFiber = Object.assign(fiber(Inner), { elementType: wrapper });

    const [result] = traverse(wrappedFiber, "root-1");

    expect(result?.displayName).toBe("Inner");
  });

  it("does not use a non-memo elementType without a displayName (e.g. lazy) to resolve the name", () => {
    function Resolved() {}
    const lazyLike = { $$typeof: Symbol.for("react.lazy") };
    const wrappedFiber = Object.assign(fiber(Resolved), { elementType: lazyLike });

    const [result] = traverse(wrappedFiber, "root-1");

    expect(result?.displayName).toBe("Resolved");
  });
});

});