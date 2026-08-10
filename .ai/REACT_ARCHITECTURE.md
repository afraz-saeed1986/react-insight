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

Those responsibilities belong to other packages.

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
- Exposing `getComponents()`, mapping internal `ComponentNode` records to the public `ComponentSnapshot` shape.

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
               since sync() updates rootId unconditionally)
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

Because discovery now connects before any root is necessarily registered (root registration is still effect-based), `onCommit` no longer bails out when `RootRegistry` is empty. Components discovered before a root registers are tagged with a `"pending"` `rootId`; the next real commit self-heals this once the real root registers (`ComponentRegistry.sync()` already updates `rootId` unconditionally on every commit).

### Hook connection requires two things, not one

`connectHookAdapter()` calls `installReactDevtoolsHook()` defensively (in case the application forgot to call it early), but installing the hook object alone is not sufficient. React's real renderer bootstrap (`injectInternals`) calls `hook.inject(rendererInternals)` once, at `react-dom` module-load time, to register itself; if that call throws (e.g. because `inject()` doesn't exist) or the hook wasn't present yet, React never calls `onCommitFiberRoot`/`onCommitFiberUnmount` for the rest of that page session. The installed stub therefore includes a working `inject()` (assigns and returns an incrementing renderer id) and `supportsFiber: true`, not just the two commit-notification callbacks. This was a real, previously-shipped bug — the original stub was `{ renderers: new Map() }` only — found via Playground, not a unit test (existing tests call `hook.onCommitFiberRoot(...)` directly, bypassing `inject()` entirely). See `DECISIONS.md`, 2026-07-21.

The full per-layer contract (responsibility, input, output, forbidden knowledge) for Hook Adapter, Fiber Adapter, Traversal, Mapper and Component Registry is defined in `REACT_RUNTIME_ARCHITECTURE.md`, Section 6.

Architectural boundary: no type whose name or shape depends on React Fiber crosses the Mapper. Only `ComponentNode` (and its structural subset, `ComponentSyncInput`) is allowed to travel from the Mapper down into `ComponentRegistry` and, eventually, Plugins.

Unmount handling marks the component record as unmounted (`status: "unmounted"`, `unmountedAt: <timestamp>`) rather than removing it from the registry, preserving its history for future consumers such as Timeline or Inspector. See `DECISIONS.md`, 2026-07-19.

Render Tracking uses the Fiber `current`/`alternate` machinery for two separate purposes, resolved together by `resolveFiberIdentity()`: a stable **id** (a direct or `alternate` WeakMap hit reuses the existing id; no hit at all means first mount, minting a new one), and a **`rendered` verdict**, which is _not_ derived from which hit occurred. React recycles at most two Fiber objects per component indefinitely, so object identity alone is only a reliable "unchanged" signal for a component's first update — the same object reference reappears as `current` again on every second-and-later real update, and comparing against `alternate` goes stale once a component stops receiving real updates while the rest of the tree keeps committing. Instead, `rendered` compares the incoming `memoizedProps`/`memoizedState` against a self-maintained `lastObservedValues` map (keyed by the stable id, updated on every resolution), so every check is relative to "changed since the last time this id was seen" rather than to a potentially-stale Fiber object. `DiscoveredComponent.rendered` carries this signal through to `ComponentNode.renderCount` / `lastRenderedAt`. See `DECISIONS.md`, 2026-07-20 and 2026-07-26.

This closes what was previously documented here as a known accuracy limitation: React clones (assigns a new Fiber object to) every ancestor and sibling along the reconciliation path down to an actually-updated component, even when their own function body bailed out (didn't re-execute); the props/state comparison correctly reports these as not rendered regardless of the object-identity churn. Root-level `RootRegistry.commitCount` was never affected by any version of this, since it doesn't depend on Fiber identity. See `DECISIONS.md`, 2026-07-26, for the two intermediate regressions (each caught only by a differently-shaped real-browser Playground test) that the final design had to survive.

### Hook Tracking (structural)

`inspectHooks()` walks the hooks linked list rooted at a function component Fiber's `memoizedState` and produces a `HookSummary[]` (`{ index, kind }`) for each discovered component, threaded through the same pipeline as `rendered`: `DiscoveredComponent.hooks` → `ComponentSyncInput.hooks` → `ComponentNode.hooks` → `ComponentSnapshot.hooks`. Unlike `rendered`, `hooks` is updated unconditionally on every `sync()` (a structural fact like `displayName`, not an accumulated stat like `renderCount`).

This is a **structural-only, always-on** inspection: no re-render, no instrumented dispatcher, consistent with the same zero-instrumentation positioning already established for Render Tracking (`DECISIONS.md`, 2026-07-20). It was deliberately chosen over the technique real React DevTools uses (`react-debug-tools`'s `inspectHooksOfFiber`, which re-invokes the component function with an instrumented dispatcher to recover hook _names_, including custom hook boundaries, via call-stack parsing) — that technique is real per-inspection work, intended by React's own team to run on-demand only, not on every commit for every component. See `DECISIONS.md`, 2026-07-27.

Because `isComponentFiber()` elsewhere in this package intentionally treats function and class components alike (both are `typeof === "function"` in JavaScript — a distinction that doesn't matter for identity/render-detection), `inspectHooks()` independently guards against class components, whose `memoizedState` is `this.state`, not a hooks list: it checks `type.prototype.isReactComponent`, the same marker React's own reconciler uses internally to decide whether to construct a class instance, rather than an unstable Fiber `tag` number. Class components report `hooks: []`.

**Known limitations** (confirmed via a controlled Playground experiment against a probe component exercising every common hook, not assumed — see `DECISIONS.md`, 2026-07-27):

- `useState` and `useReducer` share an identical Fiber-level shape and both report `kind: "state"`.
- `useMemo` and `useCallback` share an identical shape and both report `kind: "memo-like"`.
- `useEffect` and `useLayoutEffect` _are_ distinguishable, via a bitmask on the Effect object's `tag` field (confirmed empirically: `9` = `useEffect`, `5` = `useLayoutEffect`).
- `useContext` (and any custom hook that is purely a `useContext` wrapper) is entirely invisible to `inspectHooks()` — `readContext()` does not consume a hook slot at all, so no entry appears in the hooks list. (As of `DECISIONS.md`, 2026-07-29, Context values are tracked separately — see "Context Tracking (structural)" below — so this is a hooks-list-specific gap only, not a real data gap for Context values.)
- No hook or custom-hook _name_ is available from this technique, for any kind — see above. As of `DECISIONS.md`, 2026-07-28, `state`-kind hooks (`useState`/`useReducer`) do carry a shallow, circular-safe _value_ preview (`previewHookValue()`, one level deep — nested objects/arrays/functions/class instances are described by type, not walked further), read directly from `memoizedState` with no re-render, since values (unlike names) require no instrumented dispatcher for this kind. `ref`/`memo-like` hooks still carry no value in this slice.

### Context Tracking (structural)

`inspectContexts()` walks a completely separate linked list from the hooks list — `fiber.dependencies.firstContext` — which React maintains for any fiber, function or class component alike, that calls `useContext()`/`readContext()`. It produces a `ContextSummary[]` (`{ index, displayName, value }`) per distinct Context, threaded through the same pipeline as `hooks`: `DiscoveredComponent.contexts` → `ComponentSyncInput.contexts` → `ComponentNode.contexts` → `ComponentSnapshot.contexts`, updated unconditionally on every `sync()` like other structural fields.

Unlike hook values, no re-render is needed here either: `memoizedValue` already sits directly on each dependency node, populated by React itself on every commit that reads the Context — there is no need to walk up to the `Provider` fiber. `value` reuses `previewHookValue()` (2026-07-28) unchanged, since a Context's current value has exactly the same "arbitrary JS value, must stay safe and bounded" shape as a `state`-kind hook's value.

**Names are recoverable here, unlike hooks.** `context.displayName` is a documented, publicly-supported convention — the same one real React DevTools uses to label context consumers — not a private internal. `resolveDisplayName()` falls back to the literal string `"Context"` when the consuming application never set it.

**Deduplication is a deliberate defensive design choice, not an assumption.** A controlled Playground experiment (a single `useContext()` call, logging `fiber.dependencies` directly) observed **two** chained dependency nodes for that one call, both pointing at the same `context` object — most likely caused by React 18+ StrictMode's development-mode double-invocation of the component body without a full reset of the dependency list between invocations (Playground renders through `<StrictMode>`). Root cause not fully confirmed. `inspectContexts()` deduplicates by `context` object identity while walking the chain, so the output is correct regardless of the exact cause, rather than assuming the list always has exactly one node per `useContext()` call. See `DECISIONS.md`, 2026-07-29.

**Known limitation, not yet addressed:** the library's own internal `InsightContext` (used by `useInsight()`) has no `displayName` set, so it surfaces in a consuming app's `contexts` as the generic `"Context"` label with the full internal `Insight` instance as its value preview. Noticed during validation; cosmetic, cheap to fix, not yet prioritized. See `DECISIONS.md`, 2026-07-29.

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
- ComponentRegistry (including render tracking, structural hook tracking, structural context tracking, and unmount history)
- Component Discovery pipeline (Hook Adapter, Fiber Adapter, Traversal, Mapper, Hook Inspector, Context Inspector)
- Internal Component Discovery plugin, registered eagerly from `createInsight()`
- Future React-specific features

The React package consumes the Runtime provided by `@react-insight/core`.

It must never reimplement Runtime behavior.

---

## Future Packages

The architecture supports additional packages without requiring changes to the Core API.

Examples:

- `@react-insight/devtools`
- `@react-insight/inspector`
- `@react-insight/timeline`
- `@react-insight/plugins`

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
│       ├── RootRegistry.test.ts
│       ├── runtime.ts
│       ├── useInsightLifecycle.ts
│       ├── useInsightLifecycle.test.tsx
│       ├── useRootLifecycle.ts
│       │
│       ├── discovery/
│       │   ├── discoveredComponent.ts
│       │   ├── fiberAdapter.ts
│       │   ├── fiberAdapter.test.ts
│       │   ├── hookAdapter.ts
│       │   ├── hookAdapter.test.ts
│       │   ├── hookInspector.ts
│       │   ├── hookInspector.test.ts
│       │   ├── hookValuePreview.ts
│       │   ├── hookValuePreview.test.ts
│       │   ├── contextInspector.ts
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

Note: `contextInspector.ts` has no dedicated `.test.ts` file yet
(2026-07-29) — it was validated end-to-end in Playground (see "Context
Tracking (structural)" above) but not yet unit-tested in isolation,
unlike every other discovery-pipeline module. This is a real,
acknowledged gap against this project's "every public-facing module
gets dedicated unit tests" standard, not an intentional exception —
see ROADMAP.md.

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
- Expose `getComponents()` (maps `ComponentNode` → public `ComponentSnapshot`).
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

---

## componentRegistry.ts

Stores the internal representation of mounted React components. It is the sole owner of component lifecycle state.

Responsibilities:

- Register components (`register()`, throws on duplicate id — used where a duplicate is a genuine error).
- Synchronize discovered components without throwing on an existing id (`sync()` — decides mount vs. update by comparing against existing state; updates `rootId`/`displayName`/`parentId`/`hooks`/`contexts` unconditionally on every call, which is what allows the discovery pipeline's `"pending"`-rootId fallback to self-heal for free).
- Unregister components (`unregister()` — hard removal), or mark them unmounted while preserving their history (`markUnmounted()` — sets `status: "unmounted"` and `unmountedAt`, keeps the record).
- Lookup components.
- Maintain framework-agnostic component state (`status`, `mountedAt`, `unmountedAt`, `renderCount`, `lastRenderedAt`, `hooks`, `contexts`).

Has no knowledge of React Fiber or how components were discovered.

`ComponentNode.children` was removed (2026-07-21): set at creation, never read or written anywhere else in the codebase — a placeholder field with no producer or consumer.

---

## internal/discovery/

Contains the Component Discovery pipeline. Each module maps to one layer of the contract defined in `REACT_RUNTIME_ARCHITECTURE.md`, Section 6.

### hookAdapter.ts

Exports `installReactDevtoolsHook()` (public, standalone — see "Public API" above) and `connectHookAdapter()` (internal, used by `componentDiscoveryPlugin`).

`installReactDevtoolsHook()` installs `__REACT_DEVTOOLS_GLOBAL_HOOK__` if absent, with a stub that includes a working `inject()` and `supportsFiber: true` — not just the commit-notification callbacks — since React's renderer bootstrap requires a successful `inject()` call to consider itself connected.

`connectHookAdapter()` calls `installReactDevtoolsHook()` defensively, then chains any existing `onCommitFiberRoot` / `onCommitFiberUnmount` instead of overwriting them, and isolates callback errors so they never reach React's renderer.

### fiberAdapter.ts

Extracts the traversal entry point from a raw `FiberRoot` (`getFiberTraversalEntry`), and validates/narrows a raw unmount value into a Fiber-shaped object (`asFiberNode`). The only module allowed to know the shape of a raw Fiber/FiberRoot — including `alternate` (used for identity resolution), `memoizedProps`/`memoizedState` (used for render detection), the `HookNode` type describing a single node of a function component's hooks linked list (used by Hook Inspector), and the `ContextDependencyNode` type describing a single node of a fiber's context dependency list (used by Context Inspector).

### traversal.ts

Walks a Fiber tree from the entry point, filtering to function/class component fibers only, and assigns stable per-Fiber ids via a `WeakMap` (`getFiberId`, exported so unmount handling can resolve the same id). Resolves whether each fiber was actually rendered this commit (vs. merely present or merely cloned along the reconciliation path) by comparing `memoizedProps`/`memoizedState` against a self-maintained last-observed-values snapshot per stable id, not against Fiber object identity (`resolveFiberIdentity`; see `DECISIONS.md`, 2026-07-26). Also calls Hook Inspector and Context Inspector for each component fiber to produce its `hooks`/`contexts` summaries. Produces `DiscoveredComponent[]`, each carrying `rendered: boolean`, `hooks: HookSummary[]`, and `contexts: ContextSummary[]`.

### hookInspector.ts

Walks a function component Fiber's hooks linked list (`fiber.memoizedState`) and classifies each hook by structural shape alone (`classifyHook()`), producing `HookSummary[]` (`inspectHooks()`). Guards against class components via `type.prototype.isReactComponent`. For hooks classified as `kind: "state"`, delegates to `hookValuePreview.ts` to attach a `value` preview; other kinds carry no `value`. Never re-renders or invokes user code. See "Hook Tracking (structural)" above for the full design rationale and known limitations.

### hookValuePreview.ts

Pure, side-effect-free translation from an arbitrary JS value (a hook's `memoizedState`, or — as of 2026-07-29 — a Context's `memoizedValue`) to a shallow, circular-safe preview (`previewHookValue()`): primitives pass through unchanged; a plain object or array is walked exactly one level, with any nested object/array/function/class-instance/etc. replaced by a `{ __type: string }` descriptor rather than recursed into. Capped at 20 entries per object/array. Circular-reference safety is a structural property of never recursing past depth 1, not an explicit `seen`-set guard. Never invokes functions found in the value. See `DECISIONS.md`, 2026-07-28. Despite the name (kept for historical/import-path stability), this module is no longer hook-specific — Context Inspector reuses it unchanged.

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
- On commit: record the commit on the active root if one is registered (`RootRegistry.recordCommit()`); run Traversal (including Hook Inspector and Context Inspector) + Mapper using the active root's id, or a `"pending"` fallback if no root is registered yet; call `ComponentRegistry.sync()` for each discovered component.
- On unmount: resolve the Fiber id and call `ComponentRegistry.markUnmounted()`, preserving the component record instead of removing it.
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

Internal modules must never be re-exported, except `installReactDevtoolsHook` (documented exception — see "Internal Architecture" above). `HookKind`/`HookSummary`/`HookValuePreview`/`ContextSummary` are not exported separately; they are inlined into `ComponentSnapshot.hooks`'/`ComponentSnapshot.contexts`' element types, since there is no current consumer needing them as standalone named types.

---

# Testing Strategy

The React package follows the same quality standards as the Core package.

Current test coverage includes:

- `createInsight()`, including `getComponents()` and eager Component Discovery registration (a commit observed before `InsightProvider` even mounts)
- `InsightProvider`
- `useInsight()`
- `useInsightLifecycle()` under real React `<StrictMode>` rendering (register/unregister serialization — no console errors, registry ends up correctly populated)
- `RootRegistry`, including `recordCommit()`
- `ComponentRegistry` (`sync()` mount/update behavior, `markUnmounted()`, render-count accounting only incrementing when `rendered: true`, `hooks`/`contexts` updated unconditionally like other structural fields)
- Root Lifecycle Plugin
- Component Discovery Plugin (commit/sync, commits that precede root registration — `"pending"` rootId and self-heal on the next commit, unmount via `markUnmounted()`, disconnect on destroy)
- Provider lifecycle integration
- Mount / Unmount synchronization
- Public API encapsulation
- Fiber Adapter (`getFiberTraversalEntry`)
- Traversal (filtering, parent resolution, stable ids via `current`/`alternate` identity, and `rendered` detection via last-observed props/state comparison — including cloned-but-bailed-out ancestors, recycled direct-hit fibers, and repeated unrelated commits after a component's last real update)
- Hook Inspector (`classifyHook()` per hook shape — state, ref, memo-like, effect, layout-effect, unknown; hook order preservation across a multi-hook chain; class components returning an empty array instead of misreading `this.state`; `value` present only for `state`-kind hooks)
- Hook Value Preview (`previewHookValue()` — primitives, shallow object/array preview, nested structures described by type not recursed, functions described without invocation, class instances described by constructor name, self-referential/circular values handled without throwing, large arrays/objects capped)
- Component Mapper (structural translation, including `rendered`, `hooks`, and `contexts`)
- Hook Adapter (`installReactDevtoolsHook()` idempotency and stub shape including `inject()`, `connectHookAdapter()` installation, chaining, error isolation, disconnect)

**Gap, acknowledged (2026-07-29):** Context Inspector (`contextInspector.ts`) has no dedicated unit tests yet — it was validated only end-to-end in Playground (deduplication behavior, `displayName` resolution). Every other discovery-pipeline module has isolated unit-test coverage against plain fixtures; this one does not yet, and should before it is considered fully complete by this project's own standard. See ROADMAP.md.

**End-to-end validation (Playground):** unit tests alone were insufficient to catch several real bugs in this subsystem, because they invoke `hook.onCommitFiberRoot(...)` directly rather than going through React's actual `inject()`-based connection handshake or real effect/StrictMode timing. Playground renders a real component tree through `InsightProvider` and is the required final check for any change to Component Discovery, Render Tracking, Hook Tracking, or Context Tracking. See `DECISIONS.md`, 2026-07-21, 2026-07-27, and 2026-07-29.

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
- Runtime observation stays zero-instrumentation and always-on (no `<Profiler>`, no re-render, no wrapped user code) for Render Tracking, structural Hook Tracking (including `state`-kind hook value previews), and structural Context Tracking (including its value previews) — all safely readable from already-committed Fiber state, no re-invocation needed; techniques that do require re-invoking user code (hook/custom-hook _name_ resolution) are deliberately scoped as a separate, on-demand capability rather than folded into the always-on traversal pass.
- Serialization logic (`previewHookValue()`) is shared across every feature that needs an arbitrary-value preview, rather than reimplemented per feature — Context Tracking reused it unchanged rather than duplicating shallow/circular-safety logic.
- Public API remains minimal and stable.
- Internal implementation may evolve without breaking consumers.
