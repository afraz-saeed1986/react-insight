import { useEffect } from "react";

import type { Insight } from "../types";

import { getInternalInsight } from "./getInternalInsight";

import { createReactLifecyclePlugin } from "./plugins/reactLifecyclePlugin";

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
    const plugin = createReactLifecyclePlugin({
      registry: internalInsight.rootRegistry,
    });

    void internalInsight.use(plugin);

    return () => {
      void internalInsight.unregisterPlugin(plugin.name);
    };
  }, [internalInsight]);
}
