import mitt, { type Emitter } from "mitt";

import { PluginManager } from "../plugins/PluginManager";
import type { PluginContext, InsightPlugin } from "../plugins/types";
import type { RuntimeEventMap } from "./types";

export class Runtime<TEvents extends RuntimeEventMap = RuntimeEventMap> {
  private readonly emitter: Emitter<TEvents>;

  private readonly pluginManager: PluginManager<TEvents>;

  public constructor() {
    this.emitter = mitt<TEvents>();
    this.pluginManager = new PluginManager<TEvents>();
  }

  public async registerPlugin(plugin: InsightPlugin<TEvents>): Promise<void> {
    this.pluginManager.register(plugin);

    const context: PluginContext<TEvents> = {
      emit: (event, payload) => {
        this.emitter.emit(event, payload);
      },

      on: (event, listener) => {
        this.emitter.on(event, listener);

        return () => {
          this.emitter.off(event, listener);
        };
      },
    };

    try {
      await plugin.setup(context);
    } catch (error) {
      this.pluginManager.unregister(plugin.name);
      throw error;
    }

    this.emit("plugin:registered", {
      name: plugin.name,
    });
  }

  public async unregisterPlugin(name: string): Promise<void> {
    const plugin = this.pluginManager.get(name);

    if (!plugin) {
      return;
    }

    await plugin.destroy?.();

    this.emit("plugin:removed", {
      name,
    });

    this.pluginManager.unregister(name);
  }

  public on<TKey extends keyof TEvents>(
    event: TKey,
    handler: (payload: TEvents[TKey]) => void,
  ): () => void {
    this.emitter.on(event, handler);

    return () => {
      this.emitter.off(event, handler);
    };
  }

  public emit<TKey extends keyof TEvents>(
    event: TKey,
    payload: TEvents[TKey],
  ): void {
    this.emitter.emit(event, payload);
  }

  public clear(): void {
    this.pluginManager.clear();
  }

  public get plugins(): readonly InsightPlugin<TEvents>[] {
    return this.pluginManager.list();
  }
}
