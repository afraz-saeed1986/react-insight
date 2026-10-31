# @react-insight/devtools

A drop-in DevTools panel for [React Insight](https://github.com/afraz-saeed1986/react-insight):
component tree, render counts with a flash on every render, filters, and
per-component hook and context details.

> **Pre-release (0.x).** The API may still change between minor versions.
> Intended for development builds.

## Install

```bash
pnpm add @react-insight/devtools @react-insight/react react react-dom
```

`react` and `@react-insight/react` are **peer dependencies**: the panel must
use the same copy as your app, otherwise it cannot see your `Insight`
instance. Requires React >= 19 and Node.js >= 22. ESM only.

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

The panel needs `@react-insight/react` set up first. React reads the DevTools hook once, when `react-dom` loads. The hook must exist before that, or the tree stays empty. Importing `@react-insight/react/install` installs it.

### React (Vite)

Install the packages first (see above), then edit `src/main.tsx`:

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

You do not control module order in Next.js, and installing the hook from a client component is too late. Install it in `src/instrumentation-client.ts`. Next.js runs this file before hydration.

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

Run `pnpm dev` and open the panel. Verified with Next.js 16 (App Router, React Compiler enabled), in `next dev` and in a production build (`next build` + `next start`).

Component names are minified in production builds. Use the development server (`vite` or `next dev`) to read them.

### Using `DevtoolsPanel`

`DevtoolsPanel` takes no props. It renders a panel fixed to the bottom of the viewport. Place it anywhere **inside** `InsightProvider`. Render it only in development.

## Features

- Component tree built from `parentId`, including unmounted components (toggle). Nodes can be collapsed and expanded, one by one or all at once.
- Render count per component, with a brief flash on each render.
- Filter by name and by minimum render count.
- **Focus** on the selected component's subtree, with a breadcrumb of its ancestors.
- **Hide minified** names (1-2 character names) and **Hide names** by pattern (`Foo, Bar*`; `*` is a wildcard, matching is case-sensitive).
- **Hide Next.js** internals (a preset list of framework component names).
- Resizable: drag the top edge to change the height and the splitter to change the width of the details pane. The sizes are remembered in `localStorage` between page loads.
- Keyboard navigation: the tree is an ARIA `tree` with a single tab stop. Arrow keys, Home and End move focus (without selecting); Right and Left expand, collapse or move to the first child or parent; Enter or Space selects.
- Per-row hook and context summary.
- Detail pane for the selected component: **Why it rendered** (the cause of its last render), hooks (with exact names after an on-demand inspection), contexts and timestamps.

## Things to know

- Selecting a component, or pressing **Re-inspect**, runs an on-demand inspection that **re-executes that component's render body**. Nothing is inspected automatically.
- **Why it rendered** shows the cause of the last render: first render, changed props (names only), changed state hooks, changed contexts, or "Parent re-rendered; no prop, state or context change detected (may be avoidable)". It uses data already collected and does not run an inspection. A state update with a new object of equal contents, and a `setState` on a class component, show "No cause detected" (or the parent message when the parent also re-rendered). `children` often appears among the changed props. See the `@react-insight/react` README for details.
- The panel excludes itself and everything it renders from what it displays (`displayName: "ReactInsightDevtools"`), so it never observes its own renders.
- Sibling order follows the order components were first discovered, not always React's child order (visible after a re-mount).
- Hook names are unavailable for class components. They resolve in production React builds too, but custom hook names degrade in minified builds.
- In a minified production build, **Hide minified** also hides your own components, because their names are minified too, and plain function components may show as "Anonymous". Set `Component.displayName` to keep a component visible and readable.
- **Hide Next.js** uses a fixed list of Next.js internal component names. It deliberately leaves generic names (`Root`, `Router`, `Head`, `ErrorBoundary`) visible, since your own components may use them.
- The panel is fixed to the bottom of the viewport and never grows taller than the viewport minus 80px. Its sizes are saved in `localStorage` (key `react-insight:panel-size`); if storage is blocked, the default sizes are used.

## License

MIT