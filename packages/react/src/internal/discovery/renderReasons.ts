import type { ContextSummary } from "./contextInspector";
import type { HookSummary } from "./hookInspector";

/**
 * Why a component rendered in a given commit. Several reasons can apply
 * at once. Reasons are derived by comparing what was observed at the
 * previous visit with what is observed now; they are a best-effort
 * explanation, not a record of React's internal scheduling.
 */
export type RenderReason =
  | { readonly type: "mount" }
  | { readonly type: "props"; readonly keys: readonly string[] }
  | { readonly type: "state"; readonly hookIndices: readonly number[] }
  | { readonly type: "context"; readonly names: readonly string[] }
  | { readonly type: "parent" }
  | { readonly type: "unknown" };

export interface RenderReasonInput {
  readonly isMount: boolean;
  /** Names of props whose value identity changed (see diffPropKeys). */
  readonly changedPropKeys: readonly string[];
  readonly previousHooks: readonly HookSummary[];
  readonly hooks: readonly HookSummary[];
  readonly previousContexts: readonly ContextSummary[];
  readonly contexts: readonly ContextSummary[];
  /** Whether this component's parent component rendered in the same commit. */
  readonly parentRendered: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasOwn(target: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(target, key);
}

/**
 * Shallow, identity-based diff of two props objects: returns the names
 * of props that were added, removed, or whose value is not the same
 * (Object.is) as before. Only names are returned, never values, so
 * nothing from the user's props is retained.
 *
 * Returns [] when either side is not an object or the objects are the
 * same reference. Note that `children` changes on almost every parent
 * render (a new JSX element each time), so it is a common, mostly
 * uninteresting entry.
 */
export function diffPropKeys(previous: unknown, next: unknown): string[] {
  if (previous === next || !isRecord(previous) || !isRecord(next)) {
    return [];
  }

  const changed: string[] = [];

  for (const key of Object.keys(next)) {
    if (!hasOwn(previous, key) || !Object.is(previous[key], next[key])) {
      changed.push(key);
    }
  }

  for (const key of Object.keys(previous)) {
    if (!hasOwn(next, key)) {
      changed.push(key);
    }
  }

  return changed;
}

function samePreview(a: unknown, b: unknown): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Indices of state hooks (useState/useReducer) whose previewed value
 * differs from the previous visit. Only "state" hooks count: ref,
 * memo-like and effect hooks change as a consequence of a render, not
 * as its cause. A state update that produces an equal-looking preview
 * (for example a new object with the same contents) cannot be seen here.
 */
function changedStateHookIndices(
  previous: readonly HookSummary[],
  next: readonly HookSummary[],
): number[] {
  const indices: number[] = [];

  for (const hook of next) {
    if (hook.kind !== "state") continue;

    const before = previous[hook.index];
    if (!before || before.kind !== "state") continue;

    if (!samePreview(before.value, hook.value)) {
      indices.push(hook.index);
    }
  }

  return indices;
}

function changedContextNames(
  previous: readonly ContextSummary[],
  next: readonly ContextSummary[],
): string[] {
  const names = new Set<string>();
  const length = Math.max(previous.length, next.length);

  for (let i = 0; i < length; i += 1) {
    const before = previous[i];
    const after = next[i];
    const source = after ?? before;

    if (!source) continue;

    if (!before || !after || !samePreview(before.value, after.value)) {
      names.add(source.displayName);
    }
  }

  return [...names];
}

/**
 * Explains why a component rendered. Call only for a component that
 * did render in this commit.
 *
 * - First sighting: [{ type: "mount" }] only.
 * - Otherwise every cause that can be detected is reported (props,
 *   state, context).
 * - If none can be detected: "parent" when the parent rendered in the
 *   same commit (typically props that are equal by value but arrived
 *   as a new object, so the render may have been avoidable), else
 *   "unknown".
 */
export function computeRenderReasons(input: RenderReasonInput): RenderReason[] {
  if (input.isMount) {
    return [{ type: "mount" }];
  }

  const reasons: RenderReason[] = [];

  if (input.changedPropKeys.length > 0) {
    reasons.push({ type: "props", keys: input.changedPropKeys });
  }

  const hookIndices = changedStateHookIndices(input.previousHooks, input.hooks);
  if (hookIndices.length > 0) {
    reasons.push({ type: "state", hookIndices });
  }

  const names = changedContextNames(input.previousContexts, input.contexts);
  if (names.length > 0) {
    reasons.push({ type: "context", names });
  }

  if (reasons.length === 0) {
    return [{ type: input.parentRendered ? "parent" : "unknown" }];
  }

  return reasons;
}