import type { ComponentTreeNode } from "./buildComponentTree";

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
    return <p>No components tracked.</p>;
  }

  return (
    <TreeList
      nodes={nodes}
      selectedId={selectedId}
      onSelect={onSelect}
      depth={0}
    />
  );
}

interface TreeListProps extends ComponentTreeViewProps {
  readonly depth: number;
}

function TreeList({ nodes, selectedId, onSelect, depth }: TreeListProps) {
  return (
    <ul
      style={{
        listStyle: "none",
        margin: 0,
        paddingLeft: depth === 0 ? 0 : 16,
      }}
    >
      {nodes.map((node) => {
        const { snapshot } = node;
        const selected = snapshot.id === selectedId;
        const unmounted = snapshot.status === "unmounted";

        return (
          <li key={snapshot.id}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(snapshot.id)}
              style={{
                fontFamily: "monospace",
                background: selected ? "#dbeafe" : "transparent",
                border: "none",
                cursor: "pointer",
                opacity: unmounted ? 0.5 : 1,
                fontStyle: unmounted ? "italic" : "normal",
              }}
            >
              {snapshot.displayName}{" "}
              <small>
                ×{snapshot.renderCount}
                {unmounted ? " (unmounted)" : ""}
              </small>
            </button>
            {node.children.length > 0 && (
              <TreeList
                nodes={node.children}
                selectedId={selectedId}
                onSelect={onSelect}
                depth={depth + 1}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}