import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("getCurrentDispatcherRef", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock("react");
  });

  it("returns a live view over React 19's flattened dispatcher slot (.H)", async () => {
    const internals: { H: unknown } = { H: "initial" };
    vi.doMock("react", () => ({
      __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: internals,
    }));

    const { getCurrentDispatcherRef } = await import("./dispatcherAccess");
    const ref = getCurrentDispatcherRef();

    expect(ref?.current).toBe("initial");

    ref!.current = "swapped";
    expect(internals.H).toBe("swapped");
  });

  it("falls back to the pre-19 ReactCurrentDispatcher shape when only that is present", async () => {
    const dispatcherHolder = { current: "pre19" };
    vi.doMock("react", () => ({
      __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: undefined,
      __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: { ReactCurrentDispatcher: dispatcherHolder },
    }));

    const { getCurrentDispatcherRef } = await import("./dispatcherAccess");
    const ref = getCurrentDispatcherRef();

    expect(ref).toBe(dispatcherHolder);
  });

  it("prefers the React 19 shape when both are present", async () => {
    vi.doMock("react", () => ({
      __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: { H: "v19" },
      __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: { ReactCurrentDispatcher: { current: "pre19" } },
    }));

    const { getCurrentDispatcherRef } = await import("./dispatcherAccess");
    const ref = getCurrentDispatcherRef();

    expect(ref?.current).toBe("v19");
  });

    it("returns undefined when neither internals shape is present (e.g. a production build)", async () => {
    vi.doMock("react", () => ({
      __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: undefined,
      __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: undefined,
    }));

    const { getCurrentDispatcherRef } = await import("./dispatcherAccess");
    const ref = getCurrentDispatcherRef();

    expect(ref).toBeUndefined();
  });
});