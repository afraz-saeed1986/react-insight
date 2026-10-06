# React Insight

## Vision

React Insight is an open-source, TypeScript-first debugging and inspection toolkit for React applications: a lightweight, extensible, plugin-based alternative for inspecting React apps during development.

Long-term goals: plugin-based architecture, high performance, excellent TypeScript support, React-first design, modern developer experience, npm-ready packages, production-grade quality.

---

## Current status

**Phase 1 (Core)** and **Phase 2 (React integration)** are complete. **Phase 3 (Inspector / DevTools)** is active. Condensed 2026-10-04; rationale for every item is in `DECISIONS.md`, history in `SESSION_LOG.md`.

### Workspace (5 packages + shared config)
`core`, `react`, `inspector`, `devtools`, `playground`, plus `eslint-config` (private). pnpm workspace, tsup builds, shared ESLint flat config, GitHub Actions CI (build, lint, typecheck, test of every package, core-only coverage; Node 22/24). Playground has its own `lint` / `typecheck` scripts and is part of the Quality Gate.

### `@react-insight/core`
Generic `Runtime`, `PluginManager`, plugin lifecycle (atomic registration, rollback on `setup()` failure, LIFO `destroy()`, state protection), `definePlugin()`, built-in Logger Plugin (factory). Event system is `mitt` inside `Runtime`.

### `@react-insight/react`
- Public API: `createInsight()`, `InsightProvider`, `useInsight()`, `installReactDevtoolsHook()` (must be called before `react-dom` loads), and the `Insight` facade: `use()`, `destroy()`, `getComponents()`, `getComponent(id)`, `onChange()`, `inspectHookNames(id)`; type `ComponentSnapshot`.
- Internals: Root model/registry/lifecycle plugin (effect-based); framework-agnostic `ComponentRegistry`; Component Discovery pipeline (Hook Adapter, Fiber Adapter, Traversal, Mapper, Hook Inspector, Context Inspector) registered **eagerly** in `createInsight()`; recognizes plain, class, `memo`, `forwardRef` and combined components.
- Render Tracking: root `commitCount`; per-component `rendered` / `renderCount` / `lastRenderedAt` via a self-maintained last-observed props/state comparison (no known accuracy gaps).
- Structural Hook Tracking with bounded value previews for `state` / `ref` / `memo-like`; structural Context Tracking (`displayName`, deduplicated by context identity).
- On-demand hook name resolution (Fiber Handle Registry, Dispatcher Access, Hook Name Inspector): one level of custom hook name, never automatic.

### `@react-insight/inspector`
`inspectComponent(insight, id)` — `getComponent()` + `inspectHookNames()`. Depends only on the public `Insight` API; no Fiber knowledge.

### `@react-insight/devtools`
`DevtoolsPanel` (no props), the only public export: component tree (by `parentId`), detail pane (hooks joined with on-demand hook names, contexts), render flash, name filter, minimum-renders filter, per-row hook/context summary. Built on the public `Insight` API and `inspectComponent()`; pure helpers covered by 34 unit tests. `react` and `@react-insight/react` are peerDependencies (one shared `InsightContext`); the panel and its subtree exclude themselves via an explicit `displayName`.

### `playground`
The integration environment: imports workspace packages as an external app would (no relative or internal imports). Renders a real React tree through `InsightProvider` and mounts `DevtoolsPanel` from `@react-insight/devtools`. `ContextProbe` under `ThemeContext.Provider value="dark"` is a permanent Context Tracking fixture. No unit tests.

---

## Not started

- Timeline (needs a per-event history in `ComponentRegistry`).
- npm release of the packages. Publishing readiness so far: package metadata, per-package README and LICENSE, root README and CHANGELOG. Remaining: tarball verification (`pnpm pack`, `publint`, `attw`).
- Session management.
- A nested custom-hook tree for `inspectHookNames()` (no consumer).
- A React hook wrapper for the inspector (no consumer).

## Deferred, no current consumer
Root-container correlation (multi-application pages), `ComponentRegistry.getByRoot()`, `rendererId`, `onPostCommitFiberRoot`, `useComponentInspection()`.

---

## Technology stack
TypeScript (strict), React 19, pnpm workspace, tsup, Vite, mitt, Vitest, Testing Library, ESLint (flat config), GitHub Actions.

## Development principles
SOLID and clean architecture; incremental change; strict TypeScript (never relax it, use localized documented assertions); coverage-driven and test-driven; docs synchronized with implementation; **no premature abstraction** (no field or API without a real consumer); no breaking API without discussion.

## Quality

Core coverage thresholds (statements 90, lines 90, functions 85, branches 80) are enforced by Vitest and CI for Core only; the other packages meet the same build/lint/typecheck/test bar without a coverage script. Every change passes `pnpm build && pnpm lint && pnpm typecheck && pnpm test` (`build` first, because workspace packages resolve each other through `dist`) and then the CI run, which must be checked rather than assumed. Changes touching Component Discovery, Render / Hook / Context Tracking or on-demand hook resolution also need manual end-to-end validation in Playground.

---

## Current focus

Phase 3: the DevTools panel is its own package (`@react-insight/devtools`) and Playground consumes it. Candidates for the next slice: finish npm publishing readiness (tarball verification; no pipeline change); design Timeline (history structure in the registry); fix sibling order (sibling index in the always-on pipeline); the last two need a short approved design first. See `ROADMAP.md`.

---

## Architecture notes (current behavior)

- Public API is the `Insight` facade; Runtime and internals sit behind a symbol under `internal/` and are never exported, except `installReactDevtoolsHook()` (it must run before an `Insight` can exist).
- Component Discovery connects to the page-global `__REACT_DEVTOOLS_GLOBAL_HOOK__` (stub with a working `inject()`); a commit before any root registers is tagged `rootId: "pending"` and self-heals on the next commit.
- Plugin register/unregister from React effects is serialized through a promise chain to survive StrictMode's mount → cleanup → mount.
- `ComponentRegistry` keeps unmounted components (`markUnmounted()`); a re-mounted component is a new instance with a new id. `sync()` skips write and notify when nothing structural changed and `rendered` is false; `onChange()` notifications are batched with `queueMicrotask()`.
- Zero-instrumentation, always-on observation everywhere except one deliberate, opt-in exception: `inspectHookNames()` re-invokes the component with an instrumented dispatcher and retains Fiber references (`fiberHandleRegistry`, cleared on unmount).
- Any subscriber that lives inside the tree it observes (the DevTools panel) must exclude itself and everything it renders (`excludeSubtrees`); otherwise it creates a render feedback loop.
- `useContext` takes no hook slot, so it never appears in `hooks`; context values are tracked separately in `contexts`.

## Known limitations
- Tree sibling order follows registry insertion order, not React child order (visible after a re-mount).
- Single `react-dom` renderer and a single React application per page are assumed.
- Structural hooks cannot distinguish `useState` / `useReducer` or `useMemo` / `useCallback`, nor name hooks; `inspectHookNames()` resolves both on demand (development builds; custom hook names degrade under minification; class components excluded).

## Next milestone
Choose one of the Phase 3 candidates above (publishing readiness, or design for Timeline / sibling order). The platform it builds on: a complete Core, full discovery pipeline, accurate Render Tracking, structural Hook and Context Tracking, a public read API with `onChange()`, on-demand hook names, a passing CI, and a five-package monorepo including a separate `@react-insight/devtools` package.