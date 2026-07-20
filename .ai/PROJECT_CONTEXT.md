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

---

### In Progress

- Component Discovery implementation — unmount handling (`onCommitFiberUnmount` wiring implemented, Quality Gate not yet verified/committed)

---

### Not Started

- Render tracking
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

The current focus is completing the Component Discovery subsystem on top of the completed React lifecycle integration.

Current work includes:

- Component Discovery — unmount handling (`onCommitFiberUnmount`)
- Verifying the full Quality Gate for the unmount changes
- Deciding the next Component Discovery follow-up (e.g. root-container correlation for multi-application pages) or beginning Render Tracking

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

Known, deliberately deferred limitations (see `DECISIONS.md`, 2026-07-18):

- Renderer identity (`rendererId`) is not tracked yet — single renderer (`react-dom`) assumed.
- `onPostCommitFiberRoot` is not wired yet.
- Component Discovery assumes a single React application per page (no container-based root correlation yet).

---

## Next Milestone

The next milestone focuses on completing the component tracking infrastructure.

Immediate goals include:

- Finish Component Discovery (unmount handling, Quality Gate verification)
- Root-container correlation for multi-application support (if prioritized)
- Render tracking foundation

Longer-term goals include:

- Hook tracking
- State tracking
- Context tracking
- Timeline
- DevTools
- Inspector
- Session management

The completed Core package, React lifecycle integration, Component Discovery pipeline (mount/update) and automated Quality Gate provide a stable platform for continuing the component inspection pipeline.
