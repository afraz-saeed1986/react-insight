# Session Log

Condensed 2026-10-04, updated 2026-10-21. Sessions 1-25 are summarized per milestone (what shipped,
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

## Session 30 (2026-10-21) — first npm release

**Goal.** Publish `0.1.0` of `core`, `react`, `inspector` and `devtools`.

**Delivered.**
1. npm account setup: 2FA with a passkey (npm no longer allows new TOTP setups), and the `react-insight` organization (the maintainer is owner). The name was free (`npm view @react-insight/core` returned 404 before publishing).
2. Pre-publish checks: clean `main` in sync with `origin/main`, all four versions `0.1.0`, CI green, `pnpm publish -r --dry-run` for all four, `publint` all good, `attw` clean except an expected note (ESM only: a CommonJS `require` needs a dynamic `import()`).
3. `CHANGELOG.md`: `[Unreleased]` became `[0.1.0] - 2026-10-21` (commit `4e6d249`, CI green).
4. Published by hand from the maintainer's computer with `pnpm --filter <package> publish --access public`, one package at a time in the order `core` → `react` → `inspector` → `devtools`, checking `versions` and `dist-tags` after each.
5. Post-release checks: a fresh project installed `react`, `inspector` and `devtools` from the registry (`core` came in through `react`; `pnpm why` confirmed one version) and the entry points loaded; `next-dogfood` was switched from tarballs to `^0.1.0` from the registry and worked in `next dev` and in a production build.

**Real findings.**
- No physical security key was available. The Windows passkey dialog only offered a USB key, so the passkey was registered from an Android phone ("This device"). `npm login` and each publish approval were done by opening the login link on the phone.
- Right after each publish, `npm view` showed only `0.0.0-stage` (as version and as `latest`) for several minutes, although `pnpm` reported "Published". With `--prefer-online`, a few minutes later each package listed `["0.0.0-stage", "0.1.0"]` with `latest: 0.1.0`. npm's documentation describes `0.0.0-stage` as a placeholder npm creates for a new package under staged publishing; whether that was the cause here was not confirmed. Each package keeps this placeholder version.
- `next-dogfood` had `@react-insight/core` as a direct dependency left from the tarball setup, but no code imports it; the build worked without it.

**Verification.** The developer reported: the `npm view` outputs above, the fresh-install import check, `next-dogfood` working in dev and production from the registry, `pnpm build` passing after the direct `core` dependency was removed, and CI green after the CHANGELOG commit.

**Known issues.** The git tag `v0.1.0` already existed and points to the older commit `b852a46`, not to `4e6d249` which the packages were published from; left as is by the maintainer's decision. The `0.0.0-stage` placeholder versions remain. Sibling order still follows registry insertion order.

**Documentation.** `ARCHITECTURE.md`, `PROJECT_CONTEXT.md`, `ROADMAP.md` and this file updated. `DECISIONS.md` unchanged: no new architectural decision was made.

**Next recommended step.** Choose between the Phase 3 candidates in `ROADMAP.md` (sibling order, Timeline, or the `@react-insight/react/install` entry point; each needs a short approved design first).

---

## Session 29 (2026-10-07 → 2026-10-20) — Next.js, render reasons, panel behavior

**Goal.** Validate the packed tarballs in a real Next.js app, then improve what a user sees in the panel before the first npm release.

**Delivered (small gated steps).**
1. Hook name resolution shims for React 19 / React Compiler output: `useMemoCache`, `useTransition`, `useOptimistic`, `useActionState`, `useSyncExternalStore`, `use`; custom hook names only for `useXxx` callers (2026-10-13 to 17).
2. Next.js setup: the hook is installed from `src/instrumentation-client.ts` (2026-10-17), documented in the READMEs.
3. Panel: bottom-docked, closed by default (body mounts only while open), filters, expand/collapse (2026-10-07 to 17).
4. Render detection fixes and `ComponentSnapshot.lastRenderReasons` / exported `RenderReason`, shown as "Why it rendered" in the details pane (2026-10-18).
5. `memo` wrapper `displayName` read from `fiber.elementType`; `elementType` declared on `FiberNode` so the cast in `getDisplayName()` is gone (2026-10-19 to 20).
6. Panel keyboard navigation (ARIA tree; arrow keys only move focus because selection runs an inspection) and remembered panel size in `localStorage`, capped to the viewport (2026-10-19 to 20).
7. READMEs and `CHANGELOG.md` updated; all `.ai/` docs except `PROJECT_CONTEXT.md` synchronized with the code (2026-10-20).

**Real findings.**
- Next.js: the separate-module hook trick worked in `next dev` but the production build showed an empty tree; `instrumentation-client.ts` fixed it. `renderers.size` stays unreliable as a check in dev.
- Render detection: a component without hooks that re-rendered only because of a context change was under-counted; remembered values were written but never released on unmount. Both fixed.
- In production Next builds, plain function component names are lost ("Anonymous") unless `displayName` is set; a simple `memo(fn)` showed as "Anonymous" because its wrapper name lives in `elementType`.
- The panel could overflow the viewport when the window shrank after the panel was enlarged; fixed with a CSS `max-height`.

**Verification.** The developer reported the Quality Gate passing for each code step, CI green for each push (checked with `gh run list`), and manual validation passing: "Why it rendered" in a real Next.js 16 app (dev and production, React Compiler), every prediction matched; keyboard navigation and persisted size (7 manual checks each time).

**Decisions.** A per-row render-reason indicator was decided against for now (the reason is already in the details pane); revisit only if feedback asks. Publishing to npm was postponed on 2026-10-20 and done the next day (Session 30).

**Known issues.** Sibling order follows registry insertion order (needs design). A state change with an equal bounded preview reports "No cause detected". Nothing was published to npm during this session.

**Next recommended step.** Publish `0.1.0` (done in Session 30).

---

## Session 28 (2026-10-05) — npm publishing readiness and a hidden CI failure

**Goal.** Make the four publishable packages (`core`, `react`, `inspector`, `devtools`) ready for npm. Scope owner confirmed: `@react-insight/core` returned 404 on npm, so the scope was free. Defaults: all packages versioned together by hand, starting at `0.1.0`, no Changesets yet.

**Delivered (gated steps).**
1. Package metadata: `publishConfig.access: "public"`, inter-package dependencies and the `devtools` peerDependency changed from `workspace:*` to `workspace:^` (publishes as `^0.1.0`, not an exact version); stray `packages/core/package-lock.json` and the unused root `clean` script removed.
2. `README.md` and `LICENSE` added to each of the four packages.
3. Root `README.md` rewritten (it still described only Phase 1) and `CHANGELOG.md` rewritten as one Unreleased section (it still listed removed internals such as `EventBus`).
4. `ci.yml` fixed (below) and Core tests added (below).
5. Tarball verification: `publint` and `attw` added as root devDependencies; `pnpm pack` per package; `@react-insight/react` gained the missing `license`/`repository`/`keywords`/`engines` metadata (publint flagged it). `pnpm publish -r --dry-run` succeeded for all four packages.
6. Fresh-app smoke test of the packed tarballs (second real finding, below) and the README/Playground fix.

**Real finding: CI had been red or incomplete, and nobody noticed.** After step 3 the developer reported CI failing on `typecheck`, then realized that several earlier pushes had also been red and had been read as green. Causes found from the logs, not guessed:
- `typecheck` ran before `build`, so on a fresh clone `@react-insight/react` could not resolve `@react-insight/core` (TS2307). Locally this was hidden by existing `dist` folders.
- The Test step ran only `@react-insight/core`'s tests, so `react`, `inspector` and `devtools` tests never ran in CI.
- Once the Core coverage step actually ran, it failed: statements/lines 87.3% and functions 80.76% against thresholds of 90/90/85. Causes: untested `src/dev.ts` scratch file (0%, removed after confirming nothing referenced it), untested `PluginManager.has()` and `size`, and untested `PluginContext.emit()`/`on()` and unsubscribe paths in `Runtime`. Fixed with four new tests, thresholds unchanged.

**Real finding 2: the hook install pattern in the README was wrong.** Installing the tarballs into a fresh Vite app worked in `vite dev` but the production preview showed "No components to show" (`__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.size` was 0). ES `import`s run before the importing file's body, so `installReactDevtoolsHook()` placed above the `react-dom` import actually ran after it, and `react-dom` injects only once at module load (confirmed in `react-dom@19.3.0` source). Dev hid it because `@vitejs/plugin-react` installs react-refresh's hook first (verified in `react-refresh@0.19.0`: same six keys, `inject()` never fills `renderers`, so `renderers.size` is always 0 in dev and was a misleading check). Fix: documented and used the separate-module pattern (`installHook.ts` as the first import) in both READMEs and Playground; no library code changed. Verified in the fresh app and in Playground production preview (`renderers.size` = 1, tree populated).

**Fix.** `ci.yml` now runs build, lint, typecheck, `pnpm test` for all packages, then `test:coverage` for Core. Local Gate order is `pnpm build && pnpm lint && pnpm typecheck && pnpm test`.

**Verification.** After the last push the developer reported local tests passing and CI green, stating explicitly that this time the run was checked.

**Process lessons.** (1) "CI passed" is only recorded after the run itself is looked at (`gh run list`), never from a general impression. (2) Before a release, test the packed tarballs in a fresh app against a production build; the dev server and package tests cannot catch hook-ordering mistakes.

**Known issues.** Sibling order follows registry insertion order (needs design). Flash replays on first paint and when toggling "Show unmounted". Core's current coverage numbers are not recorded in docs (CI reports them). Not yet published to npm; the real publish needs the developer's npm login and 2FA. An `@react-insight/react/install` entry point (one import, no ordering pitfall) was considered and deferred.

**Documentation.** `ARCHITECTURE.md`, `PROJECT_CONTEXT.md`, `DECISIONS.md` (CI entry, publishing metadata entry, hook-install entry) and this file updated; `ROADMAP.md` follows.

**Next recommended step.** The real first publish of `0.1.0` (developer-run, order `core` → `react` → `inspector` → `devtools`, after `npm login`/2FA); then decide between an `@react-insight/react/install` design, sibling order, or Timeline.

---

## Session 27 (2026-10-04) — `@react-insight/devtools` extracted

**Goal.** Make the DevTools panel a separate, publishable package (design approved with defaults; see `DECISIONS.md`, 2026-10-04).

**Delivered (two gated commits).**
1. New package `packages/devtools`: tsup (esm + dts), metadata mirroring `inspector`, `index.ts` exporting only `DevtoolsPanel`; sources and the 34 tests copied; `react` + `@react-insight/react` as `peerDependencies`, `@react-insight/inspector` as dependency; `DevtoolsPanel.displayName = "ReactInsightDevtools"` used as the exclusion root predicate. Playground unchanged.
2. Playground switched to `import { DevtoolsPanel } from "@react-insight/devtools"`; `packages/playground/src/devtools/`, its `test` script, `vitest` devDependency and `vitest.config.ts` removed (lint and typecheck kept).

**Verification.** The developer reported the Quality Gate passing after each step (34 tests in `@react-insight/devtools`), CI green after each push, and manual Playground validation passing (tree populated, panel and children excluded, idle without activity, flash, filters, hook and context details).

**Findings.** One Gate failure along the way: Playground still had `"test": "vitest run"` after its tests were removed, and vitest exits 1 with no test files; removing the script fixed it.

**Known issues.** Sibling order follows registry insertion order, not React child order (needs a sibling index in the always-on pipeline: design first). Flash replays on first paint and when toggling "Show unmounted". Not yet published to npm.

**Documentation.** `ARCHITECTURE.md`, `DECISIONS.md`, `ROADMAP.md`, `PROJECT_CONTEXT.md` and this file updated. `REACT_ARCHITECTURE.md` and `REACT_RUNTIME_ARCHITECTURE.md` unchanged.

**Next recommended step.** Continue publishing readiness (Session 28); then sibling-order design or Timeline design.

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