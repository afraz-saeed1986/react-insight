import type { InsightPlugin } from "./types";
import type { RuntimeEventMap } from "../runtime/types";

export function definePlugin<TEvents extends RuntimeEventMap = RuntimeEventMap>(
  plugin: InsightPlugin<TEvents>,
): InsightPlugin<TEvents> {
  return plugin;
}
