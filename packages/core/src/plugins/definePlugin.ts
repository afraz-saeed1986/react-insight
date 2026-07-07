import type { InsightPlugin } from "./types";

export function definePlugin<T extends InsightPlugin>(plugin: T): T {
  return plugin;
}
