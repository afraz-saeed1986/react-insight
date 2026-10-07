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
- Structural hook tracking with value previews, and context tracking
- On-demand exact hook names (`useState` vs `useReducer`, one level of custom hook name)
- A reactive public API: `getComponents()`, `getComponent(id)`, `onChange()`
- A drop-in `<DevtoolsPanel />`: tree, render flash, filters, hook and context details
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

Once published:

```bash
pnpm add @react-insight/react @react-insight/devtools react react-dom
```

`installReactDevtoolsHook()` must run **before `react-dom` is evaluated**, so call it from its own module and import that module first (imports are evaluated before the importing file's body, so calling it in the same file is too late):

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
import { DevtoolsPanel } from "@react-insight/devtools";

import { App } from "./App";

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

See each package's README for its full API and caveats.

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
- Exact hook names need a development React build; custom hook names degrade when minified.
- Class components are discovered, but their hook names cannot be resolved.

## License

[MIT](LICENSE)