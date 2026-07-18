import { definePlugin, type InsightPlugin } from "@react-insight/core";

import type { ComponentRegistry } from "../componentRegistry";
import type { RootRegistry } from "../rootRegistry";
import { getFiberTraversalEntry } from "../discovery/fiberAdapter";
import { mapDiscoveredComponent } from "../discovery/componentMapper";
import { traverse } from "../discovery/traversal";
import { connectHookAdapter } from "../discovery/hookAdapter";

export interface ComponentDiscoveryPluginOptions {
  readonly rootRegistry: RootRegistry;
  readonly componentRegistry: ComponentRegistry;
}

export function createComponentDiscoveryPlugin(
  options: ComponentDiscoveryPluginOptions,
): InsightPlugin {
  let disconnect: (() => void) | null = null;

  return definePlugin({
    name: "react:discovery",

    setup() {
      disconnect = connectHookAdapter({
        onCommit(root) {
          // Discovery currently assumes a single React application per
          // page. See DECISIONS.md, 2026-07-18.
          const activeRoot = options.rootRegistry.list()[0];

          if (!activeRoot) return;

          const entry = getFiberTraversalEntry(root);

          if (!entry) return;

          const discovered = traverse(entry, String(activeRoot.id));

          for (const component of discovered) {
            options.componentRegistry.sync(mapDiscoveredComponent(component));
          }
        },
      });
    },

    destroy() {
      disconnect?.();
      disconnect = null;
    },
  });
}