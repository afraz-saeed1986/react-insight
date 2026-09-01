import type { FiberNode } from "./fiberAdapter";

/**
 * ⚠️ First place in this codebase that retains a live Fiber reference
 * beyond a single synchronous traversal call. Every other consumer of
 * Fiber (Traversal, Hook Inspector, Context Inspector) is fully
 * transient — reads what it needs and discards the reference before
 * returning. This registry exists specifically because on-demand hook
 * name resolution (hookNameInspector.ts) can be requested long after
 * the commit that produced a given Fiber.
 *
 * Memory safety depends entirely on callers deleting an id's handle on
 * unmount (see componentDiscoveryPlugin.ts's onUnmount) — otherwise
 * every unmounted component's Fiber (and everything it closes over)
 * would be retained forever.
 */
const handles = new Map<string, FiberNode>();

export function setFiberHandle(id: string, fiber: FiberNode): void {
  handles.set(id, fiber);
}

export function getFiberHandle(id: string): FiberNode | undefined {
  return handles.get(id);
}

export function deleteFiberHandle(id: string): void {
  handles.delete(id);
}