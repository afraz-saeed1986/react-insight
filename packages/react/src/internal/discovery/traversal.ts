import type { FiberNode } from "./fiberAdapter";
import type { DiscoveredComponent } from "./discoveredComponent";

const fiberIds = new WeakMap<FiberNode, string>();
let nextFiberId = 0;

interface FiberIdentity {
  id: string;
  rendered: boolean;
}

/**
 * Resolves a stable id for a Fiber, and whether React actually rendered
 * it in this commit.
 *
 * React reuses exactly two Fiber objects per component instance
 * (`current` <-> `alternate`), toggling which one is `root.current` on
 * every commit:
 *
 * - If this exact object was already seen: React bailed out and reused
 *   `current` unchanged — not rendered this commit.
 * - If this object is new but its `alternate` was already seen: the
 *   pair swapped, meaning React actually processed this fiber — rendered.
 * - If neither was seen: first mount — rendered.
 */
function resolveFiberIdentity(fiber: FiberNode): FiberIdentity {
  const directHit = fiberIds.get(fiber);

  if (directHit) {
    return { id: directHit, rendered: false };
  }

  const alternateHit = fiber.alternate ? fiberIds.get(fiber.alternate) : undefined;

  if (alternateHit) {
    fiberIds.set(fiber, alternateHit);
    return { id: alternateHit, rendered: true };
  }

  const id = `fiber-${++nextFiberId}`;
  fiberIds.set(fiber, id);
  return { id, rendered: true };
}

/**
 * Resolves a stable id for a Fiber, reusing the id already assigned to
 * its `alternate` if one exists. See resolveFiberIdentity() for why
 * this is necessary.
 */
export function getFiberId(fiber: FiberNode): string {
  return resolveFiberIdentity(fiber).id;
}

function isComponentFiber(fiber: FiberNode): boolean {
  return typeof fiber.type === "function";
}

function getDisplayName(fiber: FiberNode): string {
  const type = fiber.type as { displayName?: string; name?: string } | null;
  return type?.displayName ?? type?.name ?? "Anonymous";
}

/**
 * Walks a Fiber tree starting from the given entry point and returns
 * every Fiber that qualifies as a "component".
 *
 * Filtering uses `typeof fiber.type === "function"` rather than Fiber
 * `tag` numbers, because tag values are an unstable, version-specific
 * implementation detail, while the function-typed nature of components
 * (function and class components alike) is stable across React versions.
 *
 * Stable ids are assigned per Fiber via a WeakMap, since Fiber objects
 * persist in place across re-renders while mounted.
 */
export function traverse(
  entry: FiberNode,
  rootId: string,
): DiscoveredComponent[] {
  const result: DiscoveredComponent[] = [];

  function visit(fiber: FiberNode | null, parentId: string | null): void {
    if (!fiber) return;

    const isComponent = isComponentFiber(fiber);
    let nextParentId = parentId;

    if (isComponent) {
      const { id, rendered } = resolveFiberIdentity(fiber);
      nextParentId = id;

      result.push({
        id,
        rootId,
        displayName: getDisplayName(fiber),
        parentId,
        rendered,
      });
    }

    visit(fiber.child, nextParentId);
    visit(fiber.sibling, parentId);
  }

  visit(entry, null);

  return result;
}