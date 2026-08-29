# React Runtime Architecture

> Status: Active implementation reference
>
> Last Updated: 2026-08-23
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

Unit tests alone are not sufficient for this pipeline, however: several real bugs (hook connection timing, a missing `inject()` implementation, registration-timing relative to React's first commit) were only found through end-to-end testing against a real React application (Playground) — see `DECISIONS.md`, 2026-07-21. Unit tests remain necessary for algorithmic correctness (filtering, id stability, render detection); Playground remains necessary for connection/timing correctness.

---

## Performance

Runtime observation must minimize unnecessary allocations and repeated traversal.

Additional runtime work should only occur when new capabilities require it.

Performance optimizations should never compromise architectural clarity.

---

## Internal First

All runtime APIs are internal unless a real public consumer requires otherwise.

Public APIs are introduced only when justified by actual usage.

The one exception found so far, `installReactDevtoolsHook()`, is not a violation of this goal: it is internal-by-default in the sense that it does nothing an application couldn't already do by installing the hook itself — it is exported only because the timing requirement it encodes (must run before `react-dom` is imported) cannot be satisfied any other way. See Section 6, Hook Adapter.

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

This applies in both directions: a field or method must not be added without a real consumer, and an existing field must not be left in place once it demonstrably has none (`ComponentNode.children` was removed on 2026-07-21 for exactly this reason — set at creation, never read or written anywhere else).

---

## Principle 6 — Incremental Evolution

Future features extend the architecture.

They should not require rewriting previous layers.

Each completed layer becomes a stable foundation for the next one.

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
```

**Implementation note (2026-07-29):** the original downstream "Tracking" layer shown in the first version of this document is not a separate implementation layer in the current code. Root-level commit tracking is owned by `RootRegistry` and invoked by the Component Discovery Plugin when a commit arrives. Per-component `rendered` detection is resolved inside Traversal using `lastObservedValues`; structural Hook Tracking is resolved by Hook Inspector; and structural Context Tracking is resolved by Context Inspector. All three component-level facts are then carried through Traversal → Mapper → Component Registry and exposed through `ComponentSnapshot`. This keeps each concern at the layer where its required input already exists and avoids introducing a consumer-only layer without a real consumer, consistent with Principle 5.

## The long-term concepts of Timeline, Inspector, and richer tracking remain downstream consumers that can be added later. They are not current runtime pipeline layers.

## Data Flow

The runtime processes a commit in the following order:

1. React commits a tree update.
2. The Hook Adapter receives the commit notification.
3. The Component Discovery Plugin records the root-level commit when a root is registered.
4. The Fiber Adapter extracts the traversal entry point.
5. Traversal walks the Fiber tree and resolves stable component ids plus the `rendered` fact.
6. Hook Inspector resolves structural hook summaries for each component.
7. Context Inspector resolves structural context summaries for each component.
8. The Mapper converts the extracted facts into `ComponentSyncInput`.
9. Component Registry synchronizes structural state and lifecycle/render history.
10. `Insight.getComponents()` projects the internal records into read-only `ComponentSnapshot` values.

Unmounts follow a separate path: React notifies the Hook Adapter, the Fiber Adapter validates the raw Fiber, the stable component id is resolved, and `ComponentRegistry.markUnmounted()` preserves the component's history.

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

---

### Clear Ownership

Each layer owns exactly one concern.

| Layer                | Responsibility                             |
| -------------------- | ------------------------------------------ |
| Hook Adapter         | Receive React runtime notifications        |
| Fiber Adapter        | Expose React runtime entry points          |
| Traversal            | Walk Fibers and resolve component facts    |
| Hook Inspector       | Classify structural hook information       |
| Context Inspector    | Inspect structural Context dependencies    |
| Mapper               | Translate extracted facts into domain data |
| Component Registry   | Own component graph and history            |
| Root Registry        | Own root-level commit history              |
| Inspector / Timeline | Future presentation and analysis consumers |

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

──────────────────────────────────────────────

Mapper

──────────────────────────────────────────────

React Insight Domain
Component Registry
Root Registry
Public ComponentSnapshot
Future Inspector / Timeline
```

Everything above the Mapper is React-specific.

Everything below the Mapper is React Insight domain logic.

The Mapper is therefore considered the architectural boundary between React internals and the React Insight domain.

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
  Fiber Adapter → Traversal → Mapper → Component Registry pipeline.
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
as of `DECISIONS.md`, 2026-07-26). This layer also owns a second,
related raw shape: `HookNode` (`memoizedState: unknown`, `queue:
unknown`, `next: HookNode | null`), describing a single node of a
function component's hooks linked list — the entry point for that
list is `FiberNode.memoizedState` itself, reinterpreted as a
`HookNode | null` only by Hook Inspector (see below), and only after
confirming the Fiber is not a class component (whose `memoizedState`
means something entirely different — `this.state`). Fiber Adapter
remains the only module allowed to know either shape exists.

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
to resolve **`hooks`** (see below), and includes the result unchanged
in its output.

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
empty array for class components.

**Classification limits, confirmed via a controlled Playground
experiment** (a probe component exercising every common hook type,
logging each `HookNode`'s actual shape — not assumed from prior
knowledge of React internals, see `DECISIONS.md`, 2026-07-27):

- `useState` / `useReducer` share an identical shape (`queue` present,
  with a `dispatch`) and both classify as `"state"`.
- `useRef` has a unique shape (`{ current }`, no `queue`) and reliably
  classifies as `"ref"`.
- `useMemo` / `useCallback` share an identical shape (`[value, deps]`
  array, no `queue`) and both classify as `"memo-like"`.
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
- No hook or custom-hook _name_ is available from this technique, for
  any kind. Real React DevTools resolves names by re-invoking the
  component function with an instrumented dispatcher
  (`react-debug-tools`'s `inspectHooksOfFiber`) and parsing the call
  stack for custom hook boundaries — real per-inspection work, which
  React's own team intends to run on-demand only (e.g. when a
  component is explicitly selected for inspection), not on every
  commit for every component. This technique was deliberately not
  adopted for this always-on layer; it remains a candidate for a
  separate, on-demand capability once Inspector work has a concrete
  design. See `DECISIONS.md`, 2026-07-27, and "Deferred Concerns"
  below.
- `state`-kind hooks (`useState`/`useReducer`) _do_ carry a `value`, as
  of `DECISIONS.md`, 2026-07-28: unlike names, a hook's current value
  is already sitting in already-committed Fiber state
  (`hook.memoizedState`) and needs no re-invocation to read — the
  on-demand technique above simply doesn't apply to values the way it
  does to names. `hookValuePreview.ts`'s `previewHookValue()` produces
  a shallow (one-level), circular-safe preview of it. `ref`/`memo-like`
  hooks carry no `value` in this slice — technically just as readable,
  but with no current driving need.

**Input**

A single component Fiber (from Traversal, already confirmed to be a
component fiber — Hook Inspector performs its own, separate
class-vs-function check before walking).

**Output**

`HookSummary[]` — a structural fact per hook (`{ index, kind, value?
}`), where `kind` is one of `state | ref | memo-like | effect |
layout-effect | unknown`, and `value` (a shallow `HookValuePreview`,
see `hookValuePreview.ts`) is present only when `kind === "state"`.
Never a raw `HookNode` or Fiber reference.

**Must not know**

- `ComponentNode`, `ComponentRegistry`, or Plugins.
- Hook or custom-hook _names_ — out of scope for this layer entirely,
  not merely unresolved (see "Classification limits" above). Hook
  _values_ are only partially out of scope: in scope for `state`-kind
  (via `hookValuePreview.ts`), out of scope for every other kind in
  this slice.
- Whether this component is new, updated, or unchanged — that
  distinction belongs to `rendered`, resolved separately by Traversal,
  not to Hook Inspector.

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
isolation.

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
stateless inspector.

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
  structural ones. Passing `rendered`/`hooks` through is not a
  lifecycle decision: both are observational facts about this
  specific commit that Traversal (and, for `hooks`, Hook Inspector)
  already computed; the Mapper does not derive either, it only relays
  them unchanged.
- `ComponentRegistry` internals or any existing stored state.
- The internal shape of a `HookNode` — the Mapper only ever sees the
  already-classified `HookSummary[]`, never a raw hook object.

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
no-op. `hooks` and `contexts` are treated as structural, like
`displayName` — writable independently of `rendered` — since their
current shape and values are facts about the Fiber state observed in
this commit, not accumulated history like `renderCount`. Structural
fields updating whenever they differ (not gated on `rendered`) is what
still allows the discovery pipeline to tag components with a temporary
`"pending"` `rootId` before any root is registered (see the React
package's `componentDiscoveryPlugin`, which is registered eagerly and
can therefore observe commits before root registration completes) —
the next real commit self-heals `rootId` to the actual value at no
extra cost, with no reconciliation logic needed in the Registry
itself. See `DECISIONS.md`, 2026-07-21 and 2026-08-23 (the latter
added the no-op path itself; prior to it, `sync()` wrote and notified
on every single call regardless of whether anything had changed).

**Input**

`ComponentSyncInput` values (from Mapper, via `sync()`) and component
ids to mark unmounted (from the Hook Adapter → Fiber Adapter →
Traversal unmount path, via `markUnmounted()`).

**Output**

A query API for consumers: `get(id)`, `has(id)`, `values()`, `size`.
Also `subscribe(listener): () => void`, called after any `sync()` or
`markUnmounted()` call that actually mutates state — `sync()` itself
only mutates state (and therefore only notifies) when something
genuinely changed, per the dirty-check described above (`DECISIONS.md`,
2026-08-23); a call that reports no render and no structural
difference from what's already stored is a no-op that never reaches
`scheduleNotify()`. Notifications that do fire are still batched via
`queueMicrotask()` (a private `scheduleNotify()`), not fired
synchronously per call — `componentDiscoveryPlugin` calls `sync()`
once per discovered component within a single commit, and an earlier
synchronous-notify design caused a real, observed feedback loop in
Playground (the subscribing consumer, `InsightDebugPanel`, is itself
part of the observed React tree, so each notification triggered a
re-render, which triggered a new commit, which triggered more
notifications). See `DECISIONS.md`, 2026-08-04.

Neither the dirty-check nor the batching fully eliminates a
self-observing consumer's feedback loop on their own: a consumer whose
own re-render is itself a genuine, correctly-detected change (e.g. a
debug panel using local state to force a refresh) will still be
notified every time, because that really is new data. Closing that
residual loop is a consumer-level concern, not a Registry contract —
see `packages/playground/src/App.tsx`'s `InsightDebugPanel`, which
excludes its own record from its refresh decision, and `DECISIONS.md`,
2026-08-23.

**Must not know**

- Fiber, Traversal, Hook Inspector, or how discovery happened.
- Anything about eager vs. effect-based plugin registration timing —
  the Registry's unconditional `rootId` update on `sync()` happens to
  make it tolerant of that timing, but the Registry itself has no
  awareness of _why_ a `rootId` might be `"pending"`.

**Implementation status**

Change-event emission is implemented (`subscribe()`, see "Output"
above) — but as a self-contained mechanism local to `ComponentRegistry`,
not through the Core event system (see "Deferred Concerns" below for
why that path remains deferred). Root-scoped querying (`getByRoot`) is
not implemented yet. `register()` (which throws on a duplicate id) and
`unregister()` (hard removal) are retained separately from
`sync()`/`markUnmounted()` for callers where a duplicate id is a
genuine error, or a full removal is genuinely intended, respectively —
the discovery pipeline itself only ever uses `sync()`/`markUnmounted()`,
and only these two are wired to `subscribe()`'s notifications.

---

## Cross-Layer Data Rules

| Boundary                        | Model that crosses it                                                                              | Allowed below this boundary?                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| React → Hook Adapter            | Raw React callback arguments                                                                       | No — never leaves Hook Adapter                 |
| Hook Adapter → Fiber Adapter    | Internal runtime event (raw Fiber/FiberRoot ref)                                                   | No — never leaves Fiber Adapter                |
| Fiber Adapter → Traversal       | Single Fiber entry point (`alternate`, `memoizedProps`, `memoizedState`, `dependencies`)           | No — never leaves Traversal                    |
| Traversal → Hook Inspector      | Single component Fiber; `memoizedState` interpreted as `HookNode` list                             | No — never leaves Hook Inspector               |
| Hook Inspector → Traversal      | `HookSummary[]` (`{ index, kind, value? }`; no `HookNode` or Fiber reference)                      | Yes — passed through unchanged                 |
| Traversal → Context Inspector   | Single component Fiber; `dependencies.firstContext` interpreted as `ContextDependencyNode` list    | No — never leaves Context Inspector            |
| Context Inspector → Traversal   | `ContextSummary[]` (`{ index, displayName, value }`; no dependency/Context/Fiber reference)        | Yes — passed through unchanged                 |
| Traversal → Mapper              | `DiscoveredComponent` (`id`, `displayName`, `parentId`, `rootId`, `rendered`, `hooks`, `contexts`) | No — internal contract only                    |
| Mapper → Component Registry     | `ComponentSyncInput` / `ComponentNode`                                                             | Yes — domain-level consumers may read the data |
| Component Registry → Public API | `ComponentSnapshot` (read-only projection; no `rootId`, Fiber, or React internals)                 | Yes — public contract                          |

No type whose name or shape depends on React Fiber (including
`HookNode` or `ContextDependencyNode`) may cross the Mapper boundary. This is the same boundary
already defined in "Architectural Boundary" above.

---

## Deferred Concerns

The following are explicitly out of scope for this contract and are
tracked in `DECISIONS.md`:

- Renderer identity (`rendererId`) — see 2026-07-18.
- `onPostCommitFiberRoot` — see 2026-07-18.
- `ComponentRegistry` change-event emission through the Core event
  system — implemented, but not this way: `Insight.onChange()`
  (2026-08-04, hardened 2026-08-23) is backed by a self-contained
  `subscribe()` mechanism local to `ComponentRegistry`, not Core's
  `mitt`-based event system. `ComponentRegistry` has never depended on
  `Runtime` or any Core type; routing through `PluginContext.emit()`/
  `on()` would have added a new coupling with no benefit
  `sync()`/`markUnmounted()` need. See `DECISIONS.md`, 2026-08-04.
- `ComponentRegistry.getByRoot()` — no current consumer; discovery
  currently assumes a single root (see `DECISIONS.md`, 2026-07-18 —
  single React application per page).
- Root-container correlation / multi-application page support — the
  current discovery plugin associates commits with the first registered
  root and uses `"pending"` before root registration; a concrete
  multi-root correlation design is still deferred.
- On-demand hook _name_ resolution (custom hook boundaries) — a
  genuinely different, re-render-based mechanism from structural Hook
  Inspector above; deliberately not built into the always-on
  Traversal pass; a candidate for Phase 3 Inspector work once it has a
  concrete design. See `DECISIONS.md`, 2026-07-27. Hook _value_
  resolution for `state`-kind hooks is no longer deferred for this
  slice — see `DECISIONS.md`, 2026-07-28. Values for `ref`/`memo-like`
  hooks remain out of scope because no current consumer justifies them.

Per-component render detection for ancestors/siblings cloned along a
reconciliation path without themselves re-rendering is no longer a
deferred concern — see Traversal above and `DECISIONS.md`, 2026-07-26.

Each may be introduced later without breaking this contract, provided
a real consumer is identified first.