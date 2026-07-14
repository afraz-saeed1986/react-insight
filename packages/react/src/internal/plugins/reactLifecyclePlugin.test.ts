import { describe, expect, it } from "vitest";

import { RootRegistry } from "../rootRegistry";
import { createReactLifecyclePlugin } from "./reactLifecyclePlugin";

describe("createReactLifecyclePlugin", () => {
  it("registers a root during setup", async () => {
    const registry = new RootRegistry();

    const plugin = createReactLifecyclePlugin({
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

    const plugin = createReactLifecyclePlugin({
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
