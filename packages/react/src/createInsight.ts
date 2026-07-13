import { Runtime } from "@react-insight/core";

import type { InternalInsight } from "./internal/runtime";
import { runtimeSymbol } from "./internal/runtime";
import type { Insight } from "./types";

export function createInsight(): Insight {
  const runtime = new Runtime();

  const insight: InternalInsight = {
    [runtimeSymbol]: runtime,

    use(plugin) {
      return runtime.registerPlugin(plugin);
    },

    destroy() {
      return runtime.destroy();
    },
  };

  return insight;
}
