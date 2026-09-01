import type { FiberNode, HookNode } from "./fiberAdapter";
import { isClassComponentType } from "./hookInspector";
import type { DispatcherRef } from "./dispatcherAccess";

export interface InspectedHookName {
  readonly index: number;
  readonly hookName: string;
  /** Present only when this hook was called from inside a named
   * custom hook wrapper, rather than directly in the component body. */
  readonly customHookName?: string;
}

function noop(): void {}

/**
 * Extracts the immediate caller's function name from a V8-style
 * `Error().stack` string, to identify the nearest enclosing custom
 * hook (if any). Best-effort only:
 * - Relies on V8's "    at functionName (...)" stack format (Node,
 *   Chrome, jsdom under Vitest). Other engines may not resolve.
 * - Breaks under minification, since it reads real function names —
 *   the exact limitation already documented for this general
 *   technique in DECISIONS.md, 2026-07-27.
 */
// Names react itself exports for built-in hooks. Both our own shim
// methods AND react's real hook-export wrapper functions (which sit
// between the shim and the actual caller) happen to share these same
// names in the call stack, so skipping any leading frame matching one
// of these — regardless of whether it's "our" frame or "react's" —
// correctly walks past both layers to reach the true caller.
// "recordCall" is our own internal function — included here because
// new Error() is constructed inside recordCall() itself (see below),
// so its own frame is always the first one on the stack, before any
// hook-name frame even appears. Confirmed empirically: without this,
// customHookName incorrectly resolved to "recordCall" for every case.
const INTERNAL_FRAME_NAMES = new Set([
  "recordCall",
  "useState", "useReducer", "useRef", "useMemo", "useCallback",
  "useEffect", "useLayoutEffect", "useInsertionEffect", "useContext",
  "useDebugValue", "useId", "useTransition", "useDeferredValue",
  "useSyncExternalStore", "useImperativeHandle",
]);

/**
 * ⚠️ HIGHEST-UNCERTAINTY PART OF THIS FEATURE — verify against a real
 * stack trace in Playground before trusting it (see the message this
 * shipped with). Extracts the nearest true caller's function name
 * from a V8-style Error().stack, skipping leading frames that are
 * either our own dispatcher shim or react's real hook-export wrapper
 * (both frames legitimately share the hook's name, e.g. "useState").
 * The first frame that ISN'T one of those names is either a named
 * custom hook, or the component function itself.
 *
 * Only reliable for the explicitly-modeled hooks (state, ref,
 * memo-like, effect, layout-effect) — the Proxy fallback path (any
 * other hook) does not attempt custom-hook-name resolution at all
 * (see createInstrumentedDispatcher()), since its synthetic frame
 * name isn't predictable enough to skip correctly.
 */
function resolveCustomHookName(
  stack: string | undefined,
  componentFunctionName: string,
): string | undefined {
  if (!stack) return undefined;

  const frameNames = stack
    .split("\n")
    .slice(1) // drop the literal "Error" line
    .map((line) => {
      const raw = /at\s+([^\s(]+)/.exec(line)?.[1];
      if (!raw) return undefined;
      // Strips any wrapper prefix V8 reports (e.g. "Object.useState",
      // "Proxy.useState" — our dispatcher shim is accessed through a
      // Proxy) by keeping only the segment after the last ".". Plain
      // frame names with no "." (e.g. "StateComponent") are returned
      // unchanged. Confirmed empirically against real stack output,
      // not assumed.
      const parts = raw.split(".");
      return parts[parts.length - 1];
    })
    .filter((name): name is string => Boolean(name));

  let i = 0;
  while (i < frameNames.length && INTERNAL_FRAME_NAMES.has(frameNames[i]!)) {
    i += 1;
  }

  const callerName = frameNames[i];

  if (!callerName || callerName === componentFunctionName) {
    return undefined;
  }

  return callerName;
}

/**
 * Builds an instrumented dispatcher that mirrors React's real
 * Dispatcher shape, but never performs real update logic. Each method
 * reads the NEXT node from the fiber's already-committed hooks linked
 * list (in call order, matching hookInspector.ts's own walk) instead
 * of creating or scheduling anything — this must never mutate real
 * hook state.
 *
 * Only the hook kinds hookInspector.ts can already classify
 * structurally (state, ref, memo-like, effect, layout-effect) plus
 * useContext get a precise shim. Any other hook name (useTransition,
 * useId, useDeferredValue, useSyncExternalStore, useImperativeHandle,
 * future hooks, ...) falls through to a generic, best-effort handler:
 * records the call, consumes exactly one hooks-list slot, and returns
 * the raw stored value. This is accurate for simple single-slot hooks
 * and not guaranteed for anything more elaborate — an explicit,
 * documented trade-off rather than a silent gap.
 */
function createInstrumentedDispatcher(
  recordCall: (hookName: string) => void,
  nextNode: () => HookNode | null,
): Record<string, (...args: unknown[]) => unknown> {
  const explicit: Record<string, (...args: unknown[]) => unknown> = {
    useState() {
      recordCall("useState");
      const node = nextNode();
      return [node?.memoizedState, noop];
    },
    useReducer() {
      recordCall("useReducer");
      const node = nextNode();
      return [node?.memoizedState, noop];
    },
    useRef(initialValue: unknown) {
      recordCall("useRef");
      const node = nextNode();
      return node?.memoizedState ?? { current: initialValue };
    },
    useMemo(create: unknown) {
      recordCall("useMemo");
      const node = nextNode();
      const state = node?.memoizedState as readonly [unknown, unknown] | undefined;
      return state ? state[0] : (create as () => unknown)();
    },
    useCallback(callback: unknown) {
      recordCall("useCallback");
      const node = nextNode();
      const state = node?.memoizedState as readonly [unknown, unknown] | undefined;
      return state ? state[0] : callback;
    },
    useEffect() {
      recordCall("useEffect");
      nextNode();
    },
    useLayoutEffect() {
      recordCall("useLayoutEffect");
      nextNode();
    },
    useInsertionEffect() {
      recordCall("useInsertionEffect");
      nextNode();
    },
    useContext(context: unknown) {
      // useContext does not consume a hooks-list slot at all —
      // matches hookInspector.ts's existing, documented behavior.
      // No recordCall() either: it never appears in the hooks list,
      // so it has no `index` to report here.
      return (context as { _currentValue?: unknown } | null)?._currentValue;
    },
    useDebugValue() {
      // Does not consume a hooks-list slot.
    },
  };

   // Note: recordCall() is the same function whether reached through
  // an explicit method or this fallback — resolveCustomHookName()
  // itself is what limits custom-hook-name resolution to the
  // explicitly-modeled kinds, by only recognizing their frame names.
  return new Proxy(explicit, {
    get(target, prop: string) {
      if (prop in target) {
        return target[prop];
      }

         return () => {
        recordCall(prop);
        const node = nextNode();
        return node?.memoizedState;
      };
    },
  });
}

/**
 * On-demand only. Re-invokes the component function with an
 * instrumented dispatcher to resolve exact hook names and custom hook
 * boundaries — information structural inspection (hookInspector.ts)
 * cannot recover. This genuinely re-executes the component's render
 * body; if it has real side effects, they run again.
 *
 * Scoped to plain function components only (not memo/forwardRef,
 * not class components) for this slice.
 *
 * Never throws: returns undefined if the fiber isn't inspectable this
 * way, or if re-invocation itself throws (caller's responsibility is
 * only to try again later, not to handle a partial result).
 */
export function resolveHookNames(
  fiber: FiberNode,
  dispatcherRef: DispatcherRef,
): ReadonlyArray<InspectedHookName> | undefined {
  if (typeof fiber.type !== "function" || isClassComponentType(fiber.type)) {
    return undefined;
  }

  const componentFunctionName = (fiber.type as { name?: string }).name ?? "";
  const calls: InspectedHookName[] = [];
  let hookIndex = 0;
  let cursor = fiber.memoizedState as HookNode | null;

  function nextNode(): HookNode | null {
    const node = cursor;
    cursor = cursor?.next ?? null;
    return node;
  }

  function recordCall(hookName: string): void {
    const customHookName = resolveCustomHookName(new Error().stack, componentFunctionName);
    calls.push(
      customHookName
        ? { index: hookIndex, hookName, customHookName }
        : { index: hookIndex, hookName },
    );
    hookIndex += 1;
  }

  const dispatcher = createInstrumentedDispatcher(recordCall, nextNode);
  const previousDispatcher = dispatcherRef.current;

  // Suppress console output during re-invocation, so any logging the
  // component (or a custom hook it calls) does isn't duplicated —
  // the same defensive pattern react-devtools-shared uses around its
  // own inspectHooksOfFiber() call.
  const consoleMethods = Object.keys(console) as Array<keyof Console>;
  const previousConsole: Partial<Record<keyof Console, unknown>> = {};

  for (const method of consoleMethods) {
    try {
      previousConsole[method] = console[method];
      (console as unknown as Record<string, unknown>)[method] = noop;
    } catch {
      // Some console methods may be non-writable; skip silently.
    }
  }

  try {
    dispatcherRef.current = dispatcher;
    (fiber.type as (props: unknown) => unknown)(fiber.pendingProps);
    return calls;
  } catch {
    return undefined;
  } finally {
    dispatcherRef.current = previousDispatcher;

    for (const method of consoleMethods) {
      if (method in previousConsole) {
        (console as unknown as Record<string, unknown>)[method] = previousConsole[method];
      }
    }
  }
}