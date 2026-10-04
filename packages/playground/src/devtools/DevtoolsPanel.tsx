import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInsight } from "@react-insight/react";
import type { ComponentSnapshot, Insight } from "@react-insight/react";
import { inspectComponent } from "@react-insight/inspector";
import type { ComponentInspection } from "@react-insight/inspector";

import { buildComponentTree } from "./buildComponentTree";
import { ComponentDetails } from "./ComponentDetails";
import { ComponentTreeView } from "./ComponentTreeView";
import { excludeSubtrees } from "./excludeSubtrees";
import { filterByMinRenders } from "./filterByMinRenders";
import { filterComponentTree } from "./filterComponentTree";

/**
 * Must match this component's function name: the panel (and everything
 * rendered under it) is excluded from what it observes, to avoid a
 * self-observation re-render loop.
 */
const PANEL_DISPLAY_NAME = "DevtoolsPanel";
const REFRESH_THROTTLE_MS = 150;

function readComponents(insight: Insight): ComponentSnapshot[] {
  return excludeSubtrees(
    insight.getComponents(),
    (s) => s.displayName === PANEL_DISPLAY_NAME,
  );
}

export function DevtoolsPanel() {
  const insight = useInsight();
  const lastSerializedRef = useRef<string | null>(null);

  const [components, setComponents] = useState<readonly ComponentSnapshot[]>([]);
  const [includeUnmounted, setIncludeUnmounted] = useState(true);
  const [query, setQuery] = useState("");
  const [minRendersInput, setMinRendersInput] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inspection, setInspection] = useState<ComponentInspection | null>(null);

  const refresh = useCallback(
    (force: boolean) => {
      const next = readComponents(insight);
      const serialized = JSON.stringify(next);

      if (!force && serialized === lastSerializedRef.current) return;

      lastSerializedRef.current = serialized;
      setComponents(next);
    },
    [insight],
  );

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    refresh(false);

    const unsubscribe = insight.onChange(() => {
      if (timeoutId !== null) return;

      timeoutId = setTimeout(() => {
        timeoutId = null;
        refresh(false);
      }, REFRESH_THROTTLE_MS);
    });

    return () => {
      unsubscribe();
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [insight, refresh]);

  const minRenders = Number.parseInt(minRendersInput, 10);

  const tree = useMemo(
    () =>
      filterByMinRenders(
        filterComponentTree(
          buildComponentTree(components, { includeUnmounted }),
          query,
        ),
        minRenders,
      ),
    [components, includeUnmounted, query, minRenders],
  );

  // Inspection re-executes the component's render body (see
  // Insight.inspectHookNames), so it only ever runs on an explicit click.
  const handleSelect = (id: string) => {
    setSelectedId(id);
    setInspection(inspectComponent(insight, id) ?? null);
  };

  const handleReinspect = () => {
    if (selectedId === null) return;
    setInspection(inspectComponent(insight, selectedId) ?? null);
  };

  const handleClose = () => {
    setSelectedId(null);
    setInspection(null);
  };

  const selectedSnapshot =
    selectedId === null
      ? undefined
      : components.find((c) => c.id === selectedId);

  return (
    <div style={{ marginTop: 16, fontFamily: "monospace" }}>
      <button type="button" onClick={() => refresh(true)}>
        Refresh snapshot
      </button>{" "}
      <label>
        <input
          type="checkbox"
          checked={includeUnmounted}
          onChange={(e) => setIncludeUnmounted(e.target.checked)}
        />{" "}
             Show unmounted
      </label>{" "}
      <input
        type="search"
        placeholder="Filter by name"
        value={query}
              onChange={(e) => setQuery(e.target.value)}
      />{" "}
      <input
        type="number"
        min={1}
        placeholder="Min renders"
        value={minRendersInput}
        onChange={(e) => setMinRendersInput(e.target.value)}
        style={{ width: 110 }}
      />

      <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
        <div style={{ minWidth: 260 }}>
          <ComponentTreeView
            nodes={tree}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </div>
        {selectedId !== null && (
          <ComponentDetails
            snapshot={selectedSnapshot}
            inspection={inspection}
            onReinspect={handleReinspect}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
}