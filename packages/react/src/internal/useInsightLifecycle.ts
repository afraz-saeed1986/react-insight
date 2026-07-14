import { useEffect } from "react";

import type { Insight } from "../types";

import { getInternalInsight } from "./getInternalInsight";

/**
 * Internal React lifecycle integration.
 *
 * This hook intentionally contains no behavior yet.
 * It serves as the single integration point for future
 * React lifecycle features such as:
 *
 * - Root registration
 * - Component tracking
 * - Render tracking
 * - Session lifecycle
 *
 * It is not part of the public API.
 */
export function useInsightLifecycle(insight: Insight): void {
  const internalInsight = getInternalInsight(insight);

  useEffect(() => {
    // Keep the registry reachable from the single React
    // lifecycle integration point.
    void internalInsight.rootRegistry;

    return () => {
      // Reserved for future cleanup.
    };
  }, [internalInsight]);
}
