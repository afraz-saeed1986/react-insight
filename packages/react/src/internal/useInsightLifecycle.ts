import type { Insight } from "../types";

import { useRootLifecycle } from "./useRootLifecycle";
import { useComponentDiscovery } from "./useComponentDiscovery";

/**
 * Coordinates React Insight lifecycle integrations.
 *
 * Individual lifecycle features are delegated to dedicated hooks.
 * This hook intentionally contains no feature-specific logic.
 */
export function useInsightLifecycle(insight: Insight): void {
  useRootLifecycle(insight);
  useComponentDiscovery(insight);
}