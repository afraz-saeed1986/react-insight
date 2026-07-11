import { describe, expect, it, vi } from "vitest";

import { Runtime } from "../../runtime";
import { loggerPlugin } from "./logger";

describe("loggerPlugin", () => {
  it("should log when a plugin is registered", async () => {
    const runtime = new Runtime();

    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    await runtime.registerPlugin(loggerPlugin());

    expect(spy).toHaveBeenCalledWith(
      "[React Insight] Plugin registered: logger",
    );

    spy.mockRestore();
  });
});
