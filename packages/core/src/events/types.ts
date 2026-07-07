/**
 * Base contract for all event maps.
 *
 * Example:
 *
 * interface InsightEvents {
 *   ready: void;
 *   render: {
 *     component: string;
 *     duration: number;
 *   };
 * }
 */
export interface EventMap {
  [event: string]: unknown;
}

/**
 * Valid event names.
 */
export type EventKey<TEvents extends EventMap> = Extract<keyof TEvents, string>;

/**
 * Payload type for a specific event.
 */
export type EventPayload<
  TEvents extends EventMap,
  TKey extends EventKey<TEvents>,
> = TEvents[TKey];

/**
 * Event listener.
 */
export type EventListener<TPayload> = (payload: TPayload) => void;

/**
 * Function returned by `on()` to unsubscribe.
 */
export type Unsubscribe = () => void;

export type EventArguments<
  TEvents extends EventMap,
  TKey extends EventKey<TEvents>,
> =
  EventPayload<TEvents, TKey> extends void
    ? []
    : [payload: EventPayload<TEvents, TKey>];
