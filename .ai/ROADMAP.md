# Roadmap

Planned work, milestones and priorities. The session-by-session narrative is
in `SESSION_LOG.md` and rationale is in `DECISIONS.md`; this file only
summarizes current state and what is next. Condensed 2026-10-04, updated 2026-10-20.

---

## Phases

### Phase 1 — Core — **Complete**
Framework-agnostic plugin runtime: `Runtime`, `PluginManager`, plugin lifecycle (atomic registration, rollback on `setup()` failure, LIFO destruction), built-in Logger Plugin, full Quality Gate with coverage thresholds.

### Phase 2 — React integration — **Complete**
React lifecycle integration, Component Discovery (mount / update / unmount, including `memo` / `forwardRef`), accurate Render Tracking, structural Hook Tracking with value previews, structural Context Tracking, public read API (`getComponents()` / `getComponent()`), reactive `onChange()`. All validated end-to-end against a real React app in Playground.

### Phase 3 — Inspector / DevTools — **Active**
Delivered: on-demand `Insight.inspectHookNames()`; `@react-insight/inspector`; `memo` / `forwardRef` across the whole pipeline; and (2026-10-04) a DevTools panel on the public API only (component tree, detail pane, render flash, name filter, minimum-renders filter, hook/context summary), extracted the same day into the fifth package `@react-insight/devtools`. Since then: hook name shims for React 19 / React Compiler output, Next.js setup via `instrumentation-client.ts` (2026-10-17), "Why it rendered" from `ComponentSnapshot.lastRenderReasons` (2026-10-18), `memo` wrapper `displayName` (2026-10-19), and panel keyboard navigation with remembered panel size (2026-10-20). The first npm release (`0.1.0` of `core`, `react`, `inspector` and `devtools`) was published on 2026-10-21. Not started: Timeline, Session management.

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
- **First npm release** (2026-10-21): `@react-insight/core`, `react`, `inspector` and `devtools` `0.1.0` published from the maintainer's computer, in the order `core` → `react` → `inspector` → `devtools`; `latest` points to `0.1.0` for each (each package also lists a `0.0.0-stage` placeholder version that npm created). Checked afterwards by installing from the registry in a fresh project and in the Next.js 16 app (dev and production build).
- **Render reasons** (2026-10-18): `ComponentSnapshot.lastRenderReasons` (`RenderReason`: `mount`, `props`, `state`, `context`, `parent`, `unknown`). Render detection also compares raw context values, and remembered values are released on unmount. Shown as "Why it rendered" in the panel details. Validated in a real Next.js 16 app (dev and production, React Compiler).
- **Hook name resolution shims** (2026-10-13 to 17): explicit handling for `useMemoCache`, `useTransition`, `useOptimistic`, `useActionState`, `useSyncExternalStore` and `use`; custom hook names only for `useXxx` callers.
- **Next.js setup** (2026-10-17): the hook is installed from `src/instrumentation-client.ts`; documented in the READMEs.
- **Panel behavior** (2026-10-07 to 20): bottom-docked, closed by default (body mounts only while open), filters, expand/collapse, ARIA tree keyboard navigation (arrow keys move focus only), panel size remembered in `localStorage` and capped to the viewport. `memo` wrapper `displayName` is resolved from `elementType` (2026-10-19).
- Housekeeping: orphaned `EventBus` system, archive folder, empty stub files and dead Playground files removed; `InsightContext.displayName` set; `ComponentSnapshot` exported.

---

## Current priorities (Phase 3, none started)

Candidates, each needing a short design approved before code (panel polish below needs no pipeline change):

1. **Timeline** — needs a per-event history structure in `ComponentRegistry` (today only latest state is kept); an always-on hot-path change, so design first (ring buffer / memory cap / event schema / public API).
2. **Correct sibling order** — the tree orders siblings by registry insertion order, not React child order (visible after a re-mount). Needs a sibling index in the always-on pipeline.
3. Panel polish with no pipeline change, if wanted: copy snapshot as JSON. (Expand/collapse and keyboard navigation are done. A per-row render-reason indicator was decided against for now, to keep rows uncluttered, since the reason is already in the details pane; revisit if feedback asks for it.)
4. **First npm publish of `0.1.0`** — developer-run (needs npm login and 2FA; irreversible, versions can only be deprecated): order `core` → `react` → `inspector` → `devtools`. Technical readiness is done. Postponed by the maintainer (2026-10-20); nothing has been published. A step-by-step publishing guide is the next task.
4. **`@react-insight/react/install` entry point** — one `import` line that installs the hook, removing the ordering pitfall from the READMEs. New public API, so it needs a short design first.

---

## Deferred, no current consumer

- Root-container correlation for multi-application pages (`DECISIONS.md`, 2026-07-18) and `ComponentRegistry.getByRoot()`.
- A full nested custom-hook tree for `inspectHookNames()` (current slice resolves one level).
- A React hook wrapper for the inspector (`useComponentInspection()`) — a plain `onClick` call sufficed.
- `rendererId` and `onPostCommitFiberRoot` (single `react-dom` renderer assumed).

## Known gaps

- Git tag `v0.1.0` points to the older commit `b852a46`, not to `4e6d249`, the commit the packages were published from. Left as is for now (2026-10-21).
- Tree sibling order follows registry insertion order (above).
- `inspectHookNames()` custom hook names degrade under minified builds; hooks are never available in production React builds.
- Render reasons: a state change whose bounded preview is equal (for example a new object with equal contents) reports "No cause detected"; class components have no hook-level reasons; `children` often appears among changed props.
- Hook summary counts structural hooks only; `useContext` is reported under contexts, never under hooks (by design — it takes no hook slot).

## Longer-term goals

Timeline, Session management.

---

## Quality bar

Every item clears `pnpm build && pnpm lint && pnpm typecheck && pnpm test` (`build` first; all five packages; Playground has no unit tests) and a checked, green CI run. Any change touching Component Discovery, Render / Hook / Context Tracking or on-demand hook name resolution also requires manual end-to-end validation in Playground. Several real bugs were found only that way, never by fixture tests (see `DECISIONS.md`).