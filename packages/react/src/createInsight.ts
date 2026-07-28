import { Runtime } from "@react-insight/core";

import type { InternalInsight } from "./internal/runtime";
import { runtimeSymbol } from "./internal/runtime";
import type { Insight } from "./types";
import { RootRegistry } from "./internal/rootRegistry";
import { ComponentRegistry } from "./internal/componentRegistry";
import { createComponentDiscoveryPlugin } from "./internal/plugins/componentDiscoveryPlugin";

export function createInsight(): Insight {
  const runtime = new Runtime();
  const rootRegistry = new RootRegistry();
  const componentRegistry = new ComponentRegistry();

  // Registered eagerly, right here, rather than deferred to a React
  // effect inside InsightProvider. Effects always run *after* the
  // commit that triggers them, so a React-effect-based registration
  // structurally can never observe the very first commit of its own
  // tree (the one that mounts InsightProvider itself) — confirmed
  // empirically: onCommitFiberRoot never fired on initial page load
  // under the old effect-based registration. createInsight() runs
  // before ReactDOM.createRoot().render() in the app entry point, so
  // registering here connects the hook adapter in time for that first
  // commit. See DECISIONS.md.
  void runtime.registerPlugin(
    createComponentDiscoveryPlugin({ rootRegistry, componentRegistry }),
  );

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

getComponents() {
      return [...componentRegistry.values()].map((component) => ({
        id: component.id,
        displayName: component.displayName,
        parentId: component.parentId,
        status: component.status,
        renderCount: component.renderCount,
        mountedAt: component.mountedAt,
        lastRenderedAt: component.lastRenderedAt,
        unmountedAt: component.unmountedAt,
        hooks: component.hooks,
      }));
    },

    unregisterPlugin(name) {
      return runtime.unregisterPlugin(name);
    },
  };

  return insight;
}