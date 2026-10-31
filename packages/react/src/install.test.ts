import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const HOOK_KEY = "__REACT_DEVTOOLS_GLOBAL_HOOK__";

type GlobalWithHook = typeof globalThis & { [HOOK_KEY]?: unknown };

function readHook(): unknown {
  return (globalThis as GlobalWithHook)[HOOK_KEY];
}

function clearHook(): void {
  delete (globalThis as GlobalWithHook)[HOOK_KEY];
}

describe("install entry", () => {
  beforeEach(() => {
    vi.resetModules();
    clearHook();
  });

  afterEach(() => {
    clearHook();
  });

  it("installs the DevTools global hook as a side effect of importing it", async () => {
    expect(readHook()).toBeUndefined();

    await import("./install");

    expect(readHook()).toBeDefined();
  });

  it("can be combined with an explicit installReactDevtoolsHook() call", async () => {
    await import("./install");
    const installed = readHook();

    const { installReactDevtoolsHook } = await import(
      "./internal/discovery/hookAdapter"
    );
    installReactDevtoolsHook();

    expect(readHook()).toBe(installed);
  });
});