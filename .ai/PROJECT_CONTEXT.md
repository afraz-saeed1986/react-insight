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

The project has completed **Phase 1 — Core** and **Phase 2 — React Integration**, and is actively progressing through **Phase 3 — Inspector**.

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
- Manual end-to-end validation surface for Component Discovery / Render Tracking (`InsightDebugPanel`, reactive via `insight.onChange()` rather than polling)
- **Real "Inspect" UI** (2026-08-25): each component row has an "Inspect" button calling `inspectComponent(insight, id)` from `@react-insight/inspector`, displaying the combined structural snapshot + on-demand `hookNames` result. First real UI consumer of `@react-insight/inspector`.

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
- **`memo`/`forwardRef` support in Component Discovery** (2026-08-25): `isComponentFiber()` and `getDisplayName()` recognize and recursively unwrap `memo(...)`, `forwardRef(...)`, and `memo(forwardRef(...))` — previously these components were entirely invisible to the whole pipeline (never discovered, never tracked, never rendered/hook/context-tracked). Hook Inspector, Context Inspector, and Render Tracking required no changes, since they operate on Fiber-instance-level state independent of `fiber.type`'s shape. See `DECISIONS.md`, 2026-08-25.
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
- `Insight.inspectHookNames(id)` — **on-demand** hook name resolution (Phase 3's first slice): re-invokes a component's function with an instrumented dispatcher to resolve exact built-in hook names (distinguishing `useState`/`useReducer` and `useMemo`/`useCallback`, which are structurally identical) and the nearest enclosing custom hook name, if any. Strictly on-demand — never wired into the always-on discovery pipeline. Since 2026-08-25, also correctly re-invokes `memo`/`forwardRef`/`memo(forwardRef(...))` components (not just plain function components). Custom hook name resolution degrades under minified production builds. See `DECISIONS.md`, 2026-08-24, for the full design history, including two dependency/technique decisions that were reversed after research

#### Inspector Package

- `@react-insight/inspector` — the fourth workspace package, added 2026-08-24
- `inspectComponent(insight, id)` — combines `Insight.getComponent()` and `Insight.inspectHookNames()` into a single `ComponentInspection` result
- Depends only on `@react-insight/react`'s public `Insight` API — no knowledge of React Fiber or any React-internal concept, consistent with `REACT_ARCHITECTURE.md`'s existing non-goal that "Inspector implementation" does not belong in the React package itself
- Tested entirely against a fake `Insight` — no real React rendering needed
- **First real UI consumer** (2026-08-25): Playground's `InsightDebugPanel` "Inspect" button. With this consumer in hand, the integration turned out to be a simple imperative call on click — no reactive behavior needed — so a React hook wrapper (`useComponentInspection()`) remains deliberately deferred, now backed by evidence rather than speculation (see `DECISIONS.md`, 2026-08-25)

---

### In Progress

None currently. See **Current Focus** below for the next planned work.

---

### Not Started

- A full nested custom-hook tree for `inspectHookNames()` (current slice resolves one level only; no current consumer needs more)
- A React hook wrapper for `@react-insight/inspector` (e.g. `useComponentInspection()`) — deferred until a consumer needs live/reactive results, not just an on-demand call (see `DECISIONS.md`, 2026-08-25)
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

Phase 2 (React Integration) is complete. Phase 3 (Inspector) is active: on-demand hook name resolution, the `@react-insight/inspector` package, a real "Inspect" UI in Playground, and full `memo`/`forwardRef` support across Component Discovery are all implemented and validated end-to-end.

Candidates for the next slice, in no particular order:

- Timeline or a real DevTools panel — both still without a concrete design; the natural next big design-first effort, since the underlying data (component history via `mountedAt`/`unmountedAt`/`renderCount`, reactive `onChange()`) already exists but has never been shaped into either concept.
- A full nested custom-hook tree for `inspectHookNames()` — no current consumer needs it yet.

---

## Deferred, No Current Consumer

Carried forward across multiple sessions; still genuinely without a real consumer, so per Principle 5 (no premature abstraction) these remain deliberately unimplemented rather than scheduled speculatively:

- Root-container correlation for multi-application pages (see `DECISIONS.md`, 2026-07-18).
- `ComponentRegistry.getByRoot()` query.
- A React hook wrapper for `@react-insight/inspector` (`useComponentInspection()`).

---

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
- Per-component render detection reuses that same identity resolution rather than `<Profiler>` or profiler-timing fields, keeping the library's zero-instrumentation, no-wrapper positioning (see `DECISIONS.md`, 2026-07-20).
- Plugin register/unregister calls that originate from React effects are serialized through a promise chain, not fired independently, to survive React 18+ StrictMode's synchronous mount → cleanup → mount double-invoke in development (see `DECISIONS.md`, 2026-07-21).
- Per-component render detection no longer relies on Fiber object identity for the `rendered` verdict: `resolveFiberIdentity()` compares `memoizedProps`/`memoizedState` against a self-maintained last-observed snapshot per stable id, fixing overcounting for ancestors/siblings cloned along the reconciliation path to a real update (see `DECISIONS.md`, 2026-07-26).
- Structural Hook Tracking (`inspectHooks()`) classifies each hook by shape alone (no re-render, no instrumented dispatcher), consistent with the same zero-instrumentation positioning as Render Tracking. It guards against class components via `type.prototype.isReactComponent` rather than an unstable Fiber `tag` (see `DECISIONS.md`, 2026-07-27).
- `state`, `ref`, and `memo-like` hooks all carry a shallow (one-level), circular-safe value preview (`previewHookValue()`), now also bounded against arbitrarily long strings via a 200-character cap (see `DECISIONS.md`, 2026-07-28 and 2026-08-24).
- Context values are tracked via a separate mechanism from hooks entirely: `inspectContexts()` walks `fiber.dependencies.firstContext`, deduplicated by `context` object identity, reusing `previewHookValue()` for value serialization (see `DECISIONS.md`, 2026-07-29).
- `Insight.onChange()` is backed by a self-contained `ComponentRegistry.subscribe()`/`scheduleNotify()` mechanism, batched via `queueMicrotask()` and gated by a structural dirty-check in `sync()` (see `DECISIONS.md`, 2026-08-04 and 2026-08-23).
- **On-demand hook name resolution is a deliberate, narrow departure from the zero-instrumentation posture above** — it genuinely re-invokes a component's function, unlike every other always-on inspection technique in this project. Exposed as an explicit, separate, opt-in API (`Insight.inspectHookNames()`) rather than folded into the always-on `hooks` field (see `DECISIONS.md`, 2026-08-24).
- `fiberHandleRegistry.ts` is the first place in this codebase that retains a live Fiber reference beyond a single traversal call. Explicitly cleared on unmount to bound memory (see `DECISIONS.md`, 2026-08-24).
- React's active dispatcher slot is read directly from the `react` package itself (`dispatcherAccess.ts`), not threaded through this project's own DevTools hook `inject()` capture (see `DECISIONS.md`, 2026-08-24).
- `@react-insight/inspector` depends only on the public `Insight` API and has no knowledge of React Fiber, matching `REACT_ARCHITECTURE.md`'s pre-existing non-goal that "Inspector implementation" is not `@react-insight/react`'s responsibility (see `DECISIONS.md`, 2026-08-24).
- **`memo`/`forwardRef` components are fully supported across Component Discovery** (2026-08-25) — recognized via stable, well-known global symbols (`Symbol.for("react.memo")`/`Symbol.for("react.forward_ref")`) defined locally rather than via a new dependency, since these symbols (unlike dispatcher internals) have never changed since `memo`/`forwardRef` were introduced. Hook Inspector, Context Inspector, and Render Tracking required no changes, since they operate on Fiber-instance-level state independent of `fiber.type`'s shape (see `DECISIONS.md`, 2026-08-25).

Known, deliberately deferred limitations (see `DECISIONS.md`, 2026-07-18, 2026-07-21, 2026-07-27, and 2026-08-24):

- Renderer identity (`rendererId`) is not tracked yet — single renderer (`react-dom`) assumed.
- `onPostCommitFiberRoot` is not wired yet.
- Component Discovery assumes a single React application per page (no container-based root correlation yet).
- Structural Hook Tracking (the always-on `hooks` field) still cannot distinguish `useState` from `useReducer`, or `useMemo` from `useCallback` by shape alone, and still cannot resolve any hook *name*. `Insight.inspectHookNames()` (on-demand) resolves both of these, but only one level of custom hook nesting, and with degraded custom-hook-name accuracy under minified production builds.
- Hook Tracking itself remains entirely blind to `useContext` at the hooks-list level — Context values are tracked separately via `contexts` (`inspectContexts()`, `DECISIONS.md`, 2026-07-29), so this is no longer a real data gap, only a hooks-list-specific one.
- Class components remain out of scope for `inspectHookNames()` (they have no hooks list at all). `memo`/`forwardRef` are no longer a limitation here as of 2026-08-25.

---

## Next Milestone

Phase 2 (React Integration) is complete and fully validated. Phase 3 (Inspector) has real, working slices: on-demand hook name resolution, `@react-insight/inspector` with its first real UI consumer, and full `memo`/`forwardRef` support across the entire discovery pipeline (not just hook name resolution — this closed a gap that had made these components invisible to Render/Hook/Context Tracking too). The next milestone has not been chosen yet — see **Current Focus** above; Timeline and a real DevTools panel are the most likely candidates, but both need a concrete design pass before implementation, matching this project's design-first discipline.

Longer-term goals remain:

- A real Inspector/DevTools UI (Playground "Inspect" button was the first concrete step)
- A full nested custom-hook tree for `inspectHookNames()`
- Timeline
- Session management

The completed Core package, React lifecycle integration, full Component Discovery pipeline (now including `memo`/`forwardRef`), fully-accurate Render Tracking, structural Hook Tracking with value previews, structural Context Tracking, a public read API, a verified reactive `onChange()` API, on-demand hook name resolution, a genuinely-passing CI workflow, and a four-package monorepo (`core`, `react`, `inspector`, `playground`) — the last of which now has a real Inspector UI consumer — provide a stable, genuinely-validated platform for the next phase of work.