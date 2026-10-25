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

## Usage

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