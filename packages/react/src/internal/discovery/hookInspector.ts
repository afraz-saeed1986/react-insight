import type { FiberNode, HookNode } from "./fiberAdapter";
import { previewHookValue, type HookValuePreview } from "./hookValuePreview";

export type HookKind =
  | "state" // useState or useReducer — indistinguishable from shape alone
  | "ref"
  | "memo-like" // useMemo or useCallback — indistinguishable from shape alone
  | "effect"
  | "layout-effect"
  | "unknown";

export interface HookSummary {
  readonly index: number;
  readonly kind: HookKind;
  /**
   * Present for kind === "state" (useState/useReducer — the value
   * itself), "ref" (useRef — the ref's current contents, not the
   * { current } wrapper object), and "memo-like" (useMemo/useCallback
   * — the memoized value itself, not the dependency array). Absent
   * for "effect" | "layout-effect" | "unknown", which carry no
   * previewable value.
   */
  readonly value?: HookValuePreview;
}

// react-reconciler's internal Effect tag bits (ReactHookEffectTags.js).
// Unexported and not part of any public React API — confirmed against
// this project's installed React version via a controlled Playground
// experiment (useEffect => 9, useLayoutEffect => 5) rather than
// assumed. If a future React version changes these values, this
// classification silently degrades to "unknown" rather than
// misclassifying (see the bitwise check below), but will no longer
// distinguish useEffect from useLayoutEffect. See DECISIONS.md.
const EFFECT_TAG_LAYOUT = 0b0100;
const EFFECT_TAG_PASSIVE = 0b1000;

/**
 * Detects whether a Fiber's `type` is a class component, using the
 * same marker React itself uses internally to decide whether to
 * construct an instance (`Component.prototype.isReactComponent`,
 * set by every class extending `React.Component`). This is safer
 * than an unstable Fiber `tag` number, and is required here because
 * `isComponentFiber()` elsewhere in this package intentionally treats
 * function and class components alike (both are `typeof === "function"`
 * in JavaScript) — a distinction that doesn't matter for identity/
 * render-detection, but does matter here: a class component's
 * `memoizedState` is `this.state`, not a hooks linked list.
 */
function isClassComponentType(type: unknown): boolean {
  if (typeof type !== "function") {
    return false;
  }

  const prototype = (type as { prototype?: { isReactComponent?: unknown } }).prototype;
  return Boolean(prototype?.isReactComponent);
}

function classifyHook(hook: HookNode): HookKind {
  if (hook.queue !== null && hook.queue !== undefined) {
    return "state";
  }

  const state = hook.memoizedState;

  if (
    state !== null &&
    typeof state === "object" &&
    "current" in state &&
    Object.keys(state).length === 1
  ) {
    return "ref";
  }

  if (Array.isArray(state) && state.length === 2) {
    return "memo-like";
  }

  if (state !== null && typeof state === "object" && "tag" in state) {
    const tag = (state as { tag: unknown }).tag;

    if (typeof tag === "number") {
      if ((tag & EFFECT_TAG_PASSIVE) !== 0) return "effect";
      if ((tag & EFFECT_TAG_LAYOUT) !== 0) return "layout-effect";
    }

    return "unknown";
  }

  return "unknown";
}

const KINDS_WITH_VALUE = new Set<HookKind>(["state", "ref", "memo-like"]);

/**
 * Extracts the previewable value for an already-classified hook,
 * mirroring the exact shape checks classifyHook() used to arrive at
 * that kind in the first place:
 *
 * - "state": memoizedState IS the value (useState/useReducer store it
 *   directly, no wrapper).
 * - "ref": memoizedState is the { current } wrapper object produced by
 *   useRef — the previewable value is .current, not the wrapper
 *   itself (previewing the wrapper would just show
 *   { __type: "object", keys: { current: ... } }, which is noise).
 * - "memo-like": memoizedState is [value, deps] — the previewable
 *   value is index 0 (the memoized result), not the dependency array
 *   at index 1.
 *
 * Returns undefined for any other kind, which the caller uses to
 * decide whether to attach a value at all.
 */
function extractHookValue(kind: HookKind, memoizedState: unknown): unknown {
  switch (kind) {
    case "state":
      return memoizedState;
    case "ref":
      return (memoizedState as { current: unknown }).current;
    case "memo-like":
      return (memoizedState as readonly [unknown, unknown])[0];
    default:
      return undefined;
  }
}

/**
 * Walks the hooks linked list rooted at a function component Fiber's
 * `memoizedState` and returns a structural summary of each hook.
 *
 * This is a structural-only, always-on inspection (no re-render, no
 * instrumented dispatcher) — consistent with this library's existing
 * zero-instrumentation positioning for Render Tracking. It cannot
 * recover hook *names*, including custom hook boundaries: React
 * doesn't preserve them at the Fiber level at all, they only exist by
 * re-invoking the component with a dispatcher that intercepts each
 * call (the technique `react-debug-tools` / React DevTools use,
 * on-demand, only when a component is explicitly inspected — see
 * DECISIONS.md for why that approach was not chosen for this
 * always-on pass). Some primitive hooks also share an identical
 * shape and cannot be told apart at all this way: `useState` vs.
 * `useReducer` (both "state"), and `useMemo` vs. `useCallback` (both
 * "memo-like").
 *
 * Returns an empty array for class components (no hooks exist) and
 * for fibers with no hooks at all.
 */
export function inspectHooks(fiber: FiberNode): HookSummary[] {
  if (isClassComponentType(fiber.type)) {
    return [];
  }

  const summaries: HookSummary[] = [];
  let hook = fiber.memoizedState as HookNode | null;
  let index = 0;

  while (hook) {
    const kind = classifyHook(hook);
    summaries.push(
      KINDS_WITH_VALUE.has(kind)
        ? { index, kind, value: previewHookValue(extractHookValue(kind, hook.memoizedState)) }
        : { index, kind },
    );
    hook = hook.next;
    index += 1;
  }

  return summaries;
}