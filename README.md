# React Insight

> A TypeScript-first toolkit for debugging, inspecting and understanding React applications at runtime.

[![CI](https://github.com/afraz-saeed1986/react-insight/actions/workflows/ci.yml/badge.svg)](https://github.com/afraz-saeed1986/react-insight/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Node.js](https://img.shields.io/badge/node-%3E%3D22-339933)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6)

> ⚠️ **Pre-release.** React Insight is under active development and is not
> published to npm yet. APIs may change before `1.0`. It is intended for
> development builds.

---

## What it does

React Insight discovers the components in a running React tree and gives you
a typed, read-only API over them: which components exist, how often each one
rendered, their hooks and the contexts they read. It ships with a ready-made
DevTools panel built on that API.

- Component discovery (mount, update, unmount) without modifying your components
- Accurate per-component render counts
- Render reasons: why a component last re-rendered (first render, changed props, state or context, or a parent re-render)
- Structural hook tracking with value previews, and context tracking
- On-demand exact hook names (`useState` vs `useReducer`, one level of custom hook name)
- A reactive public API: `getComponents()`, `getComponent(id)`, `onChange()`
- A drop-in `<DevtoolsPanel />`: resizable panel with a collapsible tree, render flash, filters (name, minimum renders, focus on a subtree, hide minified or named components, hide Next.js internals), a "Why it rendered" section, hook and context details
- A plugin-based, framework-agnostic runtime underneath (`@react-insight/core`)

## Packages

| Package | Purpose |
|---|---|
| [`@react-insight/core`](packages/core) | Framework-agnostic plugin runtime |
| [`@react-insight/react`](packages/react) | React integration: component discovery and the `Insight` API |
| [`@react-insight/inspector`](packages/inspector) | `inspectComponent()` over the public `Insight` API |
| [`@react-insight/devtools`](packages/devtools) | `DevtoolsPanel`, a drop-in DevTools UI |
| [`playground`](packages/playground) | Integration app (private) |
| [`eslint-config`](packages/eslint-config) | Shared ESLint flat config (private) |

Dependency direction: `devtools` → `inspector` → `react` → `core`.

## Quick start

Install:

```bash
pnpm add @react-insight/react @react-insight/devtools react react-dom
```

React reads the DevTools hook once, when `react-dom` loads. The hook must exist before that, or the tree stays empty. Importing `@react-insight/react/install` installs it.

### React (Vite)

Edit `src/main.tsx`:

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

To install the hook yourself instead of using the `install` entry, see the [`@react-insight/react` README](packages/react). See each package's README for its full API and caveats.

## Try it locally

```bash
pnpm install
pnpm build
pnpm dev
```

`pnpm dev` starts the Playground, a real React app that consumes the packages
exactly like an external project would.

## Development

Requirements: Node.js >= 22 and pnpm.

Every change must pass:

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test
```

These run in GitHub Actions on every push and pull request (Node 22 and 24).
Changes that touch component discovery, render/hook/context tracking or
on-demand hook resolution also need a manual check in the Playground, because
that is the only place that exercises the real `react-dom` DevTools hook.

Engineering documentation (architecture, decisions, roadmap) lives in
[`.ai/`](.ai).

## Known limitations

- Tree sibling order follows discovery order, not always React's child order (visible after a re-mount).
- One `react-dom` renderer and one React application per page are assumed.
- Hook names resolve in production React builds too, but custom hook names degrade when minified. Component names can also be minified or lost in production bundles; set `Component.displayName` to keep them readable.
- Multi-slot React 19 hooks (`useTransition`, `useActionState`, `useSyncExternalStore`, `useOptimistic`) are resolved with slot layouts that mirror React's internal implementation, so they may need updating when React changes.
- Class components are discovered, but their hook names cannot be resolved.
- Render reasons are best-effort: a state update with a new object of equal contents, and a `setState` on a class component, are reported as "No cause detected" (or as a parent re-render).

## License

[MIT](LICENSE)