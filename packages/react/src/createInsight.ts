import { Runtime } from "@react-insight/core";

import type { InternalInsight } from "./internal/runtime";
import { runtimeSymbol } from "./internal/runtime";
import type { Insight } from "./types";
import { RootRegistry } from "./internal/rootRegistry";
import { ComponentRegistry } from "./internal/componentRegistry";

export function createInsight(): Insight {
  const runtime = new Runtime();
  const rootRegistry = new RootRegistry();
  const componentRegistry = new ComponentRegistry();

  const insight: InternalInsight = {
    [runtimeSymbol]: runtime,
    rootRegistry,
    componentRegistry,

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
