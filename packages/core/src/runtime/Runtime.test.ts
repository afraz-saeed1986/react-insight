import { describe, expect, it, vi } from "vitest";

import { definePlugin } from "../plugins";
import { Runtime } from "./Runtime";

describe("Runtime", () => {
  it("should register a plugin and call setup", async () => {
    const setup = vi.fn();

    const runtime = new Runtime();

    const plugin = definePlugin({
      name: "test-plugin",

      setup,
    });

    await runtime.registerPlugin(plugin);

    expect(setup).toHaveBeenCalledTimes(1);

    expect(runtime.plugins).toHaveLength(1);

    expect(runtime.plugins[0]).toBe(plugin);
  });

  it("should emit plugin:registered event", async () => {
    const runtime = new Runtime();

    const registered = vi.fn();

    runtime.on("plugin:registered", registered);

    const plugin = definePlugin({
      name: "logger",

      setup() {},
    });

    await runtime.registerPlugin(plugin);

    expect(registered).toHaveBeenCalledTimes(1);

    expect(registered).toHaveBeenCalledWith({
      name: "logger",
    });
  });

  it("should unregister a plugin and call destroy", async () => {
    const destroy = vi.fn();

    const runtime = new Runtime();

    const plugin = definePlugin({
      name: "test-plugin",

      setup() {},

      destroy,
    });

    await runtime.registerPlugin(plugin);

    expect(runtime.plugins).toHaveLength(1);

    await runtime.unregisterPlugin("test-plugin");

    expect(destroy).toHaveBeenCalledTimes(1);

    expect(runtime.plugins).toHaveLength(0);
  });

  it("should emit plugin:removed event", async () => {
    const runtime = new Runtime();

    const removed = vi.fn();

    runtime.on("plugin:removed", removed);

    const plugin = definePlugin({
      name: "logger",

      setup() {},
    });

    await runtime.registerPlugin(plugin);
    await runtime.unregisterPlugin("logger");

    expect(removed).toHaveBeenCalledTimes(1);

    expect(removed).toHaveBeenCalledWith({
      name: "logger",
    });
  });

  it("should not register plugin when setup throws", async () => {
    const runtime = new Runtime();

    const plugin = definePlugin({
      name: "broken-plugin",

      setup() {
        throw new Error("Setup failed");
      },
    });

    await expect(runtime.registerPlugin(plugin)).rejects.toThrow(
      "Setup failed",
    );

    expect(runtime.plugins).toHaveLength(0);
  });

  it("should throw when registering a plugin with duplicate name", async () => {
    const runtime = new Runtime();

    const plugin = definePlugin({
      name: "logger",

      setup() {},
    });

    await runtime.registerPlugin(plugin);

    await expect(runtime.registerPlugin(plugin)).rejects.toThrow();

    expect(runtime.plugins).toHaveLength(1);
  });
});
