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

The React package integrates with the Core Runtime through an internal lifecycle plugin.

The lifecycle integration is intentionally isolated behind `useInsightLifecycle()`.

Current lifecycle flow:

```text
InsightProvider
        │
        ▼
useInsightLifecycle()
        │
        ▼
createReactLifecyclePlugin()
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

This design ensures that the Runtime remains the sole owner of the plugin lifecycle while React is responsible only for integrating Runtime with the React component lifecycle.

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
- Internal React lifecycle infrastructure
- Internal lifecycle plugins
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
- Internal React lifecycle hook
- Internal React Lifecycle Plugin
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
│       ├── index.ts
│       ├── getInternalInsight.ts
│       ├── root.ts
│       ├── rootRegistry.ts
│       ├── runtime.ts
│       ├── useInsightLifecycle.ts
│       │
│       └── plugins/
│           ├── reactLifecyclePlugin.ts
│           └── reactLifecyclePlugin.test.ts
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

## useInsightLifecycle.ts

Acts as the single integration point between React and the Runtime.

Responsibilities:

- Create the internal lifecycle plugin
- Register the plugin when the Provider mounts
- Unregister the plugin during cleanup
- Keep React lifecycle synchronization isolated from the public API

This hook is considered an internal implementation detail.

---

## context/

Contains internal React Context definitions.

The Context is considered an implementation detail.

Applications should always consume hooks instead of the Context directly.

---

## internal/plugins/

Contains internal Runtime integration plugins.

Current plugins:

- React Lifecycle Plugin

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
- React lifecycle hook
- Internal lifecycle plugins

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
- React Lifecycle Plugin
- Provider lifecycle integration
- Mount / Unmount synchronization
- Public API encapsulation

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
- Public API remains minimal and stable.
- Internal implementation may evolve without breaking consumers.
