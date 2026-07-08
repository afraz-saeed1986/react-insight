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

The project is currently in **Phase 1 — Core**.

### Completed

- pnpm workspace
- TypeScript project setup
- tsup build configuration
- Runtime implementation
- Generic Runtime
- PluginManager implementation
- Generic PluginManager
- Plugin lifecycle
- Generic PluginContext
- Generic InsightPlugin
- Generic definePlugin
- Built-in Logger Plugin
- Runtime integration tests
- PluginManager unit tests
- Logger Plugin integration test
- Atomic plugin registration with rollback on setup failure
- Core architecture documentation

### In Progress

- Playground package
- Workspace integration
- Package export validation

### Not Started

- React package
- React hooks tracking
- Timeline
- DevTools panel
- Coverage reporting
- CI pipeline
- Release preparation

---

## Technology Stack

- TypeScript
- pnpm Workspace
- tsup
- Vite
- mitt
- Vitest
- ESLint

---

## Development Principles

- SOLID
- Clean Architecture
- Incremental Refactoring
- Type Safety
- Test-Driven Refactoring
- Documentation synchronized with implementation
- No unnecessary abstractions
- No breaking API without discussion

---

## Current Focus

The current focus is validating the public developer experience by building the first real consumer of the library.

The Playground package imports the Core package exactly as an external consumer would:

- No relative imports
- No internal source imports
- Workspace package resolution only

This phase validates packaging, exports and public API before starting the React package.
