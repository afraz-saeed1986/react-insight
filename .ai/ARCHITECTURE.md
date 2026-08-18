# Architecture

## Overview

```
                     Runtime
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
   mitt (internal) PluginManager     Public API
                        │
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

### Internal Event System

Runtime's internal event dispatching (used for `plugin:registered` /
`plugin:removed` and for `PluginContext.emit()`/`on()`) is implemented
directly with `mitt`, wired inside `Runtime` itself — there is no
separate EventBus/Subscription/SubscriptionRegistry abstraction. An
earlier, independently-designed EventBus/Subscription/SubscriptionRegistry
implementation existed in `packages/core/src/events/` but was never
wired into `Runtime` and was removed after confirming (by temporarily
relocating it outside the package before deleting) that nothing
depended on it. See `DECISIONS.md`.

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

Note: `Plugin.destroy()` completes, and the Runtime's `plugin:removed`
event fires, **before** `PluginManager.unregister()` actually frees the
plugin's name. Callers that fire registration/unregistration
independently (rather than awaiting each other) can race if they
attempt to reuse the same plugin name before the prior unregistration
has fully settled — see the React package's `useRootLifecycle`, which
serializes these calls for exactly this reason.

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
- `Insight.getComponents()` public read API (`ComponentSnapshot`), decoupled from the internal `ComponentNode` representation
- `installReactDevtoolsHook()`, a standalone public entry point independent of any `Insight` instance (see below)
- Internal Runtime encapsulation
- Internal Runtime access helpers
- React Context
- Internal Root model (including root-level commit counting)
- Internal RootRegistry
- Internal Component model (including render count / last-rendered / mount-unmount lifecycle state / structural hook summary / context dependency summary)
- Internal ComponentRegistry
- Internal React lifecycle hook (root lifecycle only — see below)
- Internal Root Lifecycle Plugin
- Internal Component Discovery pipeline (Hook Adapter, Fiber Adapter, Traversal, Mapper, Hook Inspector, Context Inspector)
- Internal Component Discovery Plugin

The React package owns React-specific behavior only and delegates all Runtime responsibilities to `@react-insight/core`.

React roots are synchronized with the Runtime through an internal root lifecycle plugin, while the Runtime remains the sole owner of the plugin lifecycle.

Discovered React components are synchronized with the internal `ComponentRegistry` through an internal Component Discovery plugin. See `REACT_RUNTIME_ARCHITECTURE.md` for the detailed layer contracts (Hook Adapter, Fiber Adapter, Traversal, Mapper, Registry) and their architectural boundaries.

### Registration timing: root lifecycle vs. Component Discovery

Root lifecycle and Component Discovery are registered differently, because they have different timing requirements:

- **Root lifecycle** is registered from a React effect (`useRootLifecycle`, inside `useInsightLifecycle`). It only needs to know "a Provider mounted", which the effect running is sufficient evidence of.
- **Component Discovery** is registered **eagerly, inside `createInsight()`** — before `ReactDOM.createRoot().render()` is ever called by the consuming application — not from a React effect. A React effect always runs _after_ the commit that triggers it, so an effect-based registration structurally cannot observe the very first commit of the tree it lives inside. This was confirmed empirically, not just reasoned about: under the old effect-based registration, `onCommitFiberRoot` never fired for a page's initial render.

Because Component Discovery connects before root lifecycle registers, a commit can arrive before any root exists yet. `ComponentDiscoveryPlugin` handles this by tagging such components with a `"pending"` `rootId`, which self-heals on the next commit once the real root registers (`ComponentRegistry.sync()` already updates `rootId` unconditionally on every commit).

### `installReactDevtoolsHook()`

React's renderer (`react-dom`) checks for `__REACT_DEVTOOLS_GLOBAL_HOOK__` exactly once, at its own module-initialization time, and calls `hook.inject(...)` to register itself. If the hook does not exist yet at that moment — or exists but lacks a working `inject()` — React never notifies it of commits for the rest of that page session, no matter what is installed later.

Because of this, hook installation cannot be deferred to anything that runs after `react-dom` has loaded (including any React effect). `installReactDevtoolsHook()` is exported directly from `@react-insight/react` as a standalone function, independent of any `Insight` instance, and the consuming application must call it before importing `react-dom` anywhere in its module graph. This is the one deliberate exception to "nothing under `internal/` is exported publicly" (see `REACT_ARCHITECTURE.md`). The same constraint is documented by React's own `react-devtools-inline` package.

`connectHookAdapter()` (used internally by the Component Discovery plugin) also calls `installReactDevtoolsHook()` defensively, so discovery still degrades gracefully for consumers who forget to call it early — at the cost of missing however many initial commits happen before the plugin connects.

### Async lifecycle operations under React StrictMode

React 18+ StrictMode invokes effects as mount → cleanup → mount in development. Since plugin registration and unregistration are both asynchronous (Runtime awaits `Plugin.setup()` / `Plugin.destroy()`), any code that fires registration and unregistration independently from effects can race: a second mount's registration can run before the first mount's cleanup has actually freed the plugin's name, throwing "Plugin already registered". `useRootLifecycle` avoids this by serializing every register/unregister call through a per-hook promise chain, so operations are strictly ordered regardless of exactly how closely spaced in time React schedules the effect/cleanup calls.

---

## Design Rules

- Runtime owns the plugin lifecycle.
- PluginManager stores plugins only.
- Plugins never access Runtime directly.
- Plugins communicate only through `PluginContext`.
- The internal event emitter (`mitt`) remains an internal implementation detail.
- Event emitter implementation is private.
- Public API is strongly typed using generics.
- Plugin names are unique within a Runtime instance.
- Built-in plugins follow the same API as third-party plugins.
- Runtime cannot be used after `destroy()`.
- The project is developed with TypeScript `strict` mode enabled.
- `strictFunctionTypes` remains enabled.
- Any required type assertions must include a documented safety comment explaining why they are safe.
- Nothing under `internal/` is exported from a package's public entry point, with one deliberate, documented exception: `installReactDevtoolsHook()` (see React Integration above), which must be callable before an `Insight` instance exists.
- Registration/unregistration calls triggered from React effects must be serialized (not fired independently), to remain correct under React StrictMode's development-mode double-invoke.

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

No current documented type-assertion exceptions. (The one that
previously existed lived in `SubscriptionRegistry`, which was removed
— see `DECISIONS.md`.)

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

- `createInsight()` (including `getComponents()` and eager Component Discovery registration)
- `InsightProvider`
- `useInsight()`
- `useInsightLifecycle()` under React StrictMode (register/unregister serialization)
- `RootRegistry` (including `recordCommit()`)
- `ComponentRegistry` (including `sync()` mount/update behavior, `markUnmounted()`, and render-count accounting)
- Root Lifecycle Plugin
- Component Discovery Plugin (commit/sync, pre-root "pending" fallback, unmount via `markUnmounted()`, disconnect on destroy)
- Provider lifecycle integration
- Mount / Unmount synchronization
- Public API encapsulation
- Component Discovery pipeline (Fiber Adapter, Traversal, Mapper, Hook Adapter, Hook Inspector, Context Inspector, including Fiber `current`/`alternate` identity resolution for stable ids, `memoizedProps`/`memoizedState` comparison for `rendered` detection, structural hook-shape classification with shallow value preview for `state`-kind hooks, and context-dependency-list walking with shallow value preview and displayName-based naming)

### End-to-End Validation (Playground)

Beyond unit tests, Playground renders a real React tree through `InsightProvider` and is the only environment that exercises the real `react-dom` DevTools hook connection path (`hook.inject(...)`, module-load timing, actual commit notifications) rather than a directly-invoked test double. This caught several bugs invisible to fixture-based unit tests alone — see `DECISIONS.md`, 2026-07-21 — and remains the required check before considering discovery/render-tracking/hook-tracking/context-tracking changes complete.

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
- Root model (including commit counting)
- RootRegistry
- Component model (including render tracking, structural hook tracking with state-value preview, context-dependency tracking with value preview, and unmount history)
- ComponentRegistry
- Root Lifecycle hook and Plugin (effect-based)
- Component Discovery pipeline (Hook Adapter, Fiber Adapter, Traversal, Mapper, Hook Inspector, Context Inspector) and Plugin (registered eagerly from `createInsight()`, not effect-based)

### playground

Integration application used to validate package exports, Runtime behavior and Developer Experience before publishing — and, since it now renders a real React tree through `@react-insight/react`, the only environment that validates Component Discovery, Render Tracking, Hook Tracking, and Context Tracking against actual `react-dom` behavior rather than synthetic Fiber fixtures.

---

The Playground package is the first real consumer of the Core package.

It imports the Core package exactly as an external application would:

```ts
import { Runtime, loggerPlugin } from "@react-insight/core";

const runtime = new Runtime();

await runtime.registerPlugin(loggerPlugin());
```

It also imports the React package exactly as an external application would, including the module-order requirement that `installReactDevtoolsHook()` must run before `react-dom` is imported:

```tsx
import { installReactDevtoolsHook } from "@react-insight/react";
installReactDevtoolsHook();

import { createRoot } from "react-dom/client";
import { createInsight, InsightProvider } from "@react-insight/react";
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

For changes touching Component Discovery, Render Tracking, Hook Tracking, or Context Tracking specifically, manual end-to-end verification through Playground (real browser, real React commits) is also required before considering the change complete — see Testing Strategy above.

A change is considered complete only after all quality gates pass successfully.
