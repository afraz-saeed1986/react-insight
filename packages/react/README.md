# @react-insight/react

React integration for [React Insight](https://github.com/afraz-saeed1986/react-insight):
discovers the components in a running React tree and exposes a read-only,
typed API over them. Built on `@react-insight/core`.

> **Pre-release (0.x).** The API may still change between minor versions.
> Intended for development builds.

## Install

```bash
pnpm add @react-insight/react react react-dom
```

Requires React >= 19 and Node.js >= 22. ESM only.

## Setup

`installReactDevtoolsHook()` must run **before `react-dom` is imported**,
because React reads the DevTools global hook once, at module load. Put it
first in your entry file:

```tsx
import { installReactDevtoolsHook } from "@react-insight/react";
installReactDevtoolsHook();

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createInsight, InsightProvider } from "@react-insight/react";

import { App } from "./App";

const insight = createInsight();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <InsightProvider insight={insight}>
      <App />
    </InsightProvider>
  </StrictMode>,
);
```

`createInsight()` must be called before the first render so the first commit is observed.

## API

- `createInsight()`: creates an `Insight` instance.
- `<InsightProvider insight={...}>` and `useInsight()`: provide and read the instance.
- `installReactDevtoolsHook()`: see Setup.

The `Insight` instance:

| Method | Description |
|---|---|
| `getComponents()` | Read-only `ComponentSnapshot[]` of every tracked component, mounted and unmounted. |
| `getComponent(id)` | One snapshot, or `undefined`. |
| `onChange(listener)` | Called when tracked state changes (no payload; re-read with `getComponents()`). Returns an unsubscribe function. |
| `inspectHookNames(id)` | **On demand only.** Resolves exact hook names (e.g. `useState` vs `useReducer`) and one level of custom hook name. |
| `use(plugin)` / `destroy()` | Register a `@react-insight/core` plugin / tear down. |

A `ComponentSnapshot` has `id`, `displayName`, `parentId`, `status`, `renderCount`, `mountedAt`, `lastRenderedAt`, `unmountedAt`, a structural `hooks` summary (kind and a bounded value preview) and `contexts`.

## Things to know

- **`inspectHookNames()` re-executes the component's render body** with an instrumented dispatcher. Call it only in response to an explicit user action, never automatically. It supports function components, `memo`, `forwardRef` and `memo(forwardRef(...))`; not class components, and not production React builds. Custom hook names degrade in minified builds.
- A re-mounted component is a new instance with a new `id`; the old record stays as `unmounted`.
- `useContext` does not take a hook slot, so it appears under `contexts`, never under `hooks`.
- One `react-dom` renderer and one React application per page are assumed.

## License

MIT