import { describe, expect, it } from "vitest";

import { RootRegistry } from "../rootRegistry";
import { createRootLifecyclePlugin } from "./rootLifecyclePlugin";

describe("createReactLifecyclePlugin", () => {
  it("registers a root during setup", async () => {
    const registry = new RootRegistry();

    const plugin = createRootLifecyclePlugin({
      registry,
    });

    expect(registry.size).toBe(0);

    await plugin.setup({
      emit() {},
      on() {
        return () => {};
      },
    });

    expect(registry.size).toBe(1);
  });

  it("unregisters the root during destroy", async () => {
    const registry = new RootRegistry();

    const plugin = createRootLifecyclePlugin({
      registry,
    });

    await plugin.setup({
      emit() {},
      on() {
        return () => {};
      },
    });

    expect(registry.size).toBe(1);

    await plugin.destroy?.();

    expect(registry.size).toBe(0);
  });
});
