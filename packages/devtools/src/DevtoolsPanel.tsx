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
import { PANEL_CSS } from "./styles";

/**
 * این مقدار به‌عنوان `DevtoolsPanel.displayName` ست می‌شود (انتهای فایل).
 * پنل و کل زیردرخت آن از چیزی که مشاهده می‌کند حذف می‌شوند تا حلقه‌ی
 * self-observation ایجاد نشود. چون صریح است، با minify شدن bundle هم
 * کار می‌کند (برخلاف نام تابع).
 */
const PANEL_DISPLAY_NAME = "ReactInsightDevtools";
const REFRESH_THROTTLE_MS = 150;

function readComponents(insight: Insight): ComponentSnapshot[] {
  return excludeSubtrees(
    insight.getComponents(),
    (s) => s.displayName === PANEL_DISPLAY_NAME,
  );
}

interface PanelBodyProps {
  onClose: () => void;
}

function PanelBody({ onClose }: PanelBodyProps) {
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

  const handleCloseDetails = () => {
    setSelectedId(null);
    setInspection(null);
  };

  const selectedSnapshot =
    selectedId === null
      ? undefined
      : components.find((c) => c.id === selectedId);

  return (
    <section className="ri-panel" aria-label="React Insight">
      <div className="ri-header">
        <span className="ri-title">React Insight</span>
        <input
          type="search"
          className="ri-input ri-input--search"
          placeholder="Filter by name"
          aria-label="Filter by name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input
          type="number"
          min={1}
          className="ri-input ri-input--number"
          placeholder="Min renders"
          aria-label="Minimum renders"
          value={minRendersInput}
          onChange={(e) => setMinRendersInput(e.target.value)}
        />
        <label className="ri-switch">
          <input
            type="checkbox"
            checked={includeUnmounted}
            onChange={(e) => setIncludeUnmounted(e.target.checked)}
          />
          Show unmounted
        </label>
        <span className="ri-spacer" />
        <button
          type="button"
          className="ri-btn"
          title="Refresh snapshot"
          onClick={() => refresh(true)}
        >
          Refresh
        </button>
        <button
          type="button"
          className="ri-btn"
          aria-label="Close panel"
          title="Close panel"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className="ri-body">
        <div className="ri-tree-pane">
          <ComponentTreeView
            nodes={tree}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </div>
        <div className="ri-details-pane">
          {selectedId !== null ? (
            <ComponentDetails
              snapshot={selectedSnapshot}
              inspection={inspection}
              onReinspect={handleReinspect}
              onClose={handleCloseDetails}
            />
          ) : (
            <div className="ri-empty">Select a component to inspect it.</div>
          )}
        </div>
      </div>
    </section>
  );
}

export function DevtoolsPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="ri-root">
      <style>{PANEL_CSS}</style>
      {open ? (
        <PanelBody onClose={() => setOpen(false)} />
      ) : (
        <button
          type="button"
          className="ri-toggle"
          onClick={() => setOpen(true)}
        >
          React Insight
        </button>
      )}
    </div>
  );
}

DevtoolsPanel.displayName = PANEL_DISPLAY_NAME;