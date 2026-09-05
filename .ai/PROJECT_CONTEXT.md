# React Insight

## Vision

React Insight is an open-source debugging and inspection toolkit for React applications.

The project aims to provide a lightweight, extensible and plugin-based alternative for inspecting React applications during development.

Long-term goals:

- Plugin-based architecture
- High performance
- Excellent TypeScript support
- React-first design
- Modern developer experience
- npm-ready packages
- Production-grade code quality

---

## Current Status

The project has completed **Phase 1 — Core** and **Phase 2 — React Integration**, and has begun **Phase 3 — Inspector** with its first slice: on-demand hook name resolution and a new `@react-insight/inspector` package.

### Completed

#### Workspace & Tooling

- pnpm workspace
- TypeScript project setup
- tsup build configuration
- Shared ESLint Flat Config
- GitHub Actions CI (a real `.github/workflows/ci.yml` now exists — lint, typecheck, build, test, and core-only coverage on a Node 22/24 matrix — closing a gap where earlier documentation claimed this was implemented and passing when no workflow file actually existed; see `DECISIONS.md`, 2026-08-24)
- Automated Quality Gate

#### Core

- Runtime implementation
- Generic Runtime
- Runtime destruction lifecycle (`destroy()`)
- Runtime state protection
- PluginManager
- Generic PluginManager
- Plugin lifecycle
- Generic PluginContext
- Generic InsightPlugin
- Generic `definePlugin()`
- Built-in Logger Plugin
- Logger Plugin factory API
- Atomic plugin registration
- Rollback on setup failure

#### Testing

- Runtime integration tests
- PluginManager unit tests
- EventBus unit tests
- Subscription unit tests
- SubscriptionRegistry unit tests
- Logger Plugin integration tests
- Coverage thresholds

#### Playground

- Real React app wired through `@react-insight/react` and `InsightProvider` (previously only exercised `@react-insight/core` directly — never validated Component Discovery or Render Tracking against a real browser until this session)
- Public package export validation
- Runtime validation
- Developer Experience validation
- Manual end-to-end validation surface for Component Discovery / Render Tracking (`InsightDebugPanel`, now reactive via `insight.onChange()` rather than polling)

#### React Package

- `@react-insight/react`
- `createInsight()`
- `InsightProvider`
- `useInsight()`
- Internal Runtime encapsulation
- React Context
- Internal architecture layer
- Internal Root model
- Internal RootRegistry
- Internal Component model
- Internal ComponentRegistry
- Internal Root Lifecycle Plugin
- React lifecycle integration
- Root registration
- Root cleanup
- Mount / Unmount synchronization
- React package unit tests
- React integration tests
- Component Discovery architecture (finalized layer contracts: Hook Adapter, Fiber Adapter, Traversal, Mapper, Registry)
- Component Discovery implementation — mount/update (Hook Adapter, Fiber Adapter, Traversal, Mapper, `ComponentRegistry.sync()`, Component Discovery Plugin)
- Component Discovery implementation — unmount (`ComponentRegistry.markUnmounted()`, preserving component history instead of removing the record)
- Component Discovery Plugin test coverage (`componentDiscoveryPlugin.test.ts`)
- Render Tracking — root-level commit counting (`InternalRoot.commitCount` / `lastCommittedAt`, `RootRegistry.recordCommit()`)
- Render Tracking — fiber identity fix (`getFiberId()` resolves across React's `current`/`alternate` swap, fixing a pre-existing ghost-entry bug in Component Discovery)
- Render Tracking — per-component render detection and count (`DiscoveredComponent.rendered`, `ComponentNode.renderCount` / `lastRenderedAt`)
- `Insight.getComponents()` public read API (`ComponentSnapshot`)
- `Insight.getComponent(id)` — single-component, O(1) counterpart to `getComponents()`, sharing its `ComponentNode` → `ComponentSnapshot` mapping via a single `toSnapshot()` helper (see `DECISIONS.md`, 2026-08-24)
- `installReactDevtoolsHook()` public entry point (must be called before React loads)
- End-to-end validation against a real React app via Playground — found and fixed 4 real bugs (DevTools hook stub missing `inject()`, StrictMode register/unregister race, discovery registered too late to see the first commit, pre-root commits silently dropped) — see `DECISIONS.md`, 2026-07-21
- Render Tracking — overcounting fix: `renderCount` no longer overcounts ancestors/siblings cloned along the reconciliation path (see `DECISIONS.md`, 2026-07-26)
- Structural Hook Tracking — `inspectHooks()` classifies each hook by shape on every commit (`ComponentSnapshot.hooks`); `state`, `ref`, and `memo-like` kinds all carry a shallow value preview (extended from `state`-only on 2026-08-24). Structural inspection still cannot resolve hook *names* or distinguish `useState`/`useReducer` or `useMemo`/`useCallback` by shape alone — see the on-demand `inspectHookNames()` entry below for the on-demand complement to this (see `DECISIONS.md`, 2026-07-27, 2026-07-28, and 2026-08-24)
- Structural Context Tracking — `inspectContexts()` walks a fiber's context dependency list (`fiber.dependencies.firstContext`, separate from the hooks list) on every commit, deduplicated by `context` identity, exposed as `ComponentSnapshot.contexts` with a `displayName` (from `Context.displayName`, falling back to `"Context"`) and a value preview reusing `previewHookValue()` (see `DECISIONS.md`, 2026-07-29)
- `previewHookValue()` caps string length at 200 characters (in addition to the existing 20-entry cap on arrays/objects), keeping every value preview genuinely bounded regardless of value shape — found and fixed via Playground once `ref` values were previewed for the first time and surfaced an unbounded string in practice (see `DECISIONS.md`, 2026-08-24)
- `Insight.onChange(listener)` reactive change-notification API, backed by a self-contained `ComponentRegistry.subscribe()`/`scheduleNotify()` mechanism (batched via `queueMicrotask()`), replacing Playground's `InsightDebugPanel` polling workaround. `sync()` performs a structural dirty-check before notifying, so subscribers are only notified when something about a component actually changed (see `DECISIONS.md`, 2026-08-04 and 2026-08-23)
- `Insight.inspectHookNames(id)` — **on-demand** hook name resolution (Phase 3's first slice): re-invokes a component's function with an instrumented dispatcher to resolve exact built-in hook names (distinguishing `useState`/`useReducer` and `useMemo`/`useCallback`, which are structurally identical) and the nearest enclosing custom hook name, if any. Strictly on-demand — never wired into the always-on discovery pipeline. Scoped to plain function components only for this slice (not `memo`/`forwardRef`/class components); custom hook name resolution degrades under minified production builds. See `DECISIONS.md`, 2026-08-24, for the full design history, including two dependency/technique decisions that were reversed after research (the `react-debug-tools` npm package, and how the current dispatcher is accessed)

#### Inspector Package

- `@react-insight/inspector` — the fourth workspace package, added 2026-08-24
- `inspectComponent(insight, id)` — combines `Insight.getComponent()` and `Insight.inspectHookNames()` into a single `ComponentInspection` result
- Depends only on `@react-insight/react`'s public `Insight` API — no knowledge of React Fiber or any React-internal concept, consistent with `REACT_ARCHITECTURE.md`'s existing non-goal that "Inspector implementation" does not belong in the React package itself
- Tested entirely against a fake `Insight` — no real React rendering needed
- No React hook wrapper yet (e.g. `useComponentInspection()`) — deferred until a real UI consumer exists (see `DECISIONS.md`, 2026-08-24)

---

### In Progress

None currently. See **Current Focus** below for the next planned work.

---

### Not Started

- Extending on-demand hook name resolution to `memo`/`forwardRef`-wrapped components (scoped out of the 2026-08-24 slice; class components remain permanently out of scope, since they have no hooks)
- A full nested custom-hook tree for `inspectHookNames()` (current slice resolves one level only; no current consumer needs more)
- A real "Inspect" UI in Playground (`@react-insight/inspector` currently has no UI consumer — see `DECISIONS.md`, 2026-08-24)
- A React hook wrapper for `@react-insight/inspector` (e.g. `useComponentInspection()`) — deferred until the UI consumer above exists
- State tracking (beyond the `state`/`ref`/`memo-like` hook value previews already shipped as part of Hook Tracking)
- Timeline
- DevTools panel
- Session management

---

## Technology Stack

- TypeScript
- React 19
- pnpm Workspace
- tsup
- Vite
- mitt
- Vitest
- Testing Library
- ESLint (Flat Config)
- GitHub Actions

---

## Development Principles

- SOLID
- Clean Architecture
- Incremental Refactoring
- Type Safety
- Strict TypeScript
- Test-Driven Development
- Coverage-Driven Development
- Documentation synchronized with implementation
- No unnecessary abstractions
- No breaking API without discussion

---

## Current Quality

Current Core package coverage is approximately:

| Metric     | Coverage | Threshold |
| ---------- | -------: | --------: |
| Statements |     ~92% |       90% |
| Lines      |     ~91% |       90% |
| Branches   |     ~85% |       80% |
| Functions  |     ~88% |       85% |

The project enforces these thresholds through Vitest and verifies them automatically through GitHub Actions CI — now a real, verified-passing workflow (see `DECISIONS.md`, 2026-08-24).

Every contribution is validated by the automated Quality Gate, which executes:

- ESLint
- TypeScript type checking
- Build
- Unit tests
- Coverage verification

Core, React, and Inspector packages are all expected to follow the same quality standards.

---

## Current Focus

Phase 2 (React Integration) is complete: Component Discovery, Render Tracking, structural Hook Tracking (including value previews for `state`/`ref`/`memo-like` kinds), structural Context Tracking, and a reactive `onChange()` API are all implemented and validated end-to-end in Playground. Phase 3 (Inspector) has begun with its first slice — on-demand hook name resolution (`Insight.inspectHookNames()`) and the new `@react-insight/inspector` package.

Candidates for the next slice, in no particular order:

- A real "Inspect" UI in Playground, giving `@react-insight/inspector` its first real UI consumer — likely the natural next step, since it would also surface whether a React hook wrapper (`useComponentInspection()`) is actually justified yet
- Extending `inspectHookNames()` to `memo`/`forwardRef`-wrapped components
- Root-container correlation for multi-application pages, still deferred and unprioritized (see `DECISIONS.md`, 2026-07-18)
- `ComponentRegistry.getByRoot()` query — still no current consumer
- Timeline or a real DevTools panel — both still without a concrete design (see `ROADMAP.md`, Phase 3 status)

The Playground package continues to serve as the primary integration environment.

It imports published workspace packages exactly as external applications will.

Rules:

- No relative imports
- No internal source imports
- Workspace package resolution only

This validates:

- Package exports
- Public API
- Runtime lifecycle
- React integration
- Developer Experience (DX)
- Packaging before npm publishing

---

## Current Architecture Notes

The project preserves strict compiler settings.

Known TypeScript limitations are documented instead of weakening compiler guarantees.

Current examples include:

- Localized type assertions where TypeScript cannot express safe generic relationships.
- Runtime implementation hidden behind the public `Insight` abstraction.
- Internal implementation isolated from the public API, with one deliberate exception: `installReactDevtoolsHook()` is exported from `internal/discovery/hookAdapter.ts` because it must be callable before an `Insight` instance can even exist (see `DECISIONS.md`, 2026-07-21).
- Component Discovery isolated behind an internal Component Discovery plugin — registered eagerly inside `createInsight()`, not via a React effect, because effects run after commit and cannot observe the tree's first commit (see `DECISIONS.md`, 2026-07-21).
- Root lifecycle remains effect-based (`useRootLifecycle`), since it only needs to know "a Provider mounted", with no first-commit visibility requirement.
- No type whose name or shape depends on React Fiber crosses the Mapper boundary (see `REACT_RUNTIME_ARCHITECTURE.md`).
- Component unmount preserves history (`ComponentRegistry.markUnmounted()`) instead of deleting the record, since `status`/`unmountedAt` already exist on `ComponentNode` and needed a real producer (see `DECISIONS.md`, 2026-07-19).
- Component identity survives React's `current`/`alternate` fiber-pair swap: `getFiberId()` resolves via the alternate before minting a new id, fixing a ghost-entry bug that affected every component that ever re-rendered (see `DECISIONS.md`, 2026-07-20).
- Per-component render detection reuses that same identity resolution (direct hit = bailout, alternate hit = rendered, neither = mount) rather than `<Profiler>` or profiler-timing fields, keeping the library's zero-instrumentation, no-wrapper positioning (see `DECISIONS.md`, 2026-07-20).
- Plugin register/unregister calls that originate from React effects are serialized through a promise chain, not fired independently, to survive React 18+ StrictMode's synchronous mount → cleanup → mount double-invoke in development (see `DECISIONS.md`, 2026-07-21).
- Per-component render detection no longer relies on Fiber object identity for the `rendered` verdict: `resolveFiberIdentity()` compares `memoizedProps`/`memoizedState` against a self-maintained last-observed snapshot per stable id, fixing overcounting for ancestors/siblings cloned along the reconciliation path to a real update (see `DECISIONS.md`, 2026-07-26). Object identity (direct/alternate hit) is still used solely to resolve the stable id.
- Structural Hook Tracking (`inspectHooks()`) classifies each hook by shape alone (no re-render, no instrumented dispatcher), consistent with the same zero-instrumentation positioning as Render Tracking. It guards against class components via `type.prototype.isReactComponent` rather than an unstable Fiber `tag`, since `isComponentFiber()` elsewhere deliberately treats function and class components alike (see `DECISIONS.md`, 2026-07-27).
- `state`, `ref`, and `memo-like` hooks all carry a shallow (one-level), circular-safe value preview (`previewHookValue()`), read directly from `memoizedState` — safe against arbitrary/circular values by construction (no code path ever revisits a node past depth 1), and now also bounded against arbitrarily long strings via a 200-character cap (see `DECISIONS.md`, 2026-07-28 and 2026-08-24).
- Context values are tracked via a separate mechanism from hooks entirely: `inspectContexts()` walks `fiber.dependencies.firstContext` (not the hooks linked list `useContext` never touches), deduplicated by `context` object identity to stay correct despite a StrictMode-related duplicate-node anomaly observed in a controlled Playground experiment. Reuses `previewHookValue()` unchanged for value serialization, and resolves real Context names via the public, DevTools-supported `Context.displayName` convention where the consuming application sets it (see `DECISIONS.md`, 2026-07-29).
- `Insight.onChange()` is backed by a self-contained `ComponentRegistry.subscribe()`/`scheduleNotify()` mechanism, not the Core `mitt`-based event system, since `ComponentRegistry` has never depended on `Runtime` or any Core type. Notifications are batched via `queueMicrotask()` and gated by a structural dirty-check in `sync()`, so subscribers are only notified when a component's tracked data actually changed (see `DECISIONS.md`, 2026-08-04 and 2026-08-23).
- **On-demand hook name resolution is a deliberate, narrow departure from the zero-instrumentation posture above** — it genuinely re-invokes a component's function, unlike every other always-on inspection technique in this project. This is why it is exposed as an explicit, separate, opt-in API (`Insight.inspectHookNames()`) rather than folded into the always-on `hooks` field, and why it is scoped to plain function components only for this slice (see `DECISIONS.md`, 2026-08-24).
- `fiberHandleRegistry.ts` (`internal/discovery/`) is the first place in this codebase that retains a live Fiber reference beyond a single synchronous traversal call, since on-demand inspection can be requested long after the commit that produced a component. Explicitly cleared on unmount to bound memory (see `DECISIONS.md`, 2026-08-24).
- React's active dispatcher slot is read directly from the `react` package itself (`dispatcherAccess.ts`), not threaded through this project's own DevTools hook `inject()` capture — simpler, and works identically in tests and real usage (see `DECISIONS.md`, 2026-08-24).
- `@react-insight/inspector` depends only on the public `Insight` API and has no knowledge of React Fiber, keeping every Fiber-aware capability inside `@react-insight/react` and presentation/orchestration logic in the new package — matching `REACT_ARCHITECTURE.md`'s pre-existing non-goal that "Inspector implementation" is not `@react-insight/react`'s responsibility (see `DECISIONS.md`, 2026-08-24).

Known, deliberately deferred limitations (see `DECISIONS.md`, 2026-07-18, 2026-07-21, 2026-07-27, and 2026-08-24):

- Renderer identity (`rendererId`) is not tracked yet — single renderer (`react-dom`) assumed.
- `onPostCommitFiberRoot` is not wired yet.
- Component Discovery assumes a single React application per page (no container-based root correlation yet).
- Structural Hook Tracking (the always-on `hooks` field) still cannot distinguish `useState` from `useReducer`, or `useMemo` from `useCallback` by shape alone, and still cannot resolve any hook *name*. `Insight.inspectHookNames()` (on-demand, 2026-08-24) resolves both of these, but only for plain function components, only one level of custom hook nesting, and with degraded custom-hook-name accuracy under minified production builds.
- Hook Tracking itself remains entirely blind to `useContext` at the hooks-list level (`readContext()` consumes no hook slot) — but Context values are now tracked separately via `contexts` (`inspectContexts()`, `DECISIONS.md`, 2026-07-29), so this is no longer a real data gap, only a hooks-list-specific one.
- `memo`/`forwardRef`-wrapped components and class components are out of scope for `inspectHookNames()` in this slice.

---

## Next Milestone

Phase 2 (React Integration) is complete and fully validated: Component Discovery, fully-accurate Render Tracking, structural Hook Tracking (with value previews across `state`/`ref`/`memo-like`), structural Context Tracking, and a reactive `onChange()` API. Phase 3 (Inspector) has begun: on-demand hook name resolution (`Insight.inspectHookNames()`) closes the `useState`/`useReducer` and `useMemo`/`useCallback` ambiguities structural tracking could never resolve on its own, and the new `@react-insight/inspector` package establishes the architectural boundary (presentation/orchestration package, consuming only the public `Insight` API) that future Inspector/DevTools/Timeline work will build on. The next milestone has not been chosen yet — see **Current Focus** above for the candidates under consideration.

Longer-term goals remain:

- A real Inspector/DevTools UI (Playground "Inspect" button as a first step)
- `memo`/`forwardRef` support for on-demand hook name resolution
- Timeline
- Session management

The completed Core package, React lifecycle integration, full Component Discovery pipeline (mount/update/unmount), fully-accurate Render Tracking, structural Hook Tracking with value previews, structural Context Tracking, a public read API (`getComponents()`/`getComponent()`), a verified reactive `onChange()` API, on-demand hook name resolution, a genuinely-passing CI workflow, and a four-package monorepo (`core`, `react`, `playground`, `inspector`) provide a stable, genuinely-validated platform for the next phase of work.