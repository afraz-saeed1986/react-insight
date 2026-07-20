import type { FiberNode } from "./fiberAdapter";
import type { DiscoveredComponent } from "./discoveredComponent";

const fiberIds = new WeakMap<FiberNode, string>();
let nextFiberId = 0;

/**
 * Resolves a stable id for a Fiber, reusing the id already assigned to
 * its `alternate` if one exists.
 *
 * React reuses exactly two Fiber objects per component instance
 * (`current` <-> `alternate`, "double buffering"), toggling which one
 * is `root.current` on every commit. Without this alternate lookup, a
 * component that re-renders even once would get a brand-new id on its
 * second render (since its Fiber object flips to the previously-unseen
 * alternate), causing ComponentRegistry.sync() to treat it as a new
 * mount and leaving the old entry as an orphaned "ghost" that never
 * unmounts.
 */
export function getFiberId(fiber: FiberNode): string {
  const existing = fiberIds.get(fiber) ?? (fiber.alternate ? fiberIds.get(fiber.alternate) : undefined);

  if (existing) {
    fiberIds.set(fiber, existing);
    return existing;
  }

  const id = `fiber-${++nextFiberId}`;
  fiberIds.set(fiber, id);
  return id;
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
    const nextParentId = isComponent ? getFiberId(fiber) : parentId;

    if (isComponent) {
      result.push({
        id: getFiberId(fiber),
        rootId,
        displayName: getDisplayName(fiber),
        parentId,
      });
    }

    visit(fiber.child, nextParentId);
    visit(fiber.sibling, parentId);
  }

  visit(entry, null);

  return result;
}