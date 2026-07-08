export interface PluginContext<TEvents extends object> {
  emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]): void;

  on<TKey extends keyof TEvents>(
    event: TKey,
    listener: (payload: TEvents[TKey]) => void,
  ): () => void;
}

export interface InsightPlugin<TEvents extends object = object> {
  /**
   * Unique plugin name.
   */
  name: string;

  /**
   * Called once when the plugin is registered.
   */
  setup(context: PluginContext<TEvents>): void | Promise<void>;

  /**
   * Called before the plugin is removed.
   */
  destroy?(): void | Promise<void>;
}
