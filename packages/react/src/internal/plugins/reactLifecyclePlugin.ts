import { definePlugin, type InsightPlugin } from "@react-insight/core";

import { createInternalRoot } from "../root";
import type { RootRegistry } from "../rootRegistry";

export interface ReactLifecyclePluginOptions {
  readonly registry: RootRegistry;
}

export function createReactLifecyclePlugin(
  options: ReactLifecyclePluginOptions,
): InsightPlugin {
  const root = createInternalRoot();

  return definePlugin({
    name: "react:lifecycle",

    setup() {
      options.registry.register(root);
    },

    destroy() {
      options.registry.unregister(root.id);
    },
  });
}
