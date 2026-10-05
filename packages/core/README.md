# @react-insight/core

Framework-agnostic, TypeScript-first plugin runtime that powers
[React Insight](https://github.com/afraz-saeed1986/react-insight).

> **Pre-release (0.x).** The API may still change between minor versions.

## Install

```bash
pnpm add @react-insight/core
```

Requires Node.js >= 22. ESM only.

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