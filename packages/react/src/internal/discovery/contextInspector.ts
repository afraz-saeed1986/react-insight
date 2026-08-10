import type { FiberNode, ContextDependencyNode } from "./fiberAdapter";
import { previewHookValue, type HookValuePreview } from "./hookValuePreview";

export interface ContextSummary {
  readonly index: number;
  /**
   * From `context.displayName`, a documented, publicly-supported
   * convention (the same one React DevTools itself uses to label
   * context consumers) — not a private internal. Falls back to
   * `"Context"` when the consuming application never set it.
   */
  readonly displayName: string;
  readonly value: HookValuePreview;
}

function resolveDisplayName(context: unknown): string {
  const displayName = (context as { displayName?: unknown } | null)?.displayName;
  return typeof displayName === "string" && displayName.length > 0 ? displayName : "Context";
}

/**
 * Walks a Fiber's context dependency list (`fiber.dependencies.firstContext`
 * — a linked list React itself maintains for any fiber, function or
 * class component alike, that reads context via `useContext()` /
 * `readContext()`) and produces a structural summary per distinct
 * Context.
 *
 * Deduplicates by `context` object identity: a controlled Playground
 * experiment (a single `useContext()` call, under React 18+
 * StrictMode) observed two chained entries for the same Context
 * object rather than one, most likely from StrictMode's development-
 * mode double-invocation of the component body. Deduplicating makes
 * the output correct regardless of the exact cause, rather than
 * assuming the list always has exactly one node per `useContext`
 * call. See DECISIONS.md.
 *
 * Unlike hook values, no re-render or instrumented dispatcher is
 * needed here either: `memoizedValue` already sits directly on each
 * dependency node, populated by React itself on every commit that
 * reads the context.
 */
export function inspectContexts(fiber: FiberNode): ContextSummary[] {
  const dependencies = fiber.dependencies as { firstContext: ContextDependencyNode | null } | null;

  if (!dependencies || !dependencies.firstContext) {
    return [];
  }

  const summaries: ContextSummary[] = [];
  const seenContexts = new Set<unknown>();
  let node: ContextDependencyNode | null = dependencies.firstContext;

  while (node) {
    if (!seenContexts.has(node.context)) {
      seenContexts.add(node.context);
      summaries.push({
        index: summaries.length,
        displayName: resolveDisplayName(node.context),
        value: previewHookValue(node.memoizedValue),
      });
    }

    node = node.next;
  }

  return summaries;
}