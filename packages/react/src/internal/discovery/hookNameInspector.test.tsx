import { Component, useCallback, useMemo, useReducer, useState } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { FiberNode } from "./fiberAdapter";
import { getCurrentDispatcherRef } from "./dispatcherAccess";
import { resolveHookNames } from "./hookNameInspector";

/**
 * Test-only infrastructure: extracts a real Fiber from a rendered DOM
 * node via React's well-known `__reactFiber$...` internal property,
 * then walks `.return` up to the fiber matching the given component
 * function. This is separate from — and much simpler than — the
 * production fiberHandleRegistry path (which captures fibers during
 * real commit-driven Traversal); it exists here only so these tests
 * can get a genuinely real Fiber + real dispatcher without going
 * through the full DevTools-hook connection handshake.
 */
function getFiberFromDom(node: Node): FiberNode & { return?: FiberNode | null } {
  const record = node as unknown as Record<string, unknown>;
  const fiberKey = Object.keys(record).find((key) => key.startsWith("__reactFiber$"));

  if (!fiberKey) {
    throw new Error("Could not find a React Fiber key on the rendered DOM node.");
  }

  return record[fiberKey] as FiberNode & { return?: FiberNode | null };
}

function findComponentFiber(node: Node, type: unknown): FiberNode {
  let current: (FiberNode & { return?: FiberNode | null }) | null = getFiberFromDom(node);

  while (current) {
    if (current.type === type) return current;
    current = current.return ?? null;
  }

  throw new Error("Could not locate the target component's fiber by walking .return.");
}

function requireDispatcherRef() {
  const ref = getCurrentDispatcherRef();

  if (!ref) {
    throw new Error("Expected a dispatcher ref to be available in this test environment.");
  }

  return ref;
}

describe("resolveHookNames", () => {
  it("distinguishes useState from useReducer, which are structurally identical", () => {
    function StateComponent() {
      useState(0);
      return <div />;
    }

    const { container } = render(<StateComponent />);
    const fiber = findComponentFiber(container.firstChild!, StateComponent);

    expect(resolveHookNames(fiber, requireDispatcherRef())).toEqual([
      { index: 0, hookName: "useState" },
    ]);
  });

  it("resolves useReducer distinctly from useState", () => {
    function ReducerComponent() {
      useReducer((s: number) => s, 0);
      return <div />;
    }

    const { container } = render(<ReducerComponent />);
    const fiber = findComponentFiber(container.firstChild!, ReducerComponent);

    expect(resolveHookNames(fiber, requireDispatcherRef())).toEqual([
      { index: 0, hookName: "useReducer" },
    ]);
  });

  it("distinguishes useMemo from useCallback, which are structurally identical", () => {
    function MemoComponent() {
      useMemo(() => 42, []);
      useCallback(() => {}, []);
      return <div />;
    }

    const { container } = render(<MemoComponent />);
    const fiber = findComponentFiber(container.firstChild!, MemoComponent);

    expect(resolveHookNames(fiber, requireDispatcherRef())).toEqual([
      { index: 0, hookName: "useMemo" },
      { index: 1, hookName: "useCallback" },
    ]);
  });

  it("resolves the custom hook name wrapping a hook, when present", () => {
    function useCustomCounter() {
      return useState(0);
    }
    function WrapperComponent() {
      useCustomCounter();
      return <div />;
    }

    const { container } = render(<WrapperComponent />);
    const fiber = findComponentFiber(container.firstChild!, WrapperComponent);

    const names = resolveHookNames(fiber, requireDispatcherRef());

    // ⚠️ If this specific assertion fails while the others in this
    // file pass, the frame-skip logic in resolveCustomHookName() needs
    // adjustment — see that function's documentation. Temporarily log
    // the raw `stack` inside recordCall() to see the actual frame
    // layout in this environment before changing the skip logic.
    expect(names).toEqual([
      { index: 0, hookName: "useState", customHookName: "useCustomCounter" },
    ]);
  });

  it("reports no customHookName when the hook is called directly in the component body", () => {
    function DirectComponent() {
      useState(0);
      return <div />;
    }

    const { container } = render(<DirectComponent />);
    const fiber = findComponentFiber(container.firstChild!, DirectComponent);

    const names = resolveHookNames(fiber, requireDispatcherRef());

    expect(names?.[0]?.customHookName).toBeUndefined();
  });

  it("does not mutate real hook state (safe to call repeatedly)", () => {
    function Counter() {
      useState(5);
      return <div />;
    }

    const { container } = render(<Counter />);
    const fiber = findComponentFiber(container.firstChild!, Counter);

    resolveHookNames(fiber, requireDispatcherRef());
    const secondCall = resolveHookNames(fiber, requireDispatcherRef());

    expect(secondCall).toEqual([{ index: 0, hookName: "useState" }]);
    expect((fiber.memoizedState as { memoizedState: unknown }).memoizedState).toBe(5);
  });

  it("suppresses console output during re-invocation", () => {
    function LoggingComponent() {
      console.log("should not actually print during inspection");
      useState(0);
      return <div />;
    }

    const { container } = render(<LoggingComponent />);
    const fiber = findComponentFiber(container.firstChild!, LoggingComponent);

    const logSpy = vi.spyOn(console, "log");
    resolveHookNames(fiber, requireDispatcherRef());

    expect(logSpy).not.toHaveBeenCalledWith("should not actually print during inspection");
    logSpy.mockRestore();
  });

  it("returns undefined instead of throwing when re-invocation itself errors", () => {
    let renderCount = 0;
    function FlakyComponent() {
      renderCount += 1;
      useState(0);
      if (renderCount > 1) {
        throw new Error("boom on re-invocation");
      }
      return <div />;
    }

    const { container } = render(<FlakyComponent />);
    const fiber = findComponentFiber(container.firstChild!, FlakyComponent);

    expect(resolveHookNames(fiber, requireDispatcherRef())).toBeUndefined();
  });

  it("returns undefined for class components", () => {
    class ClassComponent extends Component {
      override render() {
        return <div />;
      }
    }

    const { container } = render(<ClassComponent />);
    const fiber = findComponentFiber(container.firstChild!, ClassComponent);

    expect(resolveHookNames(fiber, requireDispatcherRef())).toBeUndefined();
  });
});