import type { ComponentSnapshot, Insight, InspectedHookName } from "@react-insight/react";

/**
 * Combined, on-demand inspection result for a single component: its
 * always-available structural snapshot, plus (if resolvable) its
 * on-demand-resolved hook names.
 */
export interface ComponentInspection {
  readonly snapshot: ComponentSnapshot;
  /**
   * Undefined when hook name resolution isn't available for this
   * component (not a plain function component, or running in an
   * environment where React's internals aren't accessible — see
   * Insight.inspectHookNames()'s own documentation for the full list
   * of cases).
   */
  readonly hookNames: ReadonlyArray<InspectedHookName> | undefined;
}

/**
 * Inspects a single tracked component by id, combining its always-on
 * structural snapshot (Insight.getComponent()) with an on-demand
 * attempt to resolve its exact hook names (Insight.inspectHookNames()).
 *
 * Returns undefined only if the component isn't currently tracked at
 * all. A tracked component whose hook names couldn't be resolved
 * still returns a result, with hookNames: undefined — that is a
 * distinct case from the component itself being untracked.
 *
 * This package has no knowledge of React Fiber or any React-internal
 * concept — it only calls the public Insight API.
 */
export function inspectComponent(insight: Insight, id: string): ComponentInspection | undefined {
  const snapshot = insight.getComponent(id);

  if (!snapshot) {
    return undefined;
  }

  return {
    snapshot,
    hookNames: insight.inspectHookNames(id),
  };
}