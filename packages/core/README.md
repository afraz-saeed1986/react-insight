# @react-insight/core

Framework-agnostic, TypeScript-first plugin runtime that powers
[React Insight](https://github.com/afraz-saeed1986/react-insight).

> **Pre-release (0.x).** The API may still change between minor versions.

## Install

```bash
pnpm add @react-insight/core
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

## Setup (React)

React reads the DevTools hook once, when `react-dom` loads. The hook must exist before that, or the tree stays empty. Importing `@react-insight/react/install` installs it.

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

To install the hook yourself instead of using the `install` entry, see the [`@react-insight/react` README](https://www.npmjs.com/package/@react-insight/react).

## Usage without React

```ts
import { Runtime, loggerPlugin } from "@react-insight/core";

const runtime = new Runtime();

await runtime.registerPlugin(loggerPlugin());

// ...

await runtime.destroy();
```

## What it provides

- `Runtime`: owns the plugin lifecycle (`registerPlugin()`, `unregisterPlugin()`, `destroy()`, `on()`, `emit()`).
- `definePlugin()` and the `InsightPlugin` / `PluginContext` types: plugins talk to the runtime only through `PluginContext`.
- `loggerPlugin()`: a built-in plugin, created with a factory so every instance is independent.

## Behavior to know about

- **Atomic registration:** if a plugin's `setup()` throws, the plugin is removed, the original error is re-thrown and no `plugin:registered` event is emitted.
- **Unique names:** registering a plugin whose name is already taken throws.
- **Destruction:** `destroy()` destroys plugins in reverse registration order; afterwards the runtime cannot be used and its methods throw.

Most applications use [`@react-insight/react`](https://www.npmjs.com/package/@react-insight/react) instead of this package directly.

## License

MIT