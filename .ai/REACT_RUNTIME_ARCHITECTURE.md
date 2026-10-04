# React Runtime Architecture

> Status: Active implementation reference
>
> Last Updated: 2026-08-25
>
> This document defines the long-term architecture of the React runtime package. It serves as the primary architectural reference for all React-specific runtime features, including component discovery, tracking, inspection, and future DevTools integration.

---

# 1. Vision

## Purpose

The React runtime is responsible for observing React applications and transforming React-specific runtime information into a framework-independent internal model that can be consumed by the rest of React Insight. The architecture described here reflects the implementation that is currently present in `@react-insight/react`, not only the original design target.

The runtime must never expose React internals to the Core package or to public APIs.

Instead, it acts as an adapter between React and the internal domain model.

The long-term objective is to provide a stable foundation for:

- Component discovery
- Component hierarchy
- Render tracking
- Hook tracking
- State tracking
- Context tracking
- Timeline generation
- Inspector
- Future DevTools integration

while keeping the Core package completely framework-agnostic.

As of 2026-08-24, "Inspector" is no longer only a long-term foundation item — its first slice (on-demand hook name resolution, `Insight.inspectHookNames()`) is implemented and consumed by the `@react-insight/inspector` package. As of 2026-08-25, Component Discovery itself (not just the on-demand layer) also recognizes `memo(...)`/`forwardRef(...)`-wrapped components, closing a gap that had made them invisible to the entire pipeline, not just Inspector. See Section 6, "Hook Name Inspector" and "What Counts as a Component Fiber", for both.

---

## High-Level Vision

React Runtime exists to translate React runtime behavior into React Insight domain objects.

React internals are considered implementation details.

React Insight domain models are considered the source of truth.

This separation allows the runtime implementation to evolve independently from the rest of the system.

---

## Long-Term Philosophy

The runtime should not become a second implementation of React DevTools.

Instead, it should provide a clean and maintainable architecture that uses React runtime information as input and produces stable domain objects as output.

Every future feature should build on those domain objects instead of depending directly on React internals.

---

# 2. Goals

The React Runtime is designed around the following goals.

## Framework Isolation

All React-specific logic must remain inside the React package.

The Core package must never import or understand React.

---

## Stable Internal Domain

React runtime data must be converted into stable internal domain models before entering the rest of the architecture.

The rest of the system should never depend on Fiber nodes or other React implementation details.

---

## Single Responsibility

Each layer has exactly one responsibility.

Examples:

- Discover components.
- Traverse runtime structures.
- Map runtime structures.
- Store domain models.
- Track changes.
- Consume tracking information.

No layer should perform responsibilities belonging to another layer.

---

## Extensibility

Future features should be added by extending existing layers rather than rewriting them.

Examples include:

- Render tracking
- Hook tracking
- Context tracking
- Performance profiling
- Timeline generation

---

## Testability

Every architectural layer should be independently testable.

Business logic should not require a running React application whenever possible.

Unit tests alone are not sufficient for this pipeline, however: several real bugs (hook connection timing, a missing `inject()` implementation, registration-timing relative to React's first commit) were only found through end-to-end testing against a real React application (Playground) — see `DECISIONS.md`, 2026-07-21. Unit tests remain necessary for algorithmic correctness (filtering, id stability, render detection); Playground remains necessary for connection/timing correctness. Hook Name Inspector (Section 6) is a partial exception to "business logic should not require a running React application whenever possible": its unit tests genuinely do require real React rendering (`@testing-library/react`), since a hand-built Fiber fixture cannot faithfully stand in for React's real dispatcher — see `DECISIONS.md`, 2026-08-24. The `memo`/`forwardRef` discovery fix (2026-08-25) reinforced this again: two of its real bugs were only found by running real code, not by reasoning about the design in advance.

---

## Performance

Runtime observation must minimize unnecessary allocations and repeated traversal.

Additional runtime work should only occur when new capabilities require it.

Performance optimizations should never compromise architectural clarity.

---

## Internal First

All runtime APIs are internal unless a real public consumer requires otherwise.

Public APIs are introduced only when justified by actual usage.

The exceptions found so far are `installReactDevtoolsHook()` and, as of 2026-08-24, `Insight.inspectHookNames()`. Neither violates this goal: `installReactDevtoolsHook()` is internal-by-default in the sense that it does nothing an application couldn't already do by installing the hook itself — it is exported only because the timing requirement it encodes (must run before `react-dom` is imported) cannot be satisfied any other way (see Section 6, Hook Adapter). `inspectHookNames()` is exported because it is the first real, demonstrated consumer need in this project for information (exact hook names, custom hook boundaries) that structural inspection can never recover — see Section 6, Hook Name Inspector.

---

# 3. Non-Goals

The runtime intentionally does not attempt to solve the following problems.

## Replace React DevTools

React Insight is not intended to replace React DevTools.

Instead, it builds its own architecture using runtime information provided by React.

---

## Mirror React Internals

Fiber trees are not part of the React Insight domain.

The runtime may read Fiber structures but must never expose them outside the adapter layer.

---

## Store React Objects

ComponentRegistry stores Component domain models.

It does not store Fiber nodes.

It does not own React objects.

The one narrow, documented exception is `fiberHandleRegistry.ts` (Section 6) — and it is deliberately *not* `ComponentRegistry`: a separate, on-demand-only registry, explicitly memory-bounded via unmount cleanup, that exists solely to support `Insight.inspectHookNames()`. `ComponentRegistry` itself still stores only `ComponentNode` domain models and has no knowledge that `fiberHandleRegistry.ts` exists.

---

## Own Application State

Application state belongs to the application.

React Insight only observes runtime behavior.

---

## Leak React Concepts

Packages outside the React runtime should not need knowledge of:

- Fiber
- ReactRoot
- React renderer internals
- DevTools hook implementation

`@react-insight/inspector` (added 2026-08-24) is the first real test of this goal against an actual second package: it consumes only `Insight.getComponent()` and `Insight.inspectHookNames()`, and has zero knowledge of Fiber, dispatchers, or any React-internal concept. It gained a real UI consumer (Playground's "Inspect" button) 2026-08-25.

---

# 4. Architecture Principles

The following principles govern every architectural decision inside the React runtime.

## Principle 1 — Layered Architecture

Each architectural layer has a single responsibility.

Dependencies always flow downward.

Upper layers consume lower layers.

Lower layers never depend on upper layers.

---

## Principle 2 — Domain First

Domain models are the source of truth.

React runtime structures are temporary inputs.

All React-specific information must be translated before entering the domain layer.

---

## Principle 3 — Framework Isolation

React-specific implementation details never leave the React package.

The Core package remains completely renderer-agnostic.

---

## Principle 4 — Stable Boundaries

Every architectural layer exposes stable contracts.

Internal implementation may evolve without affecting neighboring layers.

---

## Principle 5 — No Premature Abstraction

Abstractions are introduced only when at least one real consumer exists.

Placeholder APIs are prohibited.

Unused extension points are prohibited.

This applies in both directions: a field or method must not be added without a real consumer, and an existing field must not be left in place once it demonstrably has none (`ComponentNode.children` was removed on 2026-07-21 for exactly this reason — set at creation, never read or written anywhere else). `Insight.getComponent(id)` (2026-08-24) is a positive example of the other direction: added specifically because a real, concrete consumer (`inspectHookNames()`, and later `@react-insight/inspector`) needed single-component lookup, not speculatively.

---

## Principle 6 — Incremental Evolution

Future features extend the architecture.

They should not require rewriting previous layers.

Each completed layer becomes a stable foundation for the next one.

On-demand hook name resolution (2026-08-24) is the clearest demonstration of this principle so far: it was built entirely as new, additive layers (`dispatcherAccess.ts`, `fiberHandleRegistry.ts`, `hookNameInspector.ts`) alongside the existing pipeline, requiring zero changes to Traversal's, Hook Inspector's, or Component Registry's existing contracts — only one small addition to Traversal (recording a fiber handle) and one to the Component Discovery Plugin (clearing it on unmount). The `memo`/`forwardRef` fix (2026-08-25) reinforced this a second time: once the actual gap (`isComponentFiber()`) was located, extending it required changing only `traversal.ts` and `hookNameInspector.ts` — Hook Inspector, Context Inspector, and Render Tracking needed no changes at all, since they were already written against Fiber-instance-level state rather than `fiber.type`'s shape.

---

## Principle 7 — Internal by Default

Every new runtime capability starts as an internal implementation detail.

Promotion to the public API requires a demonstrated need and a stable design.

---

## Principle 8 — Domain Ownership

Each piece of information has exactly one owner.

Examples:

- React owns Fiber.
- Mapper owns translation.
- Registry owns domain objects.
- Tracking owns runtime history.
- Inspector owns presentation.

## Ownership must never overlap.

As of 2026-08-24, "Inspector owns presentation" has a concrete owner: `@react-insight/inspector`, not `@react-insight/react`. The React package owns only the underlying on-demand *capability* (`inspectHookNames()`); it does not combine that capability with structural data or format it for display — that is `inspectComponent()`'s job in the Inspector package.

# 5. Runtime Pipeline

## Overview

The React Runtime is organized as a unidirectional processing pipeline.

Each layer has a single responsibility and produces input for the next layer.

Information always flows downward.

Higher layers consume lower layers.

Lower layers never depend on higher layers.

The pipeline is intentionally linear to simplify reasoning, testing, and future extension.

```text
                        React Application
                               │
                               ▼
                    React Renderer Commit
                               │
                               ▼
                     DevTools Hook Adapter
                               │
                               ▼
                      Fiber Adapter
                               │
                               ▼
                        Traversal
                (isComponentFiber(): plain function,
                 class, memo(...), forwardRef(...))
                     ┌───────┼────────┐
                     ▼       ▼        ▼
               Hook Inspector  Context Inspector
                     │       │        │
                     └───────┼────────┘
                             ▼
                          Mapper
                             │
                             ▼
                    Component Registry
                             │
                             ▼
                  ComponentSnapshot API

        RootRegistry receives commit facts in parallel
        through the Component Discovery Plugin.

        Traversal also records a fiber handle per component
        (Fiber Handle Registry) — a side channel feeding the
        on-demand Hook Name Inspector, NOT part of this
        always-on downward pipeline. See "On-demand Side
        Channel" below.
```

**Implementation note (2026-07-29):** the original downstream "Tracking" layer shown in the first version of this document is not a separate implementation layer in the current code. Root-level commit tracking is owned by `RootRegistry` and invoked by the Component Discovery Plugin when a commit arrives. Per-component `rendered` detection is resolved inside Traversal using `lastObservedValues`; structural Hook Tracking is resolved by Hook Inspector; and structural Context Tracking is resolved by Context Inspector. All three component-level facts are then carried through Traversal → Mapper → Component Registry and exposed through `ComponentSnapshot`. This keeps each concern at the layer where its required input already exists and avoids introducing a consumer-only layer without a real consumer, consistent with Principle 5.

## The long-term concepts of Timeline and richer tracking remain downstream consumers that can be added later. They are not current runtime pipeline layers. Inspector, as of 2026-08-24, has begun (see "On-demand Side Channel" below and Section 6) but deliberately as a side channel outside this pipeline, not a new pipeline stage.

## On-demand Side Channel

Unlike everything else in this pipeline, on-demand hook name resolution is **not** triggered by a commit and does not flow downward through Mapper → Component Registry. It is a pull-based side channel:

```text
   Traversal (per commit)
        │
        ▼
   Fiber Handle Registry ── set on every commit, deleted on unmount
        │
        │  (time passes — arbitrarily long)
        │
        ▼
   Insight.inspectHookNames(id)  ◄── explicit, on-demand caller request
        │
        ▼
   Hook Name Inspector ── reads the retained fiber handle,
        │                  resolves the real invocable function
        │                  (unwrapping memo/forwardRef if needed),
        │                  swaps in a dispatcher via Dispatcher
        │                  Access, re-invokes it
        ▼
   InspectedHookName[] | undefined
```

This is deliberately kept separate from the main pipeline: the main pipeline's guarantees (stateless processing except where explicitly noted, one-way flow, no re-invocation of user code) do not hold for this side channel, and conflating the two would weaken those guarantees for the entire pipeline rather than scoping the exception to where it's actually needed. See Section 6, "Hook Name Inspector", for the full contract.

## Data Flow

The runtime processes a commit in the following order:

1. React commits a tree update.
2. The Hook Adapter receives the commit notification.
3. The Component Discovery Plugin records the root-level commit when a root is registered.
4. The Fiber Adapter extracts the traversal entry point.
5. Traversal walks the Fiber tree, filtering to fibers `isComponentFiber()` recognizes (plain function, class, `memo`, or `forwardRef` — the last two since 2026-08-25) and resolves stable component ids plus the `rendered` fact, and records a fiber handle per component (Fiber Handle Registry).
6. Hook Inspector resolves structural hook summaries for each component.
7. Context Inspector resolves structural context summaries for each component.
8. The Mapper converts the extracted facts into `ComponentSyncInput`.
9. Component Registry synchronizes structural state and lifecycle/render history.
10. `Insight.getComponents()`/`getComponent()` project the internal records into read-only `ComponentSnapshot` values.

Unmounts follow a separate path: React notifies the Hook Adapter, the Fiber Adapter validates the raw Fiber, the stable component id is resolved, `ComponentRegistry.markUnmounted()` preserves the component's history, and the Fiber Handle Registry's entry for that id is deleted.

On-demand hook name resolution follows neither path — see "On-demand Side Channel" above.

Every layer only knows the contracts it needs; no downstream layer requests information from React directly.

---

## Pipeline Characteristics

The pipeline is intentionally designed with the following properties.

### One-Way Data Flow

Information never flows backwards.

The Registry never requests information from React.

Tracking never manipulates React.

Inspector never modifies Registry state.

Every layer only consumes information.

The Hook Name Inspector (on-demand side channel) genuinely re-invokes user code, which reads from — but still never writes to — Registry or domain state; this remains consistent with one-way flow even though it is the one layer in this codebase that touches React beyond reading already-committed state.

---

### Stateless Processing

Traversal and Mapping should remain stateless whenever possible.

State belongs inside registries.

Tracking owns historical information.

Presentation owns visualization.

Note: Traversal's per-Fiber id assignment (`getFiberId`, via a
`WeakMap`) and its `rendered` detection (comparing a Fiber's current
`memoizedProps`/`memoizedState` against a self-maintained
`lastObservedValues` map, keyed by stable id — deliberately
independent of Fiber object identity, see `DECISIONS.md`, 2026-07-26)
are a deliberate, narrow exception to full statelessness — they
require memory of previously-seen Fiber _objects_ (for id assignment)
and previously-observed prop/state values (for `rendered` detection)
to resolve identity and change across commits. Hook Inspector, by
contrast, is fully stateless: `classifyHook()` and `inspectHooks()`
derive their result entirely from the current commit's Fiber, with no
memory of prior commits (there is nothing to "detect a change" for —
hook structure is classified fresh every time). This is still
considered "stateless" in the
architectural sense used here: it holds no _domain_ state (no
`ComponentNode`, no lifecycle status), only an implementation detail
needed to produce a correct, stateless-from-the-Registry's-perspective
output on every call.

**A second, larger exception, added 2026-08-24:** the Fiber Handle Registry is genuinely stateful in the fullest sense — it retains a live Fiber object reference across an arbitrary span of time, not just across a single traversal call. This is a deliberate, narrow, and explicitly memory-bounded exception (see Section 6), justified only because the Hook Name Inspector it feeds has no other way to locate "the current fiber for this component id" when invoked outside the commit that produced it.

---

### Clear Ownership

Each layer owns exactly one concern.

| Layer                 | Responsibility                                        |
| ---------------------- | ------------------------------------------------------ |
| Hook Adapter          | Receive React runtime notifications                    |
| Fiber Adapter         | Expose React runtime entry points; own `REACT_MEMO_TYPE`/`REACT_FORWARD_REF_TYPE` |
| Traversal             | Walk Fibers and resolve component facts (including `memo`/`forwardRef` recognition) |
| Hook Inspector        | Classify structural hook information                   |
| Context Inspector     | Inspect structural Context dependencies                |
| Mapper                | Translate extracted facts into domain data              |
| Component Registry    | Own component graph and history                        |
| Root Registry         | Own root-level commit history                          |
| Fiber Handle Registry | Own on-demand-inspectable live fiber references (2026-08-24) |
| Dispatcher Access     | Locate React's current hooks dispatcher slot (2026-08-24) |
| Hook Name Inspector   | On-demand hook name resolution via re-invocation, including `memo`/`forwardRef` unwrapping (2026-08-24, extended 2026-08-25) |
| Inspector / Timeline  | Presentation and analysis consumers (`@react-insight/inspector`, added 2026-08-24, is the first realized Inspector-layer consumer) |

---

## Why a Pipeline?

Alternative designs were evaluated.

### Direct Fiber Access

```
Inspector

↓

Fiber
```

Rejected.

Every future feature would become coupled to React internals.

---

### Registry Reading Fiber

```
Registry

↓

Fiber
```

Rejected.

The Registry would no longer be renderer-independent.

---

### Tracking Reading Fiber

```
Tracking

↓

Fiber
```

Rejected.

Each tracking subsystem would duplicate traversal logic.

---

### Chosen Design

```
React

↓

Hook

↓

Fiber

↓

Traversal

↓

Mapper

↓

Registry

↓

Tracking

↓

Inspector
```

The chosen design centralizes React-specific logic near the runtime boundary.

Every other layer operates exclusively on domain models.

**2026-08-24 addendum:** when Inspector work actually began, it did *not* slot into this diagram as a downstream consumer of `Registry`/`Tracking` output alone — it needed a side channel back to Fiber (via the Fiber Handle Registry) for the one thing structural domain models can never contain: the ability to re-invoke a component's function. This was evaluated against the same rejected alternatives above and rejected for the same reason — it would couple every future Inspector feature to Fiber. The side channel is deliberately narrow (one registry, cleared on unmount, reachable only through one on-demand method) rather than reopening general Fiber access.

**2026-08-25 addendum:** a related but distinct question arose when `memo`/`forwardRef` support was added — should "what counts as a component" be redefined per-layer (e.g. Hook Inspector deciding for itself whether a `memo`-wrapped fiber is inspectable) or in exactly one place? The existing pipeline design already answered this: `isComponentFiber()` lives solely in Traversal, and every downstream layer (Hook Inspector, Context Inspector, the on-demand side channel) simply receives fibers Traversal has already filtered. Extending `isComponentFiber()` therefore required touching only Traversal itself (plus the on-demand re-invocation logic, which independently needs to resolve the real function to call) — confirming the single-point-of-definition design was correct rather than requiring a redesign.

---

## Architectural Boundary

The most important architectural boundary exists here:

```text
React Runtime
──────────────────────────────────────────────

Hook Adapter
Fiber Adapter
Traversal
Hook Inspector
Context Inspector
Fiber Handle Registry (on-demand side channel only)
Dispatcher Access (on-demand side channel only)
Hook Name Inspector (on-demand side channel only)

──────────────────────────────────────────────

Mapper

──────────────────────────────────────────────

React Insight Domain
Component Registry
Root Registry
Public ComponentSnapshot
Public InspectedHookName (Insight.inspectHookNames())
@react-insight/inspector
Future Timeline
```

Everything above the Mapper is React-specific.

Everything below the Mapper is React Insight domain logic.

The Mapper is therefore considered the architectural boundary between React internals and the React Insight domain.

**Note on the on-demand side channel:** the Fiber Handle Registry, Dispatcher Access, and Hook Name Inspector sit above the Mapper (they know Fiber shape) but do not cross it the way the main pipeline does. Instead, `Insight.inspectHookNames()` — a public method on `createInsight.ts`'s returned object, sitting alongside the domain layer — calls directly into this above-the-Mapper machinery and returns a domain-safe `InspectedHookName[]`. This is a narrower version of the same boundary-crossing pattern `Insight.getComponents()` already uses for the main pipeline (public API function bridging into internals), not a new kind of boundary violation.

# 6. Runtime Architecture Model

This section defines the concrete contract of every layer in the
pipeline described in Section 5. It is the current implementation
reference for the React runtime. If a future implementation needs a
different contract, the change must be intentional and recorded in
`DECISIONS.md`.

---

## Hook Adapter

**Responsibility**

Safely connect to `__REACT_DEVTOOLS_GLOBAL_HOOK__`: install it if
absent, chain any existing `onCommitFiberRoot` / `onCommitFiberUnmount`
callbacks instead of overwriting them, and isolate errors thrown by
downstream code so they never reach React's renderer.

Hook installation is split into two functions with different
visibility and timing requirements:

- **`installReactDevtoolsHook()`** — public, standalone, independent
  of any Plugin or `Insight` instance. Installs a hook stub if one
  doesn't already exist. The stub must include a working `inject()`
  (assigns and returns an incrementing renderer id) and
  `supportsFiber: true`, not just the two commit-notification
  callbacks — React's renderer bootstrap (`injectInternals`) calls
  `hook.inject(...)` once, at `react-dom` module-load time, and if
  that call fails or the hook isn't present yet, React never notifies
  the hook of commits for the rest of the page session, regardless of
  what is installed afterward. This function must be called by the
  consuming application before `react-dom` is imported anywhere in
  its module graph — confirmed empirically, not just documented by
  React's own `react-devtools-inline` package, which states the same
  constraint. See `DECISIONS.md`, 2026-07-21.
- **`connectHookAdapter()`** — internal, used by
  `componentDiscoveryPlugin`. Calls `installReactDevtoolsHook()`
  defensively (for graceful, if late, degradation when the consuming
  application forgot to call it early), then attaches the actual
  commit/unmount callbacks.

**Not extended for on-demand hook name resolution.** An earlier design
for Hook Name Inspector (below) planned to capture `currentDispatcherRef`
here, from the `rendererInternals` object passed to `inject()`. Further
research found a simpler, more direct path that doesn't touch this
module at all — see "Dispatcher Access" below. `hookAdapter.ts` is
therefore unchanged by the 2026-08-24 or 2026-08-25 work.

**Input**

Raw calls made by React itself:

- `onCommitFiberRoot(rendererID, root)`
- `onCommitFiberUnmount(rendererID, fiber)`

**Output**

A minimal internal runtime event carrying the raw `FiberRoot` (for
commit) or `Fiber` (for unmount) reference, tagged with an event kind
of `commit` or `unmount`.

**Must not know**

- `ComponentNode`, `ComponentRegistry`, or any domain model.
- Anything about Plugins or how results are consumed.
- `onPostCommitFiberRoot` (see `DECISIONS.md`, 2026-07-18 — deferred).

---

## Runtime Orchestration

**Responsibility**

The React runtime is wired through two internal plugins with different
timing requirements:

- **`react:discovery`** is registered eagerly inside `createInsight()`.
  It connects the Hook Adapter before the consuming application calls
  `ReactDOM.createRoot().render()`, so the first commit can be observed.
  It owns the commit/unmount callback wiring and coordinates the
  Fiber Adapter → Traversal → Mapper → Component Registry pipeline,
  plus (since 2026-08-24) recording/clearing Fiber Handle Registry
  entries on commit/unmount respectively.
- **`react:lifecycle`** is registered from `InsightProvider` through
  `useRootLifecycle()`. It creates and registers an `InternalRoot` when
  the Provider's effect runs and unregisters it during cleanup. This
  remains effect-based because root lifecycle only needs evidence that
  the Provider mounted; it does not need to observe the Provider's first
  commit.

The two registrations deliberately do not share the same timing model.
Discovery must be eager; root lifecycle can be effect-based.

**StrictMode requirement**

React 18+ development StrictMode can run an effect as
mount → cleanup → mount. `useRootLifecycle()` serializes registration
and unregistration through a Promise chain so asynchronous plugin
operations cannot race and produce duplicate-registration failures.

**Must not know**

- React Fiber internals beyond the discovery contracts it coordinates.
- Presentation concerns.
- Public `ComponentSnapshot` formatting.

---

## Root Registry

**Responsibility**

Own the internal React-root records used by the runtime. Each
`InternalRoot` contains:

- a private `symbol` id,
- `createdAt`,
- `commitCount`,
- `lastCommittedAt`.

`RootRegistry.recordCommit()` increments the commit count and updates
the timestamp only for a currently registered root.

**Current limitation**

Component Discovery currently assumes a single React application/root
per page and therefore records commits against the first registered
root. When no root is registered yet, discovery uses the temporary
`"pending"` component `rootId`; the next observed commit self-heals the
component's `rootId` after the real root is registered.

**Must not know**

- Fiber structures.
- DevTools hook details.
- Component traversal or mapping.
- Why a root may temporarily be absent.

---

## Fiber Adapter

**Responsibility**

Normalize the raw event received from the Hook Adapter into a single,
well-defined runtime entry point (the root Fiber to traverse), independent
of how the event was obtained.

**Input**

The internal runtime event produced by the Hook Adapter.

**Output**

A single Fiber reference representing the traversal entry point for
this event.

The `FiberNode` shape owned by this layer includes an `alternate:
FiberNode | null` reference, required by Traversal for stable-id
resolution, and `memoizedProps: unknown` / `memoizedState: unknown`
fields, required by Traversal for `rendered` detection (see Traversal
below — these two concerns are resolved independently of each other
as of `DECISIONS.md`, 2026-07-26). As of 2026-08-24, `FiberNode` also
carries an optional `pendingProps: unknown`, read only by Hook Name
Inspector (below) when re-invoking a component; as of 2026-08-25, it
also carries an optional `ref: unknown`, needed specifically for
re-invoking a `forwardRef` component's `render(props, ref)` signature.
Both are optional specifically so every existing fixture across the
discovery test suite keeps compiling unmodified. This layer also owns
a second, related raw shape: `HookNode` (`memoizedState: unknown`,
`queue: unknown`, `next: HookNode | null`), describing a single node of
a function component's hooks linked list — the entry point for that
list is `FiberNode.memoizedState` itself, reinterpreted as a
`HookNode | null` by both Hook Inspector and, on-demand, Hook Name
Inspector, and only after confirming the Fiber is not a class component
(whose `memoizedState` means something entirely different — `this.state`).

**`REACT_MEMO_TYPE` / `REACT_FORWARD_REF_TYPE` (added 2026-08-25).**
This layer also defines and exports these two constants —
`Symbol.for("react.memo")` and `Symbol.for("react.forward_ref")`,
global symbols React itself registers under the same keys. Any code
can obtain the identical symbol reference via `Symbol.for` without
importing React internals or the `react-is` package; these two
specific symbols have been stable since `memo`/`forwardRef` were
introduced (unlike the dispatcher-internals shape, which genuinely
changed between React 18 and 19 — see Dispatcher Access below), so a
local constant was preferred over a new dependency. Consumed by
Traversal (`isComponentFiber()`/`getDisplayName()`) and Hook Name
Inspector (`resolveInvocable()`/`resolveInvocableName()`) to recognize
and recursively unwrap `memo(...)`/`forwardRef(...)`/
`memo(forwardRef(...))` wrapper objects. Fiber Adapter remains the
only module allowed to know any of these raw shapes exist.

**Must not know**

- The existence of `__REACT_DEVTOOLS_GLOBAL_HOOK__` or how the
  connection was established.
- Anything about `ComponentNode` or the Component Registry.

---

## Traversal

**Responsibility**

Walk the Fiber tree starting from the entry point and produce a flat
or hierarchical list of Fibers that qualify as "components" under
React Insight's definition (filtering out host/internal Fiber types
such as Fragment or HostText), preserving parent-child relationships.

### What Counts as a Component Fiber (`isComponentFiber()`)

Originally recognized only `typeof fiber.type === "function"` —
meaning `React.memo(...)` and `React.forwardRef(...)`-wrapped
components, whose `fiber.type` is an *object*
(`{ $$typeof: REACT_MEMO_TYPE, type, ... }` /
`{ $$typeof: REACT_FORWARD_REF_TYPE, render, ... }`), were entirely
invisible to the whole pipeline — not just to Hook Name Inspector, but
to Render Tracking, Hook Tracking, and Context Tracking as well, since
none of those layers ever received a fiber for such a component in the
first place.

As of 2026-08-25, `isComponentFiber()` also recognizes these two object
shapes (`type?.$$typeof === REACT_MEMO_TYPE || type?.$$typeof ===
REACT_FORWARD_REF_TYPE`, using the constants Fiber Adapter exports).
`getDisplayName()` was extended in parallel with a recursive unwrap —
covering `memo(forwardRef(...))` — that prefers an explicit
`displayName` at any layer, then the innermost function's `.name`,
falling back to `"Anonymous"`.

**Scope was initially underestimated when this was proposed.** It was
first framed as "extend `inspectHookNames()` to support memo/forwardRef"
— an on-demand-only change. Inspecting this function before starting
found the real gap sits here, in the always-on filter itself; extending
only the on-demand layer would have had no effect, since the Fiber
Handle Registry is only ever populated for fibers this function already
recognizes. See `DECISIONS.md`, 2026-08-25.

**No changes were needed in Hook Inspector, Context Inspector, or this
function's own `resolveFiberIdentity()`/`rendered` logic** — all
operate on Fiber-instance-level state (`memoizedState`, `dependencies`,
`memoizedProps`) that exists regardless of what shape `fiber.type` is.
This was a genuine confirmation of the pipeline's layering, not an
assumption: the fix touched exactly `isComponentFiber()`,
`getDisplayName()`, and (separately) Hook Name Inspector's own
re-invocation logic, and nothing else.

For each qualifying Fiber, also resolves a stable **id** and whether
React actually rendered it in this commit (**`rendered`**), and delegates
current hook/context inspection to the dedicated inspector layers. These two
facts are resolved by the same function (`resolveFiberIdentity()`),
but from `DECISIONS.md`, 2026-07-26 onward they are derived from two
different signals, not one:

**Stable id** — via identity resolution against `fiber.alternate`:

- A direct hit on the Fiber object itself, or a hit via
  `fiber.alternate` (already seen), reuses the existing id.
- Neither means first mount — mints a new id.

This is what keeps `getFiberId()` stable across renders: without
checking `alternate`, a component's first re-render would receive a
new id (its Fiber object swaps to the previously unseen alternate),
which previously caused `ComponentRegistry.sync()` to treat every
re-rendered component as a new mount, leaving the original entry as a
permanent orphaned "ghost" — fixed 2026-07-20, see `DECISIONS.md`.

**`rendered`** — via a `memoizedProps`/`memoizedState` comparison
against `lastObservedValues`, a `Map<id, { props, state }>` that
Traversal maintains itself, updated on every resolution — **not**
against Fiber object identity or against `alternate`. Two earlier
identity-based designs were tried and rejected, each only after being
disproven by a real-browser Playground experiment of a shape the
prior design hadn't been exercised against:

- Comparing object identity alone (direct hit = not rendered,
  alternate hit = rendered) overcounted every ancestor/sibling cloned
  along the reconciliation path to a real update, even when their own
  function body bailed out — since React clones a new Fiber object
  for them without re-executing anything. This was the limitation
  originally documented here on 2026-07-21.
- Comparing `memoizedProps`/`memoizedState` against `alternate`
  (rather than against raw object identity) fixed the above, but
  broke down on two further axes: (1) React recycles at most two
  Fiber objects per component indefinitely, so from a component's
  _second_ real update onward, `current` is an already-seen object
  whose fields were mutated in place — `alternate` is not reliably
  "the previous version" once recycling starts; (2) even where
  `alternate` was reliable, it goes permanently stale for a component
  that stops receiving real updates while the rest of the tree keeps
  committing — every later comparison is against the same frozen
  snapshot, which never matches "now", so `rendered` incorrectly
  stayed `true` forever.

Comparing against a self-maintained `lastObservedValues` snapshot
(updated on every call, not tied to which physical Fiber object holds
`current`) avoids both failure modes: every comparison is relative to
"changed since Traversal itself last looked", regardless of Fiber
object recycling. Root-level `RootRegistry.commitCount` was never
affected by any version of this, since it doesn't depend on Fiber
identity at all. See `DECISIONS.md`, 2026-07-26, for the full
experiment history.

For each qualifying Fiber, Traversal also delegates to Hook Inspector
to resolve **`hooks`** (see below), includes the result unchanged in
its output, and (since 2026-08-24) records the fiber itself in the
Fiber Handle Registry, keyed by the same stable id — the one piece of
state Traversal writes that is *not* part of its own output, existing
solely to support the on-demand Hook Name Inspector.

**Input**

A single Fiber reference (from the Fiber Adapter).

**Output**

A list of minimal, extracted records — not raw Fiber references —
containing only the fields required downstream: an identifier, a
display name, a parent identifier, whether this fiber was rendered in
this commit (`rendered: boolean`, per the resolution above), and a
structural hook summary (`hooks: HookSummary[]`, per Hook Inspector
below).

**Must not know**

- Where the Fiber came from (real hook vs. a test fixture).
- `ComponentNode`, `ComponentRegistry`, or Plugins.

**Independence rationale**

Traversal is a separate layer from the Hook Adapter, not a sub-step
of it. Connecting to React (Hook Adapter) and walking a Fiber tree
(Traversal) are different concerns: one is an I/O/connection concern,
the other is an algorithmic/filtering concern. Keeping them separate
allows Traversal to be unit-tested against a plain Fiber fixture
without mocking the DevTools hook, and allows the entry point to
change in the future without touching traversal logic.

---

## Hook Inspector

**Responsibility**

For a single component Fiber, walk its hooks linked list
(`fiber.memoizedState`, reinterpreted as a `HookNode | null`) and
produce a structural summary of each hook: its position and a
best-effort `kind` classification, derived purely from the shape of
each `HookNode` (presence of `queue`, shape of `memoizedState`, and —
for Effect-shaped hooks — a bitmask on the Effect object's internal
`tag` field). No user code is invoked and no re-render occurs; this is
read-only shape inspection of already-committed Fiber state, on every
commit, for every component — the same always-on, zero-instrumentation
posture already established for Render Tracking (`DECISIONS.md`,
2026-07-20).

This layer independently determines whether the Fiber is even eligible
for hook inspection at all: `isComponentFiber()` (Traversal) treats
function and class components alike (both are `typeof === "function"`
in JavaScript, a distinction immaterial to identity/render-detection),
but a class component's `memoizedState` is `this.state`, not a hooks
list, and must not be walked as one. Hook Inspector checks
`type.prototype.isReactComponent` — the same marker React's own
reconciler uses internally to decide whether to construct a class
instance — rather than an unstable Fiber `tag` number, and returns an
empty array for class components. As of 2026-08-24, this check is
exported as `isClassComponentType()` specifically so Hook Name
Inspector (below) can reuse it rather than duplicate it. Needed **no
changes** for `memo`/`forwardRef` support (2026-08-25): it reads
`fiber.memoizedState` directly, which exists identically regardless of
what shape `fiber.type` is.

**Classification limits, confirmed via a controlled Playground
experiment** (a probe component exercising every common hook type,
logging each `HookNode`'s actual shape — not assumed from prior
knowledge of React internals, see `DECISIONS.md`, 2026-07-27):

- `useState` / `useReducer` share an identical shape (`queue` present,
  with a `dispatch`) and both classify as `"state"`. **Distinguishable
  on-demand, not structurally** — see Hook Name Inspector below.
- `useRef` has a unique shape (`{ current }`, no `queue`) and reliably
  classifies as `"ref"`.
- `useMemo` / `useCallback` share an identical shape (`[value, deps]`
  array, no `queue`) and both classify as `"memo-like"`. **Also
  distinguishable on-demand** — see below.
- `useEffect` / `useLayoutEffect` _are_ distinguishable from each
  other, via the Effect object's `tag` bitmask — confirmed
  empirically as `9` (`HasEffect | Passive`) for `useEffect` and `5`
  (`HasEffect | Layout`) for `useLayoutEffect`, matching
  `react-reconciler`'s internal (unexported)
  `ReactHookEffectTags.js` constants.
- `useContext` does not consume a hook slot at all —
  `mountContext`/`updateContext` call `readContext()` directly without
  pushing onto the hooks linked list — so it (and any custom hook that
  is purely a thin `useContext` wrapper) is entirely invisible to Hook
  Inspector, not merely unclassified.
- No hook or custom-hook _name_ is available from this structural
  technique, for any kind. Real React DevTools resolves names by
  re-invoking the component function with an instrumented dispatcher
  (`react-debug-tools`'s `inspectHooksOfFiber`) and parsing the call
  stack for custom hook boundaries — real per-inspection work, which
  React's own team intends to run on-demand only. **This technique is
  no longer only a deferred candidate** — it is implemented as Hook
  Name Inspector, below, as a deliberately separate, on-demand layer,
  never folded into this always-on structural pass. See `DECISIONS.md`,
  2026-07-27 and 2026-08-24.
- `state`, `ref`, and `memo-like` kind hooks all carry a `value`, as of
  `DECISIONS.md`, 2026-07-28 (state) and 2026-08-24 (ref, memo-like):
  unlike names, a hook's current value is already sitting in
  already-committed Fiber state (`hook.memoizedState`) and needs no
  re-invocation to read. `hookValuePreview.ts`'s `previewHookValue()`
  produces a shallow (one-level), circular-safe, and (since 2026-08-24)
  string-length-bounded preview of it.

**Input**

A single component Fiber (from Traversal, already confirmed to be a
component fiber — Hook Inspector performs its own, separate
class-vs-function check before walking).

**Output**

`HookSummary[]` — a structural fact per hook (`{ index, kind, value?
}`), where `kind` is one of `state | ref | memo-like | effect |
layout-effect | unknown`, and `value` (a shallow `HookValuePreview`,
see `hookValuePreview.ts`) is present for `kind` of `state`, `ref`, or
`memo-like`. Never a raw `HookNode` or Fiber reference.

**Must not know**

- `ComponentNode`, `ComponentRegistry`, or Plugins.
- Hook or custom-hook _names_ — out of scope for this layer entirely,
  by design (see Hook Name Inspector below for where that scope
  actually lives).
- Whether this component is new, updated, or unchanged — that
  distinction belongs to `rendered`, resolved separately by Traversal,
  not to Hook Inspector.
- Whether the Fiber it's given came from a plain function, class,
  `memo`, or `forwardRef` component — that distinction is resolved
  entirely by Traversal's `isComponentFiber()` before this layer is
  ever invoked.

**Independence rationale**

Hook Inspector is a distinct concern from `rendered` detection, even
though both are resolved for the same Fiber during the same Traversal
pass: `rendered` answers "did this commit change anything for this
component", a temporal/relative question requiring memory across
commits (`lastObservedValues`); `hooks` answers "what hooks does this
component currently have, structurally", a point-in-time question
requiring no memory at all. Keeping them as separate functions (rather
than merging hook-shape inspection into `resolveFiberIdentity()`) lets
each be unit-tested against plain `HookNode`/`FiberNode` fixtures
independently, and lets Hook Inspector's stricter safety requirement
(must never misinterpret `this.state` as a hooks list) be verified in
isolation. The same independence rationale extends to Hook Name
Inspector: it is a fundamentally different technique (re-invocation
vs. shape-reading), not a variant of Hook Inspector, and is kept in a
wholly separate module for exactly that reason.

---

## Fiber Handle Registry

**Added 2026-08-24.**

**Responsibility**

Retain a live reference to the most recently observed Fiber for each
tracked component id, so that on-demand hook name resolution
(requested arbitrarily long after the commit that produced a
component) has something to re-invoke.

This is the first module in the entire pipeline to hold a Fiber
reference beyond the lifetime of a single synchronous call — every
other layer above (Hook Adapter, Fiber Adapter, Traversal, Hook
Inspector, Context Inspector) is fully transient. This is a deliberate,
narrow, explicitly bounded exception to "Stateless Processing"
(Section 5), not a relaxation of it.

**Implementation**

A `Map<ComponentId, FiberNode>` with `set(id, fiber)`, `get(id)`, and
`delete(id)`. Written by Traversal on every commit for every fiber
`isComponentFiber()` recognizes — plain function, class, `memo`, or
`forwardRef` alike (overwriting any previous handle for that id, so it
always reflects the most recent Fiber). Read by `createInsight.ts`'s
`inspectHookNames(id)`. Deleted by `componentDiscoveryPlugin.ts`'s
`onUnmount`, alongside the existing `markUnmounted()` call.

**Memory safety depends entirely on the unmount cleanup.** Without it,
every unmounted component's Fiber — and everything it closes over
(closures, DOM references, nested state) — would be retained
indefinitely. This registry has no size cap or eviction policy beyond
that cleanup; it relies on unmount events being the sole and reliable
signal that a handle is no longer needed.

**Input**

`(ComponentId, FiberNode)` pairs from Traversal (write path);
`ComponentId` from `createInsight.ts` (read path) and
`componentDiscoveryPlugin.ts` (delete path).

**Output**

`FiberNode | undefined` for a given id.

**Must not know**

- `ComponentNode`, `ComponentRegistry`, or any domain model.
- Why a caller wants a given fiber, or what it will do with it.
- Anything about dispatchers, re-invocation, or memo/forwardRef
  unwrapping — that is Hook Name Inspector's concern entirely.

---

## Dispatcher Access

**Added 2026-08-24.**

**Responsibility**

Locate React's currently-active hooks dispatcher slot, so Hook Name
Inspector can temporarily swap in an instrumented dispatcher.

**Implementation, and why it changed from the original plan.** The
original design planned to capture `currentDispatcherRef` from the
`rendererInternals` object `react-dom` passes to `hookAdapter.ts`'s
`inject()`, requiring a new field on the Hook Adapter's internal state.
Further research (verifying before assuming, the same discipline
already applied to the `react-debug-tools` dependency decision below)
found a simpler, more direct path: React 19 exposes the active
dispatcher slot directly on the `react` package itself, at
`React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H`
(pre-19: `.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
.ReactCurrentDispatcher.current`, kept only as a defensive fallback,
since this project's peer dependency is `react >= 19`) — the same
internal real ecosystem libraries (e.g. the React Compiler runtime)
already read directly. This required zero changes to `hookAdapter.ts`,
works identically in tests (`import * as React from "react"`) and real
usage, and has no dependency on this project's own DevTools hook
connection having completed first.

**Likely unavailable in production builds**, where React strips these
internals to discourage exactly this kind of usage. Callers must treat
`undefined` as "on-demand hook name resolution unavailable right now",
not an error.

**Test coverage (added 2026-08-24, after an initial gap):** this module
originally had no dedicated test file, exercised only indirectly
through `hookNameInspector.test.tsx`'s success path. `dispatcherAccess.
test.ts` now covers all four branches — the React 19 `.H` shape, the
pre-19 fallback, preference for the React 19 shape when both are
present, and `undefined` when neither is — using `vi.doMock("react",
...)` plus a dynamic `import()` per test, since the statically-imported
namespace object can't be mutated directly. A real Vitest behavior
found via actual test execution: a mock factory that omits a key this
module reads throws `"No ... export is defined on the mock"` rather
than treating the omission as `undefined` — every mock factory must
explicitly return every key read, including as `undefined`.

**Input**

None — reads directly from the imported `react` module.

**Output**

A `{ current: unknown }`-shaped live view onto the dispatcher slot
(a getter/setter pair over React 19's flattened `.H` property, so
callers can swap it the same way regardless of the underlying shape),
or `undefined`.

**Must not know**

- `ComponentNode`, `ComponentRegistry`, `Fiber`, or any domain/Fiber
  model.
- Anything about hooks-list traversal — that is Hook Name Inspector's
  concern.

---

## Hook Name Inspector

**Added 2026-08-24. On-demand only — not part of the always-on pipeline.**

**Responsibility**

Given a Fiber (from the Fiber Handle Registry) and a dispatcher ref
(from Dispatcher Access), resolve the actual invocable render function
and re-invoke it with an instrumented dispatcher to resolve exact
built-in hook names (distinguishing `useState`/`useReducer` and
`useMemo`/`useCallback`, which Hook Inspector's structural technique
cannot) and the name of the nearest enclosing custom hook, if any.

**Dependency decision reversed after research.** The published
`react-debug-tools` npm package was the originally planned dependency
for the dispatcher-swap mechanics, since it is the technique real React
DevTools uses internally. Verifying this before committing to it (the
same discipline already applied when `react-debug-tools`'s general
approach was first researched, 2026-07-27) found the npm package has
not been republished in roughly 7 years and is still at `0.1.0`, while
the version DevTools actually uses is vendored directly inside the
`facebook/react` monorepo source and has kept evolving
(`useOptimistic`, `useActionState`, `use()` support) well past the npm
package's last publish. Depending on the stale npm package would
likely have produced incorrect results against React 19. The decision
was reversed to a small, hand-rolled, deliberately narrower
implementation instead of the npm package — see `DECISIONS.md`,
2026-08-24, for the full research trail.

**Resolving the invocable function (`resolveInvocable()`), including
memo/forwardRef (extended 2026-08-25).** For a plain function, the
function itself (after excluding class components via
`isClassComponentType()`). For `forwardRef(...)`, whose `fiber.type` is
`{ $$typeof: REACT_FORWARD_REF_TYPE, render }`, the invocable is
`render(props, ref)` — `ref` sourced from the Fiber Adapter's new
optional `FiberNode.ref` field. For `memo(...)`, whose `fiber.type` is
`{ $$typeof: REACT_MEMO_TYPE, type }`, `resolveInvocable()` recurses
into `.type`, correctly covering `memo(forwardRef(...))`. A companion
`resolveInvocableName()` mirrors this unwrapping to produce the real
function name used for custom-hook-name stack-frame comparison (see
below) — deliberately a different helper from Traversal's
`getDisplayName()`, since stack frames report a function's actual
`.name`, not a display-oriented name a consumer may have overridden.

**Implementation.** Builds an instrumented dispatcher object. For the
hook kinds Hook Inspector already classifies structurally (state, ref,
memo-like, effect, layout-effect) plus `useContext`, each dispatcher
method reads the next node from the fiber's already-committed hooks
linked list — the same list Hook Inspector walks — instead of
performing real update logic, while recording the called method's name
and call stack. This must never mutate real hook state. Any other hook
name (`useTransition`, `useId`, `useDeferredValue`,
`useSyncExternalStore`, `useImperativeHandle`, future hooks, ...) falls
through to a generic, best-effort `Proxy` handler: records the call,
consumes exactly one hooks-list slot, returns the raw stored value —
an explicit, documented trade-off for anything more elaborate, rather
than attempting full fidelity for hooks this project has no other
classified handling for anyway. `console.*` is suppressed for the
duration of the re-invocation, and the real dispatcher is always
restored in a `finally` block — the same defensive posture
`react-devtools-shared` uses around its own equivalent call.

**Custom hook name resolution required three rounds of real-execution
correction**, none reasoned about correctly in advance:

1. Constructing `Error()` inside a shared `recordCall()` helper (rather
   than inline per dispatcher method) adds an extra stack frame a fixed
   offset assumption didn't account for.
2. Dispatcher methods accessed through the `Proxy` (the generic
   fallback path) report as `Proxy.useState` in V8 stack traces, not
   bare `useState` — a `.replace(/^Object\./, "")` assumption didn't
   anticipate this prefix.
3. Once `memo`/`forwardRef` support was added (2026-08-25), an inline,
   unnamed arrow function passed directly to `forwardRef(...)` produces
   a V8 frame with **no name and no parentheses at all**
   (`"at file:line:col"`), which the then-current parser misparsed —
   the raw `"file:line:col"` text was returned as if it were a real
   function name, surfacing as a nonsensical `customHookName`.

Fixed, cumulatively, by: stripping any prefix before the last `.` in
each frame name (handles both `Object.` and `Proxy.` uniformly);
requiring the explicit `"name ("` form before extracting a name at all
(a bare `"at file:line:col"` now correctly yields `undefined` for that
position, rather than a garbage value); and skipping leading frames
whose name is in a known set of internal names (every built-in hook
export name, plus `recordCall` itself) until the first frame that
isn't — that frame is either a named custom hook, or the component
function itself (no enclosing custom hook).

**Input**

A `FiberNode` (from the Fiber Handle Registry, via `createInsight.ts`)
and a `DispatcherRef` (from Dispatcher Access, via `createInsight.ts`).

**Output**

`ReadonlyArray<InspectedHookName>` (`{ index, hookName, customHookName?
}`), or `undefined` if the fiber isn't inspectable this way (no
resolvable invocable function), or if re-invocation itself throws.
Never a raw `HookNode`, Fiber, or dispatcher reference.

**Must not know**

- `ComponentNode`, `ComponentRegistry`, `RootRegistry`, or Plugins.
- Anything about `ComponentSnapshot` or how its result will be
  presented — that is `@react-insight/inspector`'s job.
- How the Fiber it's given was obtained (Fiber Handle Registry vs. a
  test fixture) — mirrors Traversal's own independence from the Hook
  Adapter, for the same testability reason.

**Scope, deliberately limited for this slice:**

- Plain function components, `memo(...)`, `forwardRef(...)`, and
  `memo(forwardRef(...))` — not class components (excluded via the
  same `isClassComponentType()` check Hook Inspector uses).
- One level of custom hook name only, not a full nested tree
  (`react-debug-tools`'s `HooksTree`).
- Custom hook name resolution degrades to no `customHookName` (never
  an incorrect one) under minified production builds, inheriting the
  same limitation already documented for this general technique
  (`DECISIONS.md`, 2026-07-27).

**Independence rationale**

Hook Name Inspector is not a variant or extension of Hook Inspector —
it is a fundamentally different technique (re-invocation vs.
shape-reading) with a fundamentally different safety profile (can run
user side effects vs. cannot). Keeping it in a wholly separate module,
reachable only through an explicit, separately-named public method
(`Insight.inspectHookNames()`, distinct from the always-on `hooks`
field), makes the zero-instrumentation guarantee of the rest of this
document's pipeline auditable by inspection: nothing in the commit path
calls into this module.

**Testing note.** Unlike every other layer in this pipeline,
`hookNameInspector.test.ts` (a `.tsx` file, since 2026-08-25's
`memo`/`forwardRef` cases render real JSX) cannot be meaningfully tested
against plain Fiber fixtures — it needs a real dispatcher and real
hooks-list shape, which only actual React rendering
(`@testing-library/react`) can provide. See "Testability" in Section 2.

---

## Context Inspector

**Responsibility**

For a single component Fiber, inspect React's context dependency list
(`fiber.dependencies.firstContext`) and produce a structural summary of
each distinct Context consumed by that Fiber.

The inspector is always-on and read-only. It does not re-render the
component, invoke user code, or walk the Provider tree. React already
stores the current context value on each dependency node as
`memoizedValue`, so the inspector can read it directly from the
committed Fiber.

**Implementation**

`inspectContexts()`:

1. Reads `fiber.dependencies.firstContext`.
2. Walks the linked list of `ContextDependencyNode` values.
3. Deduplicates entries by Context object identity.
4. Resolves `context.displayName` when it is a non-empty string.
5. Falls back to `"Context"` when no display name is available.
6. Produces a bounded `value` preview through the existing
   `previewHookValue()` utility.
7. Returns `ContextSummary[]` with `{ index, displayName, value }`.

The identity deduplication is intentional. A controlled Playground
experiment under StrictMode observed two dependency nodes for a single
`useContext()` call that referenced the same Context object. The exact
React development-mode cause was not fully established, but
deduplication makes the output correct regardless of duplicate nodes in
the dependency list.

**Important distinction from Hook Inspector**

`useContext()` does not consume a slot in the hooks linked list, so
Context Inspector is not a special hook classification. Context
tracking therefore has its own Fiber-level source and its own
stateless inspector. Needed no changes for `memo`/`forwardRef` support
(2026-08-25), for the same reason Hook Inspector didn't.

**Output**

`ContextSummary[]`:

```ts
{
  index: number;
  displayName: string;
  value: HookValuePreview;
}
```

No raw Context object, dependency node, or Fiber reference leaves this
layer.

**Must not know**

- Component Registry or `ComponentNode`.
- Plugins.
- Whether the component rendered in this commit.
- Hook names or custom-hook boundaries.

**Independence rationale**

Context tracking answers a point-in-time structural question:
"Which distinct Contexts does this Fiber currently consume, and what
are their current values?" It does not require cross-commit history.
Keeping it separate from Hook Inspector is necessary because Context
dependencies live outside the hooks linked list.

---

## Mapper

**Responsibility**

Pure, stateless translation of a single extracted Traversal record
into the structural shape of a `ComponentNode` (`id`, `rootId`,
`displayName`, `parentId`), plus a straight pass-through of the
`rendered`, `hooks`, and `contexts` facts already resolved by the
discovery layer.

**Input**

One extracted record from Traversal (including `rendered` and
`hooks`).

**Output**

A partial `ComponentNode` containing structural fields plus
`rendered`, `hooks`, and `contexts` (`ComponentSyncInput`).

**Must not know**

- Whether this component is new, updated, or being removed.
- `mountedAt`, `unmountedAt`, `status`, `renderCount`, or
  `lastRenderedAt` — these are lifecycle/history decisions, not
  structural ones.
- `ComponentRegistry` internals or any existing stored state.
- The internal shape of a `HookNode` — the Mapper only ever sees the
  already-classified `HookSummary[]`, never a raw hook object.
- Anything about the Fiber Handle Registry, Dispatcher Access, or Hook
  Name Inspector — the on-demand side channel bypasses the Mapper
  entirely (see Section 5, "On-demand Side Channel").
- Whether the originating fiber was a plain function, class, `memo`,
  or `forwardRef` component — that distinction never survives past
  Traversal.

**Scope rationale**

The Mapper must never decide lifecycle state. Determining whether a
component is new, already known, or being removed requires comparing
against existing state — and by Principle 8 (Domain Ownership), state
comparison belongs exclusively to the Component Registry. A stateless
Mapper can be re-run safely on every commit without side effects and
is trivially testable with plain fixtures.

---

## Component Registry

**Responsibility**

Own all Component state. Compare each incoming `ComponentSyncInput`
against currently stored state to decide whether it represents a
mount or an update (`sync()`), and mark components as unmounted
without discarding their history (`markUnmounted()`) on explicit
unmount notifications from the Hook Adapter → Fiber Adapter →
Traversal path. Own `mountedAt`, `unmountedAt`, `status`,
`renderCount`, `lastRenderedAt`, `hooks`, and `contexts`. Also owns a
self-contained change-notification mechanism (`subscribe()`), separate
from and independent of `@react-insight/core`'s event system.

`sync()` compares the incoming `ComponentSyncInput` against any
existing stored state before writing or notifying. When the incoming
`rendered` flag is `true`, the call always proceeds: structural fields
(`rootId`, `displayName`, `parentId`, `hooks`, `contexts`) are written,
and `renderCount`/`lastRenderedAt` are updated. When `rendered` is
`false`, `sync()` only writes and notifies if at least one structural
field actually differs from what's stored; otherwise the call is a
no-op. This per-field dirty-check granularity
(`rootId`/`displayName`/`parentId` individually, not just
`hooks`/`contexts`) gained dedicated regression test coverage in a
2026-08-24 test-suite review. See `DECISIONS.md`, 2026-07-21 and
2026-08-23.

**Input**

`ComponentSyncInput` values (from Mapper, via `sync()`) and component
ids to mark unmounted (via `markUnmounted()`).

**Output**

A query API for consumers: `get(id)`, `has(id)`, `values()`, `size`
(all covered by dedicated tests as of 2026-08-24). Also
`subscribe(listener): () => void`, called after any `sync()` or
`markUnmounted()` call that actually mutates state, batched via
`queueMicrotask()`. See `DECISIONS.md`, 2026-08-04 and 2026-08-23 for
the full feedback-loop history this batching and dirty-checking
resolved.

`createInsight.ts` exposes both `getComponents()` (all tracked
components) and, since 2026-08-24, `getComponent(id)` (a single
component, O(1)), sharing one `toSnapshot()` mapping helper.

**Must not know**

- Fiber, Traversal, Hook Inspector, or how discovery happened —
  including whether a component is a plain function, class, `memo`, or
  `forwardRef` component.
- Anything about eager vs. effect-based plugin registration timing.
- The Fiber Handle Registry, Dispatcher Access, or Hook Name Inspector.

**Implementation status**

Change-event emission is implemented (`subscribe()`) as a
self-contained mechanism local to `ComponentRegistry`, not through the
Core event system (see "Deferred Concerns" below). Root-scoped
querying (`getByRoot`) is not implemented yet. `register()`/
`unregister()` are retained separately from `sync()`/`markUnmounted()`
for callers where a duplicate id is a genuine error, or a full removal
is genuinely intended.

---

## Cross-Layer Data Rules

| Boundary                        | Model that crosses it                                                                              | Allowed below this boundary?                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| React → Hook Adapter            | Raw React callback arguments                                                                       | No — never leaves Hook Adapter                 |
| Hook Adapter → Fiber Adapter    | Internal runtime event (raw Fiber/FiberRoot ref)                                                   | No — never leaves Fiber Adapter                |
| Fiber Adapter → Traversal       | Single Fiber entry point (`alternate`, `memoizedProps`, `memoizedState`, `dependencies`, `pendingProps`, `ref`) | No — never leaves Traversal                    |
| Traversal → Hook Inspector      | Single component Fiber; `memoizedState` interpreted as `HookNode` list                             | No — never leaves Hook Inspector               |
| Hook Inspector → Traversal      | `HookSummary[]` (`{ index, kind, value? }`; no `HookNode` or Fiber reference)                      | Yes — passed through unchanged                 |
| Traversal → Context Inspector   | Single component Fiber; `dependencies.firstContext` interpreted as `ContextDependencyNode` list    | No — never leaves Context Inspector            |
| Context Inspector → Traversal   | `ContextSummary[]` (`{ index, displayName, value }`; no dependency/Context/Fiber reference)        | Yes — passed through unchanged                 |
| Traversal → Fiber Handle Registry | The raw `FiberNode` itself, keyed by stable id                                                    | No — the on-demand side channel only            |
| Fiber Handle Registry → Hook Name Inspector | The raw `FiberNode`, via `createInsight.ts`'s `inspectHookNames()`                        | No — never leaves Hook Name Inspector           |
| Dispatcher Access → Hook Name Inspector | A live `{ current }` dispatcher ref                                                        | No — never leaves Hook Name Inspector           |
| Hook Name Inspector → public API | `ReadonlyArray<InspectedHookName>` (`{ index, hookName, customHookName? }`)                       | Yes — public contract (`Insight.inspectHookNames()`) |
| Traversal → Mapper              | `DiscoveredComponent` (`id`, `displayName`, `parentId`, `rootId`, `rendered`, `hooks`, `contexts`) | No — internal contract only                    |
| Mapper → Component Registry     | `ComponentSyncInput` / `ComponentNode`                                                             | Yes — domain-level consumers may read the data |
| Component Registry → Public API | `ComponentSnapshot` (read-only projection; no `rootId`, Fiber, or React internals)                 | Yes — public contract                          |
| Public API → @react-insight/inspector | `ComponentSnapshot` and `InspectedHookName[]` (via `getComponent()`/`inspectHookNames()`)     | Yes — that package's only inputs                |

No type whose name or shape depends on React Fiber (including
`HookNode`, `ContextDependencyNode`, or the `REACT_MEMO_TYPE`/
`REACT_FORWARD_REF_TYPE` wrapper shapes) may cross the Mapper boundary,
or leave Hook Name Inspector.

---

## Deferred Concerns

The following are explicitly out of scope for this contract and are
tracked in `DECISIONS.md`:

- Renderer identity (`rendererId`) — see 2026-07-18.
- `onPostCommitFiberRoot` — see 2026-07-18.
- `ComponentRegistry` change-event emission through the Core event
  system — implemented, but not this way: `Insight.onChange()` is
  backed by a self-contained `subscribe()` mechanism local to
  `ComponentRegistry`. See `DECISIONS.md`, 2026-08-04.
- `ComponentRegistry.getByRoot()` — no current consumer.
- Root-container correlation / multi-application page support — still
  deferred.
- **On-demand hook _name_ resolution is no longer deferred** —
  implemented 2026-08-24, extended to `memo`/`forwardRef` 2026-08-25.
  What remains deferred within it: a full nested custom-hook tree (only
  one level is resolved). No current consumer.
- Hook _value_ resolution is likewise no longer deferred for
  `state`/`ref`/`memo-like` kinds.
- **`memo`/`forwardRef` recognition in Component Discovery is no
  longer deferred** — see "What Counts as a Component Fiber" above,
  implemented 2026-08-25. This was not previously listed here as an
  explicit deferred item (the gap wasn't identified as its own concern
  until inspecting `traversal.ts` while scoping the on-demand
  extension), but is recorded here now for completeness.

Per-component render detection for ancestors/siblings cloned along a
reconciliation path without themselves re-rendering is no longer a
deferred concern — see Traversal above and `DECISIONS.md`, 2026-07-26.

Each may be introduced later without breaking this contract, provided
a real consumer is identified first.