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

The project has completed **Phase 1 — Core** and is actively progressing through **Phase 2 — React Integration**.

### Completed

#### Workspace & Tooling

- pnpm workspace
- TypeScript project setup
- tsup build configuration
- Shared ESLint Flat Config
- GitHub Actions CI
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
- EventBus
- Subscription
- SubscriptionRegistry
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

- Workspace integration
- Public package export validation
- Runtime validation
- Developer Experience validation

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

---

### In Progress

None currently. See **Current Focus** below for the next planned work.

---

### Not Started

- Hook tracking
- State tracking
- Context tracking
- Timeline
- DevTools panel
- Inspector
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

The project enforces these thresholds through Vitest and verifies them automatically through GitHub Actions CI.

Every contribution is validated by the automated Quality Gate, which executes:

- ESLint
- TypeScript type checking
- Build
- Unit tests
- Coverage verification

Both Core and React packages are expected to follow the same quality standards.

---

## Current Focus

Render Tracking (root-level commit counting and per-component render detection/count) is now complete. The current focus is deciding the next area of work.

Candidates, in no particular order:

- Root-container correlation for multi-application pages, still deferred and unprioritized (see `DECISIONS.md`, 2026-07-18)
- `ComponentRegistry` change-event emission and `getByRoot()` query — still without a real consumer, so still deferred per the no-placeholder principle until something (e.g. an Inspector or DevTools panel prototype) actually needs them
- Beginning Hook / State / Context tracking
- Beginning the Phase 3 Inspector groundwork now that Component + Render Tracking are stable

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
- Internal implementation isolated from the public API.
- React lifecycle isolated behind an internal lifecycle plugin.
- Component Discovery isolated behind an internal Component Discovery plugin, following the same plugin-based integration pattern as React lifecycle.
- No type whose name or shape depends on React Fiber crosses the Mapper boundary (see `REACT_RUNTIME_ARCHITECTURE.md`).
- Component unmount preserves history (`ComponentRegistry.markUnmounted()`) instead of deleting the record, since `status`/`unmountedAt` already exist on `ComponentNode` and needed a real producer (see `DECISIONS.md`, 2026-07-19).
- Component identity survives React's `current`/`alternate` fiber-pair swap: `getFiberId()` resolves via the alternate before minting a new id, fixing a ghost-entry bug that affected every component that ever re-rendered (see `DECISIONS.md`, 2026-07-20).
- Per-component render detection reuses that same identity resolution (direct hit = bailout, alternate hit = rendered, neither = mount) rather than `<Profiler>` or profiler-timing fields, keeping the library's zero-instrumentation, no-wrapper positioning (see `DECISIONS.md`, 2026-07-20).

Known, deliberately deferred limitations (see `DECISIONS.md`, 2026-07-18):

- Renderer identity (`rendererId`) is not tracked yet — single renderer (`react-dom`) assumed.
- `onPostCommitFiberRoot` is not wired yet.
- Component Discovery assumes a single React application per page (no container-based root correlation yet).

---

## Next Milestone

Component Tracking and Render Tracking foundations are both complete. The next milestone has not been chosen yet — see **Current Focus** above for the candidates under consideration.

Longer-term goals remain:

- Hook tracking
- State tracking
- Context tracking
- Timeline
- DevTools
- Inspector
- Session management

The completed Core package, React lifecycle integration, full Component Discovery pipeline (mount/update/unmount), and full Render Tracking (root-level commit counting plus per-component render detection/count) provide a stable platform for the next phase of work.
