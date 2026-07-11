import { Runtime } from "../../runtime";
import { loggerPlugin } from "./logger";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let logSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
});

describe("loggerPlugin", () => {
  it("should log when a plugin is registered", async () => {
    const runtime = new Runtime();

    // const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    await runtime.registerPlugin(loggerPlugin());

    expect(logSpy).toHaveBeenCalledWith(
      "[React Insight] Plugin registered: logger",
    );

    logSpy.mockRestore();
  });

  it("should log when another plugin is registered", async () => {
    const runtime = new Runtime();

    // const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    await runtime.registerPlugin(loggerPlugin());

    await runtime.registerPlugin({
      name: "test",
      setup() {},
    });

    expect(logSpy).toHaveBeenCalledWith(
      "[React Insight] Plugin registered: test",
    );

    logSpy.mockRestore();
  });

  it("should log when a plugin is removed", async () => {
    const runtime = new Runtime();

    // const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    await runtime.registerPlugin(loggerPlugin());

    await runtime.registerPlugin({
      name: "test",
      setup() {},
    });

    await runtime.unregisterPlugin("test");

    expect(logSpy).toHaveBeenCalledWith("[React Insight] Plugin removed: test");

    logSpy.mockRestore();
  });

  it("should dispose listeners when destroyed", async () => {
    const runtime = new Runtime();

    // const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    await runtime.registerPlugin(loggerPlugin());

    await runtime.destroy();

    expect(logSpy).toHaveBeenCalledWith("[React Insight] Logger destroyed.");

    logSpy.mockRestore();
  });
});
