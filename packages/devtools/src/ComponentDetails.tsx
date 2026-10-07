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
      <div>
        <p className="ri-note">This component is no longer tracked.</p>
        <button type="button" className="ri-btn" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  const rows = mergeHookInfo(snapshot.hooks, inspection?.hookNames);
  const namesUnavailable =
    inspection !== null && inspection.hookNames === undefined;

  return (
    <div>
      <div className="ri-d-head">
        <span className="ri-d-name">{snapshot.displayName}</span>
        <span
          className={
            snapshot.status === "mounted"
              ? "ri-status ri-status--mounted"
              : "ri-status"
          }
        >
          {snapshot.status}
        </span>
        <span className="ri-spacer" />
        <button type="button" className="ri-btn" onClick={onReinspect}>
          Re-inspect
        </button>
        <button type="button" className="ri-btn" onClick={onClose}>
          Close
        </button>
      </div>

      <dl className="ri-stats">
        <dt>renders</dt>
        <dd>{snapshot.renderCount}</dd>
        <dt>mounted</dt>
        <dd>{formatTime(snapshot.mountedAt)}</dd>
        <dt>last rendered</dt>
        <dd>{formatTime(snapshot.lastRenderedAt)}</dd>
        <dt>unmounted</dt>
        <dd>{formatTime(snapshot.unmountedAt)}</dd>
      </dl>

      <h4 className="ri-section">Hooks</h4>
      {namesUnavailable && (
        <p className="ri-note">
          Hook names unavailable (class component, or React internals not
          accessible in this environment).
        </p>
      )}
      {rows.length === 0 ? (
        <p className="ri-note">No hooks.</p>
      ) : (
        <ul className="ri-list">
          {rows.map((row) => (
            <li key={row.index} className="ri-item">
              <span className="ri-idx">{row.index}</span>
              <span className="ri-item-name">
                {row.hookName ?? row.kind}
                {row.customHookName ? ` ← ${row.customHookName}` : ""}
              </span>
              {row.value !== undefined && (
                <span className="ri-value">{formatValue(row.value)}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <h4 className="ri-section">Contexts</h4>
      {snapshot.contexts.length === 0 ? (
        <p className="ri-note">No contexts.</p>
      ) : (
        <ul className="ri-list">
          {snapshot.contexts.map((ctx) => (
            <li key={ctx.index} className="ri-item">
              <span className="ri-idx">{ctx.index}</span>
              <span className="ri-item-name">{ctx.displayName}</span>
              <span className="ri-value">{formatValue(ctx.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}