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

`DevtoolsPanel` takes no props and renders inline (no portal), so place it
where you want it in your layout. Render it only in development.

## Features

- Component tree built from `parentId`, including unmounted components (toggle).
- Render count per component, with a brief flash on each render.
- Filter by name and by minimum render count.
- Per-row hook and context summary.
- Detail pane for the selected component: hooks (with exact names after an on-demand inspection), contexts and timestamps.

## Things to know

- Selecting a component, or pressing **Re-inspect**, runs an on-demand inspection that **re-executes that component's render body**. Nothing is inspected automatically.
- The panel excludes itself and everything it renders from what it displays (`displayName: "ReactInsightDevtools"`), so it never observes its own renders.
- Sibling order follows the order components were first discovered, not always React's child order (visible after a re-mount).
- Hook names are unavailable for class components and in production React builds.

## License

MIT