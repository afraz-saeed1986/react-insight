# React Architecture

## Vision

The `@react-insight/react` package provides the official React integration for React Insight.

It acts as the bridge between React applications and the Runtime implemented in `@react-insight/core`.

The package must remain lightweight and focus exclusively on React-specific functionality.

---

## Goals

- Provide an ergonomic React API.
- Keep the Core package completely framework-agnostic.
- Minimize runtime overhead.
- Preserve strong TypeScript support.
- Integrate naturally with modern React applications.
- Support React 19 and newer.
- Remain compatible with Server Components where applicable.

---

## Non-Goals

The React package is **not** responsible for:

- Runtime implementation
- Plugin lifecycle management
- Event system implementation
- DevTools UI
- Inspector implementation

Those responsibilities belong to other packages.

---

# Public API

The React package should expose a minimal and ergonomic public API.

The initial API is proposed as:

```ts
import { createInsight, InsightProvider } from "@react-insight/react";

const insight = createInsight();

insight.use(loggerPlugin());

root.render(
  <InsightProvider insight={insight}>
    <App />
  </InsightProvider>
);
```

## Design Principles

The public API should:

- Be easy to learn.
- Minimize required configuration.
- Avoid exposing Core internals.
- Be extensible without breaking existing applications.
- Support future built-in plugins and developer tools.

## API Responsibilities

### createInsight()

Responsible for:

- Creating the Runtime instance.
- Registering plugins.
- Providing the application-level Insight instance.

### InsightProvider

Responsible for:

- Making the Insight instance available to React.
- Initializing React integration.
- Providing future React-specific context.

The Provider must not implement Runtime logic.

That responsibility belongs to `@react-insight/core`.

```

```

---

# Package Responsibilities

## @react-insight/core

The Core package is framework-agnostic.

Responsibilities:

- Runtime
- Plugin lifecycle
- Plugin registration
- Event system
- Subscription management
- Built-in plugins
- Public Runtime API

The Core package must never depend on React.

---

## @react-insight/react

The React package provides the official integration with React.

Responsibilities:

- `createInsight()`
- `InsightProvider`
- React Context
- React Hooks
- Root registration
- React lifecycle integration

The React package must not reimplement Runtime behavior.

It consumes the Runtime exposed by `@react-insight/core`.

---

## Future Packages

The architecture is designed to support additional packages without changing the Core API.

Examples:

- `@react-insight/devtools`
- `@react-insight/inspector`
- `@react-insight/timeline`
- `@react-insight/plugins`

Each package should have a single, well-defined responsibility.

---

# Folder Structure

The initial structure of `@react-insight/react` is proposed as:

```text
packages/react
│
├── src
│   ├── createInsight.ts
│   ├── InsightProvider.tsx
│   ├── context/
│   │   ├── InsightContext.ts
│   │   └── index.ts
│   │
│   ├── hooks/
│   │   ├── useInsight.ts
│   │   └── index.ts
│   │
│   └── index.ts
```

## Responsibilities

### createInsight.ts

Creates the public Insight instance.

Responsibilities:

- Create the Runtime.
- Register plugins.
- Return the public Insight API.

---

### InsightProvider.tsx

Provides the Insight instance to React.

Responsibilities:

- React Context Provider
- Runtime availability
- Future React initialization

Must not contain Runtime implementation.

---

### context/

Contains internal React Context definitions.

The Context should remain private to the package.

Consumers should use hooks instead.

---

### hooks/

Contains public React hooks.

Initially:

- `useInsight()`

Additional hooks may be introduced in the future without changing the Provider API.

---

### index.ts

Exports the public API only.

Internal modules must never be re-exported unintentionally.

```

```
