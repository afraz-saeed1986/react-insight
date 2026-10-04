import type { ComponentSnapshot } from "@react-insight/react";

/**
 * Removes every component for which `isExcludedRoot` returns true,
 * together with all of its descendants (resolved via the parentId
 * chain). Ancestors and unrelated components are kept.
 *
 * Used so the DevTools panel never observes itself: filtering only the
 * panel component isn't enough once the panel has child components of
 * its own, since their renderCount changes would feed back into the
 * panel's re-render.
 */
export function excludeSubtrees(
  snapshots: ReadonlyArray<ComponentSnapshot>,
  isExcludedRoot: (snapshot: ComponentSnapshot) => boolean,
): ComponentSnapshot[] {
  const byId = new Map(snapshots.map((s) => [s.id, s] as const));

  const isExcluded = (snapshot: ComponentSnapshot): boolean => {
    const seen = new Set<string>();
    let current: ComponentSnapshot | undefined = snapshot;

    while (current && !seen.has(current.id)) {
      if (isExcludedRoot(current)) return true;
      seen.add(current.id);
      current =
        current.parentId === null ? undefined : byId.get(current.parentId);
    }

    return false;
  };

  return snapshots.filter((s) => !isExcluded(s));
}