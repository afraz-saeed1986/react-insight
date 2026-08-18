import { describe, expect, it } from "vitest";

import { inspectContexts } from "./contextInspector";
import type { ContextDependencyNode, FiberNode } from "./fiberAdapter";

function contextNode(
  context: unknown,
  memoizedValue: unknown,
): ContextDependencyNode {
  return { context, memoizedValue, next: null };
}

function chain(
  ...nodes: ContextDependencyNode[]
): ContextDependencyNode | null {
  for (let i = 0; i < nodes.length - 1; i += 1) {
    nodes[i]!.next = nodes[i + 1]!;
  }
  return nodes[0] ?? null;
}

function fiberWithDependencies(
  firstContext: ContextDependencyNode | null | undefined,
): FiberNode {
  return {
    type: function AnyComponent() {},
    child: null,
    sibling: null,
    alternate: null,
    memoizedProps: null,
    memoizedState: null,
    dependencies:
      firstContext === undefined ? {} : { firstContext },
  };
}

describe("inspectContexts", () => {
  it("returns an empty array when the fiber has no dependencies at all", () => {
    const fiber: FiberNode = {
      type: function AnyComponent() {},
      child: null,
      sibling: null,
      alternate: null,
      memoizedProps: null,
      memoizedState: null,
      dependencies: null,
    };

    expect(inspectContexts(fiber)).toEqual([]);
  });

  it("returns an empty array when dependencies exist but firstContext is absent", () => {
    expect(inspectContexts(fiberWithDependencies(undefined))).toEqual([]);
  });

  it("returns an empty array when firstContext is explicitly null", () => {
    expect(inspectContexts(fiberWithDependencies(null))).toEqual([]);
  });

  it("produces a summary for a single consumed context", () => {
    const ThemeContext = { displayName: "ThemeContext" };
    const node = contextNode(ThemeContext, "dark");
    const fiber = fiberWithDependencies(chain(node));

    expect(inspectContexts(fiber)).toEqual([
      { index: 0, displayName: "ThemeContext", value: "dark" },
    ]);
  });

  it("falls back to 'Context' when displayName is not set", () => {
    const AnonymousContext = {};
    const node = contextNode(AnonymousContext, 1);
    const fiber = fiberWithDependencies(chain(node));

    expect(inspectContexts(fiber)).toEqual([
      { index: 0, displayName: "Context", value: 1 },
    ]);
  });

  it("falls back to 'Context' when displayName is an empty string", () => {
    const EmptyNameContext = { displayName: "" };
    const node = contextNode(EmptyNameContext, 1);
    const fiber = fiberWithDependencies(chain(node));

    expect(inspectContexts(fiber)).toEqual([
      { index: 0, displayName: "Context", value: 1 },
    ]);
  });

  it("falls back to 'Context' when displayName is not a string", () => {
    // Guards against a malformed/unexpected shape rather than trusting
    // displayName's type blindly.
    const WeirdContext = { displayName: 42 };
    const node = contextNode(WeirdContext, 1);
    const fiber = fiberWithDependencies(chain(node));

    expect(inspectContexts(fiber)).toEqual([
      { index: 0, displayName: "Context", value: 1 },
    ]);
  });

  it("walks multiple distinct contexts in list order, assigning sequential indices", () => {
    const ThemeContext = { displayName: "ThemeContext" };
    const LocaleContext = { displayName: "LocaleContext" };

    const themeNode = contextNode(ThemeContext, "dark");
    const localeNode = contextNode(LocaleContext, "en-US");
    const fiber = fiberWithDependencies(chain(themeNode, localeNode));

    expect(inspectContexts(fiber)).toEqual([
      { index: 0, displayName: "ThemeContext", value: "dark" },
      { index: 1, displayName: "LocaleContext", value: "en-US" },
    ]);
  });

  it("deduplicates repeated nodes that reference the same context object", () => {
    // A controlled Playground experiment under StrictMode observed two
    // chained dependency nodes for a single useContext() call, both
    // pointing at the same context object. inspectContexts() must
    // produce exactly one entry regardless, keyed by context identity.
    const ThemeContext = { displayName: "ThemeContext" };

    const first = contextNode(ThemeContext, "dark");
    const duplicate = contextNode(ThemeContext, "dark");
    const fiber = fiberWithDependencies(chain(first, duplicate));

    expect(inspectContexts(fiber)).toEqual([
      { index: 0, displayName: "ThemeContext", value: "dark" },
    ]);
  });

  it("does not deduplicate distinct context objects that happen to share a displayName", () => {
    const FirstContext = { displayName: "SameName" };
    const SecondContext = { displayName: "SameName" };

    const first = contextNode(FirstContext, "a");
    const second = contextNode(SecondContext, "b");
    const fiber = fiberWithDependencies(chain(first, second));

    expect(inspectContexts(fiber)).toEqual([
      { index: 0, displayName: "SameName", value: "a" },
      { index: 1, displayName: "SameName", value: "b" },
    ]);
  });

  it("reuses previewHookValue()'s shallow, circular-safe preview for the value field", () => {
    const ThemeContext = { displayName: "ThemeContext" };
    const node = contextNode(ThemeContext, {
      mode: "dark",
      nested: { a: 1 },
    });
    const fiber = fiberWithDependencies(chain(node));

    expect(inspectContexts(fiber)).toEqual([
      {
        index: 0,
        displayName: "ThemeContext",
        value: {
          __type: "object",
          keys: {
            mode: "dark",
            nested: { __type: "object" },
          },
        },
      },
    ]);
  });

  it("never leaks the raw context object or dependency node in the output", () => {
    const ThemeContext = { displayName: "ThemeContext", secret: "internal" };
    const node = contextNode(ThemeContext, "dark");
    const fiber = fiberWithDependencies(chain(node));

    const [summary] = inspectContexts(fiber);

    expect(summary).toBeDefined();
    expect(Object.keys(summary!)).toEqual(["index", "displayName", "value"]);
  });
});