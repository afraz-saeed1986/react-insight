import { describe, expect, it, vi } from "vitest";

import { connectHookAdapter } from "./hookAdapter";

function createFakeGlobal() {
  return {} as typeof globalThis;
}

describe("connectHookAdapter", () => {
  it("installs the hook when it does not exist yet", () => {
    const fakeGlobal = createFakeGlobal();

    connectHookAdapter({ onCommit: vi.fn(), onUnmount: vi.fn() }, fakeGlobal);

    expect(
      (fakeGlobal as { __REACT_DEVTOOLS_GLOBAL_HOOK__?: unknown })
        .__REACT_DEVTOOLS_GLOBAL_HOOK__,
    ).toBeDefined();
  });

  it("chains an existing onCommitFiberRoot instead of overwriting it", () => {
    const previousOnCommit = vi.fn();
    const fakeGlobal = {
      __REACT_DEVTOOLS_GLOBAL_HOOK__: {
        renderers: new Map(),
        onCommitFiberRoot: previousOnCommit,
      },
    } as unknown as typeof globalThis;

    const onCommit = vi.fn();
    connectHookAdapter({ onCommit, onUnmount: vi.fn() }, fakeGlobal);

    const hook = (
      fakeGlobal as unknown as {
        __REACT_DEVTOOLS_GLOBAL_HOOK__: {
          onCommitFiberRoot: (rendererId: number, root: unknown) => void;
        };
      }
    ).__REACT_DEVTOOLS_GLOBAL_HOOK__;

    hook.onCommitFiberRoot(1, { fake: "root" });

    expect(previousOnCommit).toHaveBeenCalledWith(1, { fake: "root" }, undefined);
    expect(onCommit).toHaveBeenCalledWith({ fake: "root" });
  });

  it("chains an existing onCommitFiberUnmount instead of overwriting it", () => {
    const previousOnUnmount = vi.fn();
    const fakeGlobal = {
      __REACT_DEVTOOLS_GLOBAL_HOOK__: {
        renderers: new Map(),
        onCommitFiberUnmount: previousOnUnmount,
      },
    } as unknown as typeof globalThis;

    const onUnmount = vi.fn();
    connectHookAdapter({ onCommit: vi.fn(), onUnmount }, fakeGlobal);

    const hook = (
      fakeGlobal as unknown as {
        __REACT_DEVTOOLS_GLOBAL_HOOK__: {
          onCommitFiberUnmount: (rendererId: number, fiber: unknown) => void;
        };
      }
    ).__REACT_DEVTOOLS_GLOBAL_HOOK__;

    hook.onCommitFiberUnmount(1, { fake: "fiber" });

    expect(previousOnUnmount).toHaveBeenCalledWith(1, { fake: "fiber" });
    expect(onUnmount).toHaveBeenCalledWith({ fake: "fiber" });
  });

  it("isolates errors thrown by callbacks instead of letting them propagate", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fakeGlobal = createFakeGlobal();

    connectHookAdapter(
      {
        onCommit: () => {
          throw new Error("boom");
        },
        onUnmount: vi.fn(),
      },
      fakeGlobal,
    );

    const hook = (
      fakeGlobal as unknown as {
        __REACT_DEVTOOLS_GLOBAL_HOOK__: {
          onCommitFiberRoot: (rendererId: number, root: unknown) => void;
        };
      }
    ).__REACT_DEVTOOLS_GLOBAL_HOOK__;

    expect(() => hook.onCommitFiberRoot(1, {})).not.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("restores both previous callbacks on disconnect", () => {
    const previousOnCommit = vi.fn();
    const previousOnUnmount = vi.fn();
    const fakeGlobal = {
      __REACT_DEVTOOLS_GLOBAL_HOOK__: {
        renderers: new Map(),
        onCommitFiberRoot: previousOnCommit,
        onCommitFiberUnmount: previousOnUnmount,
      },
    } as unknown as typeof globalThis;

    const disconnect = connectHookAdapter(
      { onCommit: vi.fn(), onUnmount: vi.fn() },
      fakeGlobal,
    );

    disconnect();

    const hook = (
      fakeGlobal as unknown as {
        __REACT_DEVTOOLS_GLOBAL_HOOK__: {
          onCommitFiberRoot: unknown;
          onCommitFiberUnmount: unknown;
        };
      }
    ).__REACT_DEVTOOLS_GLOBAL_HOOK__;

    expect(hook.onCommitFiberRoot).toBe(previousOnCommit);
    expect(hook.onCommitFiberUnmount).toBe(previousOnUnmount);
  });
});