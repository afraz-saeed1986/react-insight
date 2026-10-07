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
Delivered: on-demand `Insight.inspectHookNames()`; `@react-insight/inspector`; `memo` / `forwardRef` across the whole pipeline; and (2026-10-04) a DevTools panel on the public API only (component tree, detail pane, render flash, name filter, minimum-renders filter, hook/context summary), extracted the same day into the fifth package `@react-insight/devtools`. Not started: Timeline, Session management, npm release.

---

## Completed (by capability)

- Core runtime, plugin lifecycle, Logger Plugin, Quality Gate; `.github/workflows/ci.yml` (build, lint, typecheck, test of every package, core-only coverage, Node 22/24). Fixed 2026-10-05: it previously ran typecheck before build and only Core's tests, and had been red unnoticed.
- `@react-insight/react` public API: `createInsight()`, `InsightProvider`, `useInsight()`, `installReactDevtoolsHook()` (must run before `react-dom` loads).
- Root lifecycle (effect-based, StrictMode-safe via serialized registration); Component Discovery registered eagerly in `createInsight()`.
- Render Tracking: root `commitCount`; per-component `rendered` / `renderCount` / `lastRenderedAt` (no known accuracy gaps).
- Structural Hook Tracking (`state`, `ref`, `memo-like`, `effect`, `layout-effect`, `unknown`) with bounded value previews (20 entries, 200-char strings); structural Context Tracking with `displayName`.
- `Insight.getComponents()`, `getComponent(id)`, `onChange()` (batched by microtask, gated by a structural dirty-check).
- `Insight.inspectHookNames(id)` (on-demand, one level of custom hook name, plain function / `memo` / `forwardRef` / `memo(forwardRef)`; not class components).
- `@react-insight/inspector` — `inspectComponent(insight, id)`.
- **Playground as a gated package** (2026-10-04): `lint` / `typecheck` scripts (its unit tests moved with the panel code).
- **`@react-insight/devtools`** (2026-10-04): `DevtoolsPanel` (only public export): `buildComponentTree`, `excludeSubtrees` (self-observation guard, root matched by explicit `displayName`), `mergeHookInfo`, `filterComponentTree`, `filterByMinRenders`, `summarizeComponent`, tree / detail components, render flash; 34 unit tests; `react` and `@react-insight/react` as peerDependencies. Playground consumes it like an external app.
- **Publishing readiness, steps 1-4** (2026-10-05 to 07): `publishConfig.access`, `workspace:^` ranges, per-package README and LICENSE, root README and CHANGELOG, Core tests added to meet coverage thresholds, tarballs verified (`pnpm pack`, `publint`, `attw`, `pnpm publish -r --dry-run`), fresh-app smoke test against a production build (found and fixed the hook-install pattern in the READMEs and Playground; see `DECISIONS.md`, 2026-10-07).
- Housekeeping: orphaned `EventBus` system, archive folder, empty stub files and dead Playground files removed; `InsightContext.displayName` set; `ComponentSnapshot` exported.

---

## Current priorities (Phase 3, none started)

Candidates, each needing a short design approved before code (npm publishing readiness below needs no pipeline change):

1. **Timeline** — needs a per-event history structure in `ComponentRegistry` (today only latest state is kept); an always-on hot-path change, so design first (ring buffer / memory cap / event schema / public API).
2. **Correct sibling order** — the tree orders siblings by registry insertion order, not React child order (visible after a re-mount). Needs a sibling index in the always-on pipeline.
3. Panel polish with no pipeline change, if wanted: expand/collapse, keyboard navigation, copy snapshot as JSON.
4. **First npm publish of `0.1.0`** — developer-run (needs npm login and 2FA; irreversible, versions can only be deprecated): order `core` → `react` → `inspector` → `devtools`. Technical readiness is done. **Recommended next.**
5. **`@react-insight/react/install` entry point** — one `import` line that installs the hook, removing the ordering pitfall from the READMEs. New public API, so it needs a short design first.

---

## Deferred, no current consumer

- Root-container correlation for multi-application pages (`DECISIONS.md`, 2026-07-18) and `ComponentRegistry.getByRoot()`.
- A full nested custom-hook tree for `inspectHookNames()` (current slice resolves one level).
- A React hook wrapper for the inspector (`useComponentInspection()`) — a plain `onClick` call sufficed.
- `rendererId` and `onPostCommitFiberRoot` (single `react-dom` renderer assumed).

## Known gaps

- Tree sibling order follows registry insertion order (above).
- `inspectHookNames()` custom hook names degrade under minified builds; hooks are never available in production React builds.
- Hook summary counts structural hooks only; `useContext` is reported under contexts, never under hooks (by design — it takes no hook slot).

## Longer-term goals

Publishing `@react-insight/devtools`, Timeline, Session management, npm release of all packages.

---

## Quality bar

Every item clears `pnpm build && pnpm lint && pnpm typecheck && pnpm test` (`build` first; all five packages; Playground has no unit tests) and a checked, green CI run. Any change touching Component Discovery, Render / Hook / Context Tracking or on-demand hook name resolution also requires manual end-to-end validation in Playground. Several real bugs were found only that way, never by fixture tests (see `DECISIONS.md`).