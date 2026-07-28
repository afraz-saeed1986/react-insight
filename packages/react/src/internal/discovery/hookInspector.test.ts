import { describe, expect, it } from "vitest";
import { inspectHooks } from "./hookInspector";
import type { FiberNode, HookNode } from "./fiberAdapter";

function hookNode(memoizedState: unknown, queue: unknown = null): HookNode {
  return { memoizedState, queue, next: null };
}

function chain(...hooks: HookNode[]): HookNode | null {
  for (let i = 0; i < hooks.length - 1; i += 1) {
    hooks[i]!.next = hooks[i + 1]!;
  }
  return hooks[0] ?? null;
}

function functionComponentFiber(memoizedState: HookNode | null): FiberNode {
  return {
    type: function AnyComponent() {},
    child: null,
    sibling: null,
    alternate: null,
    memoizedProps: null,
    memoizedState,
  };
}

describe("inspectHooks", () => {
  it("returns an empty array when there are no hooks", () => {
    expect(inspectHooks(functionComponentFiber(null))).toEqual([]);
  });

  it("classifies a useState/useReducer-shaped hook as 'state'", () => {
    const hook = hookNode(0, { pending: null, dispatch: () => {} });
    const fiber = functionComponentFiber(chain(hook));

    expect(inspectHooks(fiber)).toEqual([{ index: 0, kind: "state", value: 0 }]);
  });

  it("classifies a useRef-shaped hook as 'ref'", () => {
    const hook = hookNode({ current: null });
    const fiber = functionComponentFiber(chain(hook));

    expect(inspectHooks(fiber)).toEqual([{ index: 0, kind: "ref" }]);
  });

  it("classifies a useMemo/useCallback-shaped hook as 'memo-like'", () => {
    const hook = hookNode([42, ["dep"]]);
    const fiber = functionComponentFiber(chain(hook));

    expect(inspectHooks(fiber)).toEqual([{ index: 0, kind: "memo-like" }]);
  });

  it("classifies an effect hook with the Passive tag bit as 'effect'", () => {
    // HasEffect (0b0001) | Passive (0b1000) = 9 — confirmed against a
    // real useEffect via a controlled Playground experiment.
    const hook = hookNode({ tag: 9, create: () => {}, deps: null, next: null });
    const fiber = functionComponentFiber(chain(hook));

    expect(inspectHooks(fiber)).toEqual([{ index: 0, kind: "effect" }]);
  });

  it("classifies an effect hook with the Layout tag bit as 'layout-effect'", () => {
    // HasEffect (0b0001) | Layout (0b0100) = 5 — confirmed against a
    // real useLayoutEffect via a controlled Playground experiment.
    const hook = hookNode({ tag: 5, create: () => {}, deps: null, next: null });
    const fiber = functionComponentFiber(chain(hook));

    expect(inspectHooks(fiber)).toEqual([{ index: 0, kind: "layout-effect" }]);
  });

  it("classifies an unrecognized shape as 'unknown' instead of throwing", () => {
    const hook = hookNode("something-unexpected");
    const fiber = functionComponentFiber(chain(hook));

    expect(inspectHooks(fiber)).toEqual([{ index: 0, kind: "unknown" }]);
  });

  it("preserves hook order across a multi-hook chain", () => {
    const stateHook = hookNode(0, { dispatch: () => {} });
    const refHook = hookNode({ current: null });
    const memoHook = hookNode([1, []]);
    const fiber = functionComponentFiber(chain(stateHook, refHook, memoHook));

  expect(inspectHooks(fiber)).toEqual([
      { index: 0, kind: "state", value: 0 },
      { index: 1, kind: "ref" },
      { index: 2, kind: "memo-like" },
    ]);
  });

  it("includes a shallow value preview for state hooks, and no value for other kinds", () => {
    const stateHook = hookNode(42, { dispatch: () => {} });
    const refHook = hookNode({ current: null });
    const fiber = functionComponentFiber(chain(stateHook, refHook));

    expect(inspectHooks(fiber)).toEqual([
      { index: 0, kind: "state", value: 42 },
      { index: 1, kind: "ref" },
    ]);
  });


  it("returns an empty array for class components instead of walking this.state as hooks", () => {
    class AnyClassComponent {
      state = { count: 0 };
    }
    (AnyClassComponent.prototype as { isReactComponent?: unknown }).isReactComponent = {};

    const fiber: FiberNode = {
      type: AnyClassComponent,
      child: null,
      sibling: null,
      alternate: null,
      memoizedProps: null,
      // A class component's memoizedState is `this.state`, not a hooks
      // linked list — if this were walked as one, `.next` would be
      // undefined and misinterpreted.
      memoizedState: { count: 0 },
    };

    expect(inspectHooks(fiber)).toEqual([]);
  });
});