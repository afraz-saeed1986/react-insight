import { useEffect, useRef } from "react";

import type { Insight } from "../types";

import { getInternalInsight } from "./getInternalInsight";
import { createRootLifecyclePlugin } from "./plugins/rootLifecyclePlugin";

/**
 * Registers the internal root lifecycle plugin.
 *
 * This hook is responsible only for root lifecycle integration.
 *
 * Registration/unregistration are serialized through chainRef rather
 * than fired independently. React 18+ StrictMode invokes effects as
 * mount -> cleanup -> mount in development. Since registration and
 * unregistration are both asynchronous (Runtime awaits
 * Plugin.setup()/destroy()), firing them independently races: the
 * second mount's registration can run before the first mount's
 * cleanup has actually removed the plugin from the registry, throwing
 * "Plugin already registered". Chaining every operation onto the
 * previous one guarantees strict ordering regardless of exactly how
 * close together React schedules the effect/cleanup calls.
 */
export function useRootLifecycle(insight: Insight): void {
  const internalInsight = getInternalInsight(insight);
  const chainRef = useRef(Promise.resolve());

  useEffect(() => {
    const plugin = createRootLifecyclePlugin({
      registry: internalInsight.rootRegistry,
    });

    chainRef.current = chainRef.current
      .then(() => internalInsight.use(plugin))
      .catch((error) => {
        console.error("[react-insight] Failed to register root lifecycle plugin:", error);
      });

    return () => {
      chainRef.current = chainRef.current
        .then(() => internalInsight.unregisterPlugin(plugin.name))
        .catch((error) => {
          console.error("[react-insight] Failed to unregister root lifecycle plugin:", error);
        });
    };
  }, [internalInsight]);
}