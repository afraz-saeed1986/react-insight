import type { ComponentTreeNode } from "./buildComponentTree";
import { summarizeComponent } from "./summarizeComponent";

interface ComponentTreeViewProps {
  readonly nodes: readonly ComponentTreeNode[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
}

export function ComponentTreeView({
  nodes,
  selectedId,
  onSelect,
}: ComponentTreeViewProps) {
  if (nodes.length === 0) {
    return <p className="ri-empty">No components to show.</p>;
  }

  return (
    <TreeList
      nodes={nodes}
      selectedId={selectedId}
      onSelect={onSelect}
      root
    />
  );
}

interface TreeListProps extends ComponentTreeViewProps {
  readonly root?: boolean;
}

function TreeList({ nodes, selectedId, onSelect, root = false }: TreeListProps) {
  return (
    <ul className={root ? "ri-tree" : undefined}>
      {nodes.map((node) => {
        const { snapshot } = node;
        const selected = snapshot.id === selectedId;
        const unmounted = snapshot.status === "unmounted";
        const summary = summarizeComponent(snapshot);

        return (
          <li key={snapshot.id}>
            <button
              type="button"
              aria-pressed={selected}
              className={unmounted ? "ri-row ri-row--unmounted" : "ri-row"}
              onClick={() => onSelect(snapshot.id)}
            >
              <span key={snapshot.renderCount} className="ri-label ri-flash">
                <span className="ri-name">{snapshot.displayName}</span>
                <span className="ri-badge">×{snapshot.renderCount}</span>
              </span>
              {summary !== "" && <span className="ri-meta">{summary}</span>}
              {unmounted && <span className="ri-meta">unmounted</span>}
            </button>
            {node.children.length > 0 && (
              <TreeList
                nodes={node.children}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}