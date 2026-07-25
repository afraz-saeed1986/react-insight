import type { InsightPlugin } from "@react-insight/core";

/**
 * Public, read-only snapshot of a discovered component.
 *
 * Intentionally decoupled from the internal ComponentNode shape so the
 * internal representation can evolve without breaking this contract.
 */
export interface ComponentSnapshot {
  readonly id: string;
  readonly displayName: string;
  readonly parentId: string | null;
  readonly status: "mounted" | "unmounted";
  readonly renderCount: number;
  readonly mountedAt: number;
  readonly lastRenderedAt: number | null;
  readonly unmountedAt: number | null;
}

export interface Insight {
  use(plugin: InsightPlugin): Promise<void>;

  destroy(): Promise<void>;

  /**
   * Returns a read-only snapshot of every currently tracked component
   * (mounted and unmounted).
   */
  getComponents(): ReadonlyArray<ComponentSnapshot>;
}