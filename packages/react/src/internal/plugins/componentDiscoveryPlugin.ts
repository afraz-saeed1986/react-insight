import { definePlugin, type InsightPlugin } from "@react-insight/core";

import type { ComponentRegistry } from "../componentRegistry";
import type { RootRegistry } from "../rootRegistry";
import { asFiberNode, getFiberTraversalEntry } from "../discovery/fiberAdapter";
import { mapDiscoveredComponent } from "../discovery/componentMapper";
import { getFiberId, traverse } from "../discovery/traversal";
import { connectHookAdapter } from "../discovery/hookAdapter";

export interface ComponentDiscoveryPluginOptions {
  readonly rootRegistry: RootRegistry;
  readonly componentRegistry: ComponentRegistry;
}

/**
 * Used to tag components discovered before any root has been
 * registered yet.
 *
 * componentDiscoveryPlugin is registered eagerly in createInsight()
 * (see createInsight.ts) so it can observe the very first commit, but
 * root registration is still effect-based (useRootLifecycle), which
 * only runs after that first commit. Without this fallback, the first
 * commit's components would be silently dropped forever, since
 * StrictMode's mount/cleanup/mount only re-runs effects, not a full
 * tree commit.
 *
 * Self-heals on the next commit: ComponentRegistry.sync() always
 * updates rootId unconditionally (see componentRegistry.ts), so once
 * the real root registers, these components pick up the correct
 * rootId at no extra cost.
 */
const PENDING_ROOT_ID = "pending";

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

          if (activeRoot) {
            options.rootRegistry.recordCommit(activeRoot.id);
          }

          const rootId = activeRoot ? String(activeRoot.id) : PENDING_ROOT_ID;

          const entry = getFiberTraversalEntry(root);

          if (!entry) return;

          const discovered = traverse(entry, rootId);

          for (const component of discovered) {
            options.componentRegistry.sync(mapDiscoveredComponent(component));
          }
        },

        onUnmount(fiber) {
          const node = asFiberNode(fiber);

          if (!node) return;

          options.componentRegistry.markUnmounted(getFiberId(node));
        },
      });
    },

    destroy() {
      disconnect?.();
      disconnect = null;
    },
  });
}