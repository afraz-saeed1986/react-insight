# Architecture

## Overview

```
                     Runtime
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
   EventBus       PluginManager      Public API
        │               │
        ▼               ▼
 SubscriptionRegistry  InsightPlugin
        │               │
        ▼               ▼
  Subscription     PluginContext
```

---

## Responsibilities

### Runtime

Responsible for:

- Event system
- Plugin lifecycle
- Plugin registration
- Plugin removal
- Runtime events
- Plugin context creation
- Runtime destruction
- Runtime state validation

Runtime becomes immutable after `destroy()`.

---

### PluginManager

Responsible only for:

- Registering plugins
- Removing plugins
- Looking up plugins
- Listing plugins
- Clearing registered plugins

It has **no knowledge** about plugin lifecycle or events.

---

### EventBus

Responsible for:

- Event dispatching
- Event subscriptions
- Subscription cleanup
- Strongly typed event communication

The EventBus implementation remains internal to the Core package.

---

### InsightPlugin

Responsible for:

- Plugin initialization (`setup`)
- Optional cleanup (`destroy`)

Plugins never access Runtime directly.

---

### PluginContext

Provides a safe communication layer between plugins and the Runtime.

Available APIs:

- `emit()`
- `on()`

Plugins communicate only through `PluginContext`.

---

## Lifecycle

### Registration

```
registerPlugin()

        │
        ▼

ensureNotDestroyed()

        │
        ▼

PluginManager.register()

        │
        ▼

Plugin.setup()

        │
        ▼

Runtime emits
plugin:registered
```

---

### Unregistration

```
unregisterPlugin()

        │
        ▼

ensureNotDestroyed()

        │
        ▼

Plugin.destroy()

        │
        ▼

Runtime emits
plugin:removed

        │
        ▼

PluginManager.unregister()
```

---

### Runtime Destruction

```
destroy()

        │
        ▼

Registered plugins
(reversed order)

        │
        ▼

Plugin.destroy()

        │
        ▼

plugin:removed

        │
        ▼

Runtime destroyed

        │
        ▼

Further API usage throws
```

Plugins are destroyed in **reverse registration order (LIFO)**.

---

## React Integration

The React package builds on top of the completed Core package.

Current architecture includes:

- Public `Insight` abstraction
- Internal Runtime encapsulation
- Internal Runtime access helpers
- React Context
- Internal Root model
- Internal RootRegistry
- Internal Component model
- Internal ComponentRegistry
- Internal React lifecycle hook
- Internal Root Lifecycle Plugin
- Internal Component Discovery pipeline (Hook Adapter, Fiber Adapter, Traversal, Mapper)
- Internal Component Discovery Plugin

The React package owns React-specific behavior only and delegates all Runtime responsibilities to `@react-insight/core`.

React roots are synchronized with the Runtime through an internal root lifecycle plugin, while the Runtime remains the sole owner of the plugin lifecycle.

Discovered React components are synchronized with the internal `ComponentRegistry` through an internal Component Discovery plugin, following the same plugin-based integration pattern as root lifecycle synchronization. See `REACT_RUNTIME_ARCHITECTURE.md` for the detailed layer contracts (Hook Adapter, Fiber Adapter, Traversal, Mapper, Registry) and their architectural boundaries.

---

## Design Rules

- Runtime owns the plugin lifecycle.
- PluginManager stores plugins only.
- Plugins never access Runtime directly.
- Plugins communicate only through `PluginContext`.
- EventBus remains an internal implementation detail.
- Event emitter implementation is private.
- Public API is strongly typed using generics.
- Plugin names are unique within a Runtime instance.
- Built-in plugins follow the same API as third-party plugins.
- Runtime cannot be used after `destroy()`.
- The project is developed with TypeScript `strict` mode enabled.
- `strictFunctionTypes` remains enabled.
- Any required type assertions must include a documented safety comment explaining why they are safe.

---

## Error Handling

Plugin registration is **atomic**.

If `setup()` throws:

1. The plugin is removed from `PluginManager`.
2. The original error is re-thrown.
3. No `plugin:registered` event is emitted.

This guarantees that Runtime never enters an inconsistent state.

---

## Type Safety

React Insight follows a **TypeScript-first** design philosophy.

Compiler strictness is preserved instead of being relaxed to silence type errors.

Current documented exception:

- `SubscriptionRegistry` contains a single localized type assertion.
- The assertion exists because TypeScript cannot currently express the relationship between a `Map` key and the corresponding value type when both depend on the same generic event key.
- The assertion is documented with a safety comment instead of disabling compiler checks such as `strictFunctionTypes`.

---

## Testing Strategy

The project follows a test-first approach for every public API.

### Static Analysis

Every change must pass:

- ESLint (Flat Config)
- TypeScript strict type checking

---

### Core Unit Tests

Current coverage includes:

- Runtime
- PluginManager
- EventBus
- Subscription
- SubscriptionRegistry
- Built-in Logger Plugin

---

### Core Integration Tests

Current coverage includes:

- Plugin lifecycle
- Runtime lifecycle
- Runtime destruction
- Runtime events
- Plugin registration rollback
- PluginContext communication
- Playground integration

---

### React Package Tests

Current coverage includes:

- `createInsight()`
- `InsightProvider`
- `useInsight()`
- `RootRegistry`
- `ComponentRegistry`
- React Lifecycle Plugin
- Provider lifecycle integration
- Mount / Unmount synchronization
- Public API encapsulation
- Component Discovery pipeline (Fiber Adapter, Traversal, Mapper, Hook Adapter)

---

### Coverage Requirements

Coverage is enforced using Vitest.

Minimum thresholds:

- Statements: **90%**
- Lines: **90%**
- Functions: **85%**
- Branches: **80%**

Current Core coverage is approximately:

- Statements: **92%**
- Lines: **91%**
- Functions: **88%**
- Branches: **85%**

Coverage reports are generated using the V8 provider in:

```text
coverage/
```

---

## Monorepo Architecture

```text
packages
│
├── core
├── react
├── playground
└── eslint-config
```

### core

Framework-agnostic Runtime implementation.

### react

Official React integration layer.

Current internal infrastructure includes:

- Runtime encapsulation
- Runtime access helpers
- Root model
- RootRegistry
- Component model
- ComponentRegistry
- React lifecycle hook
- React Lifecycle Plugin
- Component Discovery pipeline (Hook Adapter, Fiber Adapter, Traversal, Mapper)
- Component Discovery Plugin

### playground

Integration application used to validate package exports, Runtime behavior and Developer Experience before publishing.

---

The Playground package is the first real consumer of the Core package.

It imports the Core package exactly as an external application would:

```ts
import { Runtime, loggerPlugin } from "@react-insight/core";

const runtime = new Runtime();

await runtime.registerPlugin(loggerPlugin());
```

No internal source imports are allowed.

---

## Built-in Plugins

Built-in plugins are implemented as **factory functions**.

Example:

```ts
const plugin = loggerPlugin();
```

This guarantees:

- Independent plugin instances
- No shared internal state
- Better test isolation
- Multiple Runtime instances can safely use the same built-in plugin

---

## Quality Gate

Every change should successfully pass the following checks before being committed:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

Continuous Integration verifies these quality gates automatically on every push and pull request.

A change is considered complete only after all quality gates pass successfully.
