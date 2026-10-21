# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-10-21

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
- `ComponentSnapshot.lastRenderReasons` and the exported `RenderReason` type: why a component last re-rendered (`mount`, `props` with the changed prop names, `state` with the changed hook indices, `context` with the changed context names, `parent`, or `unknown`). Only names and indices are kept, never values
- Render detection also compares context values, so a component without hooks that re-renders only because of a context change is now counted
- A `displayName` set on a `memo` wrapper is resolved, so such components no longer show as "Anonymous" in production builds where the inner function name is lost

#### `@react-insight/inspector`

- `inspectComponent(insight, id)`: combines a component snapshot with on-demand hook names

#### `@react-insight/devtools`

- `DevtoolsPanel`: docked bottom panel with a floating toggle (closed by default), resizable height and tree/details split, component tree with expand/collapse, unmounted-component toggle, render flash, per-row hook and context summary, detail pane with on-demand inspection
- Tree filters: name, minimum renders, Focus on a subtree (with an ancestor breadcrumb), Hide minified names, Hide names by pattern, and a Hide Next.js preset
- "Why it rendered" section in the details pane, listing the cause of the last re-render (first render, changed props, changed state hooks, changed contexts, or a parent re-render with no detected change)
- Keyboard navigation and ARIA roles for the component tree (`tree`, `treeitem`, roving tab stop; arrow keys never select, so no inspection runs without Enter, Space or a click)
- The panel height and the details pane width are remembered in `localStorage`; the panel is capped at the viewport height minus 80px
- Known limits of "Why it rendered": state changes are detected by comparing value previews, so `setState` with a new object of equal contents shows "No cause detected"; class components have no hooks, so their `setState` shows "No cause detected" or a parent re-render; `children` often appears among changed props

#### Tooling and quality

- pnpm workspace, tsup builds (ESM and type declarations), TypeScript strict mode
- Shared ESLint flat config for all packages
- Vitest unit tests; coverage thresholds enforced for `core`
- GitHub Actions CI: lint, typecheck, build, test, coverage (Node 22 and 24)
- Playground app as the integration environment for the packages

### Changed

- Inter-package dependencies use `workspace:^`, so published ranges are `^0.1.0`
- Added `publishConfig.access: "public"`, a README and a LICENSE to each publishable package