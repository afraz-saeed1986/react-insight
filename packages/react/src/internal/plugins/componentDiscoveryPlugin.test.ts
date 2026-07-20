import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ComponentNode } from "../component";
import { ComponentRegistry } from "../componentRegistry";
import { createInternalRoot } from "../root";
import { RootRegistry } from "../rootRegistry";
import { createComponentDiscoveryPlugin } from "./componentDiscoveryPlugin";

/**
 * Minimal shape of `__REACT_DEVTOOLS_GLOBAL_HOOK__` needed for these
 * tests. Mirrors the (unexported) shape connectHookAdapter() installs,
 * following the same pattern already used in hookAdapter.test.ts.
 *
 * Optional members are typed with an explicit `| undefined` so they can
 * be restored to `undefined` in afterEach() under
 * `exactOptionalPropertyTypes`.
 */
interface FakeReactDevtoolsGlobalHook {
  renderers: Map<number, unknown>;
  onCommitFiberRoot?: ((rendererId: number, root: unknown) => void) | undefined;
  onCommitFiberUnmount?: ((rendererId: number, fiber: unknown) => void) | undefined;
}

type GlobalWithHook = typeof globalThis & {
  __REACT_DEVTOOLS_GLOBAL_HOOK__?: FakeReactDevtoolsGlobalHook | undefined;
};

function getGlobalWithHook(): GlobalWithHook {
  return globalThis as GlobalWithHook;
}

function createFakeHook(): FakeReactDevtoolsGlobalHook {
  return { renderers: new Map() };
}

/**
 * Reads the installed hook, failing fast if setup() did not install one.
 * Keeps test bodies free of repeated undefined-checks.
 */
function getInstalledHook(): FakeReactDevtoolsGlobalHook {
  const hook = getGlobalWithHook().__REACT_DEVTOOLS_GLOBAL_HOOK__;

  if (!hook) {
    throw new Error("Expected the DevTools global hook to be installed.");
  }

  return hook;
}

/**
 * Returns the single component in the registry, narrowing away
 * `undefined` (required because of noUncheckedIndexedAccess) via an
 * explicit guard instead of a non-null assertion.
 */
function getOnlyComponent(registry: ComponentRegistry): ComponentNode {
  const components = [...registry.values()];
  const [component] = components;

  if (!component) {
    throw new Error(`Expected exactly one component, found ${components.length}.`);
  }

  return component;
}

function createFiber(displayName: string) {
  function Component() {
    return null;
  }
  Object.defineProperty(Component, "name", { value: displayName });

  return { type: Component, child: null, sibling: null };
}

describe("createComponentDiscoveryPlugin", () => {
  let originalHook: FakeReactDevtoolsGlobalHook | undefined;

  beforeEach(() => {
    originalHook = getGlobalWithHook().__REACT_DEVTOOLS_GLOBAL_HOOK__;
    getGlobalWithHook().__REACT_DEVTOOLS_GLOBAL_HOOK__ = createFakeHook();
  });

  afterEach(() => {
    getGlobalWithHook().__REACT_DEVTOOLS_GLOBAL_HOOK__ = originalHook;
  });

it("syncs discovered components into the registry on commit", async () => {
    const rootRegistry = new RootRegistry();
    const componentRegistry = new ComponentRegistry();
    const root = createInternalRoot();
    rootRegistry.register(root);

    const plugin = createComponentDiscoveryPlugin({ rootRegistry, componentRegistry });
    await plugin.setup({ emit() {}, on: () => () => {} });

    const appFiber = createFiber("App");
    const fiberRoot = { current: appFiber };

    getInstalledHook().onCommitFiberRoot?.(1, fiberRoot);

    expect(componentRegistry.size).toBe(1);
    const component = getOnlyComponent(componentRegistry);
    expect(component.displayName).toBe("App");
    expect(component.status).toBe("mounted");

    expect(rootRegistry.get(root.id)?.commitCount).toBe(1);
  });

  it("does nothing on commit when no root is registered", async () => {
    const rootRegistry = new RootRegistry();
    const componentRegistry = new ComponentRegistry();

    const plugin = createComponentDiscoveryPlugin({ rootRegistry, componentRegistry });
    await plugin.setup({ emit() {}, on: () => () => {} });

    const fiberRoot = { current: createFiber("App") };
    getInstalledHook().onCommitFiberRoot?.(1, fiberRoot);

    expect(componentRegistry.size).toBe(0);
  });

  it("marks a component as unmounted (without removing it) on onCommitFiberUnmount", async () => {
    const rootRegistry = new RootRegistry();
    const componentRegistry = new ComponentRegistry();
    rootRegistry.register(createInternalRoot());

    const plugin = createComponentDiscoveryPlugin({ rootRegistry, componentRegistry });
    await plugin.setup({ emit() {}, on: () => () => {} });

    const appFiber = createFiber("App");
    const fiberRoot = { current: appFiber };
    const hook = getInstalledHook();

    hook.onCommitFiberRoot?.(1, fiberRoot);
    hook.onCommitFiberUnmount?.(1, appFiber);

    expect(componentRegistry.size).toBe(1);
    const component = getOnlyComponent(componentRegistry);
    expect(component.status).toBe("unmounted");
    expect(component.unmountedAt).not.toBeNull();
  });

  it("disconnects the hook adapter on destroy", async () => {
    const rootRegistry = new RootRegistry();
    const componentRegistry = new ComponentRegistry();

    const plugin = createComponentDiscoveryPlugin({ rootRegistry, componentRegistry });
    await plugin.setup({ emit() {}, on: () => () => {} });

    expect(getInstalledHook().onCommitFiberRoot).toBeDefined();

    await plugin.destroy?.();

    expect(getInstalledHook().onCommitFiberRoot).toBeUndefined();
  });
});