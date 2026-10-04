# Architecture

System-level architecture. React-specific layer contracts live in
`REACT_ARCHITECTURE.md` and `REACT_RUNTIME_ARCHITECTURE.md`; rationale and
history in `DECISIONS.md`. Condensed 2026-10-04.

---

## Overview

```
                     Runtime
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
   mitt (internal)  PluginManager     Public API
                        │
                        ▼
                   InsightPlugin ──▶ PluginContext
```

## Responsibilities

- **Runtime:** event system, plugin lifecycle (register / remove / destroy), plugin context creation, runtime state validation. Immutable after `destroy()`.
- **PluginManager:** only registers, removes, looks up, lists and clears plugins. No knowledge of lifecycle or events.
- **Internal event system:** `mitt`, wired directly inside `Runtime` (`plugin:registered`, `plugin:removed`, `PluginContext.emit()` / `on()`). There is no separate EventBus abstraction (an unused one was removed; see `DECISIONS.md`, 2026-08-04).
- **InsightPlugin:** `setup` and optional `destroy`. Plugins never access Runtime directly.
- **PluginContext:** the only channel between plugins and Runtime: `emit()` and `on()`.

## Lifecycle

```
registerPlugin():  ensureNotDestroyed → PluginManager.register → Plugin.setup → emit plugin:registered
unregisterPlugin(): ensureNotDestroyed → Plugin.destroy → emit plugin:removed → PluginManager.unregister
destroy():          registered plugins in reverse order (LIFO) → Plugin.destroy → plugin:removed → Runtime destroyed → further API use throws
```

`Plugin.destroy()` completes and `plugin:removed` fires **before** `PluginManager.unregister()` frees the name. Callers that register and unregister without awaiting each other can race on the same name; the React package's `useRootLifecycle` serializes these calls for exactly this reason.

Registration is **atomic**: if `setup()` throws, the plugin is removed from `PluginManager`, the original error is re-thrown, and no `plugin:registered` event is emitted.

---

## React integration

`@react-insight/react` builds on Core and owns React-specific behavior only; it delegates all Runtime responsibilities to `@react-insight/core`. It also does not own inspector presentation; that is `@react-insight/inspector`.

Public surface: the `Insight` facade with `use()`, `destroy()`, `getComponents()`, `getComponent(id)`, `onChange()`, `inspectHookNames(id)` (+ `ComponentSnapshot`), and `installReactDevtoolsHook()`. Internals: Runtime encapsulation, Root model / `RootRegistry`, `ComponentRegistry`, root lifecycle plugin, the Component Discovery pipeline (Hook Adapter, Fiber Adapter, Traversal, Mapper, Hook Inspector, Context Inspector) and its plugin, and the on-demand hook name resolution modules (Fiber Handle Registry, Dispatcher Access, Hook Name Inspector). Layer contracts: `REACT_RUNTIME_ARCHITECTURE.md`.

**Registration timing.** Root lifecycle is registered from a React effect (it only needs "a Provider mounted"). Component Discovery is registered **eagerly in `createInsight()`**, before `createRoot().render()`: an effect runs after the commit that triggers it and so can never see the tree's first commit. Because discovery connects before root lifecycle, an early commit tags components with `rootId: "pending"`, which self-heals on the next commit.

**`installReactDevtoolsHook()`.** `react-dom` checks for `__REACT_DEVTOOLS_GLOBAL_HOOK__` once, at module init, and calls `hook.inject()`. A missing hook (or one without `inject()`) means React never reports commits for that page. So the hook must be installed before `react-dom` is imported; it is exported as a standalone function (the one deliberate exception to "nothing under `internal/` is exported"). `connectHookAdapter()` also calls it defensively.

**StrictMode.** Effects run mount → cleanup → mount in development, and register/unregister are asynchronous. `useRootLifecycle` chains every operation on a per-hook promise so they stay strictly ordered.

**On-demand hook name resolution.** `Insight.inspectHookNames(id)` re-invokes a component with an instrumented dispatcher to recover exact built-in hook names and one level of custom hook name. Strictly on-demand, never in the always-on commit pipeline (the one deliberate exception to zero-instrumentation). Retains live Fiber references (`fiberHandleRegistry`, cleared on unmount). Supports plain function, `memo`, `forwardRef` and `memo(forwardRef(...))` components; not class components.

**`memo` / `forwardRef` recognition.** `isComponentFiber()` accepts function types and unwraps `Symbol.for("react.memo")` / `Symbol.for("react.forward_ref")` recursively. Hook Inspector, Context Inspector and Render Tracking needed no change, since they read Fiber-instance state.

**Inspector package.** `@react-insight/inspector` exports `inspectComponent(insight, id)` and depends only on the public `Insight` API.

**DevTools panel (Playground, 2026-10-04).** A React UI over the public API only (`getComponents()`, `onChange()`, `inspectComponent()`), living in `packages/playground/src/devtools/`. Pure helpers hold all logic (`buildComponentTree`, `excludeSubtrees`, `mergeHookInfo`, `filterComponentTree`, `filterByMinRenders`, `summarizeComponent`) and are unit-tested; components are thin. Because the panel sits inside the tree it observes, it excludes itself **and all its descendants** from what it reads. Inspection (which re-executes a render body) runs only on an explicit click. Planned extraction into `@react-insight/devtools` is undecided.

---

## Design rules

- Runtime owns the plugin lifecycle; PluginManager stores plugins only.
- Plugins never access Runtime directly and communicate only through `PluginContext`.
- The event emitter (`mitt`) is a private implementation detail.
- Public API is strongly typed with generics; plugin names are unique per Runtime; built-in plugins use the same API as third-party ones.
- Runtime cannot be used after `destroy()`.
- TypeScript `strict` and `strictFunctionTypes` stay on; any required assertion carries a documented safety comment.
- Nothing under `internal/` is exported from a package entry point, except `installReactDevtoolsHook()`.
- Registration/unregistration triggered from React effects must be serialized.
- Observation is zero-instrumentation and always-on, with one explicit, opt-in exception: `inspectHookNames()`.
- Presentation and orchestration over `Insight` data belongs in consumer packages (`inspector`, the DevTools panel), not in `@react-insight/react`.
- A subscriber that lives inside the tree it observes must exclude itself and everything it renders.
- Prefer a new dependency only when the technique is itself version-sensitive (e.g. dispatcher internals); small, long-stable constants (e.g. `Symbol.for("react.memo")`) are defined locally.

## Type safety
TypeScript-first; strictness is preserved rather than relaxed. There are currently no documented type-assertion exceptions.

---

## Testing strategy

Every public API is tested. Static analysis (ESLint flat config, strict `tsc`) is mandatory for every package, **Playground included**.

- **Core:** Runtime, PluginManager, Logger Plugin; lifecycle, destruction, events, rollback, `PluginContext`.
- **React:** `createInsight()` (all read APIs, eager discovery), `InsightProvider`, `useInsight()`, `useInsightLifecycle()` under StrictMode, `RootRegistry`, `ComponentRegistry` (sync, per-field dirty-check, `markUnmounted()`, render accounting, `subscribe()`), both plugins, and every discovery module (Fiber Adapter, Traversal incl. `current`/`alternate` identity and props/state-based `rendered`, Mapper, Hook Adapter, Hook Inspector, Context Inspector, value preview, `memo` / `forwardRef`). On-demand modules: Fiber Handle Registry, Dispatcher Access (all four branches via `vi.doMock("react", ...)`), and Hook Name Inspector tested against **real** React rendering (`@testing-library/react`), since fixtures cannot stand in for the real dispatcher.
- **Inspector:** `inspectComponent()` against a fake `Insight`.
- **Playground:** Vitest unit tests for the DevTools panel's pure helpers (34 tests at 2026-10-04). Component rendering is validated manually.
- **End-to-end (Playground, manual, mandatory):** Playground is the only environment exercising the real `react-dom` DevTools hook path (`inject()`, module-load timing, real commits). Required for any change touching Component Discovery, Render / Hook / Context Tracking or on-demand hook resolution; several real bugs were found only this way (see `DECISIONS.md`).

**Coverage.** Vitest + V8, enforced for **Core only** in CI: thresholds statements 90 / lines 90 / functions 85 / branches 80; current ≈ 92 / 91 / 88 / 85. React, Inspector and Playground meet the same lint / typecheck / build / test bar without a coverage script.

---

## Monorepo

```
packages
├── core          framework-agnostic Runtime
├── react         official React integration layer
├── inspector     inspectComponent() over the public Insight API
├── playground    integration app + DevTools panel; imports packages like an external app
└── eslint-config shared flat config (private)
```

Playground imports Core and React exactly as an external app would, including the module-order requirement that `installReactDevtoolsHook()` runs before `react-dom` is imported. No internal source imports are allowed.

## Built-in plugins
Factory functions (`loggerPlugin()`): independent instances, no shared state, better test isolation, safe across multiple Runtimes.

## Quality Gate

Every change passes `pnpm lint && pnpm typecheck && pnpm build && pnpm test` (all four packages including Playground), verified by GitHub Actions on every push and pull request (`.github/workflows/ci.yml`: lint, typecheck, build, test, core-only coverage, Node 22/24). Any CI step that lists packages explicitly must include Playground. Changes touching Component Discovery, Render / Hook / Context Tracking or on-demand hook resolution also require manual Playground validation. A change is complete only after all gates pass.