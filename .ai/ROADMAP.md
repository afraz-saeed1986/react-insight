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

**Status: Active.**

React lifecycle integration, Component Discovery (mount/update/unmount),
Render Tracking, structural Hook Tracking, structural Context Tracking,
and a public read API (`getComponents()`) are all implemented, tested,
and validated end-to-end against a real React application via
Playground. See "Completed" below for the full list.

The next slice of Phase 2 work has not been chosen yet — see "Current
Priorities" below.

### Phase 3 — Inspector

**Status: Not started.**

Depends on Phase 2's Component/Render/Hook/Context Tracking data, which
is now stable. No concrete design exists yet. Candidate work includes
on-demand hook name resolution and the Inspector/DevTools panel itself
— see "Longer-Term Goals" below.

---

## Completed (by capability, not session)

- Core Runtime, plugin lifecycle, built-in Logger Plugin, Quality Gate,
  CI-workflow configuration claims (see "Known Gaps" below — the CI
  claim itself is currently inaccurate).
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
  preview for `state`-kind hooks.
- Structural Context Tracking (`inspectContexts()`), including
  `displayName` resolution, deduplication, and value preview reuse.
  Full unit-test coverage (`contextInspector.test.ts`) as of the most
  recent session.
- `Insight.getComponents()` public read API (`ComponentSnapshot`),
  actually exported from the package's public entry point.
- `Insight.onChange(listener)` reactive change-notification API,
  backed by a self-contained `ComponentRegistry.subscribe()` mechanism
  (not the Core event system), replacing Playground's polling
  workaround. Notifications are batched via `queueMicrotask()` and
  gated by a structural dirty-check in `sync()`, so subscribers are
  only notified when something actually changed (see `DECISIONS.md`,
  2026-08-04 and 2026-08-23).
- Removed the orphaned `EventBus`/`Subscription`/`SubscriptionRegistry`
  system from `@react-insight/core` — fully implemented and tested,
  but never wired into `Runtime` (see `DECISIONS.md`, 2026-08-04).
- `InsightContext.displayName` set, so the library's own internal
  context surfaces with a real name in Context Tracking output.
- Playground wired to a real React application (`InsightProvider`,
  `InsightDebugPanel`) as the required end-to-end validation
  environment for Component/Render/Hook/Context Tracking changes.
- Housekeeping: removed empty/unreferenced stub files from
  `@react-insight/core` (`src/insight/`, `src/internal/`,
  `plugins/Plugin.ts`) and dead files from `packages/playground`
  (`src/index.ts`, `src/plugins/greetingPlugin.ts`).

---

## Current Priorities

No single next feature has been committed to yet. Open candidates, in
no particular order (see `PROJECT_CONTEXT.md`, "Current Focus" for the
up-to-date list and reasoning):

- Root-container correlation for multi-application pages.
- `ComponentRegistry.getByRoot()` query (`onChange()` itself shipped —
  see Completed above).
- On-demand hook value/name resolution (likely Phase 3 work).
- Extending value preview to `ref`/`memo-like` hooks.
- Beginning Phase 3 Inspector groundwork.

---

## Known Gaps Not Yet Scheduled

These were identified during a project-wide baseline review and are
deliberately not yet assigned to a session, pending a decision:

- **No CI workflow actually exists in the repository**, despite
  `ARCHITECTURE.md`/`DECISIONS.md` describing GitHub Actions CI as
  implemented and passing on a Node 22/24 matrix. Either the workflow
  needs to be added, or the documentation needs correcting. Re-flagged
  as of the most recent session's inspection — still unresolved.

---

## Longer-Term Goals

- On-demand hook value/name resolution (custom hook boundaries)
- Extending value preview to `ref`/`memo-like` hooks
- Timeline
- DevTools panel
- Inspector
- Session management

---

## Quality Bar

Every roadmap item is expected to clear the same Quality Gate before
being considered complete: lint, typecheck, build, unit tests, and —
for any change touching Component Discovery, Render Tracking, Hook
Tracking, or Context Tracking specifically — manual end-to-end
validation in Playground (see `ARCHITECTURE.md`, Testing Strategy).