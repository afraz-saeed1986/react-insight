import { Runtime } from "@react-insight/core";

import type { InternalInsight } from "./internal/runtime";
import { runtimeSymbol } from "./internal/runtime";
import type { Insight } from "./types";
import { RootRegistry } from "./internal/rootRegistry";

export function createInsight(): Insight {
  const runtime = new Runtime();
  const rootRegistry = new RootRegistry();

  const insight: InternalInsight = {
    [runtimeSymbol]: runtime,
    rootRegistry,

    use(plugin) {
      return runtime.registerPlugin(plugin);
    },

    destroy() {
      return runtime.destroy();
    },

    unregisterPlugin(name) {
      return runtime.unregisterPlugin(name);
    },
  };

  return insight;
}
