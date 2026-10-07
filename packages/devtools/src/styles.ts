/**
 * استایل پنل. فقط یک تگ <style> تزریق می‌شود؛ همه‌ی کلاس‌ها پیشوند `ri-`
 * دارند و متغیرها روی `.ri-root` تعریف می‌شوند تا به اپ میزبان نشت نکنند.
 */
export const PANEL_CSS = `
.ri-root, .ri-root * { box-sizing: border-box; }
:where(.ri-root) button,
:where(.ri-root) input { color: inherit; font: inherit; }
.ri-root {
  --ri-bg: #ffffff;
  --ri-bg-alt: #f6f7f9;
  --ri-fg: #1f2328;
  --ri-muted: #6b7280;
  --ri-border: #d8dce2;
  --ri-accent: #2563eb;
  --ri-accent-fg: #ffffff;
  --ri-input-bg: #ffffff;
  --ri-shadow: 0 -4px 16px rgba(0, 0, 0, 0.12);
  --ri-selected: rgba(37, 99, 235, 0.12);
  --ri-chip-bg: rgba(107, 114, 128, 0.15);
  --ri-ok: #15803d;
  --ri-ok-bg: rgba(21, 128, 61, 0.12);
  --ri-flash: rgba(250, 204, 21, 0.45);
}
@media (prefers-color-scheme: dark) {
  .ri-root {
    --ri-bg: #16181d;
    --ri-bg-alt: #1e2128;
    --ri-fg: #e6e8eb;
    --ri-muted: #9aa3b0;
    --ri-border: #2e333d;
    --ri-accent: #3b82f6;
    --ri-accent-fg: #ffffff;
    --ri-input-bg: #0f1115;
    --ri-shadow: 0 -4px 16px rgba(0, 0, 0, 0.5);
    --ri-selected: rgba(59, 130, 246, 0.28);
    --ri-chip-bg: rgba(154, 163, 176, 0.18);
    --ri-ok: #4ade80;
    --ri-ok-bg: rgba(74, 222, 128, 0.15);
    --ri-flash: rgba(250, 204, 21, 0.35);
  }
}
.ri-root {
  font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  color: var(--ri-fg);
}
.ri-toggle {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 2147483000;
  padding: 6px 14px;
  border: 0;
  border-radius: 999px;
  background: var(--ri-accent);
  color: var(--ri-accent-fg);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}
.ri-toggle:focus-visible,
.ri-btn:focus-visible,
.ri-input:focus-visible,
.ri-row:focus-visible {
  outline: 2px solid var(--ri-accent);
  outline-offset: 2px;
}
.ri-panel {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2147483000;
  height: 340px;
  display: flex;
  flex-direction: column;
  background: var(--ri-bg);
  border-top: 1px solid var(--ri-border);
  box-shadow: var(--ri-shadow);
}
.ri-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--ri-bg-alt);
  border-bottom: 1px solid var(--ri-border);
}
.ri-title { font-weight: 700; }
.ri-spacer { flex: 1; }
.ri-input {
  height: 26px;
  padding: 0 8px;
  border: 1px solid var(--ri-border);
  border-radius: 6px;
  background: var(--ri-input-bg);
  color: var(--ri-fg);
  font: inherit;
}
.ri-input--search { width: 180px; }
.ri-input--number { width: 100px; }
.ri-switch {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--ri-muted);
  cursor: pointer;
}
.ri-btn {
  height: 26px;
  padding: 0 10px;
  border: 1px solid var(--ri-border);
  border-radius: 6px;
  background: var(--ri-bg);
  color: var(--ri-fg);
  font: inherit;
  cursor: pointer;
}
.ri-btn:hover { background: var(--ri-bg-alt); }
.ri-body {
  flex: 1;
  min-height: 0;
  display: flex;
}
.ri-tree-pane {
  width: 42%;
  min-width: 220px;
  overflow: auto;
  padding: 6px;
  border-right: 1px solid var(--ri-border);
}
.ri-details-pane {
  flex: 1;
  min-width: 0;
  overflow: auto;
  padding: 10px 12px;
}
.ri-empty { color: var(--ri-muted); padding: 8px; margin: 0; }

/* درخت */
.ri-tree, .ri-tree ul { list-style: none; margin: 0; padding: 0; }
.ri-tree ul {
  margin-left: 10px;
  padding-left: 8px;
  border-left: 1px solid var(--ri-border);
}
.ri-row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 2px 6px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--ri-fg);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.ri-row:hover { background: var(--ri-bg-alt); }
.ri-row[aria-pressed="true"] { background: var(--ri-selected); }
.ri-row--unmounted { opacity: 0.5; font-style: italic; }
.ri-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 4px;
}
.ri-flash { animation: ri-flash 600ms ease-out; }
@keyframes ri-flash {
  from { background: var(--ri-flash); }
  to { background: transparent; }
}
.ri-name { font-weight: 600; }
.ri-badge {
  padding: 0 6px;
  border-radius: 999px;
  background: var(--ri-chip-bg);
  color: var(--ri-muted);
  font-size: 11px;
}
.ri-meta { color: var(--ri-muted); font-size: 11px; }

/* جزئیات */
.ri-d-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.ri-d-name { font-size: 14px; font-weight: 700; }
.ri-status {
  padding: 0 8px;
  border-radius: 999px;
  background: var(--ri-chip-bg);
  color: var(--ri-muted);
  font-size: 11px;
}
.ri-status--mounted { background: var(--ri-ok-bg); color: var(--ri-ok); }
.ri-stats {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 2px 14px;
  margin: 0;
  padding: 8px 10px;
  background: var(--ri-bg-alt);
  border: 1px solid var(--ri-border);
  border-radius: 6px;
}
.ri-stats dt { color: var(--ri-muted); margin: 0; }
.ri-stats dd { margin: 0; }
.ri-section {
  margin: 14px 0 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ri-muted);
}
.ri-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--ri-border);
  border-radius: 6px;
  overflow: hidden;
}
.ri-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 10px;
  border-bottom: 1px solid var(--ri-border);
}
.ri-item:last-child { border-bottom: 0; }
.ri-idx { color: var(--ri-muted); min-width: 1.5em; }
.ri-item-name { font-weight: 600; }
.ri-value {
  margin-left: auto;
  padding-left: 8px;
  color: var(--ri-accent);
  text-align: right;
  word-break: break-all;
}
.ri-note { color: var(--ri-muted); margin: 0 0 6px; }
`;