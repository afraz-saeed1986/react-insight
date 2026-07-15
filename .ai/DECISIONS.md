# Architecture Decisions

## 2026-07-07

### Runtime owns the plugin lifecycle

PluginManager stores plugins only.

Plugin lifecycle belongs to Runtime.

---

## 2026-07-07

### Internal event system

`mitt` is used as the internal event emitter.

The implementation is completely hidden from the public API.

---

## 2026-07-07

### Generic PluginContext

PluginContext became generic.

Reason:

Preserve event payload types across plugins.

---

## 2026-07-07

### Generic InsightPlugin

InsightPlugin became generic.

Reason:

Allow strongly typed plugins without casts.

---

## 2026-07-07

### Generic PluginManager

PluginManager became generic.

Reason:

Preserve event types throughout the Runtime.

---

## 2026-07-08

### Generic Runtime

Runtime became fully generic.

Reason:

Keep the entire public API strongly typed without using:

- `any`
- `unknown`
- public casts

---

## 2026-07-08

### Atomic plugin registration

Plugin registration is transactional.

If `setup()` throws:

- the plugin is removed,
- the original error is re-thrown,
- no registration event is emitted.

Reason:

Prevent inconsistent Runtime state.

---

## 2026-07-08

### Plugin identity

Plugin names are unique.

Registering two plugins with the same name throws an error.

Reason:

Plugin names are the unique identifier used by Runtime and PluginManager.

---

## 2026-07-08

### Public API testing

Every public API must have automated tests.

Reason:

Public behavior is part of the library contract and must remain stable.

---

## 2026-07-08

### Playground strategy

The Playground package is the first official consumer of the Core package.

It imports the package exactly as external users will:

```ts
import { Runtime, loggerPlugin } from "@react-insight/core";

const runtime = new Runtime();

await runtime.registerPlugin(loggerPlugin());
```

Relative imports from `core/src` are not allowed.

Reason:

Validate package exports, workspace integration and developer experience before publishing.

---

## 2026-07-08

### Package consistency

Every package inside the workspace follows the same minimal structure:

```text
package
│
├── package.json
├── tsconfig.json
└── src/
```

Reason:

Keep the monorepo consistent and easy to maintain.

---

## 2026-07-11

### Runtime destruction

Runtime exposes a dedicated `destroy()` method.

After destruction:

- every registered plugin is destroyed,
- plugins are destroyed in reverse registration order (LIFO),
- Runtime becomes permanently unusable.

Every public API validates the Runtime state before executing.

Reason:

Prevent resource leaks and ensure deterministic shutdown.

---

## 2026-07-11

### Removed Runtime.clear()

`clear()` was removed in favor of `destroy()`.

Reason:

Removing plugins without executing their cleanup logic could leave resources and event subscriptions alive.

A Runtime should have a single explicit shutdown mechanism.

---

## 2026-07-11

### Built-in plugins are factories

Built-in plugins are created using factory functions.

Example:

```ts
const logger = loggerPlugin();
```

instead of:

```ts
const logger = loggerPlugin;
```

Reason:

Each Runtime receives an isolated plugin instance.

Internal plugin state (such as event disposers) is never shared across Runtime instances or test executions.

---

## 2026-07-11

### Coverage-driven development

Core development now follows a coverage-first approach.

Every completed feature is followed by:

- Unit tests
- Integration tests
- Coverage review

Reason:

Keep the Core package stable before expanding the public API.

Coverage thresholds are enforced through Vitest configuration.

---

## 2026-07-11

### Quality Gate

Every change must successfully pass:

- ESLint
- TypeScript type checking
- Build
- Unit tests
- Coverage thresholds

Reason:

Prevent regressions before changes are committed.

---

## 2026-07-11

### Shared ESLint configuration

The workspace now provides a shared Flat Config package.

All packages consume the same ESLint configuration.

Reason:

Ensure consistent code quality rules across the monorepo while avoiding duplicated configuration.

---

## 2026-07-11

### Preserve TypeScript strictness

Compiler strictness is never relaxed to silence type errors.

In particular:

- `strictFunctionTypes` remains enabled.
- `strict` mode remains enabled.

When TypeScript cannot express a safe relationship, localized and documented type assertions are preferred over weakening compiler guarantees.

Reason:

Maintain a strongly typed public API and maximize compile-time correctness.

---

## 2026-07-11

### Playground as integration validation

Playground is no longer only a manual demo.

It serves as an integration test bed for:

- package exports
- plugin lifecycle
- Runtime destruction
- built-in plugins
- workspace package resolution

Reason:

Ensure the published package behaves exactly as it will in external applications.

---

## 2026-07-12

### Automated Quality Gate

The project quality gate is enforced through GitHub Actions CI.

Every push and pull request targeting the main development branches automatically executes:

- ESLint
- TypeScript type checking
- Build
- Unit tests
- Coverage verification

The workflow runs against the supported Node.js LTS versions using a matrix strategy.

Reason:

Ensure every contribution satisfies the project's quality standards before being merged, while validating compatibility across supported Node.js versions.

---

## 2026-07-13

### Official React integration package

React integration is implemented as a dedicated workspace package:

```text
@react-insight/react
```

Reason:

Keep the Core package framework-agnostic while providing an idiomatic React API.

---

## 2026-07-13

### Runtime encapsulation

The Runtime is no longer exposed through the public React API.

Instead, applications interact with the `Insight` abstraction.

The Runtime is stored internally using a symbol-based implementation detail.

Reason:

Prevent coupling to internal implementation details and preserve API stability during future refactors.

---

## 2026-07-13

### Insight as the public facade

The `Insight` object is the only public entry point for application code.

It exposes only high-level operations such as:

- `use()`
- `destroy()`

Reason:

Expose a small, stable API while allowing the internal Runtime implementation to evolve independently.

---

## 2026-07-13

### Internal implementation layer

Private implementation details are isolated under an `internal/` directory.

Examples include:

- Runtime symbol
- Internal Runtime holder types

These modules are never exported from the package entry point.

Reason:

Clearly separate public APIs from implementation details and reduce the risk of accidental public exports.

---

## 2026-07-13

### React public API testing

The React package follows the same public API testing strategy as the Core package.

Current public APIs covered by automated tests include:

- `createInsight()`
- `InsightProvider`
- `useInsight()`

Reason:

Protect the React integration layer against regressions while maintaining a stable developer experience.

---

## 2026-07-14

### Defer React-specific runtime infrastructure

React-specific runtime infrastructure such as `ReactBridge`, `InsightSession`, or similar ownership abstractions is intentionally postponed until a real runtime consumer exists.

Current React infrastructure is implemented only when justified by actual behavior and integration requirements.

Reason:

Follow the YAGNI principle and avoid introducing abstractions before they provide concrete value.

This keeps the React package simple while allowing future architecture to evolve from real use cases instead of predictions.

---

## 2026-07-14

### React lifecycle is implemented as an internal Runtime plugin

React lifecycle behavior is implemented as an internal plugin registered through the existing Runtime plugin system.

The lifecycle plugin is responsible for synchronizing React root mount and unmount events with the internal `RootRegistry`.

`InsightProvider` owns only the lifecycle integration point. It does not implement registration logic itself.

Reason:

Reuse the existing Runtime plugin architecture instead of introducing a React-specific lifecycle mechanism.

This keeps the React package aligned with the Core architecture, preserves a single plugin lifecycle model, and avoids unnecessary abstractions.

---

## 2026-07-14

### Runtime remains the single owner of lifecycle management

React-specific lifecycle events are delegated to the Runtime through plugin registration.

Neither `InsightProvider` nor React hooks manage plugin lifecycles directly beyond registering the internal lifecycle plugin.

Reason:

Maintain a single source of truth for plugin lifecycle management and keep React integration focused solely on bridging React with the Runtime.

---

## 2026-07-14

### Internal Runtime access is isolated behind helper utilities

The internal Runtime and supporting infrastructure are accessed through dedicated internal helper functions rather than exposing implementation details throughout the React package.

Reason:

Reduce coupling between internal modules, improve maintainability, and preserve the flexibility to refactor the internal implementation without affecting the public API.

---

## 2026-07-15

### Component Registry is independent from React internals

The `ComponentRegistry` is implemented as a framework-agnostic state container.

It stores only React Insight domain models and has no knowledge of React Fiber or renderer-specific implementation details.

Reason:

Keep the registry reusable, testable and independent from React internals. React-specific discovery mechanisms are responsible for translating renderer data into registry updates.

---

## 2026-07-15

### Component Discovery is design-first

Implementation of the Component Discovery subsystem is intentionally postponed until its architecture is finalized.

No renderer abstraction, Fiber bridge or discovery service will be introduced before a concrete design with real producers and consumers exists.

Reason:

Follow YAGNI and avoid premature abstractions. Every new module should provide immediate value instead of acting as a placeholder for future functionality.
