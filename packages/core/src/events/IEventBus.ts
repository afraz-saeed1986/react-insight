import type {
  EventKey,
  EventListener,
  EventMap,
  EventPayload,
  Unsubscribe,
} from "./types";

export interface IEventBus<TEvents extends EventMap> {
  /**
   * Subscribe to an event.
   *
   * Returns a function that unsubscribes the listener.
   */
  on<TKey extends EventKey<TEvents>>(
    event: TKey,
    listener: EventListener<EventPayload<TEvents, TKey>>,
  ): Unsubscribe;

  /**
   * Subscribe only once.
   */
  once<TKey extends EventKey<TEvents>>(
    event: TKey,
    listener: EventListener<EventPayload<TEvents, TKey>>,
  ): Unsubscribe;

  /**
   * Remove a listener.
   */
  off<TKey extends EventKey<TEvents>>(
    event: TKey,
    listener: EventListener<EventPayload<TEvents, TKey>>,
  ): void;

  /**
   * Emit an event.
   */
  emit<TKey extends EventKey<TEvents>>(
    event: TKey,
    ...args: EventArguments<TEvents, TKey>
  ): void;

  /**
   * Remove every listener.
   */
  clear(): void;
}
