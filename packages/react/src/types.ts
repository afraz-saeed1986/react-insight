import type { InsightPlugin } from "@react-insight/core";

export interface Insight {
  use(plugin: InsightPlugin): Promise<void>;

  destroy(): Promise<void>;
}
