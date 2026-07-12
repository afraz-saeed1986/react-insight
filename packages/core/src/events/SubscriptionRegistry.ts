import type { EventKey, EventMap } from "./types";
import type { Subscription } from "./Subscription";

export class SubscriptionRegistry<TEvents extends EventMap> {
  private readonly subscriptions = new Map<
    EventKey<TEvents>,
    Subscription<TEvents, EventKey<TEvents>>[]
  >();

  public add<TKey extends EventKey<TEvents>>(
    subscription: Subscription<TEvents, TKey>,
  ): void {
    const event = subscription.event;

    const subscriptions = this.subscriptions.get(event) ?? [];

    // SAFETY:
    // The map is keyed by `subscription.event`, therefore every array only contains
    // subscriptions for the same event key. TypeScript cannot currently express
    // this key/value relationship for Map, so a cast is required here.
    subscriptions.push(
      subscription as unknown as Subscription<TEvents, EventKey<TEvents>>,
    );

    subscriptions.sort((a, b) => b.priority - a.priority);

    this.subscriptions.set(event, subscriptions);
  }

  public remove(id: string): boolean {
    for (const [event, subscriptions] of this.subscriptions) {
      const index = subscriptions.findIndex(
        (subscription) => subscription.id === id,
      );

      if (index === -1) {
        continue;
      }

      subscriptions.splice(index, 1);

      if (subscriptions.length === 0) {
        this.subscriptions.delete(event);
      }

      return true;
    }

    return false;
  }

  public get<TKey extends EventKey<TEvents>>(
    event: TKey,
  ): readonly Subscription<TEvents, TKey>[] {
    return (
      (this.subscriptions.get(event) as
        | Subscription<TEvents, TKey>[]
        | undefined) ?? []
    );
  }

  public clear(): void {
    this.subscriptions.clear();
  }

  public has<TKey extends EventKey<TEvents>>(event: TKey): boolean {
    return (this.subscriptions.get(event)?.length ?? 0) > 0;
  }

  public count<TKey extends EventKey<TEvents>>(event: TKey): number {
    return this.subscriptions.get(event)?.length ?? 0;
  }

  public size(): number {
    let total = 0;

    for (const subscriptions of this.subscriptions.values()) {
      total += subscriptions.length;
    }

    return total;
  }
}
