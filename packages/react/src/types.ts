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

  /**
   * Structural summary of this component's hooks (count, order,
   * best-effort kind classification — see internal/discovery/
   * hookInspector.ts for what this can and cannot distinguish, e.g.
   * useState/useReducer and useMemo/useCallback share a kind).
   */
readonly hooks: ReadonlyArray<{
    readonly index: number;
    readonly kind:
      | "state"
      | "ref"
      | "memo-like"
      | "effect"
      | "layout-effect"
      | "unknown";
    readonly value?:
      | string
      | number
      | boolean
      | null
      | undefined
      | { readonly __type: string }
      | { readonly __type: "array"; readonly length: number; readonly items: readonly unknown[] }
      | { readonly __type: "object"; readonly keys: Readonly<Record<string, unknown>> };
  }>;

  readonly contexts: ReadonlyArray<{
    readonly index: number;
    readonly displayName: string;
    readonly value:
      | string
      | number
      | boolean
      | null
      | undefined
      | { readonly __type: string }
      | { readonly __type: "array"; readonly length: number; readonly items: readonly unknown[] }
      | { readonly __type: "object"; readonly keys: Readonly<Record<string, unknown>> };
  }>;
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