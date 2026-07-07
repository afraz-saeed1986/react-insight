export interface PluginContext {
  emit(event: string, payload?: unknown): void;
}

export interface InsightPlugin {
  /**
   * Unique plugin name.
   */
  name: string;

  /**
   * Called once when the plugin is registered.
   */
  setup(context: PluginContext): void | Promise<void>;

  /**
   * Called before the plugin is removed.
   */
  destroy?(): void | Promise<void>;
}
