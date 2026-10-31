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

## Which packages do I need?

| I want to... | Install |
| --- | --- |
| Read component data from my own code (`getComponents()`, `onChange()`) | `@react-insight/react` |
| See a ready-made panel in my app (component tree, render counts, "Why it rendered") | `@react-insight/react` and `@react-insight/devtools` |
| Inspect one component on demand (hook names) | `@react-insight/react` and `@react-insight/inspector` |
| Write my own plugin, or use the runtime without React | `@react-insight/core` |

Using React? Start with `@react-insight/react`: it already includes `@react-insight/core`. For the panel:

```bash
pnpm add @react-insight/react @react-insight/devtools react react-dom
```

## Setup

React reads the DevTools hook once, when `react-dom` loads. The hook must exist before that, or the tree stays empty. Importing `@react-insight/react/install` installs it.

### React (Vite)

Install the packages first (see **Install** above), then edit `src/main.tsx`:

```tsx
import "@react-insight/react/install"; // must stay the first import
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createInsight, InsightProvider } from "@react-insight/react";
import { DevtoolsPanel } from "@react-insight/devtools";
import "./index.css";
import App from "./App.tsx";

const insight = createInsight();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <InsightProvider insight={insight}>
      <App />
      <DevtoolsPanel />
    </InsightProvider>
  </StrictMode>,
);
```

Run `pnpm dev` and open the panel.

### Next.js (App Router)

You do not control module order in Next.js, so install the hook in `src/instrumentation-client.ts`. Next.js runs this file before hydration.

**1.** Create `src/instrumentation-client.ts`:

```ts
import "@react-insight/react/install";
```

**2.** Create `src/InsightRoot.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import { createInsight, InsightProvider } from "@react-insight/react";
import { DevtoolsPanel } from "@react-insight/devtools";

const insight = createInsight();

export function InsightRoot({ children }: { children: ReactNode }) {
  return (
    <InsightProvider insight={insight}>
      {children}
      <DevtoolsPanel />
    </InsightProvider>
  );
}
```

**3.** In `src/app/layout.tsx`, wrap `children` inside `<body>`:

```tsx
import { InsightRoot } from "./InsightRoot";

// ...
<body>
  <InsightRoot>{children}</InsightRoot>
</body>
```

Run `pnpm dev` and open the panel. Verified with Next.js 16 (App Router, React Compiler enabled), in `next dev` and in a production build.

Component names are minified in production builds. Use the development server (`vite` or `next dev`) to read them.

### Installing the hook yourself

If you prefer not to use the `install` entry, call the function in its own module and import that module first:

```ts
// src/installHook.ts
import { installReactDevtoolsHook } from "@react-insight/react";

installReactDevtoolsHook();
```

```tsx
// src/main.tsx
import "./installHook"; // must stay the first import
```

Do not call it in the same file after other imports: imports are hoisted, so `react-dom` would load first. `installReactDevtoolsHook()` is idempotent, so using it together with the `install` entry is safe.

## API

- `createInsight()`: creates an `Insight` instance.
- `<InsightProvider insight={...}>` and `useInsight()`: provide and read the instance.
- `@react-insight/react/install`: importing it installs the DevTools hook; see Setup.
- `installReactDevtoolsHook()`: installs the hook when you call it yourself; see Setup.

The `Insight` instance:

| Method | Description |
|---|---|
| `getComponents()` | Read-only `ComponentSnapshot[]` of every tracked component, mounted and unmounted. |
| `getComponent(id)` | One snapshot, or `undefined`. |
| `onChange(listener)` | Called when tracked state changes (no payload; re-read with `getComponents()`). Returns an unsubscribe function. |
| `inspectHookNames(id)` | **On demand only.** Resolves exact hook names (e.g. `useState` vs `useReducer`) and one level of custom hook name. |
| `use(plugin)` / `destroy()` | Register a `@react-insight/core` plugin / tear down. |

A `ComponentSnapshot` has `id`, `displayName`, `parentId`, `status`, `renderCount`, `mountedAt`, `lastRenderedAt`, `unmountedAt`, a structural `hooks` summary (kind and a bounded value preview), `contexts` and `lastRenderReasons`.

## Why a component rendered

`ComponentSnapshot.lastRenderReasons` is a `ReadonlyArray<RenderReason>` that explains the component's last render. It is updated on every render and kept unchanged when a sync is not a render. One or more of these kinds can be present:

- `mount`: the first render of this instance.
- `props`: the names of the props that changed (shallow comparison with `Object.is`).
- `state`: the state hooks whose value changed.
- `context`: the contexts whose value changed (by the context's `displayName`, or `Context` when it has none).
- `parent`: the parent re-rendered and no prop, state or context change was detected. The render may be avoidable.
- `unknown`: no cause was detected.

See the `RenderReason` type for the exact shape. Only names and hook indices are stored, never values.

Limits:

- State changes are detected by comparing bounded value previews. A `setState` with a new object of equal contents re-renders the component but is reported as `unknown`.
- Class components have no hooks, so a `setState` on a class component is reported as `parent` or `unknown`.
- `children` often appears among the changed props, because JSX children are new elements on every render.

## Things to know

- **`inspectHookNames()` re-executes the component's render body** with an instrumented dispatcher. Call it only in response to an explicit user action, never automatically. It supports function components, `memo`, `forwardRef` and `memo(forwardRef(...))`; not class components. It also works in production React builds, but custom hook names degrade in minified builds.
- A re-mounted component is a new instance with a new `id`; the old record stays as `unmounted`.
- React Compiler output is supported: hook names resolve for compiled components (verified in a Next.js 16 app).
- Multi-slot React 19 hooks (`useTransition`, `useActionState`, `useSyncExternalStore`, `useOptimistic`) are resolved with slot layouts that mirror React's internal implementation, so they may need updating when React changes.
- Component names can be minified or lost in production bundles, and plain function components may then show as "Anonymous". Set `Component.displayName` to keep them readable. For `memo(fn)`, a `displayName` set on the wrapper is used.
- `useContext` does not take a hook slot, so it appears under `contexts`, never under `hooks`.
- One `react-dom` renderer and one React application per page are assumed.

## License

MIT