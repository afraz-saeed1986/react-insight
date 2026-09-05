# React Architecture

## Vision

The `@react-insight/react` package provides the official React integration for React Insight.

It acts as the bridge between React applications and the Runtime implemented in `@react-insight/core`.

The package remains lightweight and focuses exclusively on React-specific functionality while preserving a clean separation between the public React API and the Core Runtime.

---

## Goals

- Provide an ergonomic React API.
- Keep the Core package completely framework-agnostic.
- Minimize runtime overhead.
- Preserve strong TypeScript support.
- Integrate naturally with modern React applications.
- Support React 19 and newer.
- Remain compatible with Server Components where applicable.
- Hide Core implementation details behind a stable React API.

---

## Non-Goals

The React package is **not** responsible for:

- Runtime implementation
- Plugin lifecycle management
- Event system implementation
- DevTools UI
- Inspector implementation
- Plugin execution logic

Those responsibilities belong to other packages. As of 2026-08-24, "Inspector implementation" is no longer a purely aspirational non-goal — `@react-insight/inspector` is a real, existing package built exactly on this boundary: it consumes this package's public `Insight` API (including the on-demand `inspectHookNames()` capability below) and has no knowledge of React Fiber. See "Package Responsibilities" and `DECISIONS.md`, 2026-08-24.

---

# Public API

The React package exposes a minimal, ergonomic and stable API.

Current public API:

```ts
import {
  createInsight,
  InsightProvider,
  useInsight,
  installReactDevtoolsHook,
} from "@react-insight/react";

// Must run before react-dom is imported anywhere in the module graph.
// See "installReactDevtoolsHook()" below.
installReactDevtoolsHook();

import { createRoot } from "react-dom/client";

const insight = createInsight();

await insight.use(loggerPlugin());

root.render(
  <InsightProvider insight={insight}>
    <App />
  </InsightProvider>
);

function Dashboard() {
  const insight = useInsight();

  const components = insight.getComponents();
  const one = insight.getComponent(components[0].id);

  // On-demand only — re-invokes the component's function. See
  // "On-demand Hook Name Resolution" below before calling this
  // automatically or on every render.
  const hookNames = insight.inspectHookNames(components[0].id);
  // ...
}
```

---

## Public API Design Principles

The public API should:

- Be easy to learn.
- Minimize required configuration.
- Avoid exposing Core internals.
- Remain stable across internal refactors.
- Be extensible without breaking existing applications.
- Support future built-in plugins and developer tools.

The Runtime is intentionally hidden from consumers.

Applications interact only with the `Insight` abstraction — with one deliberate exception, `installReactDevtoolsHook()` (see below), which by necessity exists outside any `Insight` instance.

---

## API Responsibilities

### createInsight()

Responsible for:

- Creating the internal Runtime.
- Creating the internal RootRegistry.
- Creating the internal ComponentRegistry.
- Registering the Component Discovery plugin **eagerly** (synchronously, before returning), not deferred to a React effect — see "Component Discovery" below for why.
- Returning the public `Insight` instance.
- Delegating plugin registration.
- Delegating plugin unregistration.
- Delegating Runtime destruction.
- Exposing `getComponents()` and `getComponent(id)`, both mapping internal `ComponentNode` records to the public `ComponentSnapshot` shape through a single shared `toSnapshot()` helper (see `DECISIONS.md`, 2026-08-24).
- Exposing `inspectHookNames(id)`, delegating to `internal/discovery/hookNameInspector.ts`'s `resolveHookNames()` after resolving a live Fiber handle (`fiberHandleRegistry.ts`) and the current dispatcher ref (`dispatcherAccess.ts`). See "On-demand Hook Name Resolution" below.

The Runtime implementation remains internal to the package.

---

### installReactDevtoolsHook()

A standalone function, independent of any `Insight` instance, that installs `__REACT_DEVTOOLS_GLOBAL_HOOK__` if it does not already exist.

Responsible for:

- Being safely callable multiple times (idempotent).
- Doing nothing (and not conflicting) if a real React DevTools extension, or another tool, already installed a hook.

**Must be called by the consuming application before `react-dom` is imported anywhere in the module graph.** React's renderer checks for this hook exactly once, at its own module-initialization time; if the hook doesn't exist yet at that moment, React never discovers it for the rest of that page session, no matter what is installed afterward. This is the same constraint documented by React's own `react-devtools-inline` package.

This is why the function is exported directly from the package root rather than tucked into `Insight` — an `Insight` instance cannot meaningfully exist before this call has already happened.

---

### InsightProvider

Responsible for:

- Providing the `Insight` instance through React Context.
- Making the public API available to React components.
- Hosting the internal root lifecycle integration (**not** Component Discovery — see below).

The Provider must never own or implement Runtime behavior.

---

### useInsight()

Responsible for:

- Accessing the current `Insight` instance.
- Providing a stable React API.
- Throwing a descriptive error when used outside `InsightProvider`.

Consumers should never access React Context directly.

---

# React Lifecycle

The React package integrates with the Core Runtime through an internal root lifecycle plugin.

The lifecycle integration is intentionally isolated behind `useInsightLifecycle()`, which today coordinates only root lifecycle (`useRootLifecycle`) — Component Discovery is **not** part of this effect-based flow; see the next section for why.

Current lifecycle flow:

```text
InsightProvider
        │
        ▼
useInsightLifecycle()
        │
        ▼
useRootLifecycle()
        │
        ▼
createRootLifecyclePlugin()
        │
        ▼
Runtime.registerPlugin()
        │
        ▼
Plugin.setup()
        │
        ▼
RootRegistry.register()

Unmount
        │
        ▼
Runtime.unregisterPlugin()
        │
        ▼
Plugin.destroy()
        │
        ▼
RootRegistry.unregister()
```

This design ensures that the Runtime remains the sole owner of the plugin lifecycle while React is responsible only for integrating Runtime with the React lifecycle.

Register/unregister calls are **serialized** through a per-hook promise chain (`useRootLifecycle`) rather than fired independently. React 18+ StrictMode invokes effects as mount → cleanup → mount in development; since both operations are asynchronous (`Runtime` awaits `Plugin.setup()` / `Plugin.destroy()`), firing them independently can race — the second mount's registration running before the first mount's cleanup has actually freed the plugin's name — throwing "Plugin already registered". This was found through real StrictMode rendering in Playground, not a unit test. See `DECISIONS.md`, 2026-07-21.

---

# Component Discovery

Unlike root lifecycle, Component Discovery is registered **eagerly, inside `createInsight()`** — synchronously, before the function returns, and therefore before the consuming application ever calls `ReactDOM.createRoot().render()`. It is **not** registered from a React effect, and there is no `useComponentDiscovery()` hook.

Current discovery flow:

```text
createInsight()
        │
        ▼
Runtime.registerPlugin(componentDiscoveryPlugin)
        │
        ▼
Plugin.setup()
        │
        ▼
connectHookAdapter()
        │
        ▼
installReactDevtoolsHook() (idempotent; ideally already
called by the application before react-dom was imported)
        │
        ▼
__REACT_DEVTOOLS_GLOBAL_HOOK__

  onCommitFiberRoot
        │
        ▼
  RootRegistry.recordCommit() (if a root is registered yet)
        │
        ▼
  getFiberTraversalEntry()
        │
        ▼
  traverse()  — rootId falls back to "pending" if no root
               is registered yet (self-heals on the next commit,
               since sync() updates rootId whenever it differs
               from what's stored); also records a fiber handle
               per component (fiberHandleRegistry.ts) for later
               on-demand inspection
        │
        ▼
  mapDiscoveredComponent()
        │
        ▼
  ComponentRegistry.sync()

  onCommitFiberUnmount
        │
        ▼
  asFiberNode() + getFiberId()
        │
        ▼
  ComponentRegistry.markUnmounted()
        │
        ▼
  fiberHandleRegistry.delete() — bounds the fiber handle
  registry's memory (see "On-demand Hook Name Resolution" below)

Runtime.destroy() / unregisterPlugin("react:discovery")
        │
        ▼
Plugin.destroy()
        │
        ▼
disconnect() — restores previous hook callbacks
```

### Why eager, not effect-based

A React effect always runs _after_ the commit that triggers it. An effect-based registration (the original design, via a `useComponentDiscovery()` hook mirroring `useRootLifecycle`) therefore structurally cannot observe the very first commit of the tree it lives inside — confirmed empirically: `onCommitFiberRoot` never fired on a page's initial render under that design. Root lifecycle doesn't have this problem because it only needs to know "a Provider mounted", which the effect running is itself sufficient evidence of; Component Discovery needs to observe actual commits, including the first one. See `DECISIONS.md`, 2026-07-21.

Because discovery now connects before any root is necessarily registered (root registration is still effect-based), `onCommit` no longer bails out when `RootRegistry` is empty. Components discovered before a root registers are tagged with a `"pending"` `rootId`; the next real commit self-heals this once the real root registers (`ComponentRegistry.sync()` already updates `rootId` whenever it differs from what's stored, on every commit).

### Hook connection requires two things, not one

`connectHookAdapter()` calls `installReactDevtoolsHook()` defensively (in case the application forgot to call it early), but installing the hook object alone is not sufficient. React's real renderer bootstrap (`injectInternals`) calls `hook.inject(rendererInternals)` once, at `react-dom` module-load time, to register itself; if that call throws (e.g. because `inject()` doesn't exist) or the hook wasn't present yet, React never calls `onCommitFiberRoot`/`onCommitFiberUnmount` for the rest of that page session. The installed stub therefore includes a working `inject()` (assigns and returns an incrementing renderer id) and `supportsFiber: true`, not just the two commit-notification callbacks. This was a real, previously-shipped bug — the original stub was `{ renderers: new Map() }` only — found via Playground, not a unit test (existing tests call `hook.onCommitFiberRoot(...)` directly, bypassing `inject()` entirely). See `DECISIONS.md`, 2026-07-21.

The full per-layer contract (responsibility, input, output, forbidden knowledge) for Hook Adapter, Fiber Adapter, Traversal, Mapper and Component Registry is defined in `REACT_RUNTIME_ARCHITECTURE.md`, Section 6.

Architectural boundary: no type whose name or shape depends on React Fiber crosses the Mapper. Only `ComponentNode` (and its structural subset, `ComponentSyncInput`) is allowed to travel from the Mapper down into `ComponentRegistry` and, eventually, Plugins.

Unmount handling marks the component record as unmounted (`status: "unmounted"`, `unmountedAt: <timestamp>`) rather than removing it from the registry, preserving its history for future consumers such as Timeline or Inspector. See `DECISIONS.md`, 2026-07-19.

Render Tracking uses the Fiber `current`/`alternate` machinery for two separate purposes, resolved together by `resolveFiberIdentity()`: a stable **id** (a direct or `alternate` WeakMap hit reuses the existing id; no hit at all means first mount, minting a new id), and a **`rendered` verdict**, which is _not_ derived from which hit occurred. React recycles at most two Fiber objects per component indefinitely, so object identity alone is only a reliable "unchanged" signal for a component's first update — the same object reference reappears as `current` again on every second-and-later real update, and comparing against `alternate` goes stale once a component stops receiving real updates while the rest of the tree keeps committing. Instead, `rendered` compares the incoming `memoizedProps`/`memoizedState` against a self-maintained `lastObservedValues` map (keyed by the stable id, updated on every resolution), so every check is relative to "changed since the last time this id was seen" rather than to a potentially-stale Fiber object. `DiscoveredComponent.rendered` carries this signal through to `ComponentNode.renderCount` / `lastRenderedAt`. See `DECISIONS.md`, 2026-07-20 and 2026-07-26.

This closes what was previously documented here as a known accuracy limitation: React clones (assigns a new Fiber object to) every ancestor and sibling along the reconciliation path down to an actually-updated component, even when their own function body bailed out (didn't re-execute); the props/state comparison correctly reports these as not rendered regardless of the object-identity churn. Root-level `RootRegistry.commitCount` was never affected by any version of this, since it doesn't depend on Fiber identity. See `DECISIONS.md`, 2026-07-26, for the two intermediate regressions (each caught only by a differently-shaped real-browser Playground test) that the final design had to survive.

### Hook Tracking (structural)

`inspectHooks()` walks the hooks linked list rooted at a function component Fiber's `memoizedState` and produces a `HookSummary[]` (`{ index, kind, value? }`) for each discovered component, threaded through the same pipeline as `rendered`: `DiscoveredComponent.hooks` → `ComponentSyncInput.hooks` → `ComponentNode.hooks` → `ComponentSnapshot.hooks`. Unlike `rendered`, `hooks` is updated unconditionally on every `sync()` (a structural fact like `displayName`, not an accumulated stat like `renderCount`).

This is a **structural-only, always-on** inspection: no re-render, no instrumented dispatcher, consistent with the same zero-instrumentation positioning already established for Render Tracking (`DECISIONS.md`, 2026-07-20). It cannot, on its own, distinguish `useState` from `useReducer`, `useMemo` from `useCallback`, or recover any hook _name_ — resolving those requires re-invoking the component with an instrumented dispatcher, the technique real React DevTools uses via `react-debug-tools`'s `inspectHooksOfFiber`. That technique is deliberately **not** part of this always-on structural pass; it is instead available as a separate, explicit, on-demand capability — see "On-demand Hook Name Resolution" below. See `DECISIONS.md`, 2026-07-27.

Because `isComponentFiber()` elsewhere in this package intentionally treats function and class components alike (both are `typeof === "function"` in JavaScript — a distinction that doesn't matter for identity/render-detection), `inspectHooks()` independently guards against class components, whose `memoizedState` is `this.state`, not a hooks list: it checks `type.prototype.isReactComponent` (exported as `isClassComponentType()`, reused unchanged by the on-demand hook name resolver below rather than duplicated — see `DECISIONS.md`, 2026-08-24), the same marker React's own reconciler uses internally to decide whether to construct a class instance, rather than an unstable Fiber `tag` number. Class components report `hooks: []`.

**Known limitations** (confirmed via a controlled Playground experiment against a probe component exercising every common hook, not assumed — see `DECISIONS.md`, 2026-07-27):

- `useState` and `useReducer` share an identical Fiber-level shape and both report `kind: "state"`. `Insight.inspectHookNames()` (on-demand) resolves this distinction — see below.
- `useMemo` and `useCallback` share an identical shape and both report `kind: "memo-like"`. Also resolved on-demand — see below.
- `useEffect` and `useLayoutEffect` _are_ distinguishable, via a bitmask on the Effect object's `tag` field (confirmed empirically: `9` = `useEffect`, `5` = `useLayoutEffect`).
- `useContext` (and any custom hook that is purely a `useContext` wrapper) is entirely invisible to `inspectHooks()` — `readContext()` does not consume a hook slot at all, so no entry appears in the hooks list. (As of `DECISIONS.md`, 2026-07-29, Context values are tracked separately — see "Context Tracking (structural)" below — so this is a hooks-list-specific gap only, not a real data gap for Context values.)
- No hook or custom-hook _name_ is available from this structural technique, for any kind. As of `DECISIONS.md`, 2026-07-28 (extended 2026-08-24), `state`, `ref`, and `memo-like` kind hooks all carry a shallow, circular-safe _value_ preview (`previewHookValue()`, one level deep, string length capped at 200 characters — nested objects/arrays/functions/class instances are described by type, not walked further), read directly from `memoizedState` with no re-render, since values (unlike names) require no instrumented dispatcher for these kinds.

### On-demand Hook Name Resolution

Unlike everything else in this document, `Insight.inspectHookNames(id)` is a **deliberate, narrow departure** from this package's zero-instrumentation, always-on posture: it genuinely re-invokes the component's function to recover information the structural techniques above cannot. This is the first slice of Phase 3 (Inspector) work. See `DECISIONS.md`, 2026-08-24, for the full design history, including two decisions that were reversed after research (see below).

**What it resolves that structural Hook Tracking cannot:** the exact built-in hook name for each hooks-list slot (distinguishing `useState`/`useReducer` and `useMemo`/`useCallback`), and the name of the nearest enclosing custom hook, if the hook was called from inside one rather than directly in the component body.

**Strictly on-demand.** This must never be called automatically or wired into the always-on commit pipeline — it is only safe to call in direct response to an explicit inspection request (e.g. a future "Inspect" UI action), since it re-executes the component's render body and any real side effects in it.

**Dependency decision reversed after research.** The published `react-debug-tools` npm package was initially the planned dependency for the dispatcher-swap mechanics, since it is the technique real React DevTools uses. Verifying this before committing to it found the npm package hadn't been republished in roughly 7 years (still `0.1.0`), while the version DevTools actually uses is vendored directly inside the `facebook/react` monorepo and has kept evolving past the npm package's last publish. Decision reversed to a small, hand-rolled, deliberately narrower implementation instead (no nested custom-hook tree, no deps/source display) — see `internal/discovery/hookNameInspector.ts` below.

**Dispatcher access simplified after further research.** Rather than threading `currentDispatcherRef` through this package's own `hookAdapter.ts`/`inject()` (the original plan), `internal/discovery/dispatcherAccess.ts` reads React's active dispatcher slot directly from the `react` package itself — `React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H` on React 19 (with a pre-19 fallback) — the same internal real ecosystem libraries (e.g. the React Compiler runtime) already read directly. This has no dependency on this package's own DevTools hook connection having completed, and works identically in tests and real usage.

**Retaining a live Fiber reference — a first for this codebase.** Every other Fiber consumer in this pipeline (Traversal, Hook Inspector, Context Inspector) is fully transient. On-demand inspection can be requested arbitrarily long after the commit that produced a component, so `internal/discovery/fiberHandleRegistry.ts` retains a `Map<ComponentId, FiberNode>`, updated by Traversal on every commit and explicitly cleared by `componentDiscoveryPlugin.ts`'s `onUnmount` handler — without this, every unmounted component's Fiber (and everything it closes over) would be retained forever.

**Implementation (`hookNameInspector.ts`).** Builds an instrumented dispatcher whose methods, for the hook kinds already classified structurally above (state, ref, memo-like, effect, layout-effect, plus `useContext`), read the next node from the fiber's already-committed hooks linked list — never performing real update logic, never mutating real hook state — while recording the called method's name and call stack. Any other hook name falls through to a generic, best-effort `Proxy` handler (records the call, consumes one slot, returns the raw stored value) — an explicit, documented trade-off rather than attempting full fidelity for hooks this project has no other classified handling for. `console.*` is suppressed for the duration of the re-invocation and the real dispatcher is always restored in a `finally` block, mirroring `react-devtools-shared`'s own defensive posture around the equivalent call.

**Custom hook name resolution required real-execution correction, twice.** An initial fixed-stack-frame-offset design was wrong in two ways only caught by running the real test suite against React 19: (1) constructing `Error()` inside a separate `recordCall()` helper adds an extra frame the fixed offset didn't account for; (2) dispatcher methods accessed through the `Proxy` (used for the generic fallback) report as `Proxy.useState` rather than bare `useState` in V8 stack traces. Fixed by abandoning fixed-offset parsing for a resilient skip-loop: strip any prefix before the last `.` in each frame name (handles both `Object.` and `Proxy.`), then skip leading frames whose name is a known internal one (every built-in hook export name, plus `recordCall` itself) until the first frame that isn't — that frame is either a named custom hook or the component itself.

**Scope, deliberately limited for this slice:**

- Plain function components only — not `memo`/`forwardRef`-wrapped, not class components (excluded via the same `isClassComponentType()` check `hookInspector.ts` uses).
- One level of custom hook name only, not a full nested tree (`react-debug-tools`' `HooksTree`). No current consumer needs more, and the flat result already resolves this project's two concrete, previously-documented ambiguities.
- Inherits the same minification caveat already documented for this general technique: custom hook name resolution reads real function names from the call stack, so it degrades to no `customHookName` (never an incorrect one) under minified production builds.
- Depends on React internals expected to be present in development builds only; gracefully returns `undefined` rather than throwing when unavailable.

**Validated in both real-rendering unit tests and Playground.** `hookNameInspector.test.tsx` uses `@testing-library/react` (not plain Fiber fixtures — a hand-built fixture cannot faithfully stand in for React's real dispatcher). Playground validation (via a temporary `window.__insight` console handle, removed after) confirmed against real browser commits: correct `useState` resolution on `Counter`, and correct `customHookName` resolution after temporarily wrapping `Counter`'s `useState` call in a real custom hook.

---

### Context Tracking (structural)

`inspectContexts()` walks a completely separate linked list from the hooks list — `fiber.dependencies.firstContext` — which React maintains for any fiber, function or class component alike, that calls `useContext()`/`readContext()`. It produces a `ContextSummary[]` (`{ index, displayName, value }`) per distinct Context, threaded through the same pipeline as `hooks`: `DiscoveredComponent.contexts` → `ComponentSyncInput.contexts` → `ComponentNode.contexts` → `ComponentSnapshot.contexts`, updated unconditionally on every `sync()` like other structural fields.

Unlike hook values, no re-render is needed here either: `memoizedValue` already sits directly on each dependency node, populated by React itself on every commit that reads the Context — there is no need to walk up to the `Provider` fiber. `value` reuses `previewHookValue()` (2026-07-28, string-length cap added 2026-08-24) unchanged, since a Context's current value has exactly the same "arbitrary JS value, must stay safe and bounded" shape as a hook's value.

**Names are recoverable here, unlike hooks.** `context.displayName` is a documented, publicly-supported convention — the same one real React DevTools uses to label context consumers — not a private internal. `resolveDisplayName()` falls back to the literal string `"Context"` when the consuming application never set it.

**Deduplication is a deliberate defensive design choice, not an assumption.** A controlled Playground experiment (a single `useContext()` call, logging `fiber.dependencies` directly) observed **two** chained dependency nodes for that one call, both pointing at the same `context` object — most likely caused by React 18+ StrictMode's development-mode double-invocation of the component body without a full reset of the dependency list between invocations (Playground renders through `<StrictMode>`). Root cause not fully confirmed. `inspectContexts()` deduplicates by `context` object identity while walking the chain, so the output is correct regardless of the exact cause, rather than assuming the list always has exactly one node per `useContext()` call. See `DECISIONS.md`, 2026-07-29.

`InsightContext` (used by `useInsight()`) has `displayName` set to `"InsightContext"`, so it surfaces in a consuming app's `contexts` with a real name instead of the generic `"Context"` fallback.

Known, deliberately deferred limitations (see `DECISIONS.md`, 2026-07-18):

- Renderer identity (`rendererId`) is not tracked — single renderer (`react-dom`) assumed.
- `onPostCommitFiberRoot` is not wired.
- Discovery assumes a single React application per page (no container-based root correlation yet); every discovered component is attributed to the first root in `RootRegistry`.

---

# Package Responsibilities

## @react-insight/core

The Core package is framework-agnostic.

Responsibilities:

- Runtime
- Plugin lifecycle
- Plugin registration
- Plugin unregistration
- Event system
- Subscription management
- Built-in plugins
- Public Runtime API

The Core package must never depend on React.

---

## @react-insight/react

The React package provides the official React integration.

Responsibilities:

- `createInsight()`
- `installReactDevtoolsHook()`
- `InsightProvider`
- `useInsight()`
- React Context
- React lifecycle integration
- Internal root lifecycle infrastructure
- Internal lifecycle plugins
- RootRegistry (including commit counting)
- ComponentRegistry (including render tracking, structural hook tracking, structural context tracking, unmount history, and change notification via `subscribe()`/`Insight.onChange()`)
- Component Discovery pipeline (Hook Adapter, Fiber Adapter, Traversal, Mapper, Hook Inspector, Context Inspector)
- Internal Component Discovery plugin, registered eagerly from `createInsight()`
- On-demand hook name resolution (`dispatcherAccess.ts`, `fiberHandleRegistry.ts`, `hookNameInspector.ts`), exposed publicly as `Insight.inspectHookNames()` — the one deliberate, narrow exception to this package's otherwise zero-instrumentation posture (see "On-demand Hook Name Resolution" above)
- Future React-specific features

The React package consumes the Runtime provided by `@react-insight/core`.

It must never reimplement Runtime behavior. It must also never implement Inspector presentation/orchestration logic itself — that is `@react-insight/inspector`'s responsibility (see below).

---

## @react-insight/inspector

Added 2026-08-24 — the fourth workspace package, and the first to depend on another React Insight package rather than only external dependencies.

Responsibilities:

- `inspectComponent(insight, id)` — combines `Insight.getComponent()` and `Insight.inspectHookNames()` into a single `ComponentInspection` result.
- Presentation/orchestration logic that sits on top of `@react-insight/react`'s public API.

Non-goals:

- No knowledge of React Fiber or any React-internal concept — depends only on the public `Insight` interface.
- No React hook wrapper yet (e.g. `useComponentInspection()`) — deferred until a real UI consumer exists (currently none; Playground has no "Inspect" action yet).

This package is the first concrete realization of the boundary `@react-insight/react`'s own Non-Goals section already described ("Inspector implementation" does not belong there) — see `DECISIONS.md`, 2026-08-24.

---

## Future Packages

The architecture supports additional packages without requiring changes to the Core API.

Examples still pending:

- `@react-insight/devtools`
- `@react-insight/timeline`
- `@react-insight/plugins`

`@react-insight/inspector`, previously listed here as an example, now exists — see above.

Each package should have a single, well-defined responsibility.

---

# Internal Architecture

The React package separates its public API from internal implementation details.

Internal modules are not exported from the package entry point, with one deliberate exception: `installReactDevtoolsHook()` is exported from `internal/discovery/hookAdapter.ts` at the package root, because it must be callable before an `Insight` instance can exist. See "Public API" above.

Current internal implementation includes:

- Internal Runtime symbol
- Internal Runtime holder types
- Internal Runtime access helpers
- Internal Root model (including commit counting)
- Internal RootRegistry
- Internal Component model (including render tracking, structural hook tracking, structural context tracking, and unmount history)
- Internal ComponentRegistry
- Internal root lifecycle hook (`useRootLifecycle`, effect-based)
- Internal Root Lifecycle Plugin
- Internal Component Discovery pipeline (Hook Adapter, Fiber Adapter, Traversal, Mapper, Hook Inspector, Context Inspector) — registered eagerly, not via a hook
- Internal Component Discovery Plugin
- Internal on-demand hook name resolution (`dispatcherAccess.ts`, `fiberHandleRegistry.ts`, `hookNameInspector.ts`) — the only internal capability that is explicitly *not* wired into the always-on discovery pipeline; reached only through `Insight.inspectHookNames()`
- Private React Context

This separation allows internal refactoring without introducing breaking API changes.

---

# Folder Structure

Current structure:

```text
packages/react
│
├── src
│   ├── createInsight.ts
│   ├── createInsight.test.ts
│   ├── InsightProvider.tsx
│   ├── InsightProvider.test.tsx
│   ├── types.ts
│   ├── index.ts
│   │
│   ├── context/
│   │   ├── InsightContext.ts
│   │   ├── InsightContext.test.ts
│   │   └── index.ts
│   │
│   ├── hooks/
│   │   ├── useInsight.ts
│   │   └── index.ts
│   │
│   └── internal/
│       ├── component.ts
│       ├── componentRegistry.ts
│       ├── componentRegistry.test.ts
│       ├── getInternalInsight.ts
│       ├── index.ts
│       ├── root.ts
│       ├── rootRegistry.ts
│       ├── rootRegistry.test.ts
│       ├── runtime.ts
│       ├── useInsightLifecycle.ts
│       ├── useInsightLifecycle.test.tsx
│       ├── useRootLifecycle.ts
│       │
│       ├── discovery/
│       │   ├── discoveredComponent.ts
│       │   ├── fiberAdapter.ts
│       │   ├── fiberAdapter.test.ts
│       │   ├── fiberHandleRegistry.ts
│       │   ├── fiberHandleRegistry.test.ts
│       │   ├── dispatcherAccess.ts
│       │   ├── hookAdapter.ts
│       │   ├── hookAdapter.test.ts
│       │   ├── hookInspector.ts
│       │   ├── hookInspector.test.ts
│       │   ├── hookNameInspector.ts
│       │   ├── hookNameInspector.test.tsx
│       │   ├── hookValuePreview.ts
│       │   ├── hookValuePreview.test.ts
│       │   ├── contextInspector.ts
│       │   ├── contextInspector.test.ts
│       │   ├── componentMapper.ts
│       │   ├── componentMapper.test.ts
│       │   ├── traversal.ts
│       │   └── traversal.test.ts
│       │
│       └── plugins/
│           ├── componentDiscoveryPlugin.ts
│           ├── componentDiscoveryPlugin.test.ts
│           ├── rootLifecyclePlugin.ts
│           └── rootLifecyclePlugin.test.ts
│
├── tsup.config.ts
├── tsconfig.json
└── vitest.config.ts
```

Note: `useComponentDiscovery.ts` was removed (2026-07-21) — its logic
was absorbed into `createInsight()`'s eager registration. There is no
longer a React hook for Component Discovery.

Note: `RootRegistry.test.ts` and `context/Insightcontext.test.ts` were
originally created with inconsistent filename casing relative to their
source files (`rootRegistry.ts`, `InsightContext.ts`); harmless on
Linux/CI since imports use explicit paths, but corrected here for
documentation accuracy. If the actual filenames in the repository
still use the old casing, treat that as a pending cosmetic cleanup,
not a functional issue.

---

# Module Responsibilities

## createInsight.ts

Creates the public `Insight` instance.

Responsibilities:

- Create the internal Runtime.
- Create the internal RootRegistry.
- Create the internal ComponentRegistry.
- Register the Component Discovery plugin eagerly (synchronously, before returning) — see "Component Discovery" above.
- Hide Runtime implementation details.
- Delegate Runtime operations.
- Expose `getComponents()` and `getComponent(id)` (both map `ComponentNode` → public `ComponentSnapshot` via a shared `toSnapshot()` helper).
- Expose `onChange(listener)`, delegating to `ComponentRegistry.subscribe()`.
- Expose `inspectHookNames(id)`, delegating to `hookNameInspector.ts`'s `resolveHookNames()` after resolving a fiber handle and dispatcher ref; returns `undefined` if either is unavailable.
- Return the public API.

---

## InsightProvider.tsx

Provides the `Insight` instance through React Context.

Responsibilities:

- React Context Provider
- Context wiring
- Internal root lifecycle integration (`useInsightLifecycle` → `useRootLifecycle` only; Component Discovery is not registered here)

Must not implement Runtime logic.

---

## hooks/

Contains the public React hooks.

Current hooks:

- `useInsight()`

Future hooks may include:

- `useRuntimeEvents()`
- `usePlugin()`
- `useTimeline()`
- A `@react-insight/inspector`-side `useComponentInspection()`, once a real UI consumer justifies it (see "Package Responsibilities" above)

---

## componentRegistry.ts

Stores the internal representation of mounted React components. It is the sole owner of component lifecycle state.

Responsibilities:

- Register components (`register()`, throws on duplicate id — used where a duplicate is a genuine error).
- Synchronize discovered components without throwing on an existing id (`sync()` — decides mount vs. update by comparing against existing state; when an update genuinely changes something — either `rendered: true`, or any of `rootId`/`displayName`/`parentId`/`hooks`/`contexts` differing from what's stored — updates those fields and schedules a notification; otherwise the call is a no-op. Structural fields updating whenever they differ, not only when `rendered` is `true`, is what still allows the discovery pipeline's `"pending"`-rootId fallback to self-heal for free. See `DECISIONS.md`, 2026-08-23.)
- Notify subscribers of meaningful changes (`subscribe()`/`scheduleNotify()`), batched via `queueMicrotask()`, wired into `sync()` and `markUnmounted()`, backing `Insight.onChange()`. See `DECISIONS.md`, 2026-08-04 and 2026-08-23.
- Unregister components (`unregister()` — hard removal), or mark them unmounted while preserving their history (`markUnmounted()` — sets `status: "unmounted"` and `unmountedAt`, keeps the record).
- Lookup components (`get(id)`, `has(id)`, `values()`, `size` — all now covered by dedicated regression tests, closing a coverage gap identified in a 2026-08-24 review; see `DECISIONS.md`).
- Maintain framework-agnostic component state (`status`, `mountedAt`, `unmountedAt`, `renderCount`, `lastRenderedAt`, `hooks`, `contexts`).

Has no knowledge of React Fiber or how components were discovered.

`ComponentNode.children` was removed (2026-07-21): set at creation, never read or written anywhere else in the codebase — a placeholder field with no producer or consumer.

---

## internal/discovery/

Contains the Component Discovery pipeline, plus the on-demand hook name resolution capability (which is deliberately *not* part of the always-on pipeline — see "On-demand Hook Name Resolution" above). Each pipeline module maps to one layer of the contract defined in `REACT_RUNTIME_ARCHITECTURE.md`, Section 6.

### hookAdapter.ts

Exports `installReactDevtoolsHook()` (public, standalone — see "Public API" above) and `connectHookAdapter()` (internal, used by `componentDiscoveryPlugin`).

`installReactDevtoolsHook()` installs `__REACT_DEVTOOLS_GLOBAL_HOOK__` if absent, with a stub that includes a working `inject()` and `supportsFiber: true` — not just the commit-notification callbacks — since React's renderer bootstrap requires a successful `inject()` call to consider itself connected.

`connectHookAdapter()` calls `installReactDevtoolsHook()` defensively, then chains any existing `onCommitFiberRoot` / `onCommitFiberUnmount` instead of overwriting them, and isolates callback errors so they never reach React's renderer.

Note: this module was *not* extended to capture `currentDispatcherRef` for on-demand hook name resolution — that turned out to have a simpler, more direct solution; see `dispatcherAccess.ts` below.

### fiberAdapter.ts

Extracts the traversal entry point from a raw `FiberRoot` (`getFiberTraversalEntry`), and validates/narrows a raw unmount value into a Fiber-shaped object (`asFiberNode`). The only module allowed to know the shape of a raw Fiber/FiberRoot — including `alternate` (used for identity resolution), `memoizedProps`/`memoizedState` (used for render detection), `pendingProps` (optional; read only by `hookNameInspector.ts` when re-invoking a component), the `HookNode` type describing a single node of a function component's hooks linked list (used by Hook Inspector and, on-demand, Hook Name Inspector), and the `ContextDependencyNode` type describing a single node of a fiber's context dependency list (used by Context Inspector).

### fiberHandleRegistry.ts

The first module in this codebase to retain a live Fiber reference beyond a single synchronous call. A `Map<ComponentId, FiberNode>`, written by Traversal on every commit (`setFiberHandle()`), read on-demand by `createInsight.ts`'s `inspectHookNames()` (`getFiberHandle()`), and explicitly cleared by `componentDiscoveryPlugin.ts`'s `onUnmount` (`deleteFiberHandle()`) to bound memory. See "On-demand Hook Name Resolution" above for why this retention is necessary and what would leak without the unmount cleanup.

### dispatcherAccess.ts

Best-effort access to React's currently-active hooks dispatcher slot, read directly from the `react` package's own internals (`__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H` on React 19, with a pre-19 `.ReactCurrentDispatcher.current` fallback) rather than through this package's own DevTools hook. Used exclusively by `hookNameInspector.ts`. Returns `undefined` where these internals aren't available (most likely: production builds), which callers must treat as "on-demand hook name resolution unavailable right now", not an error condition.

### traversal.ts

Walks a Fiber tree from the entry point, filtering to function/class component fibers only, and assigns stable per-Fiber ids via a `WeakMap` (`getFiberId`, exported so unmount handling can resolve the same id). Resolves whether each fiber was actually rendered this commit (vs. merely present or merely cloned along the reconciliation path) by comparing `memoizedProps`/`memoizedState` against a self-maintained last-observed-values snapshot per stable id, not against Fiber object identity (`resolveFiberIdentity`; see `DECISIONS.md`, 2026-07-26). Also calls Hook Inspector and Context Inspector for each component fiber to produce its `hooks`/`contexts` summaries, and records a fiber handle for the component in `fiberHandleRegistry.ts` (2026-08-24). Produces `DiscoveredComponent[]`, each carrying `rendered: boolean`, `hooks: HookSummary[]`, and `contexts: ContextSummary[]`.

### hookInspector.ts

Walks a function component Fiber's hooks linked list (`fiber.memoizedState`) and classifies each hook by structural shape alone (`classifyHook()`), producing `HookSummary[]` (`inspectHooks()`). Guards against class components via `isClassComponentType()` (exported since 2026-08-24 specifically so `hookNameInspector.ts` can reuse the same check rather than duplicating it). For hooks classified as `kind: "state"`, `"ref"`, or `"memo-like"` (extended from `state`-only on 2026-08-24), delegates to `hookValuePreview.ts` to attach a `value` preview; other kinds carry no `value`. Never re-renders or invokes user code. See "Hook Tracking (structural)" above for the full design rationale and known limitations.

### hookValuePreview.ts

Pure, side-effect-free translation from an arbitrary JS value (a hook's `memoizedState`, or — as of 2026-07-29 — a Context's `memoizedValue`) to a shallow, circular-safe preview (`previewHookValue()`): primitives pass through unchanged (strings capped at `MAX_STRING_LENGTH = 200` characters as of 2026-08-24, truncated with a `"… (N chars total)"` suffix); a plain object or array is walked exactly one level, with any nested object/array/function/class-instance/etc. replaced by a `{ __type: string }` descriptor rather than recursed into, and capped at 20 entries (`MAX_PREVIEW_ENTRIES`). Circular-reference safety is a structural property of never recursing past depth 1, not an explicit `seen`-set guard. Never invokes functions found in the value. See `DECISIONS.md`, 2026-07-28 and 2026-08-24 (string cap, found via Playground once `ref` values were previewed for the first time and surfaced an unbounded string in `InsightDebugPanel`'s own snapshot ref). Despite the name (kept for historical/import-path stability), this module is no longer hook-specific — Context Inspector reuses it unchanged.

### hookNameInspector.ts

**On-demand only — not part of the always-on pipeline.** Exports `resolveHookNames(fiber, dispatcherRef)`, which re-invokes a function component's `type` with an instrumented dispatcher swapped into the slot `dispatcherAccess.ts` resolves, to recover exact built-in hook names and one level of enclosing custom hook name. See "On-demand Hook Name Resolution" above for the full design. Never mutates real hook state; suppresses `console.*` during the call; always restores the real dispatcher in a `finally` block; returns `undefined` (never throws) if the fiber isn't a plain function component or if re-invocation itself errors.

### contextInspector.ts

Walks a fiber's context dependency list (`fiber.dependencies.firstContext` — separate from the hooks linked list entirely) and produces a structural summary per distinct Context (`ContextSummary[]`, `inspectContexts()`): a `displayName` (from the public `Context.displayName` convention, falling back to `"Context"`) and a `value` (via `hookValuePreview.ts`'s `previewHookValue()`, unchanged). Deduplicates by `context` object identity while walking the chain, to stay correct regardless of a StrictMode-related duplicate-node anomaly observed during validation. See "Context Tracking (structural)" above for the full design rationale and known limitations.

### componentMapper.ts

Pure, stateless translation from `DiscoveredComponent` to `ComponentSyncInput` (`id`, `rootId`, `displayName`, `parentId`, `rendered`, `hooks`, `contexts`). Never decides lifecycle state itself.

### discoveredComponent.ts

Defines the `DiscoveredComponent` type — the internal contract between Traversal and the Mapper. Never crosses the Mapper boundary.

---

## internal/plugins/componentDiscoveryPlugin.ts

Wires the discovery pipeline into the Runtime plugin lifecycle. Registered eagerly by `createInsight()` — see "Component Discovery" above for why this is not effect-based.

Responsibilities:

- Connect the Hook Adapter on `setup()`.
- On commit: record the commit on the active root if one is registered (`RootRegistry.recordCommit()`); run Traversal (including Hook Inspector and Context Inspector, and fiber-handle recording) + Mapper using the active root's id, or a `"pending"` fallback if no root is registered yet; call `ComponentRegistry.sync()` for each discovered component.
- On unmount: resolve the Fiber id, call `ComponentRegistry.markUnmounted()` (preserving the component record instead of removing it), and call `fiberHandleRegistry.delete()` (added 2026-08-24, to bound the fiber handle registry's memory).
- Disconnect the Hook Adapter on `destroy()`.

Follows the same `definePlugin()` pattern as `rootLifecyclePlugin`.

---

## useInsightLifecycle.ts

Acts as the internal orchestration point for React integration.

Responsibilities:

- Coordinate `useRootLifecycle`. (Component Discovery is registered eagerly by `createInsight()`, not coordinated here — see "Component Discovery" above.)
- Keep the public API isolated from React internals.
- Contains no feature-specific logic itself.

---

## useRootLifecycle.ts

Coordinates the React root lifecycle with the internal Root Lifecycle Plugin.

Responsibilities:

- Create the Root Lifecycle Plugin
- Register the plugin on mount, unregister on cleanup — both **serialized** through a per-hook promise chain (not fired independently), to remain correct under React 18+ StrictMode's development-mode mount → cleanup → mount double-invoke. See `DECISIONS.md`, 2026-07-21.
- Synchronize RootRegistry with React lifecycle

---

## context/

Contains internal React Context definitions.

The Context is considered an implementation detail.

Applications should always consume hooks instead of the Context directly.

---

## internal/plugins/

Contains internal Runtime integration plugins.

Current plugins:

- Root Lifecycle Plugin (effect-based registration)
- Component Discovery Plugin (eager registration, from `createInsight()`)

These plugins are not part of the public API and may evolve independently from the public React interface.

---

## internal/

Contains private implementation details.

Current contents:

- Runtime symbol
- Internal Runtime holder types
- Internal Runtime helpers
- Internal Root model (including commit counting)
- RootRegistry
- Internal Component model (including render tracking, structural hook tracking, structural context tracking, and unmount history)
- ComponentRegistry
- Component Discovery pipeline (`discovery/`), including the one public exception, `installReactDevtoolsHook()`
- On-demand hook name resolution (`discovery/dispatcherAccess.ts`, `discovery/fiberHandleRegistry.ts`, `discovery/hookNameInspector.ts`) — reachable only through the public `Insight.inspectHookNames()`, never exported directly
- Root lifecycle hook (`plugins/`)
- Internal lifecycle plugins (`plugins/`)

Nothing else inside this directory is part of the public API.

---

## index.ts

Exports only the supported public API.

Current exports:

- `createInsight`
- `installReactDevtoolsHook`
- `InsightProvider`
- `useInsight`
- `Insight`
- `ComponentSnapshot`
- `InspectedHookName` (added 2026-08-24 — the return element type of `Insight.inspectHookNames()`; exported as a standalone named type, unlike `HookKind`/`HookSummary`/`ContextSummary`, because it is itself a top-level method return type rather than a field nested inside `ComponentSnapshot`)

Internal modules must never be re-exported, except `installReactDevtoolsHook` (documented exception — see "Internal Architecture" above). `HookKind`/`HookSummary`/`HookValuePreview`/`ContextSummary` are not exported separately; they are inlined into `ComponentSnapshot.hooks`'/`ComponentSnapshot.contexts`' element types, since there is no current consumer needing them as standalone named types.

---

# Testing Strategy

The React package follows the same quality standards as the Core package.

Current test coverage includes:

- `createInsight()`, including `getComponents()`, `getComponent(id)`, `inspectHookNames(id)`, and eager Component Discovery registration (a commit observed before `InsightProvider` even mounts)
- `InsightProvider`
- `useInsight()`
- `useInsightLifecycle()` under real React `<StrictMode>` rendering (register/unregister serialization — no console errors, registry ends up correctly populated)
- `RootRegistry`, including `recordCommit()`
- `ComponentRegistry` (`sync()` mount/update behavior — including per-field dirty-check granularity for `rootId`/`displayName`/`parentId` individually, not just `hooks`/`contexts` — `markUnmounted()`, render-count accounting only incrementing when `rendered: true`, `has()`/`values()`/`unregister()`'s untracked-id path, `subscribe()`/`onChange()` notification)
- Root Lifecycle Plugin
- Component Discovery Plugin (commit/sync, commits that precede root registration — `"pending"` rootId and self-heal on the next commit, unmount via `markUnmounted()`, fiber handle cleared on unmount, disconnect on destroy)
- Provider lifecycle integration
- Mount / Unmount synchronization
- Public API encapsulation
- Fiber Adapter (`getFiberTraversalEntry`)
- Fiber Handle Registry (set/get/delete/overwrite)
- Traversal (filtering, parent resolution, stable ids via `current`/`alternate` identity, `rendered` detection via last-observed props/state comparison — including cloned-but-bailed-out ancestors, recycled direct-hit fibers, and repeated unrelated commits after a component's last real update — and fiber handle recording)
- Hook Inspector (`classifyHook()` per hook shape — state, ref, memo-like, effect, layout-effect, unknown; hook order preservation across a multi-hook chain; class components returning an empty array instead of misreading `this.state`; `value` present for `state`/`ref`/`memo-like` kinds)
- Hook Value Preview (`previewHookValue()` — primitives, string-length capping at the top level and nested inside objects, shallow object/array preview, nested structures described by type not recursed, functions described without invocation, class instances described by constructor name, self-referential/circular values handled without throwing, large arrays/objects capped)
- Hook Name Inspector (`resolveHookNames()`, tested against **real** React rendering via `@testing-library/react` rather than plain fixtures — `useState`/`useReducer` disambiguation, `useMemo`/`useCallback` disambiguation, custom hook name resolution, no `customHookName` when called directly in the component body, no real hook-state mutation across repeated calls, console suppression during re-invocation, graceful `undefined` on re-invocation error, `undefined` for class components)
- Component Mapper (structural translation, including `rendered`, `hooks`, and `contexts`)
- Hook Adapter (`installReactDevtoolsHook()` idempotency and stub shape including `inject()`, `connectHookAdapter()` installation, chaining, error isolation, disconnect)
- Context Inspector (`inspectContexts()` — empty/absent dependency list, single and multiple distinct contexts, `displayName` resolution and its fallback to `"Context"`, identity-based deduplication of repeated dependency nodes, reuse of `previewHookValue()` for the `value` field, no leakage of the raw context/dependency object)

**End-to-end validation (Playground):** unit tests alone were insufficient to catch several real bugs in this subsystem, because they invoke `hook.onCommitFiberRoot(...)` directly rather than going through React's actual `inject()`-based connection handshake or real effect/StrictMode timing. Playground renders a real component tree through `InsightProvider` and is the required final check for any change to Component Discovery, Render Tracking, Hook Tracking, Context Tracking, or on-demand hook name resolution. For the latter specifically, Playground validation carries extra weight, since even `@testing-library/react`'s jsdom environment cannot fully guarantee real-browser dispatcher behavior. See `DECISIONS.md`, 2026-07-21, 2026-07-27, 2026-07-29, and 2026-08-24.

Every public API should have automated tests before new features are introduced.

---

# Design Rules

- Core remains framework-agnostic.
- React owns React integration only.
- Runtime remains internal.
- Runtime exclusively owns plugin lifecycle.
- Consumers interact through `Insight`, with one deliberate exception: `installReactDevtoolsHook()`, which must be callable before an `Insight` instance exists.
- React Context is private.
- Hooks are the public access layer.
- Root lifecycle integration is isolated behind an internal effect-based plugin (`useRootLifecycle`).
- Component Discovery integration is isolated behind an internal plugin, registered **eagerly** by `createInsight()` rather than by an effect-based hook — a deliberate deviation from the root lifecycle pattern, because Component Discovery must observe the tree's first commit, which no effect can ever do.
- Register/unregister calls originating from React effects are serialized (never fired independently), to remain correct under React StrictMode's development-mode double-invoke.
- No type whose name or shape depends on React Fiber crosses the Mapper boundary.
- `ComponentRegistry` is the sole owner of component lifecycle state; upstream discovery layers (Traversal, Mapper, Hook Inspector, Context Inspector) remain stateless.
- Unmount preserves component history (`markUnmounted()`) rather than discarding it; `unregister()` remains available for hard removal where that is genuinely intended.
- No field or method is added to a domain model without a real, current consumer (`ComponentNode.children` was removed for violating this).
- Runtime observation stays zero-instrumentation and always-on (no `<Profiler>`, no re-render, no wrapped user code) for Render Tracking, structural Hook Tracking (including `state`/`ref`/`memo-like` hook value previews), and structural Context Tracking (including its value previews) — all safely readable from already-committed Fiber state, no re-invocation needed.
- **On-demand hook name resolution (`Insight.inspectHookNames()`) is the one deliberate, documented exception to the zero-instrumentation rule above** — it genuinely re-invokes user code, and is therefore exposed as an explicit, separate, opt-in API rather than folded into the always-on `hooks` field, and must never be called automatically or wired into the discovery pipeline.
- Retaining a live Fiber reference beyond a single commit (`fiberHandleRegistry.ts`) is permitted only for this one on-demand capability, and must always be paired with cleanup on unmount to bound memory.
- Serialization logic (`previewHookValue()`) is shared across every feature that needs an arbitrary-value preview, rather than reimplemented per feature — Context Tracking, and the `ref`/`memo-like` value preview extension, both reused it unchanged rather than duplicating shallow/circular-safety or bounding logic.
- "Inspector implementation" (presentation/orchestration on top of `Insight` data) belongs in `@react-insight/inspector`, not this package — this package owns only the underlying capability (`inspectHookNames()`) that Inspector-style consumers need.
- Public API remains minimal and stable.
- Internal implementation may evolve without breaking consumers.