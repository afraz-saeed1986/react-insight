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

React reads the DevTools global hook **once, when `react-dom` is first loaded**. `installReactDevtoolsHook()` must therefore run before `react-dom` is evaluated.

Do not call it in the same file that imports `react-dom`: ES module `import`s are evaluated before the body of the importing file, so the call would come too late (it can appear to work in a dev server and fail in a production bundle). Put it in its own module and import that module first:

```ts
// src/installHook.ts
import { installReactDevtoolsHook } from "@react-insight/react";

installReactDevtoolsHook();
```

```tsx
// src/main.tsx
import "./installHook"; // must stay the first import

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

If a production build shows no components, check `window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.size` in the browser console: `0` means React loaded before the hook was installed. This check only applies to production builds: a dev server with Fast Refresh (for example `@vitejs/plugin-react`) installs its own hook first, so `renderers.size` is always `0` there and tells you nothing.

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