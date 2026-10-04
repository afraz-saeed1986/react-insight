import type { ComponentSnapshot } from "@react-insight/react";
import type { ComponentInspection } from "@react-insight/inspector";

import { mergeHookInfo } from "./mergeHookInfo";

interface ComponentDetailsProps {
  /** Live snapshot of the selected component (undefined if no longer tracked). */
  readonly snapshot: ComponentSnapshot | undefined;
  /** Result of the last explicit inspection, if any. */
  readonly inspection: ComponentInspection | null;
  readonly onReinspect: () => void;
  readonly onClose: () => void;
}

const boxStyle = {
  border: "1px solid #ccc",
  padding: 8,
  fontFamily: "monospace",
} as const;

function formatTime(timestamp: number | null): string {
  return timestamp === null ? "—" : new Date(timestamp).toLocaleTimeString();
}

function formatValue(value: unknown): string {
  return value === undefined ? "" : JSON.stringify(value);
}

export function ComponentDetails({
  snapshot,
  inspection,
  onReinspect,
  onClose,
}: ComponentDetailsProps) {
  if (!snapshot) {
    return (
      <div style={boxStyle}>
        <p>This component is no longer tracked.</p>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  const rows = mergeHookInfo(snapshot.hooks, inspection?.hookNames);
  const namesUnavailable = inspection !== null && inspection.hookNames === undefined;

  return (
    <div style={boxStyle}>
      <div>
        <strong>{snapshot.displayName}</strong> — {snapshot.status}{" "}
        <button type="button" onClick={onReinspect}>
          Re-inspect
        </button>{" "}
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <div>renders: {snapshot.renderCount}</div>
      <div>mounted: {formatTime(snapshot.mountedAt)}</div>
      <div>last rendered: {formatTime(snapshot.lastRenderedAt)}</div>
      <div>unmounted: {formatTime(snapshot.unmountedAt)}</div>

      <h4>Hooks</h4>
      {namesUnavailable && (
        <p>
          Hook names unavailable (class component, or React internals not
          accessible in this environment).
        </p>
      )}
     {rows.length === 0 ? (
        <p>
          No stateful hooks
          {snapshot.contexts.length > 0 ? " (see Contexts for useContext)" : ""}.
        </p>
      ) : (
        <ol start={0}>
          {rows.map((row) => (
            <li key={row.index}>
              {row.hookName ?? row.kind}
              {row.customHookName ? ` ← ${row.customHookName}` : ""}
              {row.value !== undefined ? ` = ${formatValue(row.value)}` : ""}
            </li>
          ))}
        </ol>
      )}

      <h4>Contexts</h4>
      {snapshot.contexts.length === 0 ? (
        <p>No contexts.</p>
      ) : (
        <ul>
          {snapshot.contexts.map((ctx) => (
            <li key={ctx.index}>
              {ctx.displayName} = {formatValue(ctx.value)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}