import {
  Component,
  createContext,
  forwardRef,
  memo,
  use,
  useActionState,
  useCallback,
  useDeferredValue,
  useId,
  useImperativeHandle,
  useMemo,
  useOptimistic,
  useReducer,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
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

  // React's "SimpleMemoComponent" optimization sets fiber.type directly
  // to the *inner* function for a memo(fn) with no custom compare —
  // fiber.type is already unwrapped, never equal to the memo wrapper
  // reference itself. Confirmed via a real test failure, not assumed.
  // This test-only helper accounts for that by also accepting a match
  // against the memo wrapper's own .type field.
  const memoInnerType =
    type && typeof type === "object" ? (type as { type?: unknown }).type : undefined;

  while (current) {
    if (current.type === type || (memoInnerType !== undefined && current.type === memoInnerType)) {
      return current;
    }
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

  it("does not report a bogus customHookName for fallback hooks like useId", () => {
    function IdComponent() {
      useId();
      useState(0);
      return <div />;
    }

    const { container } = render(<IdComponent />);
    const fiber = findComponentFiber(container.firstChild!, IdComponent);

    expect(resolveHookNames(fiber, requireDispatcherRef())).toEqual([
      { index: 0, hookName: "useId" },
      { index: 1, hookName: "useState" },
    ]);
  });

  it("does not attempt custom hook name resolution for fallback hooks", () => {
    function useCustomId() {
      return useId();
    }
    function CustomIdComponent() {
      useCustomId();
      return <div />;
    }

    const { container } = render(<CustomIdComponent />);
    const fiber = findComponentFiber(container.firstChild!, CustomIdComponent);

    // Documented trade-off: fallback hooks skip custom-hook-name
    // resolution, so the wrapping custom hook is not reported.
    expect(resolveHookNames(fiber, requireDispatcherRef())).toEqual([
      { index: 0, hookName: "useId" },
    ]);
  });

  it("does not report a non-hook caller (e.g. a minifier-mangled frame) as a custom hook", () => {
    // Stands in for a minifier-mangled frame name: real custom hooks must
    // be named useXxx, so any other caller is not a custom hook.
    function N() {
      return useState(0);
    }
    function ManglingComponent() {
      N();
      return <div />;
    }

    const { container } = render(<ManglingComponent />);
    const fiber = findComponentFiber(container.firstChild!, ManglingComponent);

    expect(resolveHookNames(fiber, requireDispatcherRef())).toEqual([
      { index: 0, hookName: "useState" },
    ]);
  });


    // React Compiler output calls `useMemoCache(size)` (through `c(size)`) and
  // expects a size-length array back. Same call path, without needing
  // react/compiler-runtime types.
  function useMemoCacheDirect(size: number): unknown[] {
    const dispatcher = requireDispatcherRef().current as {
      useMemoCache(size: number): unknown[];
    };
    return dispatcher.useMemoCache(size);
  }

  it("supports useMemoCache (React Compiler output) without consuming a hooks-list slot", () => {
    function CompiledLikeComponent() {
      const cache = useMemoCacheDirect(3);
      const [count] = useState(0);
      return <div>{cache.length + count}</div>;
    }

    const { container } = render(<CompiledLikeComponent />);
    const fiber = findComponentFiber(container.firstChild!, CompiledLikeComponent);

    expect(resolveHookNames(fiber, requireDispatcherRef())).toEqual([
      { index: 0, hookName: "useState" },
    ]);
  });

  it("returns a sentinel-filled array of the requested size from useMemoCache", () => {
    let captured: unknown[] | undefined;
    function ProbeComponent() {
      captured = useMemoCacheDirect(2);
      return <div />;
    }

    const { container } = render(<ProbeComponent />);
    const fiber = findComponentFiber(container.firstChild!, ProbeComponent);

    captured = undefined;
    resolveHookNames(fiber, requireDispatcherRef());

    const sentinel = Symbol.for("react.memo_cache_sentinel");
    expect(captured).toEqual([sentinel, sentinel]);
  });

    it("keeps names aligned for useDeferredValue", () => {
    function DeferredComponent() {
      useDeferredValue("x");
      useState("marker");
      return <div />;
    }

    const { container } = render(<DeferredComponent />);
    const fiber = findComponentFiber(container.firstChild!, DeferredComponent);

    expect(resolveHookNames(fiber, requireDispatcherRef())).toEqual([
      { index: 0, hookName: "useDeferredValue" },
      { index: 1, hookName: "useState" },
    ]);
  });

  it("keeps names aligned for useImperativeHandle", () => {
    function ImperativeComponent() {
      useImperativeHandle(undefined, () => ({}), []);
      useState("marker");
      return <div />;
    }

    const { container } = render(<ImperativeComponent />);
    const fiber = findComponentFiber(container.firstChild!, ImperativeComponent);

    expect(resolveHookNames(fiber, requireDispatcherRef())).toEqual([
      { index: 0, hookName: "useImperativeHandle" },
      { index: 1, hookName: "useState" },
    ]);
  });

  it("maps a two-slot useTransition to two entries, then the next hook", () => {
    function TransitionComponent() {
      const [isPending] = useTransition();
      useState("marker");
      return <div>{String(isPending)}</div>;
    }

    const { container } = render(<TransitionComponent />);
    const fiber = findComponentFiber(container.firstChild!, TransitionComponent);

    expect(resolveHookNames(fiber, requireDispatcherRef())).toEqual([
      { index: 0, hookName: "useTransition" },
      { index: 1, hookName: "useTransition" },
      { index: 2, hookName: "useState" },
    ]);
  });

  it("maps a two-slot useSyncExternalStore to two entries, then the next hook", () => {
    const subscribe = () => () => {};
    const getSnapshot = () => 7;

    function StoreComponent() {
      const value = useSyncExternalStore(subscribe, getSnapshot);
      useState("marker");
      return <div>{value}</div>;
    }

    const { container } = render(<StoreComponent />);
    const fiber = findComponentFiber(container.firstChild!, StoreComponent);

    expect(resolveHookNames(fiber, requireDispatcherRef())).toEqual([
      { index: 0, hookName: "useSyncExternalStore" },
      { index: 1, hookName: "useSyncExternalStore" },
      { index: 2, hookName: "useState" },
    ]);
  });

  it("supports useOptimistic, which returns a tuple from one slot", () => {
    function OptimisticComponent() {
      const [value] = useOptimistic(1);
      useState("marker");
      return <div>{value}</div>;
    }

    const { container } = render(<OptimisticComponent />);
    const fiber = findComponentFiber(container.firstChild!, OptimisticComponent);

    expect(resolveHookNames(fiber, requireDispatcherRef())).toEqual([
      { index: 0, hookName: "useOptimistic" },
      { index: 1, hookName: "useState" },
    ]);
  });

  it("maps a three-slot useActionState to three entries, then the next hook", () => {
    function ActionStateComponent() {
      const [state] = useActionState(async (previous: number) => previous + 1, 0);
      useState("marker");
      return <div>{state}</div>;
    }

    const { container } = render(<ActionStateComponent />);
    const fiber = findComponentFiber(container.firstChild!, ActionStateComponent);

    expect(resolveHookNames(fiber, requireDispatcherRef())).toEqual([
      { index: 0, hookName: "useActionState" },
      { index: 1, hookName: "useActionState" },
      { index: 2, hookName: "useActionState" },
      { index: 3, hookName: "useState" },
    ]);
  });

  it("does not give use(Context) a hooks-list slot and returns the context value", () => {
    const ThemeContext = createContext("light");
    let theme: string | undefined;

    function UseComponent() {
      theme = use(ThemeContext);
      useState("marker");
      return <div>{theme}</div>;
    }

    const { container } = render(<UseComponent />);
    const fiber = findComponentFiber(container.firstChild!, UseComponent);

    theme = undefined;
    const names = resolveHookNames(fiber, requireDispatcherRef());

    expect(names).toEqual([{ index: 0, hookName: "useState" }]);
    expect(theme).toBe("light");
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

  
  it("resolves hook names inside a forwardRef component", () => {
    const Inner = forwardRef<HTMLDivElement, { label: string }>((props, ref) => {
      useState(props.label);
      return <div ref={ref} />;
    });
    Inner.displayName = "InnerForwardRef";

    const { container } = render(<Inner label="hi" />);
    const fiber = findComponentFiber(container.firstChild!, Inner);

    expect(resolveHookNames(fiber, requireDispatcherRef())).toEqual([
      { index: 0, hookName: "useState" },
    ]);
  });

  it("resolves hook names inside a memo component", () => {
    const MemoComponent = memo(function MemoInner() {
      useState(0);
      return <div />;
    });

    const { container } = render(<MemoComponent />);
    const fiber = findComponentFiber(container.firstChild!, MemoComponent);

    expect(resolveHookNames(fiber, requireDispatcherRef())).toEqual([
      { index: 0, hookName: "useState" },
    ]);
  });

  it("resolves hook names inside memo(forwardRef(...))", () => {
    const Combo = memo(
      forwardRef<HTMLDivElement, Record<string, never>>((_props, ref) => {
        useState(0);
        return <div ref={ref} />;
      }),
    );

    const { container } = render(<Combo />);
    const fiber = findComponentFiber(container.firstChild!, Combo);

    expect(resolveHookNames(fiber, requireDispatcherRef())).toEqual([
      { index: 0, hookName: "useState" },
    ]);
  });


});