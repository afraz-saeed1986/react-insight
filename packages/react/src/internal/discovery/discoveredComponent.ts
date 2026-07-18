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
}