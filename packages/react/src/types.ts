import type { InsightPlugin } from "@react-insight/core";

import type { RenderReason } from "./internal/discovery/renderReasons";

export type { RenderReason };

/**
 * Public, read-only snapshot of a discovered component.
 *
 * Intentionally decoupled from the internal ComponentNode shape so the
 * internal representation can evolve without breaking this contract.
 */
export interface ComponentSnapshot {
  readonly id: string;
  readonly displayName: string;
  readonly parentId: string | null;
  readonly status: "mounted" | "unmounted";
  readonly renderCount: number;
  readonly mountedAt: number;
  readonly lastRenderedAt: number | null;
  readonly unmountedAt: number | null;

  /**
   * Why this component rendered in its most recent render, derived by
   * comparing what was observed at the previous visit with what is
   * observed now. Never empty; several reasons can apply at once:
   *
   * - `mount`: the first render.
   * - `props`: names of props whose identity changed (never values).
   *   `children` changes on most parent renders.
   * - `state`: indices into `hooks` of state hooks whose previewed value
   *   changed. A new value that looks equal is not detected.
   * - `context`: names of contexts whose value changed.
   * - `parent`: nothing above changed, but the parent rendered in the
   *   same commit (often an avoidable render).
   * - `unknown`: no cause could be detected.
   */
  readonly lastRenderReasons: ReadonlyArray<RenderReason>;

  /**
   * Structural summary of this component's hooks (count, order,
   * best-effort kind classification — see internal/discovery/
   * hookInspector.ts for what this can and cannot distinguish, e.g.
   * useState/useReducer and useMemo/useCallback share a kind).
   */
readonly hooks: ReadonlyArray<{
    readonly index: number;
    readonly kind:
      | "state"
      | "ref"
      | "memo-like"
      | "effect"
      | "layout-effect"
      | "unknown";
    readonly value?:
      | string
      | number
      | boolean
      | null
      | undefined
      | { readonly __type: string }
      | { readonly __type: "array"; readonly length: number; readonly items: readonly unknown[] }
      | { readonly __type: "object"; readonly keys: Readonly<Record<string, unknown>> };
  }>;

  readonly contexts: ReadonlyArray<{
    readonly index: number;
    readonly displayName: string;
    readonly value:
      | string
      | number
      | boolean
      | null
      | undefined
      | { readonly __type: string }
      | { readonly __type: "array"; readonly length: number; readonly items: readonly unknown[] }
      | { readonly __type: "object"; readonly keys: Readonly<Record<string, unknown>> };
  }>;
}

export interface Insight {
  use(plugin: InsightPlugin): Promise<void>;

  destroy(): Promise<void>;

   /**
   * Returns a read-only snapshot of every currently tracked component
   * (mounted and unmounted).
   */
  getComponents(): ReadonlyArray<ComponentSnapshot>;

  /**
   * Returns a read-only snapshot of a single tracked component by id,
   * or undefined if no component with that id is currently tracked
   * (mounted or unmounted). Equivalent to filtering getComponents()
   * for a single id, but O(1) instead of scanning every component —
   * intended for consumers that already know which component they
   * want (e.g. a future Inspector selecting one row for detail view).
   */
  getComponent(id: string): ComponentSnapshot | undefined;

  /**
   * Subscribes to changes in tracked component state (mount, update,
   * unmount). The listener carries no payload — re-read current state
   * via getComponents() when it fires.
   *
   * Replaces the polling workaround previously used to observe
   * Component Discovery / Render Tracking output (e.g. Playground's
   * InsightDebugPanel).
   *
   * Returns an unsubscribe function.
   */
    onChange(listener: () => void): () => void;

  /**
   * On-demand only — never call this automatically or on every
   * commit. Re-invokes the component's function with an instrumented
   * dispatcher to resolve exact hook names (e.g. distinguishing
   * useState from useReducer, which are structurally identical) and
   * the nearest enclosing custom hook name, if any.
   *
   * This genuinely RE-EXECUTES the component's render body. If that
   * body has real side effects, they run again — call this only in
   * response to an explicit inspection request, never automatically.
   *
   * Returns undefined if: the component isn't currently tracked, it
   * isn't a function component (plain function, memo, forwardRef and
   * memo(forwardRef(...)) are supported; class components are not), or
   * React's dispatcher internals aren't accessible in this environment,
   * or re-invoking the component throws. Hook names resolve in a
   * production React build too (verified unminified); only custom hook
   * names degrade under minification, as noted below.
   *
   * Custom hook name resolution degrades under minified production
   * builds, since it reads real function names from the call stack.
   */
  inspectHookNames(id: string): ReadonlyArray<InspectedHookName> | undefined;
}

/**
 * A single hook's on-demand-resolved name, from Insight.inspectHookNames().
 * See that method's documentation for what this can and cannot recover.
 */
export interface InspectedHookName {
  readonly index: number;
  readonly hookName: string;
  readonly customHookName?: string;
}
