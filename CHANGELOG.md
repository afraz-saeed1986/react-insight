# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

Nothing has been published to npm yet. The first release will be `0.1.0` for
every package; its date is set when it is published.

## [Unreleased]

### Added

#### `@react-insight/core`

- Generic, framework-agnostic `Runtime` with plugin lifecycle management: `registerPlugin()`, `unregisterPlugin()`, `destroy()`, `on()`, `emit()`
- Atomic plugin registration (rollback if `setup()` throws), unique plugin names
- Deterministic destruction (reverse registration order) and state protection after `destroy()`
- `definePlugin()`, `InsightPlugin` and `PluginContext`
- Built-in `loggerPlugin()` factory

#### `@react-insight/react`

- `createInsight()`, `InsightProvider`, `useInsight()` and `installReactDevtoolsHook()`
- Component discovery: mount, update and unmount, for function, class, `memo` and `forwardRef` components
- Per-component render tracking: `renderCount`, `lastRenderedAt`
- Structural hook tracking with bounded value previews, and context tracking
- Public read API: `getComponents()`, `getComponent(id)`, `onChange()`
- `Insight.inspectHookNames(id)`: on-demand exact hook names and one level of custom hook name
- Hook name resolution covers React 19 hooks (`useTransition`, `useOptimistic`, `useActionState`, `useSyncExternalStore`, `use`) and React Compiler output (`useMemoCache`)

#### `@react-insight/inspector`

- `inspectComponent(insight, id)`: combines a component snapshot with on-demand hook names

#### `@react-insight/devtools`

- `DevtoolsPanel`: docked bottom panel with a floating toggle (closed by default), resizable height and tree/details split, component tree with expand/collapse, unmounted-component toggle, render flash, per-row hook and context summary, detail pane with on-demand inspection
- Tree filters: name, minimum renders, Focus on a subtree (with an ancestor breadcrumb), Hide minified names, Hide names by pattern, and a Hide Next.js preset

#### Tooling and quality

- pnpm workspace, tsup builds (ESM and type declarations), TypeScript strict mode
- Shared ESLint flat config for all packages
- Vitest unit tests; coverage thresholds enforced for `core`
- GitHub Actions CI: lint, typecheck, build, test, coverage (Node 22 and 24)
- Playground app as the integration environment for the packages

### Changed

- Inter-package dependencies use `workspace:^`, so published ranges are `^0.1.0`
- Added `publishConfig.access: "public"`, a README and a LICENSE to each publishable package