import { describe, expect, it } from "vitest";

import { Subscription } from "./Subscription";
import { SubscriptionRegistry } from "./SubscriptionRegistry";
import type { EventMap } from "./types";

interface TestEvents extends EventMap {
  message: string;
  count: number;
}

function createSubscription(
  id: string,
  priority = 0,
): Subscription<TestEvents, "message"> {
  return new Subscription(id, "message", () => {}, {
    priority,
  });
}

describe("SubscriptionRegistry", () => {
  it("adds a subscription", () => {
    const registry = new SubscriptionRegistry<TestEvents>();

    const subscription = createSubscription("1");

    registry.add(subscription);

    expect(registry.has("message")).toBe(true);
    expect(registry.count("message")).toBe(1);
    expect(registry.size()).toBe(1);
  });

  it("returns subscriptions for an event", () => {
    const registry = new SubscriptionRegistry<TestEvents>();

    const subscription = createSubscription("1");

    registry.add(subscription);

    expect(registry.get("message")).toEqual([subscription]);
  });

  it("sorts subscriptions by priority", () => {
    const registry = new SubscriptionRegistry<TestEvents>();

    const low = createSubscription("low", 1);
    const high = createSubscription("high", 100);
    const medium = createSubscription("medium", 10);

    registry.add(low);
    registry.add(high);
    registry.add(medium);

    expect(registry.get("message").map((s) => s.id)).toEqual([
      "high",
      "medium",
      "low",
    ]);
  });

  it("removes a subscription", () => {
    const registry = new SubscriptionRegistry<TestEvents>();

    const subscription = createSubscription("1");

    registry.add(subscription);

    expect(registry.remove("1")).toBe(true);

    expect(registry.has("message")).toBe(false);
    expect(registry.count("message")).toBe(0);
    expect(registry.size()).toBe(0);
  });

  it("returns false when removing an unknown subscription", () => {
    const registry = new SubscriptionRegistry<TestEvents>();

    expect(registry.remove("unknown")).toBe(false);
  });

  it("clears all subscriptions", () => {
    const registry = new SubscriptionRegistry<TestEvents>();

    registry.add(createSubscription("1"));
    registry.add(createSubscription("2"));

    registry.clear();

    expect(registry.size()).toBe(0);
    expect(registry.has("message")).toBe(false);
  });

  it("counts subscriptions across events", () => {
    interface MultiEvents extends EventMap {
      message: string;
      count: number;
    }

    const registry = new SubscriptionRegistry<MultiEvents>();

    registry.add(new Subscription("1", "message", () => {}));

    registry.add(new Subscription("2", "count", () => {}));

    expect(registry.size()).toBe(2);
    expect(registry.count("message")).toBe(1);
    expect(registry.count("count")).toBe(1);
  });
});
