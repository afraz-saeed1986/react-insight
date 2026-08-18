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

---

## Session 18

Completed:

### Structural Hook Tracking

Chosen from the candidates in `PROJECT_CONTEXT.md`'s Current Focus
over `onChange()`, root-container correlation, and `ComponentRegistry`
change-event emission/`getByRoot()` (all still without a real current
consumer), and over starting Phase 3 Inspector groundwork (which needs
Hook/State data that didn't exist yet).

**Research before implementation.** Initial assumption was that hook
type/name detection would work like a lighter version of Render
Tracking's identity resolution (heuristics over `fiber.memoizedState`
shape). Researching how real React DevTools does this
(`react-debug-tools`'s `inspectHooksOfFiber`) showed this assumption
was wrong: DevTools recovers hook _names_ — including custom hook
boundaries — by re-invoking the component function with an
instrumented dispatcher that intercepts each hook call, and resolving
custom hook names via call-stack parsing (which breaks under
minification, a limitation React's own team has documented). This is
real per-inspection work, intended to run on-demand only, not on every
commit — confirmed by the React team's own discussion of the
performance cost of doing this during profiling
(`facebook/react#16477`).

**Decision: structural-only tracking (no re-render, no dispatcher),
not the DevTools technique.** Consistent with this project's existing
zero-instrumentation, no-wrapper positioning for Render Tracking
(Session 15). The DevTools-style technique remains a valid future
addition, scoped as a separate on-demand capability once Inspector
work has a concrete design — deliberately deferred, not rejected.

**Validated the actual Hook object shape before writing classification
logic**, via a controlled Playground experiment: a temporary
`HookInspectorProbe` component exercising `useState`, `useRef`,
`useMemo`, `useCallback`, `useEffect`, `useLayoutEffect`, logging each
hook's `memoizedState`/`queue` shape (and, in a follow-up round, the
Effect object's `tag` field). Findings:

- `useState`/`useReducer` share an identical shape (`queue` present,
  with a `dispatch`) — not distinguishable from shape alone.
- `useRef` has a unique shape (`{ current }`, no `queue`).
- `useMemo`/`useCallback` share an identical shape (`[value, deps]`
  array, no `queue`) — not distinguishable from shape alone.
- `useEffect`/`useLayoutEffect` _are_ distinguishable, via a bitmask
  on the Effect object's `tag` field — confirmed empirically as `9`
  (`HasEffect | Passive`) and `5` (`HasEffect | Layout`) respectively,
  matching `react-reconciler`'s internal `ReactHookEffectTags.js`
  constants. Better resolution than originally expected.

Two small hiccups during the probe itself, both quickly resolved: a
leftover placeholder line (`ReactDOM.__debug_getFiber?.()`) in the
probe component that should have been deleted, not left as a
to-be-replaced stub; and the first version of the debug logger crashed
with "Converting circular structure to JSON" because `JSON.stringify`
followed the Effect object's own circular `next` linked list — fixed
by logging a shallow shape summary instead of a deep dump.

**Implementation.** `inspectHooks(fiber)` walks the hooks linked list
rooted at `fiber.memoizedState` and returns `HookSummary[]` (`{ index,
kind }`), `kind` being one of `state | ref | memo-like | effect |
layout-effect | unknown`. Guards against class components — whose
`memoizedState` is `this.state`, not a hooks list — via the same
marker React's own reconciler uses internally
(`type.prototype.isReactComponent`), a deliberate departure from this
package's existing `isComponentFiber()`, which intentionally treats
function and class components alike where the distinction doesn't
matter (identity/render-detection).

Threaded through the existing pipeline the same way `rendered` was:
`FiberNode` gained a sibling `HookNode` type (`fiberAdapter.ts`),
`DiscoveredComponent`/`ComponentSyncInput`/`ComponentNode` each gained
a `hooks: readonly HookSummary[]` field, `ComponentRegistry.sync()`
updates it unconditionally (structural, like `displayName`, not
accumulated like `renderCount`), and the public `ComponentSnapshot`
exposes it read-only.

**Validated end-to-end in Playground**, not just unit-tested: every
component's actual hook list matched hand-verified expectations
(`Counter`/`App` → `[state]`; `Display`/`Greeting` → `[]`;
`InsightProvider` → `[ref, effect]`, matching `useRootLifecycle`'s
internal `useRef` + `useEffect`). No bugs found on this pass — the
Playground experiment confirmed the design ahead of the final
implementation, rather than disproving it afterward as happened
repeatedly with the overcounting fix.

**Known limitation found during that same validation, not assumed in
advance:** `useContext` does not consume a hook slot at all —
`readContext()` is called directly by React's internals without
pushing an entry onto the hooks linked list. Confirmed by
`InsightDebugPanel` (which calls `useInsight()`, itself
`useContext`-based, plus its own `useState` and `useEffect`) reporting
only 2 hooks, not 3. Any hook that is purely a thin `useContext`
wrapper is invisible to `inspectHooks()` entirely, not merely
unclassified.

Files changed: `fiberAdapter.ts` (new `HookNode` type),
`hookInspector.ts` (new — `classifyHook()`, `inspectHooks()`),
`hookInspector.test.ts` (new), `discoveredComponent.ts`,
`traversal.ts`, `componentMapper.ts`, `component.ts`,
`componentRegistry.ts`, `types.ts`, `createInsight.ts`. Also extended
`InsightDebugPanel` in Playground to display each component's hook
kinds inline.

### Validation

Full Quality Gate (lint, typecheck, build, test) verified and passed,
including fixture updates in `componentRegistry.test.ts` and
`componentMapper.test.ts` (missing `hooks` field on existing fixtures
and one `toEqual` assertion) — the same category of fallout as the
`memoizedProps`/`memoizedState` addition in Session 17, resolved the
same way (paste the exact typecheck/test errors, fix one at a time
rather than guessing fixture contents from memory). Manual end-to-end
validation in Playground performed as described above.

### Documentation

Updated:

- DECISIONS.md (new entry: research findings, path decision, shape
  validation experiment, implementation, and the `useContext`
  limitation)
- ROADMAP.md (Hook tracking moved from unchecked to a checked
  structural-tracking entry, distinct from full hook value/name
  resolution)
- PROJECT_CONTEXT.md (Completed/Not Started/Current Focus/Current
  Architecture Notes/Next Milestone all updated)
- REACT_ARCHITECTURE.md (new "Hook Tracking (structural)" subsection
  under Component Discovery; folder structure, module responsibilities,
  testing strategy, design rules all updated)
- REACT_RUNTIME_ARCHITECTURE.md (new "Hook Inspector" layer added to
  Section 6, on equal footing with Hook Adapter/Fiber
  Adapter/Traversal/Mapper/Registry; Runtime Pipeline note, Stateless
  Processing note, Cross-Layer Data Rules table, and Deferred Concerns
  all updated)

Current status:

- Component Discovery, Render Tracking, and structural Hook Tracking
  are all implemented, unit-tested, and validated end-to-end against a
  real React application.
- Hook Tracking's real limitations (state/reducer ambiguity,
  memo/callback ambiguity, `useContext` invisibility, no values or
  names) are documented rather than silently shipped, matching the
  project's existing standard for Render Tracking.
- All `.ai` documentation is synchronized with the implementation as
  of this session.

Next session:

- Choose the next area of work from the remaining candidates in
  PROJECT_CONTEXT.md's Current Focus (a reactive `onChange()` API,
  root-container correlation, on-demand hook value/name resolution,
  State/Context tracking, or Phase 3 Inspector groundwork).

---

## Session 19

Completed:

### State Hook Value Preview

Chosen from the remaining Current Focus candidates over `onChange()`,
root-container correlation, and on-demand hook _name_ resolution (the
latter explicitly scoped to Phase 3 Inspector in Session 18) because
it closes a specific, narrow slice of the "no hook values" limitation
documented in Session 18: unlike hook _names_, a `state`-kind hook's
current _value_ is directly readable from `hook.memoizedState` with no
re-render and no instrumented dispatcher — the deferred DevTools
technique simply doesn't apply to this case.

**Design constraint:** hook values can be arbitrary JS values —
objects, arrays, functions, DOM refs, self-referential structures —
so serialization needed to be safe (no crash on circular references,
no invoking functions) and bounded (no unbounded cost on large
structures).

**Design chosen:** a shallow (one level deep) preview
(`previewHookValue()`, new `hookValuePreview.ts`). Primitives pass
through unchanged; a plain object/array is walked exactly one level,
with anything nested (object/array/function/class instance) replaced
by a `{ __type: string }` descriptor instead of recursed into.
Circular-reference safety falls out of the design itself — there is no
code path that ever revisits a node past depth 1 — rather than
requiring an explicit `seen`-set guard. Capped at 20 entries per
object/array.

**Bug found by unit tests before Playground:** the top-level branch of
`previewHookValue()` didn't apply the same class-instance check
`previewLeaf()` used one level down, so a class instance passed
directly as hook state incorrectly expanded into its own keys instead
of being described by constructor name. Fixed by reusing the same
`describeType()` check at the top level. Caught by
`hookValuePreview.test.ts` before ever reaching Playground.

**Validated end-to-end in Playground**, per the project's standing
rule for any Component Discovery change: a temporary `StateShapeProbe`
component (object and array state) alongside `Counter` (primitive
state) confirmed correct, live-updating previews for all three shapes.
`InsightDebugPanel` was permanently extended to render `hooks[].value`
inline; `StateShapeProbe` was removed after validation, having served
its purpose as a temporary fixture — the same disposable-probe pattern
used in Session 18 for the original hook-shape experiment.

Files changed: `hookValuePreview.ts` (new), `hookValuePreview.test.ts`
(new), `hookInspector.ts` (`HookSummary` gained an optional `value`,
populated only for `kind: "state"`), `hookInspector.test.ts` (fixture
updates + one new test), `types.ts` (`ComponentSnapshot.hooks[]`
element gained the same optional `value`, inlined like `HookKind`
already was — no current external consumer for a standalone type).

### Documentation Consistency Check

Before closing this session, explicitly checked all `.ai` docs (not
just the ones directly touched) for claims that would now be stale —
this caught two real, meaningfully wrong statements that a narrower
"update what I touched" pass would have missed:

- `REACT_ARCHITECTURE.md` still asserted "no hook values... at any
  hook kind" — literally false as of this session for `state`-kind
  hooks. Corrected.
- `REACT_RUNTIME_ARCHITECTURE.md`'s Hook Inspector contract still
  listed "Hook values or names" together as entirely out of scope for
  the layer — no longer accurate; values are now partially in scope
  (`state`-kind only). Corrected, along with the Cross-Layer Data
  Rules table row, the Runtime Pipeline note, and Deferred Concerns,
  all of which previously lumped "hook value/name resolution" together
  as a single deferred item.

### Validation

Full Quality Gate (lint, typecheck, build, test) verified and passed,
including one intermediate typecheck failure (an unsafe union-to-object
cast in a test file, fixed by routing through `unknown` first) and one
intermediate test failure (the class-instance bug above) — both
resolved before Playground validation, matching the project's standing
"fix one error at a time from the actual message, don't guess" pattern.

### Documentation

Updated:

- DECISIONS.md (new entry: scope decision, design constraint, the
  class-instance bug, and Playground validation)
- ROADMAP.md (Structural Hook Tracking entry updated to mention value
  preview)
- PROJECT_CONTEXT.md (Completed/Current Focus/Known Limitations/
  Architecture Notes all updated)
- REACT_ARCHITECTURE.md (Hook Tracking known-limitations list and the
  zero-instrumentation Design Rule corrected; folder structure, module
  responsibilities, and Testing Strategy updated for `hookValuePreview.ts`)
- REACT_RUNTIME_ARCHITECTURE.md (Hook Inspector's Classification
  limits, Output, and Must-not-know all corrected; Cross-Layer Data
  Rules table, Runtime Pipeline note, and Deferred Concerns updated;
  Last Updated date bumped)
- ARCHITECTURE.md checked and confirmed to need no changes — its
  existing "structural hook summary" wording never claimed values were
  absent, so nothing there was actually stale.

Current status:

- `state`-kind hook values are now visible via `ComponentSnapshot`,
  validated both by unit test (including the circular-reference and
  class-instance edge cases) and against a real, live-updating React
  tree in Playground.
- `.ai` documentation was checked project-wide for staleness this
  session, not just in the files directly touched by the new feature —
  two real inaccuracies were found and fixed as a result.

Next session:

- Choose the next area of work from the remaining candidates in
  PROJECT*CONTEXT.md's Current Focus (a reactive `onChange()` API,
  root-container correlation, on-demand hook \_name* resolution,
  extending value preview to `ref`/`memo-like` hooks, Context
  tracking, or Phase 3 Inspector groundwork).

---

## Session 20

Completed:

### Context Tracking

- Implemented the Context Tracking / Context Inspector layer using
  React Fiber's `dependencies.firstContext` dependency chain.
- Added dedicated context-dependency representation without exposing
  React's internal dependency nodes through the public API.
- Extracted consumed Context identity and current value from Fiber
  dependencies.
- Added identity-based deduplication for repeated Context dependencies.
- Added `Context.displayName` resolution with `"Context"` fallback.
- Added bounded Context value preview handling consistent with the
  project's non-invasive inspection approach.
- Kept Context tracking observational: it does not re-render components,
  invoke component functions, or install an instrumented dispatcher.
- Threaded Context data through discovery into the component model and
  public snapshot representation.
- Kept Context tracking independent from structural Hook Tracking:
  `useContext` is not represented by the hooks linked list, so Context
  consumption is inspected separately through Fiber dependencies.

### Architectural Consistency

- Added Context Inspector as a distinct runtime inspection layer alongside
  Hook Inspector, Fiber Adapter, Traversal, Mapper, and Component Registry.
- Documented the boundary between React's internal Context dependency
  nodes and the public component snapshot.
- Kept Context tracking separate from reactive Context-change notifications;
  consumption tracking is implemented, while change-event behavior remains
  a separate concern.

### Validation

- Validated Context Tracking against the real React/Playground integration.
- Verified Context data is associated with the correct component and does
  not appear as a synthetic Hook entry.
- Verified Context display-name fallback and identity deduplication.
- Dedicated Context Inspector unit-test coverage remains a follow-up item
  and is intentionally not marked complete here.

### Documentation

Updated:

- `DECISIONS.md` — Context Tracking scope and architectural boundaries.
- `PROJECT_CONTEXT.md` — completed capabilities and remaining focus.
- `ROADMAP.md` — Context Tracking status and remaining test coverage.
- `REACT_ARCHITECTURE.md` — Context Tracking responsibilities and limits.
- `REACT_RUNTIME_ARCHITECTURE.md` — Context Inspector layer, contracts,
  pipeline integration, and deferred concerns.

Current status:

- Component Discovery, Render Tracking, structural Hook Tracking,
  state-hook value preview, and Context Tracking are implemented as
  observational runtime capabilities.
- Context consumption is tracked independently from Hook Tracking because
  `useContext` does not create a node in the Fiber hook linked list.
- Context Tracking is not being represented as a reactive subscription or
  change-event mechanism.
- Dedicated Context Inspector unit tests remain outstanding.
- Remaining candidates include a reactive `onChange()` API,
  root-container correlation, on-demand hook-name resolution, extending
  value previews beyond state hooks, Context change notifications, and
  Phase 3 Inspector groundwork.

Next session:

- Add dedicated Context Inspector unit tests and edge-case coverage.
- Run the complete Quality Gate after the test additions.
- Re-validate Context Tracking in Playground.
- Then select the next feature from the remaining candidates.

---

## Session 21

Completed:

### Context Inspector Test Coverage

- Added `contextInspector.test.ts` (`packages/react/src/internal/discovery/`),
  closing the last acknowledged gap in the discovery pipeline's unit-test
  coverage (see `DECISIONS.md`, 2026-07-29 and `SESSION_LOG.md`, Session 20).
- Covers: empty/absent `dependencies`/`firstContext`, a single consumed
  context, `displayName` resolution and its fallback to `"Context"`
  (missing, empty string, non-string), multiple distinct contexts in list
  order, identity-based deduplication of repeated dependency nodes
  (the StrictMode-related anomaly documented 2026-07-29), non-dedup of
  distinct context objects sharing a `displayName`, reuse of
  `previewHookValue()` for the `value` field, and no leakage of the raw
  context/dependency object in the output shape.

### Small Fixes and Cleanup

- **`InsightContext.displayName`** (`packages/react/src/context/InsightContext.ts`)
  set to `"InsightContext"`, closing the cosmetic known limitation from
  Context Tracking validation (`DECISIONS.md`, 2026-07-29): the library's
  own internal context now surfaces with a real name instead of the
  generic `"Context"` fallback wherever a consuming application's
  `contexts` snapshot includes it. Added `InsightContext.test.ts`.
- **`ComponentSnapshot` export fix** (`packages/react/src/index.ts`): the
  type was defined and used as `Insight.getComponents()`'s return type,
  and already documented in `REACT_ARCHITECTURE.md` as a current public
  export, but was never actually re-exported from the package's entry
  point. Added `export type { ComponentSnapshot } from "./types"`, plus
  `index.test.ts` as a regression guard (imports the type from `./index`,
  not `./types`, so a future removal fails typecheck).
- **Removed empty stub files in `@react-insight/core`**: `src/insight/`
  (`Insight.ts`, `createInsight.ts`, `InsightConfig.ts`, `index.ts` — all
  zero-byte, unreferenced anywhere, and never mentioned in `.ai/`) and
  `src/internal/` (`Internal.ts`, `index.ts` — same). `src/plugins/Plugin.ts`
  (empty, superseded by `plugins/types.ts`) also removed. Confirmed via
  a repo-wide search that none of these nine files were imported
  anywhere before deleting. Cleaned the now-stale `coverage.exclude`
  entries in `packages/core/vitest.config.ts` (`src/insight/**`,
  `src/internal/**`, and the already-obsolete `src/session/**`,
  `src/inspector/**` left over from the Session 14 removal).
- **Removed dead files in `packages/playground`**: `src/index.ts` and
  `src/plugins/greetingPlugin.ts`. Both had been documented as removed
  back in Session 17, but were still physically present in the
  repository; confirmed unreferenced by `index.html` (which loads only
  `src/index.tsx`) and unreferenced anywhere else before deleting.

### Validation

Each change verified independently by the developer (test/typecheck/lint/build
for the two affected packages; a manual `build` + run for the playground
change, since `packages/playground` has no `lint`/`typecheck`/`test`
script of its own).

### Documentation

Updated:

- `REACT_ARCHITECTURE.md` (removed the Context Inspector test-gap note in
  three places — the Context Tracking section, the folder-structure note,
  and the Testing Strategy list, replacing the last with a real coverage
  entry; added `contextInspector.test.ts` to the folder-structure diagram;
  updated the `InsightContext.displayName` note from "known limitation"
  to "resolved")
- `PROJECT_CONTEXT.md` (removed the `InsightContext.displayName` item from
  both the Current Focus candidate list and the Known/deferred limitations
  list)
- `SESSION_LOG.md` (this entry; also backfilled the previously-missing
  Session 20 entry, which existed only in `ROADMAP.md` due to the
  file-content mismatch described below)

**Documentation process note:** `ROADMAP.md` and `SESSION_LOG.md` were
found to contain the same session-by-session narrative content instead of
the two files serving their distinct, documented purposes (`ROADMAP.md`
for planned work/milestones/priorities per `CLAUDE.md`; `SESSION_LOG.md`
for the session narrative itself). `ROADMAP.md` was also one session
ahead of `SESSION_LOG.md` (through Session 20 vs. Session 19). This
session corrected it: `SESSION_LOG.md` was backfilled with the missing
Session 20 entry (copied from `ROADMAP.md`, since it was the more
current of the two duplicated copies), and `ROADMAP.md` was rewritten
from scratch to actually contain roadmap content (phases, current
priorities, completed roadmap items), sourced from `PROJECT_CONTEXT.md`'s
existing "Current Focus" / "Not Started" / "Next Milestone" sections
rather than invented. No decision changed as a result — DECISIONS.md
records genuine architectural/technical decisions, not corrections or
cleanups, so it required no new entry.

Current status:

- Context Inspector now has full unit-test coverage, matching every
  other module in the discovery pipeline.
- All previously known-and-documented small gaps from Context Tracking
  (Sessions 18-20) are closed: `InsightContext.displayName`, the
  `contextInspector.test.ts` gap.
- `ComponentSnapshot` is now actually importable from
  `@react-insight/react`'s public entry point, matching what
  `REACT_ARCHITECTURE.md` already documented.
- `@react-insight/core` and `packages/playground` no longer contain
  dead/orphaned files that were either undocumented or documented as
  already removed.
- `ROADMAP.md` and `SESSION_LOG.md` no longer duplicate each other and
  are back in sync with the actual implementation.

Next session:

- Choose the next area of work from the remaining Current Focus
  candidates in `PROJECT_CONTEXT.md` (a reactive `onChange()` API,
  root-container correlation, on-demand hook value/name resolution,
  extending value preview to `ref`/`memo-like` hooks, or Phase 3
  Inspector groundwork).
- Two larger, still-undecided items from the project baseline review
  remain open and were deliberately not acted on this session: the
  orphaned `EventBus`/`Subscription`/`SubscriptionRegistry` subsystem in
  `@react-insight/core` (fully implemented and tested, but never wired
  into `Runtime`, which uses `mitt` directly instead), and the absence
  of any actual CI workflow despite `DECISIONS.md`/`ARCHITECTURE.md`
  describing one as implemented and passing.
