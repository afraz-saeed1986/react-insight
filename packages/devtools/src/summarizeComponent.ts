import type { ComponentSnapshot } from "@react-insight/react";

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/**
 * One-line summary of a component's structural hooks and contexts,
 * e.g. "2 hooks · 1 context". Zero counts are omitted; returns an
 * empty string when there is nothing to show.
 *
 * Note: useContext() consumes no hook slot, so it is counted under
 * contexts, never under hooks.
 */
export function summarizeComponent(
  snapshot: Pick<ComponentSnapshot, "hooks" | "contexts">,
): string {
  const parts: string[] = [];

  if (snapshot.hooks.length > 0) {
    parts.push(plural(snapshot.hooks.length, "hook"));
  }

  if (snapshot.contexts.length > 0) {
    parts.push(plural(snapshot.contexts.length, "context"));
  }

  return parts.join(" · ");
}