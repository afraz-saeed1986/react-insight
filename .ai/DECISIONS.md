# Architecture Decisions

Condensed 2026-10-04: every decision is kept, but each entry is reduced to
what was decided, why, and any real finding that changed the design. The
full prior text lives in git history. Newest decisions are at the bottom.

Entry shape: **Decision** · **Why** · (optional) **Found/Trade-off**.

---

## Foundations — Core & tooling (2026-07-07 → 2026-07-12)

- **Runtime owns the plugin lifecycle; `PluginManager` only stores plugins** (07-07). Single owner of lifecycle state.
- **`mitt` is the internal event emitter, hidden from the public API** (07-07).
- **Everything is generic** — `PluginContext`, `InsightPlugin`, `PluginManager`, `Runtime` (07-07/08). Why: preserve event payload types end to end with no `any`, `unknown`, or public casts.
- **Atomic plugin registration** (07-08). If `setup()` throws: the plugin is removed, the original error is re-thrown, no `plugin:registered` event is emitted.
- **Plugin names are unique**; a duplicate registration throws (07-08). The name is the identifier used by Runtime and PluginManager.
- **Every public API has automated tests** (07-08). Public behavior is the library contract.
- **Playground is the first consumer of the packages** (07-08, widened 07-11): imports workspace packages exactly like an external app (no relative imports into `src`), validating exports, lifecycle, destruction, built-in plugins and DX before publishing.
- **Package consistency** (07-08): every package has `package.json`, `tsconfig.json`, `src/`.
- **Runtime destruction** (07-11): `destroy()` destroys plugins in reverse registration order (LIFO), then the Runtime is permanently unusable; every public API checks state (`ensureNotDestroyed()`). `Runtime.clear()` was removed in favor of it, since removing plugins without running their cleanup leaks resources.
- **Built-in plugins are factories** (07-11), e.g. `loggerPlugin()`: each Runtime gets an isolated instance, with no state shared across Runtimes or tests.
- **Coverage-driven development + Quality Gate** (07-11/12): lint, typecheck, build, test, coverage thresholds (90/90/85/80 for statements/lines/functions/branches), enforced by Vitest and by GitHub Actions on a Node 22/24 matrix.
- **Shared ESLint flat config package** (07-11): one configuration for all packages.
- **Never relax TypeScript strictness** (07-11): `strict` and `strictFunctionTypes` stay on; when TS cannot express a safe relationship, use a localized, documented assertion.

## Foundations — React package (2026-07-13 → 2026-07-15)

- **Dedicated `@react-insight/react` package** (07-13): keeps Core framework-agnostic.
- **Runtime is never public in the React API** (07-13): apps get the `Insight` facade (`use()`, `destroy()`, later read APIs); the Runtime sits behind a symbol under `internal/`, never exported from the entry point. Why: API stability.
- **React public API has the same test strategy as Core** (07-13): `createInsight()`, `InsightProvider`, `useInsight()`.
- **YAGNI for React infrastructure** (07-14): `ReactBridge`, `InsightSession` and similar are deferred until a real consumer exists.
- **React lifecycle is an internal Runtime plugin** (07-14): `InsightProvider` only owns the integration point; the Runtime stays the single owner of plugin lifecycle; internal Runtime access goes through helper utilities.
- **`ComponentRegistry` is framework-agnostic** (07-15): stores only domain models, no Fiber knowledge.
- **Component Discovery is design-first** (07-15): no renderer abstraction or Fiber bridge before a concrete design with a real producer and consumer.

---

## 2026-07-18 — Scope cuts (no consumer, no field)

- **Removed unused `RootRegistration`**: no consumers; dead code confuses which lifecycle pattern is real.
- **`rendererId` deferred**: only `react-dom` is supported and nothing reads it. Multi-renderer support would be a major-version change.
- **Hook Adapter listens only to `onCommitFiberRoot` and `onCommitFiberUnmount`**: `onPostCommitFiberRoot` is not wired until something needs "effects ran" (e.g. Render Tracking).
- **Single React application per page assumed**: the hook is page-global and discovery attributes every component to the first `InternalRoot`. Revisit before any multi-root support (root-container correlation is deferred).

## 2026-07-19 — Unmount keeps history

`onUnmount` calls `ComponentRegistry.markUnmounted()` (sets `status: "unmounted"`, `unmountedAt`) instead of `unregister()`. Why: `status`/`unmountedAt` otherwise had no producer, and unmounted components are the history a future Timeline/Inspector needs. `unregister()` keeps its hard-delete semantics, unused by discovery. Non-breaking. A re-mounted component is a new instance with a new id, so its old unmounted record stays alongside it.

## 2026-07-20 — Render Tracking

- **Root-level commit counting first**: `InternalRoot.commitCount` / `lastCommittedAt`, `RootRegistry.recordCommit()` once per `onCommitFiberRoot`. Unambiguous. A per-component count inside `sync()` was rejected, since traversal walks the whole tree each commit and would count mere presence.
- **Fixed `getFiberId()` ghost entries**: React toggles two Fiber objects (`current`/`alternate`) per component, so a first update got a new id and left an orphan record. `FiberNode` gained `alternate`; `getFiberId()` now checks the alternate before minting an id. The old "stable id" test never simulated the swap.
- **Per-component `rendered`** (first version: direct hit = bailed out, alternate hit = rendered, neither = mount) with `renderCount` / `lastRenderedAt` on `ComponentNode`. Chosen over `<Profiler>` (touches consumer code) and `actualDuration` (dev-only). Superseded in accuracy by 2026-07-26.

## 2026-07-21 — Real-browser findings (Playground wired to a real React app)

Playground now renders a real tree through `InsightProvider`; until then discovery had only been tested on synthetic Fiber fixtures. Findings:

- **`Insight.getComponents()` / `ComponentSnapshot`** added: the registry model had no reader. Snapshot is deliberately decoupled from `ComponentNode`.
- **Removed `ComponentNode.children`**: never produced or read.
- **DevTools hook stub lacked `inject()`**: React calls `hook.inject()` once at `react-dom` load; without it React never reports commits. Stub now has `supportsFiber` and a real `inject()` (`createStubHook()`).
- **`installReactDevtoolsHook()` added as a public entry point**: must run before `react-dom` is imported (React reads the hook once at module init; same constraint as `react-devtools-inline`). The one deliberate exception to "nothing under `internal/` is exported"; `connectHookAdapter()` also calls it defensively.
- **StrictMode double-invoke race**: register/unregister were fire-and-forget while `unregisterPlugin()` awaits `destroy()` before freeing the name, so the second mount threw "already registered". Fix: serialize operations through a per-hook promise chain (`useRootLifecycle`); regression test renders under `<StrictMode>`.
- **Discovery registered too late**: an effect runs after the commit it reacts to, so it can never see its own first commit. Discovery is now registered eagerly in `createInsight()`; root lifecycle stays effect-based.
- **Pre-root commits were dropped**: `onCommit` now always runs and tags components with `rootId: "pending"`; the next commit self-heals it because `sync()` updates `rootId` unconditionally.
- **`renderCount` overcounting** was documented as a known limitation here (fixed 07-26).
- **Playground polled `getComponents()` every 500ms**: reactive API deferred until a real consumer existed (done 08-04).

## 2026-07-26 — Fixed `renderCount` overcounting (three iterations)

React clones Fibers along the update path even when a component's body does not re-run, so object identity overcounts ancestors/siblings. Final design: `resolveFiberIdentity()` keeps a self-maintained `Map<id, {props, state}>` (`lastObservedValues`) and compares incoming `memoizedProps`/`memoizedState` against the last observation for that stable id, on every hit type.
Rejected along the way, each only caught by a longer real-browser test: (1) comparing against `alternate` on the alternate-hit path only (React recycles two Fibers, so later direct hits can be real updates); (2) comparing against `alternate` uniformly (it freezes after a component's last real update, so `rendered` stays true forever; one component reached `renderCount` 183).
Result: exactly +1 per real update, flat for everything else. Root `commitCount` was never affected. Files: `fiberAdapter.ts` (`memoizedProps`/`memoizedState`), `traversal.ts`, `traversal.test.ts`.

## 2026-07-27 — Structural Hook Tracking (`inspectHooks()`)

**Decision:** classify each hook by shape on every commit (`state | ref | memo-like | effect | layout-effect | unknown`), no re-render, no instrumented dispatcher. DevTools-style name resolution (re-invoking the component) was researched and deferred as an on-demand technique (done 08-24).
**Found (Playground probe):** `useState`/`useReducer` share one shape; `useMemo`/`useCallback` share one shape; `useRef` is unique; effects are distinguishable via the effect `tag` bitmask (`Passive` vs `Layout`). **`useContext` consumes no hook slot**, so it never appears in the hooks list (confirmed: a component with `useContext` + `useState` + `useEffect` reported 2 hooks).
Class components are guarded with `type.prototype.isReactComponent`. Threaded as `hooks` through `FiberNode` → `DiscoveredComponent` → `ComponentNode` → `ComponentSnapshot`; `sync()` updates it unconditionally (structural fact, not an accumulated stat).

## 2026-07-28 — Hook value preview (`previewHookValue()`)

Values of `state` hooks are readable straight from `memoizedState`. Preview is **shallow (one level), circular-safe by construction, and bounded** (20 entries per object/array): primitives as-is, nested non-primitives become `{ __type }`. A unit test caught a class instance at the top level being expanded; fixed by running `describeType()` first. Validated live in Playground.

## 2026-07-29 — Structural Context Tracking (`inspectContexts()`)

Because `useContext` leaves no hook node, contexts get their own mechanism: walk `fiber.dependencies.firstContext`, deduplicated by `context` identity (StrictMode produced two nodes for one `useContext`), value via `previewHookValue()`, `displayName` from `Context.displayName` (fallback `"Context"`). Exposed as `ComponentSnapshot.contexts`.

## 2026-08-04 — Core cleanup and `Insight.onChange()`

- **Removed the orphaned `EventBus` / `Subscription` / `SubscriptionRegistry`** from Core: fully tested but never wired into `Runtime`, which uses `mitt`. Verified safe by relocating the folder outside `src`, running the full gate, then deleting (leftover folder deleted 08-24). Removed rather than adopted: replacing working code with no new capability.
- **`Insight.onChange(listener): () => void`** backed by `ComponentRegistry.subscribe()`, independent of Core's event system. First version notified synchronously per `sync()`; since the panel sits inside the tree it observes, one click produced a runaway loop (`renders: 52`+). Fix: `scheduleNotify()` batches within one tick via `queueMicrotask()` and a `pendingNotify` flag; regression test included.

## 2026-08-23 — `onChange()` dirty-check and panel self-observation

- **Bug 1:** `sync()` notified on every call although traversal syncs every component each commit. Now `sync()` skips write and notify when `rendered` is false and `rootId` / `displayName` / `parentId` / `hooks` / `contexts` are unchanged (`sameStructural()` uses `JSON.stringify`, safe only because previews are small and JSON-serializable).
- **Bug 2:** the panel's own refresh is a real tracked render, so the loop is inherent to observing yourself. A 150ms debounce only throttled it (panel `renderCount` grew 298 → 364 during 40s idle). Real fix: decide whether to refresh from a snapshot that **excludes the panel's own record**, plus an immediate catch-up on mount. Result: a click = exactly 2 panel renders, idle = 0.
Lesson: any subscriber living inside the tree it observes must exclude itself.

## 2026-08-24 — Housekeeping and small APIs

- Deleted `packages/_core_src_archive_events`; **added the real `.github/workflows/ci.yml`** (lint, typecheck, build, test, core-only coverage, Node 22/24). Earlier docs had claimed CI existed when no workflow file did.
- **Value preview extended to `ref` (the `.current` contents) and `memo-like` (the memoized value)**; Playground exposed an unbounded string, so `MAX_STRING_LENGTH = 200` with a `"… (N chars total)"` suffix was added (type shape unchanged).
- **Completed `ComponentRegistry` tests**: per-field dirty-check granularity (`rootId` alone drives the "pending" self-heal), `has()` / `values()` / `unregister()` untracked-id, and a documented behavior: `sync()` on an unmounted id updates fields but does not resurrect `status`.
- **`Insight.getComponent(id)`** (O(1)), sharing one `toSnapshot()` mapping with `getComponents()`.

## 2026-08-24 — `Insight.inspectHookNames(id)` (Phase 3 begins)

**Decision:** on-demand hook name resolution by re-invoking the component with an instrumented dispatcher; strictly opt-in, never in the always-on pipeline (the one deliberate departure from zero-instrumentation).
**Reversed after research:** (1) not using the `react-debug-tools` npm package: ~7 years stale (0.1.0) while DevTools uses a vendored, evolving copy (`useOptimistic`, `use()`, ...); hand-rolled, deliberately narrower version instead. (2) Not capturing `currentDispatcherRef` via `hookAdapter.ts`/`inject()`: React 19 exposes the active dispatcher on `react` itself (`React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H`; pre-19 fallback `ReactCurrentDispatcher.current`), implemented as `dispatcherAccess.ts`.
**New capability / memory lifetime:** `fiberHandleRegistry.ts` (`Map<ComponentId, FiberNode>`) is the first place retaining a live Fiber beyond one commit; cleared in `componentDiscoveryPlugin`'s `onUnmount`.
**Implementation:** shim dispatcher reads the committed hooks list without real update logic; unknown hooks go through a best-effort `Proxy` (consumes one slot, returns the raw value); `console.*` suppressed and the real dispatcher restored in `finally`.
**Custom hook name:** a fixed stack-frame offset failed twice in real runs (`recordCall` added a frame; V8 reports `Proxy.useState`). Final: strip any prefix before the last `.`, skip leading known-internal frames, take the first remaining frame.
**Scope:** one level of custom hook only (no nested tree); degrades (omits `customHookName`) under minification; returns `undefined` where internals are unavailable (production builds). Tested with real React rendering via `@testing-library/react`; validated in Playground.

## 2026-08-24 — `@react-insight/inspector` (fourth package)

Exports `inspectComponent(insight, id)` = `getComponent()` + `inspectHookNames()` → `ComponentInspection | undefined`. Depends only on the public `Insight` API (no Fiber knowledge), realizing the pre-existing rule that "Inspector implementation" does not belong in `@react-insight/react`. A plain function, not a React hook: no consumer needed one. Tested against a fake `Insight`.

## 2026-08-25 — Inspect UI, `memo`/`forwardRef`, dispatcher tests

- **Playground "Inspect" button** (first UI consumer of the inspector). Resolved `Counter` → `useState`, and `InsightProvider` → `useRef` + `useEffect` with `customHookName: "useRootLifecycle"`. **`useComponentInspection()` hook wrapper: not justified** (a plain `onClick` call sufficed); deferred until some consumer needs live results.
- **`memo` / `forwardRef` components were invisible to the whole pipeline.** `isComponentFiber()` only accepted `typeof fiber.type === "function"`. Initially mis-scoped as an on-demand-only change; inspecting `traversal.ts` showed the gap was in the always-on gate. Fix: recognize `Symbol.for("react.memo")` / `Symbol.for("react.forward_ref")` (defined locally in `fiberAdapter.ts`, no `react-is` dependency since these symbols never changed); `isComponentFiber()` / `getDisplayName()` and `hookNameInspector.ts` unwrap recursively (covers `memo(forwardRef(...))`). Hook Inspector, Context Inspector and Render Tracking needed no change (they read Fiber-instance state). Two bugs found only by running tests: React's `SimpleMemoComponent` optimization already unwraps `fiber.type` for plain `memo(fn)` (test-helper issue, not production), and an unnamed inline arrow in `forwardRef` yields a frame `"at file:line:col"` that the old regex misparsed as a name (fixed by requiring the `"name ("` form).
- **`dispatcherAccess.test.ts`** covers all four branches via `vi.doMock("react", ...)` + dynamic `import()`. Vitest finding: a mock factory must return every key the module reads, even as `undefined`.

---

## 2026-10-04 — DevTools panel before Timeline, built inside Playground first

**Context.** Phase 3 had two candidates with no design: Timeline and a real DevTools panel.
**Decision.** Build the DevTools panel first, inside Playground (`packages/playground/src/devtools/`), using only the public API (`getComponents()`, `onChange()`, `inspectComponent()`). No new package yet; extraction to `@react-insight/devtools` is a later, separate decision once the UI shape is stable.
**Why.** It touches no always-on pipeline code. Timeline would need a per-event history in `ComponentRegistry` (today it keeps only latest state: `renderCount`, `lastRenderedAt`), i.e. a new always-on structure on the hot path (ring buffer, memory cap, event schema, public API) with an unknown consumer. A real panel shows which data Timeline actually needs.
**Trade-off.** The panel is not publishable until extracted. `@react-insight/inspector` stays React-free, so UI never goes there.

## 2026-10-04 — Playground joins the Quality Gate

**Decision.** `packages/playground` gets `lint`, `typecheck` and `test` scripts and `eslint` / `vitest` / `@react-insight/eslint-config` as devDependencies, mirroring `inspector`. `pnpm -r lint|typecheck|test` now covers it.
**Why.** It previously had none, so any test written there would silently never run. Enabling lint immediately flagged real leftovers (unused React imports from temporary validation components; an unused `ContextProbe`). `ContextProbe` was re-rendered under `ThemeContext.Provider value="dark"` as a permanent Context Tracking fixture instead of being deleted.
**Consequence.** Any CI step that lists packages explicitly (rather than `pnpm -r`) must include Playground.

## 2026-10-04 — The panel excludes its whole subtree, not only itself

**Context.** The 2026-08-23 fix excluded the panel's own record by `displayName`. The new panel renders child components (`ComponentTreeView`, `ComponentDetails`, ...), which Insight also tracks; their `renderCount` changes would re-trigger the panel and recreate the loop.
**Decision.** `excludeSubtrees(snapshots, isExcludedRoot)` drops the panel and every descendant (resolved via the `parentId` chain, cycle-safe) before building the tree or comparing snapshots. Validated live: the panel and its children never appear, and idle shows zero activity.
**Accepted hack.** The root is still matched by name (`PANEL_DISPLAY_NAME = "DevtoolsPanel"`, must equal the function name). The proper fix is an explicit opt-out in `createInsight()`, which changes the always-on pipeline and is deferred pending its own design.

## 2026-10-04 — Inspection stays explicit; panel features use snapshot data only

Selecting a row, or pressing "Re-inspect", is the only thing that calls `inspectComponent()` (and therefore re-executes the component's render body). The panel's name filter, minimum-renders filter, hook/context summary and render-flash animation are all pure functions or CSS over `ComponentSnapshot` data, with no extra state-driven re-renders of tracked components. The flash uses `key={renderCount}` to replay a CSS animation; rapid renders inside the 150ms throttle collapse into one flash, and a remount (first paint, toggling "Show unmounted") flashes all rows once (accepted).