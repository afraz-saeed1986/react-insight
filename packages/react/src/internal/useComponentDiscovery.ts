import { useEffect } from "react";

import type { Insight } from "../types";

import { getInternalInsight } from "./getInternalInsight";
import { createComponentDiscoveryPlugin } from "./plugins/componentDiscoveryPlugin";

/**
 * Registers the internal component discovery plugin.
 *
 * This hook is responsible only for discovery lifecycle integration.
 */
export function useComponentDiscovery(insight: Insight): void {
  const internalInsight = getInternalInsight(insight);

  useEffect(() => {
    const plugin = createComponentDiscoveryPlugin({
      rootRegistry: internalInsight.rootRegistry,
      componentRegistry: internalInsight.componentRegistry,
    });

    void internalInsight.use(plugin);

    return () => {
      void internalInsight.unregisterPlugin(plugin.name);
    };
  }, [internalInsight]);
}