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