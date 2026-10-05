# Session Log

Condensed 2026-10-04. Sessions 1-25 are summarized per milestone (what shipped,
real findings, state at the end); the full prior narrative is in git history.
Decision rationale lives in `DECISIONS.md`, not here. Newest session first
after the condensed history.

---

## Condensed history (Sessions 1-25)

### Phase 1 — Core (Sessions 1-8)
- **S1-S4:** workspace + Core package; `Runtime`, `PluginManager`, plugin lifecycle; everything made generic (`PluginContext`, `InsightPlugin`, `definePlugin`, `PluginManager`, `Runtime`) with no public casts; built-in Logger Plugin; atomic registration with rollback.
- **S5-S6:** `PluginManager` fully tested; Playground created and used to validate package exports (first packaging issue found there); `clear()` replaced by `destroy()` (LIFO, state protection via `ensureNotDestroyed()`); Logger Plugin became a factory; coverage passed 90%.
- **S7:** Vitest coverage thresholds (V8), shared ESLint flat-config package, `exactOptionalPropertyTypes` fixes, localized documented assertion for generic variance. Metrics then: 5 test files, 32 tests, ~92% statements / 91% lines / 85% branches / 88% functions.
- **S8:** GitHub Actions workflow designed and verified on Node 22/24 (note: the workflow file was later found to be missing from the repo; the real one landed in S24). **Phase 1 complete.**

### Phase 2 — React integration (Sessions 9-23)
- **S9-S12:** `@react-insight/react` (`createInsight()`, `InsightProvider`, `useInsight()`, `Insight` facade, Runtime behind a symbol, `internal/` layer); Root model, `RootRegistry`, root lifecycle plugin and `useRootLifecycle`; `Component` model and `ComponentRegistry` (framework-agnostic); renames to `rootLifecyclePlugin`.
- **S13-S14:** Component Discovery architecture finalized and implemented (Hook Adapter, Fiber Adapter, Traversal, Mapper, `ComponentRegistry.sync()`, discovery plugin); unmount via `markUnmounted()` (history kept); Render Tracking started with root-level `commitCount`.
- **S15:** `getFiberId()` ghost-entry bug fixed (current/alternate swap); per-component `rendered`, `renderCount`, `lastRenderedAt`.
- **S16:** `Insight.getComponents()` + `ComponentSnapshot`; Playground wired to a real React app; **four real bugs found only in a real browser** (hook stub missing `inject()`, StrictMode register/unregister race, discovery registered too late, pre-root commits dropped); `installReactDevtoolsHook()` introduced; `renderCount` overcounting confirmed and documented.
- **S17:** overcounting fixed via a self-maintained last-observed props/state map (three iterations; the two intermediate versions each failed a longer real-browser test); dead files cleaned.
- **S18-S19:** structural Hook Tracking (`inspectHooks()`), hook value preview (`previewHookValue()`, shallow, bounded). `useContext` found to take no hook slot.
- **S20-S21:** Context Tracking (`inspectContexts()`); `contextInspector.test.ts`; `InsightContext.displayName` set; `ComponentSnapshot` actually exported from the entry point; empty stub files removed from Core and dead files from Playground. A documentation mix-up between `ROADMAP.md` and `SESSION_LOG.md` (both held the narrative) was corrected.
- **S22:** orphaned `EventBus` system removed from Core; `Insight.onChange()` added, with a microtask-batching fix for a synchronous notify loop.
- **S23:** `sync()` dirty-check (no notify when nothing changed); `InsightDebugPanel` self-observation loop fixed by excluding its own record (a debounce-only fix was proven insufficient by a 40s idle test). **Phase 2 scope complete.**

### Phase 3 — Inspector (Sessions 24-25)
- **S24:** real `ci.yml` added and verified; value preview extended to `ref` / `memo-like` (+ 200-char string cap); `ComponentRegistry` tests completed; `Insight.getComponent(id)`; `Insight.inspectHookNames(id)` (on-demand dispatcher swap; two technique/dependency decisions reversed after research); `@react-insight/inspector` created (fourth package).
- **S25:** Playground "Inspect" button (first UI consumer); `memo` / `forwardRef` support across the whole discovery pipeline (previously invisible); `dispatcherAccess.test.ts`. State: all `.ai/` docs synchronized.

---

## Session 27 (2026-10-04) — `@react-insight/devtools` extracted

**Goal.** Make the DevTools panel a separate, publishable package (design approved with defaults; see `DECISIONS.md`, 2026-10-04).

**Delivered (two gated commits).**
1. New package `packages/devtools`: tsup (esm + dts), metadata mirroring `inspector`, `index.ts` exporting only `DevtoolsPanel`; sources and the 34 tests copied; `react` + `@react-insight/react` as `peerDependencies`, `@react-insight/inspector` as dependency; `DevtoolsPanel.displayName = "ReactInsightDevtools"` used as the exclusion root predicate. Playground unchanged.
2. Playground switched to `import { DevtoolsPanel } from "@react-insight/devtools"`; `packages/playground/src/devtools/`, its `test` script, `vitest` devDependency and `vitest.config.ts` removed (lint and typecheck kept).

**Verification.** The developer reported the Quality Gate passing after each step (34 tests in `@react-insight/devtools`), CI green after each push, and manual Playground validation passing (tree populated, panel and children excluded, idle without activity, flash, filters, hook and context details).

**Findings.** One Gate failure along the way: Playground still had `"test": "vitest run"` after its tests were removed, and vitest exits 1 with no test files; removing the script fixed it.

**Known issues.** Sibling order follows registry insertion order, not React child order (needs a sibling index in the always-on pipeline: design first). Flash replays on first paint and when toggling "Show unmounted". Not yet published to npm.

**Documentation.** `ARCHITECTURE.md`, `DECISIONS.md` and this file updated. `ROADMAP.md` pending; `PROJECT_CONTEXT.md`, `REACT_ARCHITECTURE.md` and `REACT_RUNTIME_ARCHITECTURE.md` unchanged.

**Next recommended step.** Sibling-order design doc, or a Timeline design pass, or npm publishing readiness (versioning, README per package).

---

## Session 26 (2026-10-03 → 2026-10-04) — DevTools panel in Playground

**Goal.** Choose the next Phase 3 slice. Decision: a real DevTools panel built inside Playground on the public API only, before Timeline (see `DECISIONS.md`, 2026-10-04).

**Delivered (all in small, individually gated steps).**
1. Fixed a stale `inspectHookNames()` JSDoc in `types.ts` that still said `memo`/`forwardRef` were unsupported.
2. Playground test infrastructure: `lint` / `typecheck` / `test` scripts, `vitest` + `eslint` devDependencies, `vitest.config.ts`. Lint exposed leftovers: unused React imports and an unused `ContextProbe`, now re-rendered under `ThemeContext.Provider value="dark"` as a permanent fixture.
3. `DevtoolsPanel` replaces `InsightDebugPanel` (`packages/playground/src/devtools/`): `buildComponentTree` (parentId → tree; orphans and self-parents become roots; optional unmounted filter), `ComponentTreeView`, `ComponentDetails` (live snapshot + hook names joined by index via `mergeHookInfo`), `excludeSubtrees` (self-observation guard), throttled `onChange()` refresh (150ms) with a JSON-snapshot dirty check.
4. UI features on snapshot data only: render flash (`key={renderCount}` + CSS animation), name filter (`filterComponentTree`), minimum-renders filter (`filterByMinRenders`), hook/context summary per row (`summarizeComponent`).

**Tests.** Playground went from 0 to 34 (buildComponentTree 9, excludeSubtrees 5, mergeHookInfo 4, filterComponentTree 6, filterByMinRenders 6, summarizeComponent 4).

**Verification.** The developer ran the full Quality Gate after each step and reported it passing; CI was reported green after each push. Manual Playground validation was performed and reported successful for the panel (tree, no self-listing, idle = no activity, increment, unmount/mount, selection/detail), the flash, both filters and the summary.

**Real findings (recorded, not assumed).**
- Child components of the panel are themselves tracked, so excluding only the panel by name would recreate the 2026-08-23 loop; whole-subtree exclusion fixed it by design and idle validation confirmed it.
- `useContext` does not appear in `hooks`: `ContextProbe` showed "No hooks" with `ThemeContext = "dark"` under contexts; `InsightProvider` shows exactly 2 hooks (`useRef` + `useEffect` from `useRootLifecycle`). Confirmed in source (`hookNameInspector.ts` shim comment).
- A re-mounted component is a new instance: the old `Greeting` stays as an unmounted record next to the new one.
- **Sibling order in the tree follows registry insertion order, not React child order** (a re-mounted `Greeting` listed after `ContextProbe` although it renders before it). Fixing it needs a sibling index in the always-on pipeline.
- An editor-only "Could not find a declaration file for '@react-insight/react'" error appeared once (config is correct; `typecheck` passed in CI); treated as a stale/missing `dist` or TS-server cache, not reproduced.

**Known issues / limitations.** Sibling order (above); panel exclusion matched by name (fixed in Session 27); flash replays on first paint and when toggling "Show unmounted"; hook count in the summary excludes `useContext` by design.

**Documentation.** `.ai/` synchronized and condensed this session (DECISIONS, SESSION_LOG, ROADMAP, PROJECT_CONTEXT, ARCHITECTURE). `REACT_ARCHITECTURE.md` and `REACT_RUNTIME_ARCHITECTURE.md` were not touched: no React-package or runtime behavior changed this session.

**Next recommended step.** Extraction to `@react-insight/devtools` (done in Session 27); then Timeline or sibling order (both need a design).