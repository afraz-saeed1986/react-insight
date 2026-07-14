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
});
