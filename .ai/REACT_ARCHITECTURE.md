# React Architecture

## Vision

The `@react-insight/react` package provides the official React integration for React Insight.

It acts as the bridge between React applications and the Runtime implemented in `@react-insight/core`.

The package remains lightweight and focuses exclusively on React-specific functionality while preserving a clean separation between the public React API and the Core Runtime.

---

## Goals

- Provide an ergonomic React API.
- Keep the Core package completely framework-agnostic.
- Minimize runtime overhead.
- Preserve strong TypeScript support.
- Integrate naturally with modern React applications.
- Support React 19 and newer.
- Remain compatible with Server Components where applicable.
- Hide Core implementation details behind a stable React API.

---

## Non-Goals

The React package is **not** responsible for:

- Runtime implementation
- Plugin lifecycle management
- Event system implementation
- DevTools UI
- Inspector implementation
- Plugin execution logic

Those responsibilities belong to other packages.

---

# Public API

The React package exposes a minimal, ergonomic and stable API.

Current public API:

```ts
import {
  createInsight,
  InsightProvider,
  useInsight,
} from "@react-insight/react";

const insight = createInsight();

await insight.use(loggerPlugin());

root.render(
  <InsightProvider insight={insight}>
    <App />
  </InsightProvider>
);

function Dashboard() {
  const insight = useInsight();

  // ...
}
```

---

## Public API Design Principles

The public API should:

- Be easy to learn.
- Minimize required configuration.
- Avoid exposing Core internals.
- Remain stable across internal refactors.
- Be extensible without breaking existing applications.
- Support future built-in plugins and developer tools.

The Runtime is intentionally hidden from consumers.

Applications interact only with the `Insight` abstraction.

---

## API Responsibilities

### createInsight()

Responsible for:

- Creating the internal Runtime.
- Creating the internal RootRegistry.
- Creating the internal ComponentRegistry.
- Returning the public `Insight` instance.
- Delegating plugin registration.
- Delegating plugin unregistration.
- Delegating Runtime destruction.

The Runtime implementation remains internal to the package.

---

### InsightProvider

Responsible for:

- Providing the `Insight` instance through React Context.
- Making the public API available to React components.
- Hosting the internal React lifecycle integration.

The Provider must never own or implement Runtime behavior.

---

### useInsight()

Responsible for:

- Accessing the current `Insight` instance.
- Providing a stable React API.
- Throwing a descriptive error when used outside `InsightProvider`.

Consumers should never access React Context directly.

---

# React Lifecycle

The React package integrates with the Core Runtime through an internal root lifecycle plugin.

The lifecycle integration is intentionally isolated behind `useInsightLifecycle()`.

Current lifecycle flow:

```text
InsightProvider
        │
        ▼
useInsightLifecycle()
        │
        ▼
useRootLifecycle()
        │
        ▼
createRootLifecyclePlugin()
        │
        ▼
Runtime.registerPlugin()
        │
        ▼
Plugin.setup()
        │
        ▼
RootRegistry.register()

Unmount
        │
        ▼
Runtime.unregisterPlugin()
        │
        ▼
Plugin.destroy()
        │
        ▼
RootRegistry.unregister()
```

This design ensures that the Runtime remains the sole owner of the plugin lifecycle while React is responsible only for integrating Runtime with the React lifecycle.

---

# Component Discovery

The React package integrates Component Discovery through a second internal plugin, following the same integration pattern as the root lifecycle plugin.

The discovery integration is isolated behind `useComponentDiscovery()`, registered alongside `useRootLifecycle()` inside `useInsightLifecycle()`.

Current discovery flow:

```text
InsightProvider
        │
        ▼
useInsightLifecycle()
        │
        ▼
useComponentDiscovery()
        │
        ▼
createComponentDiscoveryPlugin()
        │
        ▼
Runtime.registerPlugin()
        │
        ▼
Plugin.setup()
        │
        ▼
connectHookAdapter()
        │
        ▼
__REACT_DEVTOOLS_GLOBAL_HOOK__

  onCommitFiberRoot
        │
        ▼
  getFiberTraversalEntry()
        │
        ▼
  traverse()
        │
        ▼
  mapDiscoveredComponent()
        │
        ▼
  ComponentRegistry.sync()

  onCommitFiberUnmount
        │
        ▼
  asFiberNode() + getFiberId()
        │
        ▼
  ComponentRegistry.markUnmounted()

Unmount (Provider)
        │
        ▼
Runtime.unregisterPlugin()
        │
        ▼
Plugin.destroy()
        │
        ▼
disconnect() — restores previous hook callbacks
```

The full per-layer contract (responsibility, input, output, forbidden knowledge) for Hook Adapter, Fiber Adapter, Traversal, Mapper and Component Registry is defined in `REACT_RUNTIME_ARCHITECTURE.md`, Section 6.

Architectural boundary: no type whose name or shape depends on React Fiber crosses the Mapper. Only `ComponentNode` (and its structural subset, `ComponentSyncInput`) is allowed to travel from the Mapper down into `ComponentRegistry` and, eventually, Plugins.

Unmount handling marks the component record as unmounted (`status: "unmounted"`, `unmountedAt: <timestamp>`) rather than removing it from the registry, preserving its history for future consumers such as Timeline or Inspector. See `DECISIONS.md`, 2026-07-19.

Known, deliberately deferred limitations (see `DECISIONS.md`, 2026-07-18):

- Renderer identity (`rendererId`) is not tracked — single renderer (`react-dom`) assumed.
- `onPostCommitFiberRoot` is not wired.
- Discovery assumes a single React application per page (no container-based root correlation yet); every discovered component is attributed to the first root in `RootRegistry`.

---

# Package Responsibilities

## @react-insight/core

The Core package is framework-agnostic.

Responsibilities:

- Runtime
- Plugin lifecycle
- Plugin registration
- Plugin unregistration
- Event system
- Subscription management
- Built-in plugins
- Public Runtime API

The Core package must never depend on React.

---

## @react-insight/react

The React package provides the official React integration.

Responsibilities:

- `createInsight()`
- `InsightProvider`
- `useInsight()`
- React Context
- React lifecycle integration
- Internal root lifecycle infrastructure
- Internal lifecycle plugins
- RootRegistry
- ComponentRegistry
- Component Discovery pipeline (Hook Adapter, Fiber Adapter, Traversal, Mapper)
- Internal Component Discovery plugin
- Future React-specific features

The React package consumes the Runtime provided by `@react-insight/core`.

It must never reimplement Runtime behavior.

---

## Future Packages

The architecture supports additional packages without requiring changes to the Core API.

Examples:

- `@react-insight/devtools`
- `@react-insight/inspector`
- `@react-insight/timeline`
- `@react-insight/plugins`

Each package should have a single, well-defined responsibility.

---

# Internal Architecture

The React package separates its public API from internal implementation details.

Internal modules are not exported from the package entry point.

Current internal implementation includes:

- Internal Runtime symbol
- Internal Runtime holder types
- Internal Runtime access helpers
- Internal Root model
- Internal RootRegistry
- Internal Component model
- Internal ComponentRegistry
- Internal React lifecycle hooks
- Internal Root Lifecycle Plugin
- Internal Component Discovery pipeline (Hook Adapter, Fiber Adapter, Traversal, Mapper)
- Internal Component Discovery Plugin
- Internal `useComponentDiscovery` hook
- Private React Context

This separation allows internal refactoring without introducing breaking API changes.

---

# Folder Structure

Current structure:

```text
packages/react
│
├── src
│   ├── createInsight.ts
│   ├── createInsight.test.ts
│   ├── InsightProvider.tsx
│   ├── InsightProvider.test.tsx
│   ├── types.ts
│   ├── index.ts
│   │
│   ├── context/
│   │   ├── InsightContext.ts
│   │   └── index.ts
│   │
│   ├── hooks/
│   │   ├── useInsight.ts
│   │   └── index.ts
│   │
│   └── internal/
│       ├── component.ts
│       ├── componentRegistry.ts
│       ├── componentRegistry.test.ts
│       ├── getInternalInsight.ts
│       ├── index.ts
│       ├── root.ts
│       ├── rootRegistry.ts
│       ├── runtime.ts
│       ├── useComponentDiscovery.ts
│       ├── useInsightLifecycle.ts
│       ├── useRootLifecycle.ts
│       │
│       ├── discovery/
│       │   ├── discoveredComponent.ts
│       │   ├── fiberAdapter.ts
│       │   ├── fiberAdapter.test.ts
│       │   ├── hookAdapter.ts
│       │   ├── hookAdapter.test.ts
│       │   ├── componentMapper.ts
│       │   ├── componentMapper.test.ts
│       │   ├── traversal.ts
│       │   └── traversal.test.ts
│       │
│       └── plugins/
│           ├── componentDiscoveryPlugin.ts
│           ├── componentDiscoveryPlugin.test.ts
│           ├── rootLifecyclePlugin.ts
│           └── rootLifecyclePlugin.test.ts
│
├── tsup.config.ts
├── tsconfig.json
└── vitest.config.ts
```

---

# Module Responsibilities

## createInsight.ts

Creates the public `Insight` instance.

Responsibilities:

- Create the internal Runtime.
- Create the internal RootRegistry.
- Create the internal ComponentRegistry.
- Hide Runtime implementation details.
- Delegate Runtime operations.
- Return the public API.

---

## InsightProvider.tsx

Provides the `Insight` instance through React Context.

Responsibilities:

- React Context Provider
- Context wiring
- Internal React lifecycle integration

Must not implement Runtime logic.

---

## hooks/

Contains the public React hooks.

Current hooks:

- `useInsight()`

Future hooks may include:

- `useRuntimeEvents()`
- `usePlugin()`
- `useTimeline()`

---

## componentRegistry.ts

Stores the internal representation of mounted React components. It is the sole owner of component lifecycle state.

Responsibilities:

- Register components (`register()`, throws on duplicate id — used where a duplicate is a genuine error).
- Synchronize discovered components without throwing on an existing id (`sync()` — decides mount vs. update by comparing against existing state).
- Unregister components (`unregister()` — hard removal), or mark them unmounted while preserving their history (`markUnmounted()` — sets `status: "unmounted"` and `unmountedAt`, keeps the record).
- Lookup components.
- Maintain framework-agnostic component state (`status`, `mountedAt`, `unmountedAt`).

Has no knowledge of React Fiber or how components were discovered.

---

## internal/discovery/

Contains the Component Discovery pipeline. Each module maps to one layer of the contract defined in `REACT_RUNTIME_ARCHITECTURE.md`, Section 6.

### hookAdapter.ts

Safely connects to `__REACT_DEVTOOLS_GLOBAL_HOOK__`. Installs it if absent, chains any existing `onCommitFiberRoot` / `onCommitFiberUnmount` instead of overwriting them, and isolates callback errors so they never reach React's renderer.

### fiberAdapter.ts

Extracts the traversal entry point from a raw `FiberRoot` (`getFiberTraversalEntry`), and validates/narrows a raw unmount value into a Fiber-shaped object (`asFiberNode`). The only module allowed to know the shape of a raw Fiber/FiberRoot.

### traversal.ts

Walks a Fiber tree from the entry point, filtering to function/class component fibers only, and assigns stable per-Fiber ids via a `WeakMap` (`getFiberId`, exported so unmount handling can resolve the same id). Produces `DiscoveredComponent[]`.

### componentMapper.ts

Pure, stateless translation from `DiscoveredComponent` to `ComponentSyncInput` (structural fields only: `id`, `rootId`, `displayName`, `parentId`). Never decides lifecycle state.

### discoveredComponent.ts

Defines the `DiscoveredComponent` type — the internal contract between Traversal and the Mapper. Never crosses the Mapper boundary.

---

## internal/plugins/componentDiscoveryPlugin.ts

Wires the discovery pipeline into the Runtime plugin lifecycle.

Responsibilities:

- Connect the Hook Adapter on `setup()`.
- On commit: resolve the active root, run Traversal + Mapper, call `ComponentRegistry.sync()` for each discovered component.
- On unmount: resolve the Fiber id and call `ComponentRegistry.markUnmounted()`, preserving the component record instead of removing it.
- Disconnect the Hook Adapter on `destroy()`.

Follows the same `definePlugin()` pattern as `rootLifecyclePlugin`.

---

## useComponentDiscovery.ts

Registers the Component Discovery plugin for the lifetime of the component that calls it.

Responsibilities:

- Create the plugin via `createComponentDiscoveryPlugin()`.
- Register it with the Runtime on mount.
- Unregister it on cleanup.

Contains no discovery logic itself — delegates entirely to the plugin.

---

## useInsightLifecycle.ts

Acts as the internal orchestration point for React integration.

Responsibilities:

- Coordinate internal lifecycle hooks (`useRootLifecycle`, `useComponentDiscovery`).
- Keep the public API isolated from React internals.
- Contains no feature-specific logic itself.

---

## useRootLifecycle.ts

Coordinates the React root lifecycle with the internal Root Lifecycle Plugin.

Responsibilities:

- Create the Root Lifecycle Plugin
- Register the plugin on mount
- Unregister the plugin on cleanup
- Synchronize RootRegistry with React lifecycle

---

## context/

Contains internal React Context definitions.

The Context is considered an implementation detail.

Applications should always consume hooks instead of the Context directly.

---

## internal/plugins/

Contains internal Runtime integration plugins.

Current plugins:

- Root Lifecycle Plugin
- Component Discovery Plugin

These plugins are not part of the public API and may evolve independently from the public React interface.

---

## internal/

Contains private implementation details.

Current contents:

- Runtime symbol
- Internal Runtime holder types
- Internal Runtime helpers
- Internal Root model
- RootRegistry
- Internal Component model
- ComponentRegistry
- Component Discovery pipeline (`discovery/`)
- React lifecycle hooks
- Internal lifecycle plugins (`plugins/`)

Nothing inside this directory is part of the public API.

---

## index.ts

Exports only the supported public API.

Current exports:

- `createInsight`
- `InsightProvider`
- `useInsight`
- `Insight`

Internal modules must never be re-exported.

---

# Testing Strategy

The React package follows the same quality standards as the Core package.

Current test coverage includes:

- `createInsight()`
- `InsightProvider`
- `useInsight()`
- `RootRegistry`
- `ComponentRegistry` (including `sync()` mount/update behavior and `markUnmounted()`)
- Root Lifecycle Plugin
- Component Discovery Plugin (commit/sync, no-active-root no-op, unmount via `markUnmounted()`, disconnect on destroy)
- Provider lifecycle integration
- Mount / Unmount synchronization
- Public API encapsulation
- Fiber Adapter (`getFiberTraversalEntry`)
- Traversal (filtering, parent resolution, stable ids)
- Component Mapper (structural translation)
- Hook Adapter (installation, chaining, error isolation, disconnect)

Every public API should have automated tests before new features are introduced.

---

# Design Rules

- Core remains framework-agnostic.
- React owns React integration only.
- Runtime remains internal.
- Runtime exclusively owns plugin lifecycle.
- Consumers interact through `Insight`.
- React Context is private.
- Hooks are the public access layer.
- React lifecycle integration is isolated behind internal plugins.
- Component Discovery integration is isolated behind an internal plugin, following the same pattern as React lifecycle.
- No type whose name or shape depends on React Fiber crosses the Mapper boundary.
- `ComponentRegistry` is the sole owner of component lifecycle state; upstream discovery layers (Traversal, Mapper) remain stateless.
- Unmount preserves component history (`markUnmounted()`) rather than discarding it; `unregister()` remains available for hard removal where that is genuinely intended.
- Public API remains minimal and stable.
- Internal implementation may evolve without breaking consumers.
