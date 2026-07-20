import type { ComponentSyncInput } from "../componentRegistry";
import type { DiscoveredComponent } from "./discoveredComponent";

/**
 * Translates a DiscoveredComponent into the structural shape required
 * by ComponentRegistry.sync().
 *
 * This is a pure, stateless function. It never decides lifecycle state
 * (mounted / updated / unmounted) — that decision belongs exclusively
 * to ComponentRegistry, which is the only owner of existing state.
 */
export function mapDiscoveredComponent(
  discovered: DiscoveredComponent,
): ComponentSyncInput {
  return {
    id: discovered.id,
    rootId: discovered.rootId,
    displayName: discovered.displayName,
    parentId: discovered.parentId,
    rendered: discovered.rendered,
  };
}