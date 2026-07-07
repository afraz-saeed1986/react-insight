import type { EventKey, EventMap } from "./types";
import { Subscription } from "./Subscription";

export class SubscriptionRegistry<TEvents extends EventMap> {
  private readonly subscriptions = new Map<
    EventKey<TEvents>,
    Subscription<TEvents, EventKey<TEvents>>[]
  >();

  public add<TKey extends EventKey<TEvents>>(
    subscription: Subscription<TEvents, TKey>,
  ): void {}

  public remove(id: string): boolean {
    return false;
  }

  public get<TKey extends EventKey<TEvents>>(
    event: TKey,
  ): readonly Subscription<TEvents, TKey>[] {
    return [];
  }

  public clear(): void {
    this.subscriptions.clear();
  }
}
