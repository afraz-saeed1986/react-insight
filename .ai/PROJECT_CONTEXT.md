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

The project has completed **Phase 1 — Core**.

### Completed

- pnpm workspace
- TypeScript project setup
- tsup build configuration
- Runtime implementation
- Generic Runtime
- Runtime destruction lifecycle (`destroy()`)
- Runtime state protection after destruction
- PluginManager implementation
- Generic PluginManager
- Plugin lifecycle
- Generic PluginContext
- Generic InsightPlugin
- Generic `definePlugin()`
- Built-in Logger Plugin
- Logger Plugin factory API
- EventBus implementation
- Subscription implementation
- SubscriptionRegistry implementation
- Runtime integration tests
- EventBus unit tests
- Subscription unit tests
- SubscriptionRegistry unit tests
- PluginManager unit tests
- Logger Plugin integration tests
- Playground package
- Workspace integration
- Public package export validation
- Atomic plugin registration with rollback on setup failure
- Shared ESLint Flat Config
- TypeScript strict configuration
- Coverage thresholds
- Core architecture documentation
- GitHub Actions CI
- Automated Quality Gate

### In Progress

- Release preparation

### Not Started

- React package
- React hooks tracking
- Timeline
- DevTools panel
- Inspector
- Session management

---

## Technology Stack

- TypeScript
- pnpm Workspace
- tsup
- Vite
- mitt
- Vitest
- ESLint (Flat Config)
- GitHub Actions

---

## Development Principles

- SOLID
- Clean Architecture
- Incremental Refactoring
- Type Safety
- Strict TypeScript
- Test-Driven Refactoring
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
- Coverage thresholds

---

## Current Focus

The current focus is preparing the project for its first public release before starting React-specific features.

Current work includes:

- Release preparation
- npm publishing readiness
- Phase 2 planning

The Playground package is used as the primary integration environment.

It imports the Core package exactly as an external consumer would:

```ts
import { Runtime, loggerPlugin } from "@react-insight/core";

const runtime = new Runtime();

await runtime.registerPlugin(loggerPlugin());
```

Rules:

- No relative imports
- No internal source imports
- Workspace package resolution only

This validates:

- Package exports
- Public API
- Plugin lifecycle
- Runtime destruction
- Developer Experience (DX)
- Packaging before npm publishing

---

## Current Architecture Notes

The project preserves strict compiler settings.

Known TypeScript limitations are documented instead of weakening compiler guarantees.

Current example:

- `SubscriptionRegistry` contains one localized and documented type assertion required because TypeScript cannot fully express key-dependent `Map` value types.

---

## Next Milestone

With **Phase 1 — Core** complete, the next milestone is **Phase 2 — React Integration**.

Initial Phase 2 goals include:

- React package
- `createInsight()`
- React Runtime integration
- Root registration
- Component tracking foundation

The completed Core package and automated Quality Gate provide a stable foundation for the next phase of development.
