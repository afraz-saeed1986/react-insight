import type { Insight } from "../types";

import { useRootLifecycle } from "./useRootLifecycle";

/**
 * Coordinates React Insight lifecycle integrations.
 *
 * Component Discovery is intentionally NOT registered here. It is
 * registered eagerly in createInsight() instead, because a React
 * effect (which always runs after commit) can never observe the very
 * first commit of the tree it lives inside. See createInsight.ts and
 * DECISIONS.md.
 *
 * Root lifecycle remains effect-based: it only needs to know "a
 * Provider mounted", which the effect running is sufficient evidence
 * of, with no first-commit visibility requirement.
 */
export function useInsightLifecycle(insight: Insight): void {
  useRootLifecycle(insight);
}