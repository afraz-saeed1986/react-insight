export interface FiberNode {
  type: unknown;
  child: FiberNode | null;
  sibling: FiberNode | null;
  alternate: FiberNode | null;
}

interface FiberRootContainer {
  current: FiberNode;
}

/**
 * Extracts the traversal entry point from a raw FiberRoot reference
 * received from the Hook Adapter.
 *
 * This is the only place allowed to know the shape of a raw FiberRoot.
 * Returns null when the value does not look like a FiberRoot, so callers
 * can skip processing defensively instead of throwing.
 */
export function getFiberTraversalEntry(root: unknown): FiberNode | null {
  const candidate = root as Partial<FiberRootContainer> | null | undefined;

  if (!candidate || !candidate.current) {
    return null;
  }

  return candidate.current;
}

/**
 * Validates and narrows a raw value received from
 * `onCommitFiberUnmount` into a FiberNode.
 *
 * Unlike getFiberTraversalEntry (which unwraps a FiberRoot), this
 * validates a value that is already fiber-shaped, coming directly
 * from React's unmount notification.
 */
export function asFiberNode(value: unknown): FiberNode | null {
  const candidate = value as Partial<FiberNode> | null | undefined;

  if (!candidate || typeof candidate !== "object" || !("type" in candidate)) {
    return null;
  }

  return candidate as FiberNode;
}