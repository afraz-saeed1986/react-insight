import { describe, expect, it } from "vitest";

import { definePlugin } from "./definePlugin";
import { PluginManager } from "./PluginManager";

describe("PluginManager", () => {
  it("should register a plugin", () => {
    const manager = new PluginManager();

    const plugin = definePlugin({
      name: "logger",

      setup() {},
    });

    manager.register(plugin);

    expect(manager.list()).toHaveLength(1);

    expect(manager.get("logger")).toBe(plugin);
  });

  it("should throw when registering a plugin with duplicate name", () => {
    const manager = new PluginManager();

    const plugin = definePlugin({
      name: "logger",

      setup() {},
    });

    manager.register(plugin);

    expect(() => manager.register(plugin)).toThrow();

    expect(manager.list()).toHaveLength(1);
  });

  it("should unregister a plugin", () => {
    const manager = new PluginManager();

    const plugin = definePlugin({
      name: "logger",

      setup() {},
    });

    manager.register(plugin);

    expect(manager.list()).toHaveLength(1);

    manager.unregister("logger");

    expect(manager.list()).toHaveLength(0);

    expect(manager.get("logger")).toBeUndefined();
  });

  it("should return undefined for an unknown plugin", () => {
    const manager = new PluginManager();

    expect(manager.get("unknown")).toBeUndefined();
  });

  it("should clear all plugins", () => {
    const manager = new PluginManager();

    manager.register(
      definePlugin({
        name: "logger",

        setup() {},
      }),
    );

    manager.register(
      definePlugin({
        name: "timeline",

        setup() {},
      }),
    );

    expect(manager.list()).toHaveLength(2);

    manager.clear();

    expect(manager.list()).toHaveLength(0);

    expect(manager.get("logger")).toBeUndefined();
    expect(manager.get("timeline")).toBeUndefined();
  });
});
