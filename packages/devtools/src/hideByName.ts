import type { ComponentTreeNode } from "./buildComponentTree";

/** Splits a comma-separated list into trimmed, non-empty name patterns. */
export function parseNamePatterns(input: string): string[] {
  return input
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

/**
 * Compiles a name pattern to an anchored, case-sensitive RegExp.
 * `*` matches any run of characters; everything else is literal.
 */
function compilePattern(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");

  return new RegExp(`^${escaped}$`);
}

function hideMatching(
  nodes: readonly ComponentTreeNode[],
  isHidden: (name: string) => boolean,
): ComponentTreeNode[] {
  return nodes.flatMap((node) => {
    const children = hideMatching(node.children, isHidden);

    if (isHidden(node.snapshot.displayName)) {
      return children;
    }

    return [{ snapshot: node.snapshot, children }];
  });
}

/**
 * Hides nodes whose displayName matches any of the patterns. Children of a
 * hidden node are promoted to its position (in order), so the tree stays
 * connected. With no patterns, returns the input unchanged.
 *
 * Pure function: never mutates the input tree.
 */
export function hideByName(
  nodes: readonly ComponentTreeNode[],
  patterns: readonly string[],
): readonly ComponentTreeNode[] {
  if (patterns.length === 0) return nodes;

  const matchers = patterns.map(compilePattern);

  return hideMatching(nodes, (name) => matchers.some((m) => m.test(name)));
}