import { describe, expect, it, vi } from "vitest";
import type { EventMap } from "./types";

import { EventBus } from "./EventBus";

interface TestEvents extends EventMap {
  message: string;
  count: number;
}

describe("EventBus", () => {
  it("registers and emits an event", () => {
    const bus = new EventBus<TestEvents>();

    const listener = vi.fn();

    bus.on("message", listener);

    bus.emit("message", "Hello");

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith("Hello");
  });

  it("supports multiple listeners", () => {
    const bus = new EventBus<TestEvents>();

    const first = vi.fn();
    const second = vi.fn();

    bus.on("message", first);
    bus.on("message", second);

    bus.emit("message", "Hello");

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it("removes a listener with off()", () => {
    const bus = new EventBus<TestEvents>();

    const listener = vi.fn();

    bus.on("message", listener);

    bus.off("message", listener);

    bus.emit("message", "Hello");

    expect(listener).not.toHaveBeenCalled();
  });

  it("returns an unsubscribe function", () => {
    const bus = new EventBus<TestEvents>();

    const listener = vi.fn();

    const unsubscribe = bus.on("message", listener);

    unsubscribe();

    bus.emit("message", "Hello");

    expect(listener).not.toHaveBeenCalled();
  });

  it("supports once()", () => {
    const bus = new EventBus<TestEvents>();

    const listener = vi.fn();

    bus.once("message", listener);

    bus.emit("message", "First");
    bus.emit("message", "Second");

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith("First");
  });

  it("clears all listeners", () => {
    const bus = new EventBus<TestEvents>();

    const listener = vi.fn();

    bus.on("message", listener);

    bus.clear();

    bus.emit("message", "Hello");

    expect(listener).not.toHaveBeenCalled();
  });
});
