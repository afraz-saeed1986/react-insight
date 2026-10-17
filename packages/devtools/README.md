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

## Usage

Set up `@react-insight/react` first (see its README: `installReactDevtoolsHook()`
before `react-dom`, then `createInsight()` and `<InsightProvider>`). Then render
the panel anywhere **inside** `InsightProvider`:

```tsx
import { DevtoolsPanel } from "@react-insight/devtools";

export function App() {
  return (
    <>
      <YourApp />
      <DevtoolsPanel />
    </>
  );
}
```

`DevtoolsPanel` takes no props. It renders a panel fixed to the bottom of the
viewport, so it can be placed anywhere inside `InsightProvider`. Render it only
in development.

### Next.js

The DevTools hook must be installed **before React loads**. In a production
build, installing it from a client component is too late and the tree stays
empty. Install it in `src/instrumentation-client.ts` instead:

```ts
import { installReactDevtoolsHook } from "@react-insight/react";

installReactDevtoolsHook();
```

Verified with Next.js 16 (App Router, React Compiler enabled), in both
`next dev` and a production build (`next build` + `next start`).

## Features

- Component tree built from `parentId`, including unmounted components (toggle). Nodes can be collapsed and expanded, one by one or all at once.
- Render count per component, with a brief flash on each render.
- Filter by name and by minimum render count.
- **Focus** on the selected component's subtree, with a breadcrumb of its ancestors.
- **Hide minified** names (1-2 character names) and **Hide names** by pattern (`Foo, Bar*`; `*` is a wildcard, matching is case-sensitive).
- **Hide Next.js** internals (a preset list of framework component names).
- Resizable: drag the top edge to change the height and the splitter to change the width of the details pane.
- Per-row hook and context summary.
- Detail pane for the selected component: hooks (with exact names after an on-demand inspection), contexts and timestamps.

## Things to know

- Selecting a component, or pressing **Re-inspect**, runs an on-demand inspection that **re-executes that component's render body**. Nothing is inspected automatically.
- The panel excludes itself and everything it renders from what it displays (`displayName: "ReactInsightDevtools"`), so it never observes its own renders.
- Sibling order follows the order components were first discovered, not always React's child order (visible after a re-mount).
- Hook names are unavailable for class components. They resolve in production React builds too, but custom hook names degrade in minified builds.
- In a minified production build, **Hide minified** also hides your own components, because their names are minified too. Set `Component.displayName` to keep a component visible and readable.
- **Hide Next.js** uses a fixed list of Next.js internal component names. It deliberately leaves generic names (`Root`, `Router`, `Head`, `ErrorBoundary`) visible, since your own components may use them.
- The panel is fixed to the bottom of the viewport; its size is not remembered between page loads.

## License

MIT