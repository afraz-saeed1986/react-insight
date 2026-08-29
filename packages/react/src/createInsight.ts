import { Runtime } from "@react-insight/core";

import type { InternalInsight } from "./internal/runtime";
import { runtimeSymbol } from "./internal/runtime";
import type { Insight, ComponentSnapshot } from "./types";
import type { ComponentNode } from "./internal/component";
import { RootRegistry } from "./internal/rootRegistry";
import { ComponentRegistry } from "./internal/componentRegistry";
import { createComponentDiscoveryPlugin } from "./internal/plugins/componentDiscoveryPlugin";

/**
 * Maps the internal ComponentNode shape to the public, decoupled
 * ComponentSnapshot contract. Shared by getComponents() and
 * getComponent() so the mapping is defined in exactly one place.
 */
function toSnapshot(component: ComponentNode): ComponentSnapshot {
  return {
    id: component.id,
    displayName: component.displayName,
    parentId: component.parentId,
    status: component.status,
    renderCount: component.renderCount,
    mountedAt: component.mountedAt,
    lastRenderedAt: component.lastRenderedAt,
    unmountedAt: component.unmountedAt,
    hooks: component.hooks,
    contexts: component.contexts,
  };
}

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
runtime
  .registerPlugin(
    createComponentDiscoveryPlugin({ rootRegistry, componentRegistry }),
  )
  .catch((error: unknown) => {
    console.error(
      "[react-insight] Failed to register the Component Discovery plugin:",
      error,
    );
  });

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
      return [...componentRegistry.values()].map(toSnapshot);
    },

    getComponent(id) {
      const component = componentRegistry.get(id);
      return component ? toSnapshot(component) : undefined;
    },

    unregisterPlugin(name) {
      return runtime.unregisterPlugin(name);
    },

    onChange(listener) {
      return componentRegistry.subscribe(listener);
    },
  };

  return insight;
}