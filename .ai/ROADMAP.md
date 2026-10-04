# Roadmap

Planned work, milestones and priorities. The session-by-session narrative is
in `SESSION_LOG.md` and rationale is in `DECISIONS.md`; this file only
summarizes current state and what is next. Condensed 2026-10-04.

---

## Phases

### Phase 1 — Core — **Complete**
Framework-agnostic plugin runtime: `Runtime`, `PluginManager`, plugin lifecycle (atomic registration, rollback on `setup()` failure, LIFO destruction), built-in Logger Plugin, full Quality Gate with coverage thresholds.

### Phase 2 — React integration — **Complete**
React lifecycle integration, Component Discovery (mount / update / unmount, including `memo` / `forwardRef`), accurate Render Tracking, structural Hook Tracking with value previews, structural Context Tracking, public read API (`getComponents()` / `getComponent()`), reactive `onChange()`. All validated end-to-end against a real React app in Playground.

### Phase 3 — Inspector / DevTools — **Active**
Delivered: on-demand `Insight.inspectHookNames()`; `@react-insight/inspector`; `memo` / `forwardRef` across the whole pipeline; and (2026-10-04) a DevTools panel built inside Playground on the public API only: component tree, detail pane, render flash, name filter, minimum-renders filter, hook/context summary. Not started: Timeline, extraction of the panel into its own package, Session management.

---

## Completed (by capability)

- Core runtime, plugin lifecycle, Logger Plugin, Quality Gate; real `.github/workflows/ci.yml` (lint, typecheck, build, test, core-only coverage, Node 22/24).
- `@react-insight/react` public API: `createInsight()`, `InsightProvider`, `useInsight()`, `installReactDevtoolsHook()` (must run before `react-dom` loads).
- Root lifecycle (effect-based, StrictMode-safe via serialized registration); Component Discovery registered eagerly in `createInsight()`.
- Render Tracking: root `commitCount`; per-component `rendered` / `renderCount` / `lastRenderedAt` (no known accuracy gaps).
- Structural Hook Tracking (`state`, `ref`, `memo-like`, `effect`, `layout-effect`, `unknown`) with bounded value previews (20 entries, 200-char strings); structural Context Tracking with `displayName`.
- `Insight.getComponents()`, `getComponent(id)`, `onChange()` (batched by microtask, gated by a structural dirty-check).
- `Insight.inspectHookNames(id)` (on-demand, one level of custom hook name, plain function / `memo` / `forwardRef` / `memo(forwardRef)`; not class components).
- `@react-insight/inspector` — `inspectComponent(insight, id)`.
- **Playground as a gated package** (2026-10-04): `lint` / `typecheck` / `test` scripts, Vitest, 34 unit tests over the panel's pure functions.
- **DevTools panel in Playground** (2026-10-04): `buildComponentTree`, `excludeSubtrees` (self-observation guard), `mergeHookInfo`, `filterComponentTree`, `filterByMinRenders`, `summarizeComponent`, tree / detail components, render flash.
- Housekeeping: orphaned `EventBus` system, archive folder, empty stub files and dead Playground files removed; `InsightContext.displayName` set; `ComponentSnapshot` exported.

---

## Current priorities (Phase 3, none started)

Candidates, each needing a short design approved before code:

1. **Extract the panel to `@react-insight/devtools`** — the UI is now stable and tested; decide package boundary, React peer dependency, and public API (depends only on `@react-insight/react` and `@react-insight/inspector` public APIs). Replaces the name-based self-exclusion with an explicit opt-out if that is cheap.
2. **Timeline** — needs a per-event history structure in `ComponentRegistry` (today only latest state is kept); an always-on hot-path change, so design first (ring buffer / memory cap / event schema / public API).
3. **Correct sibling order** — the tree orders siblings by registry insertion order, not React child order (visible after a re-mount). Needs a sibling index in the always-on pipeline.
4. Panel polish with no pipeline change, if wanted: expand/collapse, keyboard navigation, copy snapshot as JSON.

---

## Deferred, no current consumer

- Root-container correlation for multi-application pages (`DECISIONS.md`, 2026-07-18) and `ComponentRegistry.getByRoot()`.
- A full nested custom-hook tree for `inspectHookNames()` (current slice resolves one level).
- A React hook wrapper for the inspector (`useComponentInspection()`) — a plain `onClick` call sufficed.
- `rendererId` and `onPostCommitFiberRoot` (single `react-dom` renderer assumed).

## Known gaps

- Tree sibling order follows registry insertion order (above).
- The panel excludes itself by component name (`"DevtoolsPanel"`).
- `inspectHookNames()` custom hook names degrade under minified builds; hooks are never available in production React builds.
- Hook summary counts structural hooks only; `useContext` is reported under contexts, never under hooks (by design — it takes no hook slot).

## Longer-term goals

Publishable DevTools package, Timeline, Session management, npm release of all packages.

---

## Quality bar

Every item clears `pnpm lint && pnpm typecheck && pnpm build && pnpm test` (now including Playground). Any change touching Component Discovery, Render / Hook / Context Tracking or on-demand hook name resolution also requires manual end-to-end validation in Playground. Several real bugs were found only that way, never by fixture tests (see `DECISIONS.md`).