# Roadmap

This file tracks planned work, milestones, priorities, and project
direction for React Insight.

For the detailed, session-by-session development narrative (what
changed, why, and what was verified), see `SESSION_LOG.md`. This file
does not duplicate that narrative — it summarizes current state and
what's next.

---

## Phases

### Phase 1 — Core

**Status: Complete.**

Framework-agnostic plugin runtime: `Runtime`, `PluginManager`, plugin
lifecycle (atomic registration, rollback on `setup()` failure, LIFO
destruction), built-in Logger Plugin, full Quality Gate (lint,
typecheck, build, test, coverage thresholds).

### Phase 2 — React Integration

**Status: Complete.**

React lifecycle integration, Component Discovery (mount/update/unmount),
fully-accurate Render Tracking, structural Hook Tracking (including
value previews across `state`/`ref`/`memo-like` kinds), structural
Context Tracking, a public read API (`getComponents()`/`getComponent()`),
and a reactive `onChange()` API are all implemented, tested, and
validated end-to-end against a real React application via Playground.
See "Completed" below for the full list. No open items remain in this
phase's original scope; remaining candidates once listed here
(root-container correlation, `getByRoot()`) had no real consumer and
are tracked instead under "Deferred, No Current Consumer" below.

### Phase 3 — Inspector

**Status: Active.**

Began 2026-08-24 with its first slice: on-demand hook name resolution
(`Insight.inspectHookNames()`) and the new `@react-insight/inspector`
package. This was the only Phase 3 candidate with existing design
groundwork (the technique itself was identified and deliberately
deferred back on 2026-07-27). Timeline, a real DevTools panel, and
Session management remain without a concrete design — see "Longer-Term
Goals" below.

---

## Completed (by capability, not session)

- Core Runtime, plugin lifecycle, built-in Logger Plugin, Quality Gate.
- `.github/workflows/ci.yml` — a real, verified-passing GitHub Actions
  CI workflow (lint, typecheck, build, test, core-only coverage, Node
  22/24 matrix), closing the "Known Gap" below where earlier
  documentation had claimed this was implemented and passing without
  an actual workflow file existing in the repository. See
  `DECISIONS.md`, 2026-08-24.
- `@react-insight/react` public API: `createInsight()`, `InsightProvider`,
  `useInsight()`, `installReactDevtoolsHook()`.
- React root lifecycle integration (effect-based, StrictMode-safe
  serialization).
- Component Discovery: mount, update, unmount (history-preserving via
  `markUnmounted()`), eager registration to observe the first commit.
- Render Tracking: root-level commit counting, per-component `rendered`
  detection (accurate against cloned/bailed-out fibers and Fiber
  recycling — no known accuracy limitations remain).
- Structural Hook Tracking (`inspectHooks()`), including a shallow value
  preview for `state`, `ref`, and `memo-like` kind hooks (extended from
  `state`-only on 2026-08-24).
- `previewHookValue()`'s string-length cap (`MAX_STRING_LENGTH = 200`),
  added 2026-08-24 alongside the `ref`/`memo-like` extension above,
  after Playground surfaced a real unbounded-string case.
- Structural Context Tracking (`inspectContexts()`), including
  `displayName` resolution, deduplication, and value preview reuse.
  Full unit-test coverage (`contextInspector.test.ts`).
- `Insight.getComponents()` public read API (`ComponentSnapshot`),
  actually exported from the package's public entry point.
- `Insight.getComponent(id)` — single-component, O(1) counterpart to
  `getComponents()`, added 2026-08-24 as a justified building block for
  `inspectHookNames()` and `@react-insight/inspector` (below).
- `Insight.onChange(listener)` reactive change-notification API,
  backed by a self-contained `ComponentRegistry.subscribe()` mechanism
  (not the Core event system), replacing Playground's polling
  workaround. Notifications are batched via `queueMicrotask()` and
  gated by a structural dirty-check in `sync()`, so subscribers are
  only notified when something actually changed (see `DECISIONS.md`,
  2026-08-04 and 2026-08-23).
- `ComponentRegistry` test coverage completed (per-field dirty-check
  granularity for `rootId`/`displayName`/`parentId`, `has()`/`values()`/
  `unregister()` untracked-id coverage) — 2026-08-24.
- Removed the orphaned `EventBus`/`Subscription`/`SubscriptionRegistry`
  system from `@react-insight/core` — fully implemented and tested,
  but never wired into `Runtime` (see `DECISIONS.md`, 2026-08-04). The
  relocated `packages/_core_src_archive_events` folder was permanently
  deleted 2026-08-24.
- `InsightContext.displayName` set, so the library's own internal
  context surfaces with a real name in Context Tracking output.
- Playground wired to a real React application (`InsightProvider`,
  `InsightDebugPanel`) as the required end-to-end validation
  environment for Component/Render/Hook/Context Tracking changes.
- **`Insight.inspectHookNames(id)`** — on-demand hook name resolution
  (Phase 3's first slice, 2026-08-24). Re-invokes a component's
  function with an instrumented dispatcher to resolve exact built-in
  hook names (distinguishing `useState`/`useReducer` and
  `useMemo`/`useCallback`) and one level of enclosing custom hook name.
  Strictly on-demand; scoped to plain function components only. See
  `DECISIONS.md`, 2026-08-24, for the full design history, including
  two dependency/technique decisions reversed after research.
- **`@react-insight/inspector`** — the fourth workspace package
  (2026-08-24). `inspectComponent(insight, id)` combines
  `Insight.getComponent()` and `Insight.inspectHookNames()`. Depends
  only on the public `Insight` API; no knowledge of React Fiber.
- Housekeeping: removed empty/unreferenced stub files from
  `@react-insight/core` (`src/insight/`, `src/internal/`,
  `plugins/Plugin.ts`) and dead files from `packages/playground`
  (`src/index.ts`, `src/plugins/greetingPlugin.ts`).

---

## Current Priorities

Open candidates for the next Phase 3 slice, in no particular order
(see `PROJECT_CONTEXT.md`, "Current Focus" for the up-to-date list and
reasoning):

- A real "Inspect" UI in Playground — giving `@react-insight/inspector`
  its first real UI consumer, and the natural way to discover whether
  a React hook wrapper (`useComponentInspection()`) is actually
  justified yet.
- Extending `inspectHookNames()` to `memo`/`forwardRef`-wrapped
  components.
- Timeline or a real DevTools panel — both still without a concrete
  design.

---

## Deferred, No Current Consumer

Carried forward from Phase 2; still genuinely without a real consumer,
so per Principle 5 (no premature abstraction) these remain deliberately
unimplemented rather than scheduled speculatively:

- Root-container correlation for multi-application pages (see
  `DECISIONS.md`, 2026-07-18).
- `ComponentRegistry.getByRoot()` query.

---

## Known Gaps Not Yet Scheduled

None currently open. The CI workflow gap (previously the only entry
here) was closed 2026-08-24 — see "Completed" above.

---

## Longer-Term Goals

- A real Inspector/DevTools UI (Playground "Inspect" button as a first
  concrete step)
- `memo`/`forwardRef` support for on-demand hook name resolution
- A full nested custom-hook tree for `inspectHookNames()` (current
  slice resolves one level only)
- Timeline
- Session management

---

## Quality Bar

Every roadmap item is expected to clear the same Quality Gate before
being considered complete: lint, typecheck, build, unit tests, and —
for any change touching Component Discovery, Render Tracking, Hook
Tracking, Context Tracking, or on-demand hook name resolution
specifically — manual end-to-end validation in Playground (see
`ARCHITECTURE.md`, Testing Strategy). For on-demand hook name
resolution in particular, this validation carries extra weight, since
even `@testing-library/react`'s jsdom environment cannot fully
guarantee real-browser dispatcher behavior — see `DECISIONS.md`,
2026-08-24.