import type { HookSummary } from "./hookInspector";
import type { ContextSummary } from "./contextInspector";

export type DiscoveredComponentId = string;

/**
 * Minimal, framework-agnostic description of a discovered component.
 *
 * This type is intentionally decoupled from React Fiber. It represents
 * only the information the Mapper needs to produce a ComponentRegistry
 * sync input. It must never carry a Fiber reference across the Mapper
 * boundary.
 */
export interface DiscoveredComponent {
  readonly id: DiscoveredComponentId;
  readonly rootId: string;
  readonly displayName: string;
  readonly parentId: DiscoveredComponentId | null;

  /**
   * Whether React actually rendered this fiber in the current commit,
   * as opposed to it merely being present in the tree (e.g. a bailed-
   * out subtree). See traversal.ts, resolveFiberIdentity().
   */
  readonly rendered: boolean;

  /**
   * Names of props whose value identity changed since this component
   * was last visited. Empty on first sight, for a component that did
   * not render, and when the props object is the same reference. Names
   * only: no prop value is retained.
   */
  readonly changedPropKeys: readonly string[];

  /**
   * Whether the nearest component ancestor rendered in this same
   * commit. False for the topmost component.
   */
  readonly parentRendered: boolean;

  /**
   * Structural summary of this component's hooks (count, order, best-
   * effort kind classification). See hookInspector.ts for what this
   * can and cannot distinguish. Empty for class components.
   */
  readonly hooks: readonly HookSummary[];
  readonly contexts: readonly ContextSummary[];
}