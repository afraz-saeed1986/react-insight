import type {
  EventArguments,
  EventKey,
  EventListener,
  EventMap,
  Unsubscribe,
} from "./types";
import type { IEventBus } from "./IEventBus";

type ListenerMap<TEvents extends EventMap> = Map<
  EventKey<TEvents>,
  Set<EventListener<any>>
>;

export class EventBus<TEvents extends EventMap> implements IEventBus<TEvents> {
  private readonly listeners: ListenerMap<TEvents> = new Map();

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

    return () => this.off(event, listener);
  }

  public once<TKey extends EventKey<TEvents>>(
    event: TKey,
    listener: EventListener<TEvents[TKey]>,
  ): Unsubscribe {
    const unsubscribe = this.on(event, (payload) => {
      unsubscribe();
      listener(payload);
    });

    return unsubscribe;
  }

  public off<TKey extends EventKey<TEvents>>(
    event: TKey,
    listener: EventListener<TEvents[TKey]>,
  ): void {
    const listeners = this.listeners.get(event);

    if (!listeners) {
      return;
    }

    listeners.delete(listener as EventListener<any>);

    if (listeners.size === 0) {
      this.listeners.delete(event);
    }
  }

  public emit<TKey extends EventKey<TEvents>>(
    event: TKey,
    ...args: EventArguments<TEvents, TKey>
  ): void {
    const listeners = this.listeners.get(event);

    if (!listeners) {
      return;
    }

    for (const listener of listeners) {
      listener(args[0] as TEvents[TKey]);
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}
