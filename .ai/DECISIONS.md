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
