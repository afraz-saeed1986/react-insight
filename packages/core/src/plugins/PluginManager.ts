import type { InsightPlugin } from "./types";

export class PluginManager {
  private readonly plugins = new Map<string, InsightPlugin>();

  public register(plugin: InsightPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered.`);
    }

    this.plugins.set(plugin.name, plugin);
  }

  public unregister(name: string): boolean {
    return this.plugins.delete(name);
  }

  public get(name: string): InsightPlugin | undefined {
    return this.plugins.get(name);
  }

  public has(name: string): boolean {
    return this.plugins.has(name);
  }

  public list(): readonly InsightPlugin[] {
    return [...this.plugins.values()];
  }

  public clear(): void {
    this.plugins.clear();
  }

  public get size(): number {
    return this.plugins.size;
  }
}
