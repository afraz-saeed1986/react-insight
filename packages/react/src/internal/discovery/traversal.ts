import type { FiberNode } from "./fiberAdapter";
import { REACT_FORWARD_REF_TYPE, REACT_MEMO_TYPE } from "./fiberAdapter";
import type { DiscoveredComponent } from "./discoveredComponent";
import { inspectHooks } from "./hookInspector";
import { inspectContexts } from "./contextInspector";
import { setFiberHandle } from "./fiberHandleRegistry";

const fiberIds = new WeakMap<FiberNode, string>();
const lastObservedValues = new Map<string, { props: unknown; state: unknown }>();
let nextFiberId = 0;

interface FiberIdentity {
  id: string;
  rendered: boolean;
}

/**
 * Resolves a stable id for a Fiber, and whether React actually rendered
 * it in this commit.
 *
 * Object identity (direct vs. alternate hit) is used only to resolve
 * the stable `id` — React recycles at most two Fiber objects per
 * component indefinitely, so identity alone cannot say whether *this*
 * commit changed anything (a comparison against `alternate` would
 * compare against whatever was last committed, which goes stale and
 * stays stale forever once a component stops receiving real updates
 * while unrelated parts of the tree keep committing — this is exactly
 * the regression the second Playground experiment caught: siblings of
 * an actively-updating component were being marked "rendered" on every
 * unrelated commit, forever, after their own single real update).
 *
 * `rendered` is instead derived from `lastObservedValues`, which this
 * function itself maintains: the props/state we recorded the *last
 * time we visited this id*, regardless of which physical Fiber object
 * held them. This makes every comparison relative to "changed since we
 * last looked", which self-corrects on every traversal instead of
 * depending on a snapshot that can go stale. See DECISIONS.md,
 * overcounting fix, for both Playground experiments that led here.
 */
function resolveFiberIdentity(fiber: FiberNode): FiberIdentity {
  const alternate = fiber.alternate;
  const existingId = fiberIds.get(fiber) ?? (alternate ? fiberIds.get(alternate) : undefined);

  if (existingId) {
    fiberIds.set(fiber, existingId);

    const previous = lastObservedValues.get(existingId);
    const rendered = previous
      ? fiber.memoizedProps !== previous.props || fiber.memoizedState !== previous.state
      : true;

    lastObservedValues.set(existingId, {
      props: fiber.memoizedProps,
      state: fiber.memoizedState,
    });

    return { id: existingId, rendered };
  }

  const id = `fiber-${++nextFiberId}`;
  fiberIds.set(fiber, id);
  lastObservedValues.set(id, { props: fiber.memoizedProps, state: fiber.memoizedState });
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
  if (typeof fiber.type === "function") return true;

  // memo(...) and forwardRef(...) wrap the real component in an
  // object rather than exposing a plain function as fiber.type —
  // without this, these components are entirely invisible to the
  // whole discovery pipeline (Render Tracking, Hook Tracking, Context
  // Tracking too, not just this check). See DECISIONS.md, 2026-08-24.
  const type = fiber.type as { $$typeof?: symbol } | null;
  return type?.$$typeof === REACT_MEMO_TYPE || type?.$$typeof === REACT_FORWARD_REF_TYPE;
}

function getDisplayName(fiber: FiberNode): string {
  return resolveDisplayName(fiber.type);
}

/**
 * Recursive so memo(forwardRef(...)) resolves correctly: unwraps one
 * layer at a time until it finds an explicit displayName or a real
 * function to read .name from.
 */
function resolveDisplayName(type: unknown): string {
  if (type && typeof type === "object") {
    const t = type as {
      $$typeof?: symbol;
      displayName?: string;
      type?: unknown;
      render?: { name?: string; displayName?: string };
    };

    if (t.displayName) return t.displayName;

    if (t.$$typeof === REACT_MEMO_TYPE) {
      return resolveDisplayName(t.type);
    }

    if (t.$$typeof === REACT_FORWARD_REF_TYPE) {
      return t.render?.displayName ?? t.render?.name ?? "Anonymous";
    }
  }

  const fn = type as { displayName?: string; name?: string } | null;
  return fn?.displayName ?? fn?.name ?? "Anonymous";
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
      setFiberHandle(id, fiber);

      result.push({
        id,
        rootId,
        displayName: getDisplayName(fiber),
        parentId,
        rendered,
        hooks: inspectHooks(fiber),
        contexts: inspectContexts(fiber),
      });
    }

    visit(fiber.child, nextParentId);
    visit(fiber.sibling, parentId);
  }

  visit(entry, null);

  return result;
}