import { useMemo, useRef, useState } from "react";
import type { FocusEvent, KeyboardEvent } from "react";

import type { ComponentTreeNode } from "./buildComponentTree";
import { summarizeComponent } from "./summarizeComponent";
import { flattenVisibleTree, resolveTreeKey } from "./treeNavigation";

interface ComponentTreeViewProps {
  readonly nodes: readonly ComponentTreeNode[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  readonly collapsedIds: ReadonlySet<string>;
  readonly onToggle: (id: string) => void;
}

function idFromTarget(target: EventTarget): string | null {
  if (!(target instanceof HTMLElement)) return null;
  return target.closest<HTMLElement>("[data-ri-id]")?.dataset.riId ?? null;
}

export function ComponentTreeView({
  nodes,
  selectedId,
  onSelect,
  collapsedIds,
  onToggle,
}: ComponentTreeViewProps) {
  const treeRef = useRef<HTMLUListElement>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const items = useMemo(
    () => flattenVisibleTree(nodes, collapsedIds),
    [nodes, collapsedIds],
  );

  if (nodes.length === 0) {
    return <p className="ri-empty">No components to show.</p>;
  }

  // Roving tabindex: the whole tree is a single tab stop. It follows the last
  // focused row, then the selected row, then the first visible row.
  const isVisible = (id: string | null): id is string =>
    id !== null && items.some((item) => item.id === id);
  const tabStopId = isVisible(focusedId)
    ? focusedId
    : isVisible(selectedId)
      ? selectedId
      : (items[0]?.id ?? null);

  const focusItem = (id: string) => {
    treeRef.current
      ?.querySelector<HTMLElement>(`[data-ri-id="${CSS.escape(id)}"]`)
      ?.focus();
  };

  // Arrow keys only move focus. Selecting runs an inspection (it re-executes
  // the component's render body), so it stays an explicit Enter/Space/click.
  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

    const id = idFromTarget(event.target);
    if (id === null) return;

    const action = resolveTreeKey(items, id, event.key);
    if (action === null) return;

    event.preventDefault();
    if (action.type === "focus") {
      focusItem(action.id);
    } else {
      onToggle(action.id);
    }
  };

  const handleFocus = (event: FocusEvent<HTMLUListElement>) => {
    const id = idFromTarget(event.target);
    if (id !== null) setFocusedId(id);
  };

  return (
    <ul
      ref={treeRef}
      className="ri-tree"
      role="tree"
      aria-label="Component tree"
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
    >
      <TreeItems
        nodes={nodes}
        level={1}
        selectedId={selectedId}
        tabStopId={tabStopId}
        onSelect={onSelect}
        collapsedIds={collapsedIds}
        onToggle={onToggle}
      />
    </ul>
  );
}

interface TreeItemsProps {
  readonly nodes: readonly ComponentTreeNode[];
  readonly level: number;
  readonly selectedId: string | null;
  readonly tabStopId: string | null;
  readonly onSelect: (id: string) => void;
  readonly collapsedIds: ReadonlySet<string>;
  readonly onToggle: (id: string) => void;
}

function TreeItems({
  nodes,
  level,
  selectedId,
  tabStopId,
  onSelect,
  collapsedIds,
  onToggle,
}: TreeItemsProps) {
  return (
    <>
      {nodes.map((node) => {
        const { snapshot } = node;
        const selected = snapshot.id === selectedId;
        const unmounted = snapshot.status === "unmounted";
        const summary = summarizeComponent(snapshot);
        const hasChildren = node.children.length > 0;
        const collapsed = collapsedIds.has(snapshot.id);
        const name =
          snapshot.displayName === "" ? "Anonymous" : snapshot.displayName;

        return (
          <li key={snapshot.id} role="none">
            <div className="ri-line">
              {hasChildren ? (
                // Mouse only: keyboard users expand and collapse with the
                // arrow keys on the treeitem (aria-expanded).
                <button
                  type="button"
                  className="ri-caret"
                  tabIndex={-1}
                  aria-hidden="true"
                  onClick={() => onToggle(snapshot.id)}
                >
                  {collapsed ? "▸" : "▾"}
                </button>
              ) : (
                <span className="ri-caret ri-caret--empty" aria-hidden="true" />
              )}
              <button
                type="button"
                role="treeitem"
                data-ri-id={snapshot.id}
                aria-level={level}
                aria-selected={selected}
                aria-expanded={hasChildren ? !collapsed : undefined}
                tabIndex={snapshot.id === tabStopId ? 0 : -1}
                className={unmounted ? "ri-row ri-row--unmounted" : "ri-row"}
                onClick={() => onSelect(snapshot.id)}
              >
                <span key={snapshot.renderCount} className="ri-label ri-flash">
                  <span className="ri-name">{name}</span>
                  <span className="ri-badge">×{snapshot.renderCount}</span>
                </span>
                {summary !== "" && <span className="ri-meta">{summary}</span>}
                {unmounted && <span className="ri-meta">unmounted</span>}
              </button>
            </div>
            {hasChildren && !collapsed && (
              <ul role="group">
                <TreeItems
                  nodes={node.children}
                  level={level + 1}
                  selectedId={selectedId}
                  tabStopId={tabStopId}
                  onSelect={onSelect}
                  collapsedIds={collapsedIds}
                  onToggle={onToggle}
                />
              </ul>
            )}
          </li>
        );
      })}
    </>
  );
}