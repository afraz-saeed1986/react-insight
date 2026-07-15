import { useEffect } from "react";

import type { Insight } from "../types";

import { getInternalInsight } from "./getInternalInsight";
import { createRootLifecyclePlugin } from "./plugins/rootLifecyclePlugin";

/**
 * Registers the internal root lifecycle plugin.
 *
 * This hook is responsible only for root lifecycle integration.
 */
export function useRootLifecycle(insight: Insight): void {
  const internalInsight = getInternalInsight(insight);

  useEffect(() => {
    const plugin = createRootLifecyclePlugin({
      registry: internalInsight.rootRegistry,
    });

    void internalInsight.use(plugin);

    return () => {
      void internalInsight.unregisterPlugin(plugin.name);
    };
  }, [internalInsight]);
}
