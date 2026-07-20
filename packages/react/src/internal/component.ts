export type ComponentId = string;

export type ComponentStatus = "mounted" | "unmounted";

export interface ComponentNode {
  /**
   * Unique identifier of the component instance.
   */
  id: ComponentId;

  /**
   * Identifier of the React root that owns this component.
   */
  rootId: string;

  /**
   * Display name resolved from the React component.
   */
  displayName: string;

  /**
   * Parent component identifier.
   * Null when this component is the root of the tracked tree.
   */
  parentId: ComponentId | null;

  /**
   * Child component identifiers.
   */
  children: ReadonlySet<ComponentId>;

  /**
   * Current lifecycle state.
   */
  status: ComponentStatus;

  /**
   * Timestamp when the component was mounted.
   */
  mountedAt: number;

  /**
   * Timestamp when the component was unmounted.
   */
  unmountedAt: number | null;

  /**
   * Number of times this component has actually rendered (mount counts
   * as the first render). Distinct from mere presence in a commit's
   * traversed tree — see traversal.ts, resolveFiberIdentity().
   */
  renderCount: number;

  /**
   * Timestamp of the most recent render.
   */
  lastRenderedAt: number | null;
}
