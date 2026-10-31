# @react-insight/inspector

On-demand component inspection built on the public API of
[`@react-insight/react`](https://www.npmjs.com/package/@react-insight/react).

> **Pre-release (0.x).** The API may still change between minor versions.

## Install

```bash
pnpm add @react-insight/inspector @react-insight/react react
```

Requires Node.js >= 22. ESM only.

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

`inspectComponent()` needs an `insight` that tracks your app. Set it up as shown below (same as the panel setup; see the [`@react-insight/react` README](https://www.npmjs.com/package/@react-insight/react) for details).

React reads the DevTools hook once, when `react-dom` loads. The hook must exist before that, or nothing is tracked. Importing `@react-insight/react/install` installs it.

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

## Usage

```ts
import { inspectComponent } from "@react-insight/inspector";

// `insight` comes from createInsight() in @react-insight/react
const inspection = inspectComponent(insight, componentId);

if (inspection) {
  inspection.snapshot;  // always-available structural ComponentSnapshot
  inspection.hookNames; // resolved hook names, or undefined if unavailable
}
```

`inspectComponent(insight, id)` combines `insight.getComponent(id)` with
`insight.inspectHookNames(id)`. It returns `undefined` only when the
component is not tracked; a tracked component whose hook names cannot be
resolved still returns a result, with `hookNames: undefined`.

## Things to know

- Hook name resolution **re-executes the component's render body**. Call `inspectComponent()` only in response to an explicit action, never on every render or commit.
- `hookNames` is `undefined` for class components. It resolves in production React builds too; custom hook names (`customHookName`) degrade in minified builds.
- This package has no knowledge of React internals; it only calls the public `Insight` API.

## License

MIT