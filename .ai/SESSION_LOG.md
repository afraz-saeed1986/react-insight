# Session Log

## Session 1

Completed:

- Project initialized
- pnpm workspace created
- Core package created
- Build system configured

---

## Session 2

Completed:

- Runtime implemented
- PluginManager implemented
- Plugin lifecycle added
- Runtime event system introduced

---

## Session 3

Completed:

- RuntimeEventMap introduced
- Started Generic Architecture
- Generic PluginContext
- Generic InsightPlugin
- Generic definePlugin
- Generic PluginManager

---

## Session 4

Completed:

- Generic Runtime completed
- Removed remaining public casts
- Built-in Logger Plugin implemented
- Runtime integration tests added
- Logger Plugin integration test added
- Atomic plugin registration implemented
- Rollback added when `setup()` fails
- Architecture documentation synchronized
- Roadmap synchronized

---

## Session 5

Completed:

- PluginManager unit tests completed
- Public PluginManager API fully covered
- Core package stabilized
- Playground package created
- Playground workspace configured
- Started validating public package exports
- First packaging issue discovered during Playground integration

---

## Session 6

Completed:

### Playground

- Fixed package export issue
- Built Core package before Playground consumption
- Verified workspace package resolution
- Verified public package exports
- Created first Playground demo
- Registered built-in Logger Plugin
- Added Greeting Plugin
- Verified plugin lifecycle in Playground
- Verified Runtime destruction in Playground

### Runtime

- Replaced `clear()` with `destroy()`
- Added Runtime destruction lifecycle
- Added Runtime state protection
- Introduced `ensureNotDestroyed()`
- Runtime now throws after destruction
- Verified reverse plugin destruction order (LIFO)

### Built-in Plugins

- Refactored Logger Plugin into a factory function
- Eliminated shared plugin state between Runtime instances
- Improved test isolation

### Event System

- EventBus implementation completed
- Subscription implementation completed
- SubscriptionRegistry implementation completed
- EventBus unit tests completed
- Subscription unit tests completed
- SubscriptionRegistry unit tests completed

### Testing

- Expanded Runtime integration tests
- Added duplicate plugin registration tests
- Added Runtime destruction tests
- Added Logger Plugin integration tests
- Refactored test setup using `beforeEach` / `afterEach`
- Overall Core test coverage exceeded 90%

### Documentation

- Updated:
  - ARCHITECTURE.md
  - DECISIONS.md
  - PROJECT_CONTEXT.md
  - ROADMAP.md

---

## Session 7

Completed:

### Quality Gate

- Configured Vitest coverage thresholds
- Enabled V8 coverage provider
- Added HTML, LCOV and text coverage reports
- Verified coverage exceeds configured thresholds
- Added workspace Quality Gate commands

### Tooling

- Introduced shared ESLint Flat Config package
- Migrated workspace to ESLint Flat Config
- Enabled strict linting across the Core package
- Preserved TypeScript strict compiler settings

### Type Safety

- Fixed `exactOptionalPropertyTypes` compatibility
- Investigated `SubscriptionRegistry` generic variance
- Localized the required type assertion
- Documented the type-safety rationale

### Documentation

- Synchronized:
  - ARCHITECTURE.md
  - DECISIONS.md
  - PROJECT_CONTEXT.md
  - ROADMAP.md

Current status:

- Phase 1 (Core) is feature complete.
- Core Quality Gate is complete except GitHub Actions CI.
- Documentation is synchronized with the implementation.
- The project is ready for CI automation.

Current metrics:

- 5 test files
- 32 passing tests
- ~92% Statements
- ~91% Lines
- ~85% Branches
- ~88% Functions

Next session:

- Implement GitHub Actions CI
- Automate linting
- Automate type checking
- Automate build
- Automate test execution
- Automate coverage verification
- Finalize Phase 1

---

## Session 8

Completed:

### CI Automation

- Implemented GitHub Actions CI workflow
- Automated Quality Gate execution
- Added GitHub Actions matrix strategy for Node.js 22 and 24
- Enabled automatic linting
- Enabled automatic type checking
- Enabled automated build verification
- Enabled automated test execution
- Enabled automated coverage verification
- Added workflow concurrency control
- Applied least-privilege workflow permissions
- Added job timeout protection
- Synchronized pnpm version with `packageManager`

### Validation

- Verified successful CI execution on Node.js 22
- Verified successful CI execution on Node.js 24
- Confirmed automated Quality Gate passes
- Validated GitHub Actions workflow in the GitHub environment

### Documentation

- Updated:
  - DECISIONS.md
  - PROJECT_CONTEXT.md
  - ROADMAP.md

Current status:

- Phase 1 (Core) is complete.
- Automated Quality Gate is fully operational.
- Documentation is synchronized with the implementation.
- The project is ready for Phase 2.

Current metrics:

- 5 test files
- 32 passing tests
- ~92% Statements
- ~91% Lines
- ~85% Branches
- ~88% Functions

Next session:

- Start Phase 2 — React Integration

---

## Session 9

Completed:

### React Package

- Created the `@react-insight/react` workspace package
- Added package build configuration
- Added React 19 support
- Configured TypeScript for React
- Configured tsup build
- Added package exports

### Public API

- Implemented `createInsight()`
- Implemented `InsightProvider`
- Implemented `useInsight()`
- Introduced the public `Insight` abstraction
- Hid the internal Runtime behind a symbol
- Added an internal implementation layer

### Testing

- Configured Vitest for React using jsdom
- Added Testing Library
- Added `createInsight()` unit tests
- Added `InsightProvider` integration tests
- Added `useInsight()` usage validation
- Verified public API encapsulation

### Documentation

- Created `REACT_ARCHITECTURE.md`
- Updated:
  - ARCHITECTURE.md
  - DECISIONS.md
  - PROJECT_CONTEXT.md
  - ROADMAP.md

Current status:

- Phase 1 (Core) is complete.
- Phase 2 (React Integration) has started.
- The React package foundation is complete.
- Public React APIs are implemented and tested.
- Documentation is synchronized with the implementation.

Current metrics:

- Core package quality gate passing
- React package test infrastructure completed
- Public React API covered by automated tests

Next session:

- Implement Root registration
- Begin React Runtime integration
- Establish the component tracking foundation

---

## Session 10

Completed:

### React Internal Architecture

- Added internal Root model
- Added internal RootRegistry
- Added internal React lifecycle hook (`useInsightLifecycle()`)
- Introduced an internal barrel export for React infrastructure
- Integrated the internal lifecycle hook into `InsightProvider`

### Tooling

- Completed workspace-wide ESLint Flat Config migration
- Added a root `eslint.config.mjs`
- Unified lint configuration across packages
- Verified workspace lint execution

### Validation

Verified the complete Quality Gate:

- ESLint
- TypeScript type checking
- Build
- Unit tests

All checks passed successfully.

### Documentation

Updated:

- DECISIONS.md
- PROJECT_CONTEXT.md
- REACT_ARCHITECTURE.md
- ROADMAP.md

Current status:

- React package foundation is complete.
- Internal React infrastructure is established.
- The project is ready to begin implementing the first React runtime behavior.

Next session:

- Implement the internal React lifecycle plugin.
- Register React roots through the lifecycle integration.
- Begin the component tracking foundation.

---

## Session 11

Completed:

### React Runtime

- Implemented the internal React Lifecycle Plugin
- Added the first production React plugin
- Connected React lifecycle to the Core Runtime
- Integrated the lifecycle plugin into `useInsightLifecycle()`
- Completed Runtime lifecycle synchronization

### Root Lifecycle

- Implemented automatic root registration during Provider mount
- Implemented automatic root cleanup during Provider unmount
- Connected `RootRegistry` to the Runtime lifecycle
- Preserved Runtime ownership of the plugin lifecycle

### Internal Architecture

- Added internal Runtime access helper
- Extended the internal Insight implementation
- Introduced internal plugin infrastructure
- Improved separation between the public API and internal Runtime integration

### Testing

- Added React Lifecycle Plugin unit tests
- Expanded `createInsight()` tests
- Expanded `InsightProvider` integration tests
- Verified root registration on mount
- Verified root cleanup on unmount
- Verified complete Runtime lifecycle integration

### Validation

Verified the complete React package Quality Gate:

- ESLint
- TypeScript type checking
- Build
- Unit tests
- Integration tests

All checks passed successfully.

### Documentation

Updated:

- PROJECT_CONTEXT.md
- REACT_ARCHITECTURE.md
- ROADMAP.md

Current status:

- Phase 1 (Core) is complete.
- React lifecycle integration is complete.
- React Runtime and React lifecycle are fully synchronized.
- The project is ready to begin the Component Tracking architecture.

Next session:

- Design the Component Tracking architecture
- Implement the internal Component Registry
- Begin the component tracking foundation

---

## Session 12

Completed:

### Component Tracking Foundation

- Introduced the internal `Component` domain model.
- Implemented the internal `ComponentRegistry`.
- Extended `createInsight()` to own a `ComponentRegistry` instance.
- Extended the internal `Insight` implementation with component registry support.

### React Runtime

- Extracted root lifecycle management into `useRootLifecycle()`.
- Kept `useInsightLifecycle()` as the orchestration layer.
- Preserved Runtime ownership of the plugin lifecycle.

### Internal Architecture

- Renamed `reactLifecyclePlugin` to `rootLifecyclePlugin`.
- Renamed `createReactLifecyclePlugin()` to `createRootLifecyclePlugin()`.
- Renamed `ReactLifecyclePluginOptions` to `RootLifecyclePluginOptions`.
- Improved internal naming consistency.
- Kept `ComponentRegistry` independent from React internals.

### Validation

Verified the complete React package Quality Gate:

- ESLint
- TypeScript type checking
- Build
- Unit tests
- Integration tests

All checks passed successfully.

### Documentation

Updated:

- ARCHITECTURE.md
- DECISIONS.md
- PROJECT_CONTEXT.md
- REACT_ARCHITECTURE.md
- ROADMAP.md

Current status:

- Phase 1 (Core) is complete.
- React package foundation is complete.
- React root lifecycle integration is complete.
- Component tracking foundation has been established.
- Internal architecture is synchronized with the implementation.
- Documentation is synchronized with the implementation.

Next session:

- Finalize the Component Discovery architecture.
- Implement the Component Discovery subsystem.
- Synchronize `ComponentRegistry` with discovered React components.
- Begin Render Tracking.

---

## Session 13

Completed:

### Architecture Finalization

- Corrected the Component Discovery pipeline diagram: removed
  "Instrumentation Layer" as a separate stage (folded into Hook Adapter
  as an internal implementation detail); corrected Plugin communication
  to flow through the existing Core Event Bus rather than a direct
  Registry-to-Plugin channel.
- Evaluated all known React runtime observation techniques
  (`__REACT_DEVTOOLS_GLOBAL_HOOK__`, monkey patching, `Profiler` API,
  `react-reconciler`, Babel instrumentation) and selected the DevTools
  Global Hook with a defensive Instrumentation pattern.
- Finalized per-layer contracts (responsibility, input, output,
  forbidden knowledge) for Hook Adapter, Fiber Adapter, Traversal,
  Mapper, and Component Registry in `REACT_RUNTIME_ARCHITECTURE.md`
  Section 6.
- Identified and deferred two premature additions after review:
  `rendererId` on `ComponentNode` (no real consumer) and
  `onPostCommitFiberRoot` wiring (no real consumer). Both recorded in
  `DECISIONS.md`.
- Identified and documented a scoping limitation: Discovery currently
  assumes a single React application per page (page-global hook, no
  container-based correlation with `InternalRoot` yet).
- Identified a mismatch between the initial Section 6 draft and the
  actual `ComponentRegistry` implementation (the draft described
  change-event emission and `getByRoot()`, neither of which exist).
  Corrected Section 6 to describe the registry as implemented, and
  deferred both as documented, consumer-less extension points.

### Component Discovery Implementation

- Removed unused, unreferenced `RootRegistration` class
  (`internal/rootRegistration.ts`) — zero consumers anywhere in the
  codebase, violated the no-placeholder-API principle.
- Implemented `internal/discovery/`: `discoveredComponent.ts`,
  `fiberAdapter.ts`, `traversal.ts`, `componentMapper.ts`,
  `hookAdapter.ts`, with accompanying unit tests.
- Added `ComponentRegistry.sync()` for mount/update handling, without
  changing the existing tested `register()` duplicate-throw behavior.
- Added `componentDiscoveryPlugin` + `useComponentDiscovery()`, wired
  into `useInsightLifecycle()` alongside `useRootLifecycle()`.
- Extended `hookAdapter.ts` and `componentDiscoveryPlugin.ts` to also
  handle `onCommitFiberUnmount`, reusing the exported `getFiberId()`
  from `traversal.ts` to resolve the same id assigned at mount time.

### Validation

Mount/update pipeline: full Quality Gate (typecheck, lint, test, build)
verified and passed; committed.

Unmount handling: implemented; Quality Gate not yet run in this
session.

### Documentation

Updated:

- ARCHITECTURE.md
- DECISIONS.md (renderer identity deferral, Hook Adapter event scope,
  single-application assumption, `RootRegistration` removal,
  `ComponentRegistry` event emission / `getByRoot` deferral)
- PROJECT_CONTEXT.md
- REACT_ARCHITECTURE.md (new "Component Discovery" section, updated
  folder structure, module responsibilities, testing strategy)
- REACT_RUNTIME_ARCHITECTURE.md (Section 6 completed and corrected
  against the actual implementation)
- ROADMAP.md

Current status:

- Component Discovery is implemented for mount/update and wired
  end-to-end through a real consumer (`ComponentRegistry`), committed.
- Unmount handling is implemented but not yet validated or committed.
- All `.ai` documentation is synchronized with the implementation as
  of this session.

Next session:

- Run the full Quality Gate for the unmount changes and commit.
- Decide and implement the next Component Discovery follow-up
  (root-container correlation, or begin Render Tracking).

---

## Session 14

Completed:

### Component Discovery — Unmount Finalized

- Fixed a doc/code drift found before this session's Quality Gate run:
  `DECISIONS.md` claimed `RootRegistration` (`internal/rootRegistration.ts`)
  had been removed; the file still existed with zero consumers. Removed it.
- Removed two empty, unreferenced stub files/folders
  (`packages/core/src/inspector/`, `packages/core/src/session/`),
  present since before this session, unexported and mentioned nowhere in
  documentation — a violation of the no-placeholder-API principle.
- Reviewed the unmount design: hard-deleting via `unregister()` would
  leave `ComponentNode.status` / `unmountedAt` permanently without a
  producer, contradicting the same no-placeholder-field principle
  already applied to `rendererId`. Decided to preserve component
  history instead.
- Added `ComponentRegistry.markUnmounted()` (non-breaking; `unregister()`
  keeps its existing hard-delete semantics and test coverage).
- Wired `componentDiscoveryPlugin`'s `onUnmount` to `markUnmounted()`.
- Added `componentDiscoveryPlugin.test.ts` (previously the only
  discovery-pipeline module with zero dedicated tests): commit/sync,
  no-active-root no-op, unmount via `markUnmounted()`, disconnect on
  destroy.
- Fixed strict-mode issues in the new test file: `noUncheckedIndexedAccess`
  "possibly undefined" on array destructuring (resolved via an explicit
  guard helper, not a non-null assertion), and removed all `any` usage
  (typed global hook access the same way `hookAdapter.test.ts` already
  does; used the real `createInternalRoot()` factory instead of a hand-
  built fake root).

### Validation

Full Quality Gate (lint, typecheck, build, test) verified and passed.
Committed.

### Render Tracking — Foundation Started

- Evaluated the correctness of a naive per-component render counter:
  rejected, because `traverse()` walks the entire current fiber tree on
  every commit and calls `ComponentRegistry.sync()` for every discovered
  component regardless of whether that specific component actually
  re-rendered — a naive counter would conflate "present in the tree"
  with "rendered".
- Decided the correct first slice is root-level commit counting instead,
  which is unambiguous: every `onCommitFiberRoot` call for a registered
  root is exactly one real commit.
- Added `commitCount` / `lastCommittedAt` to `InternalRoot` and
  `RootRegistry.recordCommit()` (same non-mutating replace-on-write
  pattern as `ComponentRegistry.markUnmounted()`).
- Wired `componentDiscoveryPlugin`'s `onCommit` to call `recordCommit()`
  for the active root before traversal runs.
- Documented per-component render detection (Fiber `alternate` diffing,
  the same general technique used by React DevTools and community tools
  built on `__REACT_DEVTOOLS_GLOBAL_HOOK__`) as a deferred, dedicated
  design decision rather than implementing a heuristic now.

### Documentation

Updated:

- DECISIONS.md (`RootRegistration` actually removed, `markUnmounted()`
  decision, root-level commit counting decision, per-component render
  detection deferral)
- REACT_ARCHITECTURE.md (unmount flow, `markUnmounted()` responsibility,
  Component Discovery Plugin test coverage, folder structure)
- PROJECT_CONTEXT.md
- ROADMAP.md

Current status:

- Component Discovery is fully implemented (mount, update, unmount),
  tested, and committed.
- Render Tracking has started: root-level commit counting is implemented
  and tested; per-component render detection is designed-but-deferred,
  pending a dedicated `alternate`-diffing implementation pass.
- All `.ai` documentation is synchronized with the implementation as of
  this session.

Next session:

- Extend `FiberNode` (`fiberAdapter.ts`) with an `alternate` reference.
- Implement per-component render detection via `alternate` comparison.
- Add render count / last-rendered timestamp to `ComponentNode` once the
  detection technique is implemented and tested.
- Decide whether root-container correlation should be prioritized now
  that Component Tracking and root-level Render Tracking are stable.

---

## Session 15

Completed:

### Fiber Identity Fix

- Discovered that `getFiberId()` was keyed purely on Fiber object
  identity via a `WeakMap`, which does not survive React's
  `current`/`alternate` double buffering: a component's first
  re-render swaps `root.current` to a previously-unseen object,
  causing `ComponentRegistry.sync()` to treat it as a brand-new mount
  and leaving the original entry as a permanent orphaned "ghost"
  record. Affected every component that ever re-rendered, since
  Session 13.
- Root cause was not caught earlier because the existing "stable id"
  test re-traversed the same Fiber object twice, never simulating the
  current/alternate swap.
- Fixed: `FiberNode` gained an `alternate: FiberNode | null` field;
  `getFiberId()` now checks the alternate for an existing id before
  minting a new one.
- Added tests simulating the swap directly (`traversal.test.ts`).
- Committed as an isolated fix, separate from the render tracking
  feature commit.

### Per-Component Render Detection

- Implemented per-component render detection by reusing the fiber
  identity resolution from the fix above: a direct WeakMap hit means
  React bailed out (not rendered), a hit via `alternate` means the
  pair swapped (rendered), and no hit at all means first mount
  (rendered).
- Deliberately avoided `<Profiler>` wrapping and profiler-timing
  fields (`actualDuration`) — the signal was already available from
  the identity fix, with no need for user code changes or a
  development-build-only mechanism.
- Added `DiscoveredComponent.rendered`, threaded through
  `ComponentSyncInput` into `ComponentRegistry.sync()`.
- Added `ComponentNode.renderCount` / `lastRenderedAt`, updated only
  when `rendered` is true; structural fields continue updating
  unconditionally, matching existing `sync()` semantics.
- Updated existing fixtures/tests across `componentRegistry.test.ts`
  and `componentMapper.test.ts` that predated the `rendered` field.

### Validation

Full Quality Gate (lint, typecheck, build, test) verified and passed
across all changes in this session, including after each fixture
update.

### Documentation

Updated:

- DECISIONS.md (fiber identity fix, per-component render detection
  implementation)
- PROJECT_CONTEXT.md (Render Tracking marked complete; Current Focus
  and Next Milestone reset to open candidates)
- ROADMAP.md (Render Tracking section fully checked off)

Current status:

- Component Discovery (mount, update, unmount) and Render Tracking
  (root-level commit counting, per-component render detection and
  count) are both fully implemented, tested, and committed.
- A latent correctness bug affecting Component Discovery since
  Session 13 has been found and fixed.
- All `.ai` documentation is synchronized with the implementation as
  of this session.

Next session:

- Choose the next area of work from the candidates listed in
  PROJECT_CONTEXT.md's Current Focus (root-container correlation,
  ComponentRegistry change-event emission / getByRoot(), Hook/State/
  Context tracking, or Phase 3 Inspector groundwork).

---

## Session 16

Completed:

### Public Read API

- Added `Insight.getComponents(): ReadonlyArray<ComponentSnapshot>`,
  the first public way to read Component Discovery / Render Tracking
  data — previously the entire pipeline accumulated a rich internal
  model with zero consumer.
- `ComponentSnapshot` defined as a new, decoupled public type rather
  than exposing internal `ComponentNode` directly.
- Removed `ComponentNode.children`: set at creation, never read or
  written anywhere else — a dead placeholder field.

### Playground Wired to a Real React App

- `packages/playground` now depends on `@react-insight/react`,
  `react`, `react-dom`; added `@vitejs/plugin-react`, JSX tsconfig.
- Built a small real demo tree (`App`, `Counter`, `Display`,
  `Greeting`, `InsightDebugPanel`) rendered through `InsightProvider`.
- This was the first time Component Discovery and Render Tracking
  (built across Sessions 12-15) were exercised against real React
  commits rather than synthetic Fiber fixtures.

### Four Real Bugs Found and Fixed via End-to-End Testing

None of the following were caught by any prior unit test, because
existing discovery tests call `hook.onCommitFiberRoot(...)` directly,
bypassing the real connection/timing paths these bugs lived in:

1. **DevTools hook stub missing `inject()`.** React's real renderer
   bootstrap calls `hook.inject(...)` once at `react-dom`
   module-init time; ours threw (method didn't exist), silently
   blocking all discovery for the entire page session. Fixed by
   completing the stub (`supportsFiber: true`, working `inject()`).

2. **Hook installed too late.** `connectHookAdapter()` ran from inside
   a React effect (`useComponentDiscovery`), but React checks for the
   hook once, at `react-dom` module-load time — before any effect can
   possibly run. Added `installReactDevtoolsHook()`, a new public
   function the consuming app must call before importing `react-dom`
   (same constraint React's own `react-devtools-inline` documents).

3. **StrictMode register/unregister race.** Fire-and-forget
   `use()`/`unregisterPlugin()` calls from React effects raced under
   StrictMode's dev-mode mount→cleanup→mount double-invoke, throwing
   "Plugin already registered" (visible as an uncaught promise
   rejection in the browser console). Fixed by serializing every
   register/unregister operation through a per-hook promise chain.

4. **Discovery registered too late to see the first commit.** Even
   after fixing 1-2, `componentDiscoveryPlugin` was still registered
   from a React effect, which by definition runs _after_ the commit
   that triggers it — so it structurally could not observe the very
   first commit of its own tree. Fixed by registering the discovery
   plugin eagerly inside `createInsight()`, before
   `ReactDOM.createRoot().render()` is called. Removed
   `useComponentDiscovery.ts`; `useInsightLifecycle()` now only
   coordinates root lifecycle (which remains effect-based, since it
   has no first-commit visibility requirement).

   Fixing this exposed a fifth, smaller issue: root registration is
   _still_ effect-based, so a discovery commit can now arrive before
   any root exists. Fixed with a self-healing `"pending"` rootId
   fallback, relying on `sync()` already updating `rootId`
   unconditionally on every commit.

### Known Limitation Found (Documented, Not Fixed)

- Controlled experiment (baseline snapshot → one `Increment` click →
  snapshot again) confirmed `renderCount` overcounts: clicking a leaf
  component's state setter increments `renderCount` for every
  component sharing its root, including bailed-out ancestors and
  unrelated siblings, because React clones Fibers along the
  reconciliation path even when their function body doesn't
  re-execute. Root-level `commitCount` is unaffected. A correct fix
  needs a dedicated design pass (likely `memoizedProps`/`memoizedState`
  comparison) and was deliberately deferred rather than rushed.

### Documentation

Updated:

- DECISIONS.md (9 new entries covering every finding above)
- PROJECT_CONTEXT.md (Playground section rewritten — was badly stale;
  Current Focus, Architecture Notes, Next Milestone all updated)
- ROADMAP.md (Render Tracking marked end-to-end validated; known
  limitation added; public API checklist updated)

Current status:

- Component Discovery and Render Tracking are not just implemented and
  unit-tested, but validated end-to-end against a real React
  application for the first time.
- Four real, previously-invisible bugs were found and fixed.
- One real accuracy limitation was found, confirmed, and documented
  rather than papered over.
- All `.ai` documentation is synchronized with the implementation as
  of this session.

Next session:

- Choose the next area of work from the candidates listed in
  PROJECT_CONTEXT.md's Current Focus (fixing the renderCount
  overcounting limitation, a reactive `onChange()` API, root-container
  correlation, Hook/State/Context tracking, or Phase 3 Inspector
  groundwork).

---

## Session 17

Completed:

### renderCount Overcounting — Fixed

Closed the accuracy limitation documented in Session 16
(`DECISIONS.md`, 2026-07-21). Took three iterations, each disproven by
a real-browser Playground experiment of a shape the prior version
hadn't been exercised against — reinforcing, once again, that this
subsystem cannot be trusted to fixture-based unit tests alone.

1. **Hypothesis and first fix.** Compared `memoizedProps`/
   `memoizedState` against `fiber.alternate`, but only on the
   `alternateHit` branch of `resolveFiberIdentity()` (the pre-existing
   `directHit` branch was left returning `rendered: false`
   unconditionally, as before). Validated with a single-click
   Playground experiment (temporary console logging per component):
   only the two components that actually changed showed a props/state
   difference; cloned-but-bailed-out ancestors and an unrelated
   sibling did not — confirming the core hypothesis, that
   `bailoutOnAlreadyFinishedWork` copies `memoizedProps`/
   `memoizedState` by reference during a real bailout.

2. **Regression 1 — `directHit` is not reliably "unchanged".** A
   longer manual test (several polling-timer ticks, then one
   `Increment` click) showed `Counter`'s own `renderCount` failing to
   increment on a real update. Cause: React recycles at most two Fiber
   objects per component indefinitely — from a component's _second_
   real update onward, the object that becomes `current` was already
   seen before (a `directHit`), even though its fields were just
   mutated in place for a genuine re-render. Fixed by applying the
   props/state comparison (against `alternate`) uniformly, regardless
   of hit type.

3. **Regression 2 — comparing against `alternate` goes stale.** A
   multi-click test (baseline, then 4x `Increment` with pauses between
   clicks, letting the `InsightDebugPanel` polling timer interleave
   many unrelated commits) showed `Display`'s `renderCount` climbing
   into the hundreds after only one real prop change, because once a
   component stops receiving real updates, its `alternate` freezes at
   its last real update forever — every later comparison is against
   that same stale snapshot, which never matches "now". Fixed by
   replacing the `alternate` comparison with a self-maintained
   `lastObservedValues: Map<id, { props, state }>`, updated on every
   resolution, so every comparison is relative to "changed since
   Traversal itself last looked" rather than to a potentially-stale
   Fiber object.

4. **Implementation slip caught before re-validation.** After writing
   the Regression-2 fix, an intermediate `pnpm test` run failed in a
   way that didn't match manual reasoning about the new code; turned
   out the previous (Regression-1-era) version of
   `resolveFiberIdentity()` had been left in the file — pasted inside
   `visit()` instead of being removed — so the old, already-superseded
   logic was still the one actually executing. No logic change was
   needed; the file just needed the duplicate function removed.

5. **Final re-validation.** Baseline + 4x `Increment` click (with
   pauses between, to let many unrelated `InsightDebugPanel` polling
   commits interleave) confirmed `Counter` and `Display` each
   incrementing by exactly 1 per click and nothing else, while `App`,
   `Greeting`, and `InsightProvider` stayed completely flat across
   dozens of unrelated commits.

Files changed: `fiberAdapter.ts` (`FiberNode` gained `memoizedProps`/
`memoizedState`), `traversal.ts` (`resolveFiberIdentity()` rewritten),
`traversal.test.ts` (new coverage: props/state-driven `rendered`,
cloned-ancestor bailout, recycled direct-hit fiber both changed and
unchanged, and the stale-comparison regression itself).

### Cleanup

- Removed two leftover `console.log("[debug] ...")` statements
  (`hookAdapter.ts`, `componentDiscoveryPlugin.ts`) left over from the
  Session 16 investigation.
- Removed `packages/playground/src/index.ts` and
  `packages/playground/src/plugins/greetingPlugin.ts`: both had become
  dead code once `index.html` was pointed at `index.tsx` during
  Session 16's real-React-tree rewiring — `index.ts` was no longer
  loaded by anything, and `greetingPlugin.ts` had no consumer left
  besides it.

### Validation

Full Quality Gate (lint, typecheck, build, test) verified and passed
after the final fix. Manual end-to-end validation in Playground
performed twice: once per the process in point 5 above, confirming
the fix under realistic conditions (multiple real updates interleaved
with many unrelated commits), not just a single click.

### Documentation

Updated:

- DECISIONS.md (new entry covering the full fix history, including
  both intermediate regressions — kept deliberately, not compressed
  into just the final version, since each was only caught by a
  differently-shaped Playground test)
- ROADMAP.md (overcounting item moved from Known limitations to
  Completed)
- PROJECT_CONTEXT.md (Current Focus candidate removed; Current
  Architecture Notes updated)
- REACT_ARCHITECTURE.md (Render Tracking section rewritten to
  describe id resolution and `rendered` detection as independent
  concerns; traversal.ts module description and Testing Strategy
  updated)
- REACT_RUNTIME_ARCHITECTURE.md (Section 6 Traversal contract
  rewritten with the full three-iteration history; Fiber Adapter
  shape, Cross-Layer Data Rules table, and Deferred Concerns updated)

Current status:

- Render Tracking (root-level commit counting and per-component
  render detection/count) is now accurate for all previously-known
  cases: real updates, cloned-but-bailed-out ancestors/siblings, Fiber
  object recycling across a component's second-and-later updates, and
  components that stop updating while the rest of the tree keeps
  committing.
- No known accuracy limitations remain in Render Tracking.
- All `.ai` documentation is synchronized with the implementation as
  of this session.

Next session:

- Choose the next area of work from the remaining candidates in
  PROJECT_CONTEXT.md's Current Focus (a reactive `onChange()` API,
  root-container correlation, Hook/State/Context tracking, or Phase 3
  Inspector groundwork).
