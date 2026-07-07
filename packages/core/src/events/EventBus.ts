import type { EventKey, EventListener, EventMap, Unsubscribe } from "./types";

export class EventBus<TEvents extends EventMap> {
  private readonly listeners = new Map<
    EventKey<TEvents>,
    Set<EventListener<any>>
  >();

  public on<TKey extends EventKey<TEvents>>(
    event: TKey,
    listener: EventListener<TEvents[TKey]>,
  ): Unsubscribe {
    let listeners = this.listeners.get(event);

    if (!listeners) {
      listeners = new Set();
      this.listeners.set(event, listeners);
    }

    listeners.add(listener as EventListener<any>);

    return () => {
      listeners.delete(listener as EventListener<any>);
    };
  }

  public emit<TKey extends EventKey<TEvents>>(
    event: TKey,
    payload: TEvents[TKey],
  ): void {
    const listeners = this.listeners.get(event);

    if (!listeners) {
      return;
    }

    for (const listener of listeners) {
      listener(payload);
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}
