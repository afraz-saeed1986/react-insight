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

The project has completed **Phase 1 — Core** and entered **Phase 2 — React Integration**.

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
- React package unit tests
- React integration tests

---

### In Progress

- React integration
- Root registration
- Component tracking foundation

---

### Not Started

- Hook tracking
- State tracking
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

The current focus is building the React integration layer on top of the completed Core package.

Current work includes:

- React Runtime integration
- Root registration
- React lifecycle integration
- Component tracking foundation

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

---

## Next Milestone

The next milestone focuses on expanding the React integration layer.

Immediate goals include:

- Root registration
- Component tracking
- Render tracking
- Hook tracking foundation

Longer-term goals include:

- Timeline
- DevTools
- Inspector
- Session management

The completed Core package, React package foundation and automated Quality Gate provide a stable platform for the remaining phases of development.
