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

  it("should ignore unregistering an unknown plugin", async () => {
    const runtime = new Runtime();

    await expect(runtime.unregisterPlugin("unknown")).resolves.toBeUndefined();

    expect(runtime.plugins).toHaveLength(0);
  });

  it("should destroy runtime and unregister plugins in reverse order", async () => {
    const runtime = new Runtime();

    const calls: string[] = [];

    const pluginA = definePlugin({
      name: "plugin-a",

      setup() {},

      destroy() {
        calls.push("plugin-a");
      },
    });

    const pluginB = definePlugin({
      name: "plugin-b",

      setup() {},

      destroy() {
        calls.push("plugin-b");
      },
    });

    await runtime.registerPlugin(pluginA);
    await runtime.registerPlugin(pluginB);

    await runtime.destroy();

    expect(calls).toEqual(["plugin-b", "plugin-a"]);
  });

  it("should throw after runtime is destroyed", async () => {
    const runtime = new Runtime();

    await runtime.destroy();

    expect(() => runtime.plugins).toThrow("Runtime has been destroyed.");

    expect(() =>
      runtime.emit("plugin:registered", {
        name: "test",
      }),
    ).toThrow("Runtime has been destroyed.");

    expect(() => runtime.on("plugin:registered", () => {})).toThrow(
      "Runtime has been destroyed.",
    );

    await expect(
      runtime.registerPlugin(
        definePlugin({
          name: "plugin",

          setup() {},
        }),
      ),
    ).rejects.toThrow("Runtime has been destroyed.");

    await expect(runtime.unregisterPlugin("plugin")).rejects.toThrow(
      "Runtime has been destroyed.",
    );
  });
  it("should ignore destroying runtime twice", async () => {
    const runtime = new Runtime();

    await runtime.destroy();

    await expect(runtime.destroy()).resolves.toBeUndefined();
  });
});
