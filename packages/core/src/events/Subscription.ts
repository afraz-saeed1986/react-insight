import type { EventKey, EventListener, EventMap, EventPayload } from "./types";

export interface SubscriptionOptions {
  once?: boolean;
  priority?: number;
  owner?: string;
}

export class Subscription<
  TEvents extends EventMap,
  TKey extends EventKey<TEvents>,
> {
  public readonly id: string;

  public readonly event: TKey;

  public readonly listener: EventListener<EventPayload<TEvents, TKey>>;

  public readonly once: boolean;

  public readonly priority: number;

  public readonly owner?: string;

  public readonly createdAt: number;

  public constructor(
    id: string,
    event: TKey,
    listener: EventListener<EventPayload<TEvents, TKey>>,
    options: SubscriptionOptions = {},
  ) {
    this.id = id;
    this.event = event;
    this.listener = listener;
    this.once = options.once ?? false;
    this.priority = options.priority ?? 0;
    if (options.owner !== undefined) {
      this.owner = options.owner;
    }
    this.createdAt = Date.now();
  }
}
