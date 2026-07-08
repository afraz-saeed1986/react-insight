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

## Design Rules

- Runtime owns the plugin lifecycle.
- PluginManager stores plugins only.
- Plugins never access Runtime directly.
- Plugins communicate only through PluginContext.
- Event emitter implementation is private.
- Public API is strongly typed using generics.
- Plugin names are unique within a Runtime instance.
- Built-in plugins follow the same API as third-party plugins.

---

## Error Handling

Plugin registration is **atomic**.

If `setup()` throws:

1. The plugin is removed from `PluginManager`.
2. The original error is re-thrown.
3. No `plugin:registered` event is emitted.

This guarantees that Runtime never enters an inconsistent state.

---

## Testing Strategy

The Core package is protected by two complementary testing layers:

### Unit Tests

Focus on individual components.

Current coverage includes:

- PluginManager

### Integration Tests

Focus on interaction between Runtime and plugins.

Current coverage includes:

- Runtime lifecycle
- Runtime events
- Plugin registration rollback
- Built-in Logger Plugin

---

## Monorepo Architecture

```
packages
│
├── core
│
└── playground
```

The Playground package is the first real consumer of the Core package.

Its purpose is to validate:

- Public package exports
- Workspace package resolution
- Developer Experience (DX)
- Packaging before npm publishing

Playground imports the Core package exactly as an external application would:

```ts
import { Runtime, loggerPlugin } from "@react-insight/core";
```

No internal source imports are allowed.
