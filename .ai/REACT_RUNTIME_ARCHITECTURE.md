
The chosen design centralizes React-specific logic near the runtime boundary.

Every other layer operates exclusively on domain models.

**2026-08-24 addendum:** when Inspector work actually began, it did *not* slot into this diagram as a downstream consumer of `Registry`/`Tracking` output alone — it needed a side channel back to Fiber (via the Fiber Handle Registry) for the one thing structural domain models can never contain: the ability to re-invoke a component's function. This was evaluated against the same rejected alternatives above (e.g. "Inspector reads Fiber directly, unconditionally") and rejected for the same reason — it would couple every future Inspector feature to Fiber. The side channel is deliberately narrow (one registry, cleared on unmount, reachable only through one on-demand method) rather than reopening general Fiber access.

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
therefore unchanged by the 2026-08-24 work.

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
Inspector (below) when re-invoking a component — optional specifically
so every existing fixture across the discovery test suite keeps
compiling unmodified. This layer also owns a second, related raw
shape: `HookNode` (`memoizedState: unknown`, `queue: unknown`, `next:
HookNode | null`), describing a single node of a function component's
hooks linked list — the entry point for that list is
`FiberNode.memoizedState` itself, reinterpreted as a `HookNode | null`
by both Hook Inspector and, on-demand, Hook Name Inspector, and only
after confirming the Fiber is not a class component (whose
`memoizedState` means something entirely different — `this.state`).
Fiber Adapter remains the only module allowed to know either shape
exists.

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
Inspector (below) can reuse it rather than duplicate it.

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
`delete(id)`. Written by Traversal on every commit (overwriting any
previous handle for that id, so it always reflects the most recent
Fiber). Read by `createInsight.ts`'s `inspectHookNames(id)`. Deleted by
`componentDiscoveryPlugin.ts`'s `onUnmount`, alongside the existing
`markUnmounted()` call.

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
- Anything about dispatchers or re-invocation — that is Hook Name
  Inspector's concern entirely.

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
(from Dispatcher Access), re-invoke the component's function with an
instrumented dispatcher to resolve exact built-in hook names
(distinguishing `useState`/`useReducer` and `useMemo`/`useCallback`,
which Hook Inspector's structural technique cannot) and the name of
the nearest enclosing custom hook, if any.

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

**Custom hook name resolution required two rounds of real-execution
correction**, neither reasoned about correctly in advance:

1. Constructing `Error()` inside a shared `recordCall()` helper (rather
   than inline per dispatcher method) adds an extra stack frame a fixed
   offset assumption didn't account for.
2. Dispatcher methods accessed through the `Proxy` (the generic
   fallback path) report as `Proxy.useState` in V8 stack traces, not
   bare `useState` — a `.replace(/^Object\./, "")` assumption didn't
   anticipate this prefix.

Fixed by abandoning fixed-offset parsing for a resilient skip-loop:
strip any prefix before the last `.` in each frame name (handles both
`Object.` and `Proxy.` uniformly), then skip leading frames whose name
is in a known set of internal names (every built-in hook export name,
plus `recordCall` itself) until the first frame that isn't — that frame
is either a named custom hook, or the component function itself (no
enclosing custom hook).

**Input**

A `FiberNode` (from the Fiber Handle Registry, via `createInsight.ts`)
and a `DispatcherRef` (from Dispatcher Access, via `createInsight.ts`).

**Output**

`ReadonlyArray<InspectedHookName>` (`{ index, hookName, customHookName?
}`), or `undefined` if the fiber isn't a plain function component, or
if re-invocation itself throws. Never a raw `HookNode`, Fiber, or
dispatcher reference.

**Must not know**

- `ComponentNode`, `ComponentRegistry`, `RootRegistry`, or Plugins.
- Anything about `ComponentSnapshot` or how its result will be
  presented — that is `@react-insight/inspector`'s job.
- How the Fiber it's given was obtained (Fiber Handle Registry vs. a
  test fixture) — mirrors Traversal's own independence from the Hook
  Adapter, for the same testability reason.

**Scope, deliberately limited for this slice:**

- Plain function components only (excluded via the same
  `isClassComponentType()` check Hook Inspector uses) — not
  `memo`/`forwardRef`-wrapped, not class components.
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
`hookNameInspector.test.ts` cannot be meaningfully tested against plain
Fiber fixtures — it needs a real dispatcher and real hooks-list shape,
which only actual React rendering (`@testing-library/react`) can
provide. See "Testability" in Section 2.

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
- Anything about the Fiber Handle Registry, Dispatcher Access, or Hook
  Name Inspector — the on-demand side channel bypasses the Mapper
  entirely (see Section 5, "On-demand Side Channel").

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
on every single call regardless of whether anything had changed). This
per-field dirty-check granularity (`rootId`/`displayName`/`parentId`
individually, not just `hooks`/`contexts`) gained dedicated regression
test coverage in a 2026-08-24 test-suite review.

**Input**

`ComponentSyncInput` values (from Mapper, via `sync()`) and component
ids to mark unmounted (from the Hook Adapter → Fiber Adapter →
Traversal unmount path, via `markUnmounted()`).

**Output**

A query API for consumers: `get(id)`, `has(id)`, `values()`, `size`
(all covered by dedicated tests as of 2026-08-24). Also
`subscribe(listener): () => void`, called after any `sync()` or
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

`createInsight.ts` exposes both `getComponents()` (all tracked
components) and, since 2026-08-24, `getComponent(id)` (a single
component, O(1)), sharing one `toSnapshot()` mapping helper.

**Must not know**

- Fiber, Traversal, Hook Inspector, or how discovery happened.
- Anything about eager vs. effect-based plugin registration timing —
  the Registry's unconditional `rootId` update on `sync()` happens to
  make it tolerant of that timing, but the Registry itself has no
  awareness of _why_ a `rootId` might be `"pending"`.
- The Fiber Handle Registry, Dispatcher Access, or Hook Name Inspector
  — the on-demand side channel is entirely independent of
  `ComponentRegistry`'s own state and notification mechanism.

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
| Fiber Adapter → Traversal       | Single Fiber entry point (`alternate`, `memoizedProps`, `memoizedState`, `dependencies`, `pendingProps`) | No — never leaves Traversal (except via the Fiber Handle Registry side channel, below) |
| Traversal → Hook Inspector      | Single component Fiber; `memoizedState` interpreted as `HookNode` list                             | No — never leaves Hook Inspector               |
| Hook Inspector → Traversal      | `HookSummary[]` (`{ index, kind, value? }`; no `HookNode` or Fiber reference)                      | Yes — passed through unchanged                 |
| Traversal → Context Inspector   | Single component Fiber; `dependencies.firstContext` interpreted as `ContextDependencyNode` list    | No — never leaves Context Inspector            |
| Context Inspector → Traversal   | `ContextSummary[]` (`{ index, displayName, value }`; no dependency/Context/Fiber reference)        | Yes — passed through unchanged                 |
| Traversal → Fiber Handle Registry | The raw `FiberNode` itself, keyed by stable id                                                    | No — the on-demand side channel only, never re-enters the main pipeline |
| Fiber Handle Registry → Hook Name Inspector | The raw `FiberNode`, via `createInsight.ts`'s `inspectHookNames()`                        | No — never leaves Hook Name Inspector           |
| Dispatcher Access → Hook Name Inspector | A live `{ current }` dispatcher ref                                                        | No — never leaves Hook Name Inspector           |
| Hook Name Inspector → public API | `ReadonlyArray<InspectedHookName>` (`{ index, hookName, customHookName? }`; no `HookNode`, Fiber, or dispatcher reference) | Yes — public contract (`Insight.inspectHookNames()`) |
| Traversal → Mapper              | `DiscoveredComponent` (`id`, `displayName`, `parentId`, `rootId`, `rendered`, `hooks`, `contexts`) | No — internal contract only                    |
| Mapper → Component Registry     | `ComponentSyncInput` / `ComponentNode`                                                             | Yes — domain-level consumers may read the data |
| Component Registry → Public API | `ComponentSnapshot` (read-only projection; no `rootId`, Fiber, or React internals)                 | Yes — public contract                          |
| Public API → @react-insight/inspector | `ComponentSnapshot` and `InspectedHookName[]` (via `Insight.getComponent()`/`inspectHookNames()`) | Yes — that package's only inputs, combined into `ComponentInspection` |

No type whose name or shape depends on React Fiber (including
`HookNode` or `ContextDependencyNode`) may cross the Mapper boundary,
or leave Hook Name Inspector. This is the same boundary already
defined in "Architectural Boundary" above, extended to cover the
on-demand side channel's own exit point.

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
- **On-demand hook _name_ resolution is no longer deferred** — see
  "Hook Name Inspector" above, implemented 2026-08-24. What remains
  deferred within it specifically: `memo`/`forwardRef`-wrapped
  component support, and a full nested custom-hook tree (only one
  level is resolved). Neither has a current consumer.
- Hook _value_ resolution is likewise no longer deferred for
  `state`/`ref`/`memo-like` kinds (2026-07-28, extended 2026-08-24 —
  see `DECISIONS.md`).

Per-component render detection for ancestors/siblings cloned along a
reconciliation path without themselves re-rendering is no longer a
deferred concern — see Traversal above and `DECISIONS.md`, 2026-07-26.

Each may be introduced later without breaking this contract, provided
a real consumer is identified first.