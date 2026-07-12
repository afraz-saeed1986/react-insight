# Architecture

## Overview

```
                 Runtime
                    │
     ┌──────────────┼──────────────┐
     │              │              │
     ▼              ▼              ▼
 Event Emitter   PluginManager   Public API
    (mitt)             │
                        ▼
                 InsightPlugin
                        │
                        ▼
                 PluginContext
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

## Design Rules

- Runtime owns the plugin lifecycle.
- PluginManager stores plugins only.
- Plugins never access Runtime directly.
- Plugins communicate only through PluginContext.
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

The Core package is protected by multiple quality gates.

### Static Analysis

Every change must pass:

- ESLint (Flat Config)
- TypeScript strict type checking

### Unit Tests

Current coverage includes:

- Runtime
- PluginManager
- EventBus
- Subscription
- SubscriptionRegistry
- Built-in Logger Plugin

### Integration Tests

Current coverage includes:

- Plugin lifecycle
- Runtime lifecycle
- Runtime destruction
- Runtime events
- Plugin registration rollback
- PluginContext communication
- Playground integration

### Coverage Requirements

Coverage is enforced using Vitest.

Minimum thresholds:

- Statements: **90%**
- Lines: **90%**
- Functions: **85%**
- Branches: **80%**

Current Core coverage is approximately:

- Statements: **91%**
- Lines: **91%**
- Functions: **88%**
- Branches: **85%**

Coverage reports are generated using the V8 provider in:

```
coverage/
```

---

## Monorepo Architecture

```
packages
│
├── core
├── playground
└── eslint-config
```

The Playground package is the first real consumer of the Core package.

Its purpose is to validate:

- Public package exports
- Workspace package resolution
- Plugin lifecycle
- Runtime behavior
- Developer Experience (DX)
- Packaging before npm publishing

Playground imports the Core package exactly as an external application would:

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
pnpm --filter @react-insight/core test --coverage
```

A change is considered complete only after all quality gates pass successfully.
