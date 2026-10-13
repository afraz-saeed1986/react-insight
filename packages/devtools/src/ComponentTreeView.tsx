import type { ComponentTreeNode } from "./buildComponentTree";
import { summarizeComponent } from "./summarizeComponent";

interface ComponentTreeViewProps {
  readonly nodes: readonly ComponentTreeNode[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  readonly collapsedIds: ReadonlySet<string>;
  readonly onToggle: (id: string) => void;
}

export function ComponentTreeView(props: ComponentTreeViewProps) {
  if (props.nodes.length === 0) {
    return <p className="ri-empty">No components to show.</p>;
  }

  return <TreeList {...props} root />;
}

interface TreeListProps extends ComponentTreeViewProps {
  readonly root?: boolean;
}

function TreeList({
  nodes,
  selectedId,
  onSelect,
  collapsedIds,
  onToggle,
  root = false,
}: TreeListProps) {
  return (
    <ul className={root ? "ri-tree" : undefined}>
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
          <li key={snapshot.id}>
            <div className="ri-line">
              {hasChildren ? (
                <button
                  type="button"
                  className="ri-caret"
                  aria-expanded={!collapsed}
                  aria-label={collapsed ? "Expand" : "Collapse"}
                  onClick={() => onToggle(snapshot.id)}
                >
                  {collapsed ? "▸" : "▾"}
                </button>
              ) : (
                <span className="ri-caret ri-caret--empty" aria-hidden="true" />
              )}
              <button
                type="button"
                aria-pressed={selected}
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
              <TreeList
                nodes={node.children}
                selectedId={selectedId}
                onSelect={onSelect}
                collapsedIds={collapsedIds}
                onToggle={onToggle}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}