# Architecture Decisions

## 2026-07-07

### Runtime owns the plugin lifecycle

PluginManager stores plugins only.

Plugin lifecycle belongs to Runtime.

---

## 2026-07-07

### Internal event system

`mitt` is used as the internal event emitter.

The implementation is completely hidden from the public API.

---

## 2026-07-07

### Generic PluginContext

PluginContext became generic.

Reason:

Preserve event payload types across plugins.

---

## 2026-07-07

### Generic InsightPlugin

InsightPlugin became generic.

Reason:

Allow strongly typed plugins without casts.

---

## 2026-07-07

### Generic PluginManager

PluginManager became generic.

Reason:

Preserve event types throughout the Runtime.

---

## 2026-07-08

### Generic Runtime

Runtime became fully generic.

Reason:

Keep the entire public API strongly typed without using:

- `any`
- `unknown`
- public casts

---

## 2026-07-08

### Atomic plugin registration

Plugin registration is transactional.

If `setup()` throws:

- the plugin is removed,
- the original error is re-thrown,
- no registration event is emitted.

Reason:

Prevent inconsistent Runtime state.

---

## 2026-07-08

### Plugin identity

Plugin names are unique.

Registering two plugins with the same name throws an error.

Reason:

Plugin names are the unique identifier used by Runtime and PluginManager.

---

## 2026-07-08

### Public API testing

Every public API must have automated tests.

Reason:

Public behavior is part of the library contract and must remain stable.

---

## 2026-07-08

### Playground strategy

The Playground package is the first official consumer of the Core package.

It imports the package exactly as external users will:

```ts
import { Runtime, loggerPlugin } from "@react-insight/core";

const runtime = new Runtime();

await runtime.registerPlugin(loggerPlugin());
```

Relative imports from `core/src` are not allowed.

Reason:

Validate package exports, workspace integration and developer experience before publishing.

---

## 2026-07-08

### Package consistency

Every package inside the workspace follows the same minimal structure:

```text
package
│
├── package.json
├── tsconfig.json
└── src/
```

Reason:

Keep the monorepo consistent and easy to maintain.

---

## 2026-07-11

### Runtime destruction

Runtime exposes a dedicated `destroy()` method.

After destruction:

- every registered plugin is destroyed,
- plugins are destroyed in reverse registration order (LIFO),
- Runtime becomes permanently unusable.

Every public API validates the Runtime state before executing.

Reason:

Prevent resource leaks and ensure deterministic shutdown.

---

## 2026-07-11

### Removed Runtime.clear()

`clear()` was removed in favor of `destroy()`.

Reason:

Removing plugins without executing their cleanup logic could leave resources and event subscriptions alive.

A Runtime should have a single explicit shutdown mechanism.

---

## 2026-07-11

### Built-in plugins are factories

Built-in plugins are created using factory functions.

Example:

```ts
const logger = loggerPlugin();
```

instead of:

```ts
const logger = loggerPlugin;
```

Reason:

Each Runtime receives an isolated plugin instance.

Internal plugin state (such as event disposers) is never shared across Runtime instances or test executions.

---

## 2026-07-11

### Coverage-driven development

Core development now follows a coverage-first approach.

Every completed feature is followed by:

- Unit tests
- Integration tests
- Coverage review

Reason:

Keep the Core package stable before expanding the public API.

Coverage thresholds are enforced through Vitest configuration.

---

## 2026-07-11

### Quality Gate

Every change must successfully pass:

- ESLint
- TypeScript type checking
- Build
- Unit tests
- Coverage thresholds

Reason:

Prevent regressions before changes are committed.

---

## 2026-07-11

### Shared ESLint configuration

The workspace now provides a shared Flat Config package.

All packages consume the same ESLint configuration.

Reason:

Ensure consistent code quality rules across the monorepo while avoiding duplicated configuration.

---

## 2026-07-11

### Preserve TypeScript strictness

Compiler strictness is never relaxed to silence type errors.

In particular:

- `strictFunctionTypes` remains enabled.
- `strict` mode remains enabled.

When TypeScript cannot express a safe relationship, localized and documented type assertions are preferred over weakening compiler guarantees.

Reason:

Maintain a strongly typed public API and maximize compile-time correctness.

---

## 2026-07-11

### Playground as integration validation

Playground is no longer only a manual demo.

It serves as an integration test bed for:

- package exports
- plugin lifecycle
- Runtime destruction
- built-in plugins
- workspace package resolution

Reason:

Ensure the published package behaves exactly as it will in external applications.

---

## 2026-07-12

### Automated Quality Gate

The project quality gate is enforced through GitHub Actions CI.

Every push and pull request targeting the main development branches automatically executes:

- ESLint
- TypeScript type checking
- Build
- Unit tests
- Coverage verification

The workflow runs against the supported Node.js LTS versions using a matrix strategy.

Reason:

Ensure every contribution satisfies the project's quality standards before being merged, while validating compatibility across supported Node.js versions.

---

## 2026-07-13

### Official React integration package

React integration is implemented as a dedicated workspace package:

```text
@react-insight/react
```

Reason:

Keep the Core package framework-agnostic while providing an idiomatic React API.

---

## 2026-07-13

### Runtime encapsulation

The Runtime is no longer exposed through the public React API.

Instead, applications interact with the `Insight` abstraction.

The Runtime is stored internally using a symbol-based implementation detail.

Reason:

Prevent coupling to internal implementation details and preserve API stability during future refactors.

---

## 2026-07-13

### Insight as the public facade

The `Insight` object is the only public entry point for application code.

It exposes only high-level operations such as:

- `use()`
- `destroy()`

Reason:

Expose a small, stable API while allowing the internal Runtime implementation to evolve independently.

---

## 2026-07-13

### Internal implementation layer

Private implementation details are isolated under an `internal/` directory.

Examples include:

- Runtime symbol
- Internal Runtime holder types

These modules are never exported from the package entry point.

Reason:

Clearly separate public APIs from implementation details and reduce the risk of accidental public exports.

---

## 2026-07-13

### React public API testing

The React package follows the same public API testing strategy as the Core package.

Current public APIs covered by automated tests include:

- `createInsight()`
- `InsightProvider`
- `useInsight()`

Reason:

Protect the React integration layer against regressions while maintaining a stable developer experience.

---

## 2026-07-14

### Defer React-specific runtime infrastructure

React-specific runtime infrastructure such as `ReactBridge`, `InsightSession`, or similar ownership abstractions is intentionally postponed until a real runtime consumer exists.

Current React infrastructure is implemented only when justified by actual behavior and integration requirements.

Reason:

Follow the YAGNI principle and avoid introducing abstractions before they provide concrete value.

This keeps the React package simple while allowing future architecture to evolve from real use cases instead of predictions.

---

## 2026-07-14

### React lifecycle is implemented as an internal Runtime plugin

React lifecycle behavior is implemented as an internal plugin registered through the existing Runtime plugin system.

The lifecycle plugin is responsible for synchronizing React root mount and unmount events with the internal `RootRegistry`.

`InsightProvider` owns only the lifecycle integration point. It does not implement registration logic itself.

Reason:

Reuse the existing Runtime plugin architecture instead of introducing a React-specific lifecycle mechanism.

This keeps the React package aligned with the Core architecture, preserves a single plugin lifecycle model, and avoids unnecessary abstractions.

---

## 2026-07-14

### Runtime remains the single owner of lifecycle management

React-specific lifecycle events are delegated to the Runtime through plugin registration.

Neither `InsightProvider` nor React hooks manage plugin lifecycles directly beyond registering the internal lifecycle plugin.

Reason:

Maintain a single source of truth for plugin lifecycle management and keep React integration focused solely on bridging React with the Runtime.

---

## 2026-07-14

### Internal Runtime access is isolated behind helper utilities

The internal Runtime and supporting infrastructure are accessed through dedicated internal helper functions rather than exposing implementation details throughout the React package.

Reason:

Reduce coupling between internal modules, improve maintainability, and preserve the flexibility to refactor the internal implementation without affecting the public API.

---

## 2026-07-15

### Component Registry is independent from React internals

The `ComponentRegistry` is implemented as a framework-agnostic state container.

It stores only React Insight domain models and has no knowledge of React Fiber or renderer-specific implementation details.

Reason:

Keep the registry reusable, testable and independent from React internals. React-specific discovery mechanisms are responsible for translating renderer data into registry updates.

---

## 2026-07-15

### Component Discovery is design-first

Implementation of the Component Discovery subsystem is intentionally postponed until its architecture is finalized.

No renderer abstraction, Fiber bridge or discovery service will be introduced before a concrete design with real producers and consumers exists.

Reason:

Follow YAGNI and avoid premature abstractions. Every new module should provide immediate value instead of acting as a placeholder for future functionality.

---

## 2026-07-18

### Removed unused RootRegistration abstraction

The `RootRegistration` class (`internal/rootRegistration.ts`) was removed.

It had no consumers anywhere in the codebase and was never wired into
the lifecycle flow. `useRootLifecycle` already unregisters plugins
directly via `unregisterPlugin()`, without using this class.

Reason:

An unreferenced abstraction violates the no-placeholder-API principle
regardless of whether it is exported publicly or kept internal. Dead
code creates confusion for future contributors about which lifecycle
pattern is actually in use.

---

## 2026-07-18

### Renderer identity is deferred

`ComponentNode` and its upstream discovery models do not include a
`rendererId` field today.

Only `react-dom` is supported. No consumer (Registry, Mapper, or any
Plugin) reads or needs renderer identity yet.

The DevTools hook's `renderers: Map<RendererID, ReactRenderer>` shape
shows multi-renderer support is architecturally possible, but adding
the field now would be a placeholder with no real consumer.

Reason:

Follow the same test already used for Component Discovery: no field
is added to a domain model without a real consumer. If multi-renderer
support (React Native, react-three-fiber, etc.) is ever required, it
is expected to be a major-version change, not an incremental addition.

---

## 2026-07-18

### Hook Adapter event contract is limited to Commit and Unmount

The Hook Adapter only reacts to `onCommitFiberRoot` and
`onCommitFiberUnmount`.

`onPostCommitFiberRoot` is intentionally not wired, even though React
provides it today.

Reason:

No current consumer (Component Registry or any planned Tracking
subsystem) needs to distinguish "Fiber tree committed" from "effects
have run". Wiring it now would be an unused extension point, which
Principle 5 (No Premature Abstraction) prohibits. `onPostCommitFiberRoot`
remains available on the hook and can be adopted later (e.g. for Render
Tracking) without changing this contract.

---

## 2026-07-18

### Component Discovery assumes a single React application per page

The Hook Adapter connects to the page-global `__REACT_DEVTOOLS_GLOBAL_HOOK__`,
which reports every Fiber commit on the page, not only commits belonging to
the application wrapped by `InsightProvider`.

No container-based filtering is implemented yet. Discovery currently
attributes every discovered component to the first `InternalRoot` found in
`RootRegistry`.

Reason:

The existing lifecycle plugin (`react:lifecycle`) already assumes a single
active root per Insight instance (fixed plugin name, throws on duplicate
registration). Adding container-based correlation now would be a feature
with no current multi-root consumer. This assumption must be revisited
before multi-root or multi-application support is added.

---

## 2026-07-19

### Unmount marks components as unmounted instead of removing them

`componentDiscoveryPlugin`'s `onUnmount` now calls a new
`ComponentRegistry.markUnmounted()` instead of `unregister()`.

`markUnmounted()` sets `status` to `"unmounted"` and `unmountedAt` to
the current timestamp, but keeps the component record in the registry.

`unregister()` remains unchanged (hard removal) but is no longer used
by the discovery pipeline.

Reason:

`status` and `unmountedAt` already exist on `ComponentNode` and are
already exercised by `sync()` (which sets `status: "mounted"` and
`unmountedAt: null` on first discovery, and preserves `mountedAt`
across updates). Continuing to hard-delete on unmount would leave
these fields permanently without a producer, contradicting the
no-placeholder-field principle in the other direction — the same
principle used to defer `rendererId` and `onPostCommitFiberRoot`.

Preserving unmounted components also provides the historical data
future Timeline / Inspector consumers will need, without introducing
any new speculative abstraction now: the consumer is the unmount
handling being implemented in this change, not a predicted future one.

This is a non-breaking change. `ComponentRegistry.unregister()` keeps
its existing hard-delete semantics and its existing test coverage;
it is simply no longer called from the unmount discovery path.

---

## 2026-07-20

### Render Tracking begins with root-level commit counting

`InternalRoot` gains `commitCount` and `lastCommittedAt`. `RootRegistry`
gains `recordCommit(id)`, called once per `onCommitFiberRoot` for the
active root, before traversal runs.

Reason:

This is the first slice of Render Tracking (see ROADMAP.md). Every
`onCommitFiberRoot` call for a registered root corresponds to exactly
one real commit, so counting at the root level is unambiguous and
100% accurate.

A per-component render count was considered and rejected for this
slice: `traverse()` walks the _entire_ current fiber tree on every
commit and calls `ComponentRegistry.sync()` for every discovered
component, regardless of whether that specific component actually
re-rendered in this commit. Incrementing a count in `sync()` would
conflate "present in the tree during this commit" with "actually
rendered", producing inflated, misleading numbers for any component
that didn't change. See the next entry for why this is deferred
rather than solved now.

---

## 2026-07-20

### Per-component render detection is deferred pending a fiber diffing design

Detecting whether a specific Fiber actually rendered (rather than
merely being present in the tree) requires comparing a Fiber against
its `alternate` — the same general technique used by React DevTools
and community tools built on `__REACT_DEVTOOLS_GLOBAL_HOOK__` (e.g.
`react-debug-updates`) to implement "why did this render" features.

This is intentionally not implemented yet. It requires:

- Extending `FiberNode` (`fiberAdapter.ts`) with an `alternate`
  reference, since fiberAdapter.ts is the only module allowed to know
  raw Fiber shape.
- A dedicated design pass evaluating the diffing signal to use
  (`alternate` comparison vs. profiler timing fields such as
  `actualDuration`, which are development-build-only).
- A real consumer for the result before any field is added to
  `ComponentNode` (Principle: no field without a real consumer — the
  same principle applied to `rendererId` and `onPostCommitFiberRoot`).

Reason:

Follow the same design-first process used for Component Discovery
(see 2026-07-15 and Session 13) rather than shipping a heuristic that
could silently produce incorrect render counts. Root-level commit
counting (previous entry) ships now because it is unambiguous; per-
component detection ships once its technique is deliberately chosen
and documented.

---

## 2026-07-20

### Fixed: getFiberId() did not survive React's current/alternate toggling

`getFiberId()` assigned ids using a `WeakMap<FiberNode, string>` keyed
purely on Fiber object identity. React reuses exactly two Fiber objects
per component instance (`current` and `alternate`), toggling which one
is `root.current` on every commit. A component's _first_ update swaps
`root.current` to the previously-unseen `alternate` object, which had
no entry in the WeakMap — so it received a brand-new id.

Impact: `ComponentRegistry.sync()` treated any component's first
re-render as a new mount. The original entry, never having actually
unmounted, was never cleaned up, leaving an orphaned "ghost" record.
Every component that ever re-rendered more than once would accumulate
duplicate entries indefinitely.

This was not caught earlier because the only existing "stable id"
test re-traversed the _same_ Fiber object twice, never simulating the
current/alternate swap.

Fix:

- `FiberNode` (`fiberAdapter.ts`) gained an `alternate: FiberNode | null`
  field.
- `getFiberId()` now also checks `fiber.alternate` for an existing id
  before minting a new one, and back-fills the id for `fiber` itself so
  subsequent lookups are direct.

Reason:

Correctness of Component Discovery's mount/update tracking depends on
component identity surviving across renders. This also happens to be
required groundwork for any future per-component render detection
(2026-07-20, previous entries), which will need to compare a Fiber
against its `alternate` regardless.

---

## 2026-07-20

### Per-component render detection implemented via current/alternate resolution

The per-component render detection deferred earlier today is now
implemented, reusing the fiber identity fix from the previous entry
rather than introducing a new mechanism:

- Direct WeakMap hit on the Fiber object itself → React bailed out and
  reused `current` unchanged → not rendered this commit.
- Hit on `fiber.alternate` instead → the current/work-in-progress pair
  swapped → React actually processed this fiber → rendered.
- Neither → first mount → rendered.

`DiscoveredComponent` gained a `rendered: boolean` field, threaded
through `ComponentSyncInput` into `ComponentRegistry.sync()`.
`ComponentNode` gained `renderCount` and `lastRenderedAt`, updated only
when `rendered` is true; structural fields (`rootId`, `displayName`,
`parentId`) continue to update unconditionally, matching existing
`sync()` semantics.

Reason:

No `<Profiler>` wrapping (which would require touching consumer code,
contradicting the project's zero-instrumentation positioning) and no
dependency on development-build-only profiler timing fields
(`actualDuration`) were needed — the signal was already implied by the
fiber identity fix. This mirrors the general technique used by React
DevTools and community tools built on
`__REACT_DEVTOOLS_GLOBAL_HOOK__` (e.g. `react-debug-updates`) to detect
re-renders without wrapping user code.

---

## 2026-07-21

### Playground wired to a real React app for end-to-end validation

`packages/playground` now depends on `@react-insight/react`, `react`,
and `react-dom`, with a small demo tree (`App`, `Counter`, `Display`,
`Greeting`, `InsightDebugPanel`) rendered through `InsightProvider`.

Reason:

Component Discovery (Sessions 12-15) and Render Tracking (Session 14-15)
had never been validated against a real React commit — only synthetic
Fiber fixtures in unit tests. This session found four real bugs (see
the following entries) that no synthetic-fixture unit test could have
caught, confirming Playground's original stated purpose ("first real
consumer... validates Runtime behavior and DX before publishing") had
been neglected since the React package's introduction.

---

## 2026-07-21

### Added Insight.getComponents() public read API

`Insight` gains `getComponents(): ReadonlyArray<ComponentSnapshot>`.
`ComponentSnapshot` is a new public type, intentionally decoupled from
the internal `ComponentNode` shape.

Reason:

`ComponentRegistry` had accumulated a rich internal model (mount/unmount
status, render count) with zero way for any consumer — including
Playground — to read it. This was the actual blocker preventing
Playground from validating Component Discovery / Render Tracking at
all, and is a prerequisite for any future Inspector/DevTools panel.

---

## 2026-07-21

### Removed ComponentNode.children (dead field)

`children: ReadonlySet<ComponentId>` was set to `new Set()` at mount
and never read or written anywhere else in the codebase.

Reason:

Same no-placeholder-field principle already applied to `rendererId`
and (briefly) to `status`/`unmountedAt` before `markUnmounted()` gave
them a producer. `children` never got a producer and had no consumer;
removed rather than left as dead weight. Can be reintroduced with a
real design once something needs to render a component tree (e.g. a
future Inspector).

---

## 2026-07-21

### Fixed: DevTools hook stub was missing inject(), silently blocking all discovery

The stub installed by `connectHookAdapter()` was `{ renderers: new Map() }`
— no `inject()` method. React's real renderer bootstrap
(`injectInternals`) calls `hook.inject(rendererInternals)` once, at
`react-dom` module-initialization time, to register itself; if that
call throws (missing method) or the hook doesn't exist yet, React
never calls `onCommitFiberRoot`/`onCommitFiberUnmount` for the rest of
that page session — confirmed by `renderers.size` staying `0` even
after commits were otherwise observed working end-to-end elsewhere in
this session's testing.

Fix: the stub now includes `supportsFiber: true` and a real `inject()`
(assigns and returns an incrementing renderer id, stores into
`renderers`), extracted into `createStubHook()`.

Reason:

Discovered only through real-browser testing (Playground). No unit
test could have caught this: existing tests call
`hook.onCommitFiberRoot(...)` directly, bypassing `react-dom`'s own
`inject()`-based connection handshake entirely.

---

## 2026-07-21

### Added installReactDevtoolsHook(), a new pre-React-load public entry point

React's renderer checks for `__REACT_DEVTOOLS_GLOBAL_HOOK__` exactly
once, at `react-dom` module-initialization time. If the hook is
installed later (e.g. from inside a React effect, which is where
`connectHookAdapter()` used to run via `componentDiscoveryPlugin`),
React never discovers it for that page load — confirmed both by
React's own `react-devtools-inline` documentation ("This method must
be called before React is loaded") and empirically in this session.

`installReactDevtoolsHook()` is now exported from `@react-insight/react`
(`internal/discovery/hookAdapter.ts`), idempotent, and must be called
by the consuming application before importing `react-dom` anywhere in
the module graph. `connectHookAdapter()` also calls it defensively for
graceful (if late) degradation.

Reason:

This is a deliberate, narrow exception to "nothing under `internal/`
is exported publicly": this function is inherently independent of any
`Insight` instance and must run before one can even be created in a
correctly-ordered app. The same precedent exists in React's own
`react-devtools-inline` package (a standalone top-level `initialize()`
function with the identical constraint).

---

## 2026-07-21

### Fixed: plugin register/unregister raced under StrictMode's double-invoke

`useRootLifecycle` (and, before its removal, `useComponentDiscovery`)
fired `insight.use(plugin)` and the cleanup's `unregisterPlugin(name)`
independently ("fire and forget"). React 18+ StrictMode invokes
effects as mount -> cleanup -> mount in development; since
`Runtime.unregisterPlugin()` awaits `Plugin.destroy()` before freeing
the plugin's name from `PluginManager`, the second mount's
registration could run before the first mount's cleanup had actually
freed the name, throwing "Plugin ... is already registered" —
confirmed via an uncaught promise rejection in the browser console.

Fix: register/unregister operations are now serialized through a
per-hook `useRef`-held promise chain, so every operation waits for the
previous one to fully settle regardless of exactly how closely spaced
in time React schedules the effect/cleanup calls.

Reason:

Found only through real StrictMode rendering in Playground; no
existing unit test rendered through `<StrictMode>`. A regression test
was added (`useInsightLifecycle.test.tsx`) rendering through
`<StrictMode>` and asserting no console errors.

---

## 2026-07-21

### Fixed: component discovery registered too late to see the first commit

`componentDiscoveryPlugin` was registered via `useComponentDiscovery()`,
called from a React effect inside `InsightProvider`. Effects always run
_after_ the commit that triggers them, so an effect-based registration
structurally cannot observe the very first commit of its own tree (the
one that mounts `InsightProvider` itself) — confirmed empirically:
`onCommitFiberRoot` never fired on initial page load under the old
registration, only after a subsequent user-triggered commit.

Fix: `componentDiscoveryPlugin` is now registered eagerly inside
`createInsight()`, which runs before `ReactDOM.createRoot().render()`
in the application entry point. `useComponentDiscovery.ts` was removed;
`useInsightLifecycle()` now only coordinates `useRootLifecycle`, which
remains effect-based (it only needs to know "a Provider mounted", with
no first-commit visibility requirement).

Reason:

Root lifecycle and component discovery have fundamentally different
timing requirements, so they can no longer share the same
effect-based registration strategy.

---

## 2026-07-21

### Fixed: commits before root registration were silently dropped ("pending" rootId)

A side effect of the previous fix: `componentDiscoveryPlugin` now
connects before the very first commit, but root registration
(`useRootLifecycle`) is still effect-based and therefore still runs
_after_ that first commit. `onCommit` used to bail out entirely
(`if (!activeRoot) return;`) when no root was registered yet, silently
dropping the first commit's components forever (StrictMode only
re-invokes effects, not a full tree commit, so there was no second
chance).

Fix: `onCommit` now always runs discovery, tagging components with a
`"pending"` `rootId` fallback when no root is registered yet.
`ComponentRegistry.sync()` already updates `rootId` unconditionally on
every commit, so once the real root registers, the next commit
self-heals the correct `rootId` at no extra cost — no reconciliation
logic needed.

Reason:

Preferred over deferring/buffering pre-root commits, which would add
real complexity for a case that resolves itself for free on the very
next commit.

---

## 2026-07-21

### Known limitation: fiber cloning along the update path inflates renderCount for ancestors and siblings

Confirmed via a controlled Playground experiment (baseline snapshot,
one `Increment` click, snapshot again): clicking a leaf component's
state setter increments `renderCount` not only for that component, but
for _every_ component sharing its root — including ancestors that
bailed out (function body not re-invoked) and unrelated siblings.

Cause: React reconciles from the root on every update. Even when an
ancestor's function body doesn't re-execute (real bailout), React still
constructs a new work-in-progress Fiber (clone) for it and the fibers
along the path down to the updated component, so that new child/sibling
links can be attached. `resolveFiberIdentity()` (traversal.ts) treats
"Fiber object identity changed via the alternate pair" as "rendered",
which is accurate for the component that actually triggered the
update, but over-counts every fiber merely cloned along the path to it.

This is not fixed in this session. A correct fix requires distinguishing
"cloned because an ancestor is on the path to a real update" from
"actually re-executed", which likely needs comparing `memoizedProps`/
`memoizedState` rather than raw Fiber identity — a more invasive,
version-sensitive internals dependency that deserves its own dedicated
design pass (the same caution already applied when profiler-timing
fields were considered and deferred, 2026-07-20).

Reason for documenting rather than fixing now:

Root-level commit counting (`RootRegistry.commitCount`) remains fully
accurate and unaffected — it doesn't depend on Fiber identity at all.
Per-component `renderCount` is accurate for leaf/isolated updates but
overcounts along shared ancestor paths; this is now a documented,
known accuracy limitation (like `rendererId` and
`onPostCommitFiberRoot`), not a silently-wrong number.

---

## 2026-07-21

### Playground's InsightDebugPanel polls instead of reading data reactively

`insight.getComponents()` is a pull-based snapshot API with no change
notification. `InsightDebugPanel` (Playground only) polls it via
`setInterval` every 500ms so the demo UI stays reasonably current.

Reason:

A real reactive API (e.g. `insight.onChange(callback)`) has no current
consumer beyond this one demo panel, so per the no-placeholder-API
principle it is deferred rather than spec'd now. Revisit if/when a
real Inspector or DevTools panel consumer needs push-based updates.

## 2026-07-26

### Fixed: renderCount overcounting for ancestor/sibling Fibers cloned along the reconciliation path

Previously documented as a known limitation (2026-07-21, "fiber cloning
along the update path inflates renderCount for ancestors and
siblings"). Root-caused and fixed this session, through two rounds of
controlled Playground experiments — the fix required two iterations
because each version was correct against the experiment that motivated
it, but wrong against a fuller one.

**Attempt 1 — compare `memoizedProps`/`memoizedState` against `alternate`,
only on the alternate-hit path.**

Confirmed the core hypothesis: `bailoutOnAlreadyFinishedWork` copies
`memoizedProps`/`memoizedState` by reference from `current` during a
real bailout, so an unchanged reference on both means the fiber's
function body didn't re-execute, even if the Fiber _object_ was cloned.
Validated with a single-click Playground experiment (console logging
`propsEqual`/`stateEqual` per component): only the two components that
actually changed (`Counter`, whose own state changed; `Display`, whose
props changed) showed `false`, while cloned-but-bailed-out ancestors
(`App`, `InsightProvider`) and an unrelated sibling (`Greeting`) all
showed `true`/`true`.

This version only applied the comparison on the `alternateHit` branch
of `resolveFiberIdentity`, leaving the pre-existing `directHit` branch
returning `rendered: false` unconditionally, as before.

**Regression found — directHit is not reliably "unchanged".**

A longer manual Playground test (baseline snapshot, then one
`Increment` click after several polling-timer ticks had already
elapsed) showed `Counter`'s `renderCount` failing to increment on a
real update. Cause: React recycles at most two Fiber objects per
component indefinitely — from a component's _second_ real update
onward, the object that becomes `current` is one already seen before
(a `directHit`), even though its fields were just mutated in place for
a genuine re-render. Object identity alone (direct vs. alternate hit)
is only a reliable "nothing changed" signal for a component's first
update; comparing against `alternate` doesn't help here either, since
`alternate` also gets recycled and mutated over time.

**Regression found — comparing against `alternate` goes stale for
components that stop updating.**

Applying the props/state comparison uniformly (against `alternate`,
regardless of hit type) fixed the above, but a longer multi-click
Playground test (baseline, then 4x `Increment` clicks with a ~3s pause
after each, observing snapshots the whole way) surfaced a second,
worse regression: `Display`, after its one real update, kept being
reported as `rendered: true` on every subsequent unrelated commit
(reached `renderCount: 183` after a few dozen background polling
ticks, despite never receiving new props again). Cause: once a
component stops receiving real updates while the rest of the tree
keeps committing, its `alternate` freezes at whatever it was during
its last real update — every later comparison is against that same
stale snapshot, which never matches "now", so `rendered` stays `true`
forever.

**Final fix: compare against a self-maintained "last observed"
snapshot, not against `alternate`.**

`resolveFiberIdentity()` now keeps a `Map<id, { props, state }>`
(`lastObservedValues`) recording what was seen the _last time this
function was called_ for a given stable id, independent of which
physical Fiber object currently holds `current`. Every call — direct
hit, alternate hit, or new id — compares the incoming
`memoizedProps`/`memoizedState` against that map entry (not
`alternate`), then updates the map entry to the current values. This
makes every comparison relative to "changed since the last time we
looked", which self-corrects on every traversal rather than depending
on a snapshot that can go stale.

Re-validated end-to-end in Playground: baseline + 4x `Increment` click
(with pauses between, to let many unrelated `InsightDebugPanel`
polling commits interleave) showed `Counter` and `Display` each
incrementing by exactly 1 per click and nothing else, while `App`,
`Greeting`, and `InsightProvider` stayed completely flat across dozens
of unrelated commits.

Files changed: `packages/react/src/internal/discovery/fiberAdapter.ts`
(`FiberNode` gained `memoizedProps`/`memoizedState`),
`packages/react/src/internal/discovery/traversal.ts`
(`resolveFiberIdentity()` rewritten as above),
`packages/react/src/internal/discovery/traversal.test.ts` (new
coverage for: props/state-driven rendered detection, a cloned ancestor
with unchanged props/state, a recycled direct-hit fiber that changed
again, a recycled direct-hit fiber that didn't change, and the
stale-comparison regression itself — repeated unrelated commits after
a component's last real update must not keep reporting `rendered`).

Reason:

This closes the last known accuracy gap in Render Tracking.
Root-level `commitCount` was never affected by any of this (it doesn't
depend on Fiber identity at all); only per-component `renderCount` was.
The two intermediate regressions are recorded here deliberately,
because each was itself only caught by a real-browser Playground test
of a shape the previous fix hadn't been exercised against (a single
click; then a delayed single click; then multiple clicks with pauses)
— reinforcing the project's existing rule that unit tests against
fixture Fibers alone would not have caught either regression.

---

## 2026-07-27

### Added: structural Hook Tracking (`inspectHooks()`)

Began Hook Tracking, chosen from the open candidates in
`PROJECT_CONTEXT.md`'s Current Focus over `onChange()` / root-container
correlation / `ComponentRegistry` change-event emission (all still
without a real current consumer — see 2026-07-27 "Current Focus"
update below) and over starting Phase 3 Inspector groundwork (which
needs Hook/State data that didn't exist yet).

**Research before implementation.** Initially assumed hook type/name
detection would work like a lighter version of what we'd need for
render tracking (heuristics over `fiber.memoizedState` shape). Actual
research into how real React DevTools does this (`react-debug-tools`,
`inspectHooksOfFiber`) showed this assumption was wrong: DevTools does
not read Fiber shape at all for hook _names_ — it re-invokes the
component function with an instrumented dispatcher that intercepts
each hook call at the call site, and resolves custom hook names via
call-stack parsing (which breaks under minification, a limitation
React's own team has documented). This is real work done on-demand
only when a component is explicitly inspected, not on every commit —
confirmed by the React team's own discussion of the performance cost
of doing this during profiling (referenced in `facebook/react#16477`).

**Decision: structural-only tracking for this slice (Path A), not the
DevTools re-render technique (Path B).** Consistent with this
project's existing zero-instrumentation, no-wrapper positioning for
Render Tracking (2026-07-20). Path B remains a valid future addition,
scoped as an on-demand `inspectHooks(componentId)`-style API distinct
from the always-on traversal, once Inspector work has a concrete
design — deliberately deferred, not rejected.

**Validated the actual Hook object shape before writing
classification logic**, via a controlled Playground experiment (a
temporary `HookInspectorProbe` component exercising `useState`,
`useRef`, `useMemo`, `useCallback`, `useEffect`, `useLayoutEffect`,
logging each hook's `memoizedState`/`queue` shape). Findings:

- `useState`/`useReducer` share an identical shape (`queue` present,
  with a `dispatch`) — not distinguishable from shape alone.
- `useRef` has a unique shape (`{ current }`, no `queue`).
- `useMemo`/`useCallback` share an identical shape (`[value, deps]`
  array, no `queue`) — not distinguishable from shape alone.
- `useEffect`/`useLayoutEffect` _are_ distinguishable, via a bitmask
  on the Effect object's `tag` field: `Passive` (`0b1000`) vs.
  `Layout` (`0b0100`) — confirmed empirically as `9` (`HasEffect |
Passive`) and `5` (`HasEffect | Layout`) respectively, matching
  `react-reconciler`'s internal (unexported) `ReactHookEffectTags.js`
  constants. This was better resolution than originally expected.

**Implementation:** `inspectHooks(fiber)` walks the hooks linked list
rooted at `fiber.memoizedState` and returns `HookSummary[]` (`{ index,
kind }`), where `kind` is one of `state | ref | memo-like | effect |
layout-effect | unknown`. Guards against class components (whose
`memoizedState` is `this.state`, not a hooks list) via the same marker
React itself uses internally to detect class components
(`type.prototype.isReactComponent`) — a deliberate departure from this
package's existing `isComponentFiber()`, which intentionally treats
function and class components alike for identity/render-detection
purposes (where the distinction doesn't matter) but does matter here.

Threaded through the existing pipeline the same way `rendered` was:
`FiberNode` gained a sibling `HookNode` type (`fiberAdapter.ts`),
`DiscoveredComponent`/`ComponentSyncInput`/`ComponentNode` each gained
a `hooks: readonly HookSummary[]` field, `ComponentRegistry.sync()`
updates it unconditionally (a structural fact like `displayName`, not
an accumulated stat like `renderCount`), and the public
`ComponentSnapshot` exposes it read-only.

**Validated end-to-end in Playground**, not just unit-tested: every
component's actual hook list matched hand-verified expectations
(`Counter`/`App` → `[state]`; `Display`/`Greeting` → `[]`;
`InsightProvider` → `[ref, effect]`, matching `useRootLifecycle`'s
internal `useRef` + `useEffect`). No bugs found this time — the
Playground experiment confirmed the design ahead of the final
implementation, rather than disproving it after the fact.

**Known limitation found during that same validation, not assumed in
advance:** `useContext` does not consume a hook slot at all —
`readContext()` is called directly by React's `mountContext`/
`updateContext` internals without pushing an entry onto the hooks
linked list. Confirmed by `InsightDebugPanel` (which calls
`useInsight()`, itself `useContext`-based, plus its own `useState` and
`useEffect`) reporting only 2 hooks, not 3. This means any hook that
is purely a thin `useContext` wrapper is invisible to `inspectHooks()`
entirely, not merely unclassified — a distinct limitation from the
already-known `useState`/`useReducer` and `useMemo`/`useCallback`
shape ambiguity.

Files changed: `fiberAdapter.ts` (new `HookNode` type),
`hookInspector.ts` (new — `classifyHook()`, `inspectHooks()`),
`hookInspector.test.ts` (new), `discoveredComponent.ts`,
`traversal.ts`, `componentMapper.ts`, `component.ts`,
`componentRegistry.ts`, `types.ts`, `createInsight.ts`.

Reason:

This is the first slice of Hook Tracking (Roadmap Phase 2). It
deliberately does not attempt hook values, hook names, or custom hook
boundaries — those require the Path B technique above and a real
consumer-driven design (likely Phase 3 Inspector), not a rushed
heuristic bolted onto the always-on traversal pass. The three real
limitations found (state/reducer ambiguity, memo/callback ambiguity,
useContext invisibility) are recorded here rather than silently
shipped, matching this project's existing standard for Render
Tracking's own known limitations.

---

## 2026-07-28

### Added: state hook value preview (`previewHookValue()`)

Chosen as the next priority over `onChange()` / root-container
correlation / on-demand hook name resolution (all still deferred, see
`PROJECT_CONTEXT.md` Current Focus) because it closes a specific,
narrowly-scoped gap in the "no hook values" limitation documented
2026-07-27: unlike hook _names_, the _value_ of a `kind: "state"` hook
(`useState`/`useReducer`) is directly readable from `hook.memoizedState`
with no re-render, no instrumented dispatcher, and no per-inspection
cost — the DevTools-style technique deferred for names does not apply
here at all. Deliberately scoped to `state`-kind hooks only for this
slice; `ref`/`memo-like` values could be added later the same way, but
without a current driving need.

**Design constraint:** hook values can be arbitrary JS values —
objects, arrays, functions, DOM refs, or self-referential structures —
so serialization needed to be both safe (no crash on circular
references, no invoking functions) and bounded (no unbounded cost on
large structures), consistent with this project's zero-instrumentation
posture.

**Design chosen:** shallow (one level deep) preview.
`previewHookValue()` returns primitives as-is; for a plain object or
array, walks exactly one level and replaces any nested
object/array/function/class-instance/etc. with a `{ __type: string }`
type descriptor rather than recursing further. This makes circular-
reference safety a structural property of the design (there is no
code path that revisits a node, since nothing is ever visited past
depth 1) rather than something requiring an explicit `seen`-set guard.
Also capped at 20 entries per object/array to bound output size and
cost for large structures — a preview, not a full snapshot.

**Bug found and fixed via unit tests before Playground validation:**
the top-level branch of `previewHookValue()` treated any non-array
object as a plain object to expand into `keys`, without the same
class-instance check `previewLeaf()` already applied one level down —
so a class instance passed directly as hook state (e.g. `new
Point(1, 2)`) incorrectly expanded to `{ __type: "object", keys: {x,
y} }` instead of `{ __type: "Point" }`. Fixed by reusing the same
`describeType()` check at the top level before deciding to expand.
Caught by `hookValuePreview.test.ts` before ever reaching Playground.

**Validated end-to-end in Playground**, per the project's standing
rule for any Component Discovery change: a temporary
`StateShapeProbe` component (object and array state) plus the
existing `Counter` (primitive state) confirmed correct previews for
all three shapes, live-updating correctly on real state changes
(`Counter`'s preview moved `0` → `1` on click). `InsightDebugPanel`
was permanently extended to render `hooks[].value` inline;
`StateShapeProbe` itself was removed after validation, having served
its purpose as a temporary fixture.

Files changed: `hookValuePreview.ts` (new — `previewHookValue()`),
`hookValuePreview.test.ts` (new), `hookInspector.ts` (`HookSummary`
gained an optional `value` field, populated only for `kind: "state"`),
`hookInspector.test.ts` (existing fixtures updated, one new test for
the value/no-value split), `types.ts` (`ComponentSnapshot.hooks[]`
element gained the same optional `value` field, inlined rather than
exported as a standalone type — no current external consumer).

Reason:

Closes the "no hook values" gap for the one hook kind where it was
cheap and safe to do so (`state`), without reaching for the
re-render-based technique deliberately deferred for hook _names_ on
2026-07-27. Keeps this project's standing pattern: validate a
non-obvious design (shape safety, here) with unit tests first, then
confirm it holds against a real, live-updating React tree in
Playground before considering the change complete.

---

## 2026-07-29

### Added: structural Context Tracking (`inspectContexts()`)

Chosen from the remaining Current Focus candidates over `onChange()`,
root-container correlation, on-demand hook _name_ resolution, and
extending value preview to `ref`/`memo-like` hooks (the last
explicitly flagged 2026-07-28 as "no current consumer justifies it
yet"). Context Tracking is a planned Roadmap Phase 2 item with a clear
scope, not a speculative API, and is a natural continuation of Hook
Tracking — ironically prompted by discovering (2026-07-27) that
`useContext` leaves no trace in the hooks linked list at all, meaning
Context values needed an entirely separate mechanism.

**Research before implementation**, matching the project's standing
pattern: `fiber.dependencies.firstContext` is a linked list, separate
from the hooks list (`fiber.memoizedState`), that React maintains for
any fiber — function or class component alike — that calls
`useContext()`/`readContext()`. Each node already carries
`memoizedValue` directly (unlike hook _names_, no walk up to the
Provider fiber is needed). `context.displayName` is a documented,
publicly-supported convention (the same one real React DevTools uses
to label context consumers), making Context tracking able to recover
real names where hook names could not.

**Validated the actual shape before writing implementation**, via a
controlled Playground experiment (a temporary `ContextProbe` component
calling `useContext()` once, logging `fiber.dependencies` directly).
Confirmed the shape above, and surfaced an unexpected finding:
**two** chained dependency nodes appeared for a single `useContext()`
call, both pointing at the same `context` object and the same
`memoizedValue`. Most likely caused by React 18+ StrictMode's
development-mode double-invocation of the component body without a
full reset of the dependency list between the two invocations —
Playground renders through `<StrictMode>` (`index.tsx`). Root cause
not fully confirmed, but `inspectContexts()` was designed to be
correct regardless: it deduplicates by `context` object identity while
walking the chain, so a duplicate node (whatever its cause) never
produces a duplicate entry in the output.

**Implementation:** `inspectContexts(fiber)` walks
`fiber.dependencies.firstContext`, deduplicating by `context` identity,
and returns `ContextSummary[]` (`{ index, displayName, value }`) per
distinct Context. `value` reuses `previewHookValue()` (2026-07-28)
unchanged — no new serialization logic needed, since a Context's
current value has exactly the same "arbitrary JS value, must be safe
and bounded" shape as a `state`-kind hook's value. `displayName` falls
back to the literal string `"Context"` when the consuming application
never set `Context.displayName`.

Threaded through the existing pipeline the same way `hooks` was:
`FiberNode` gained a `dependencies: unknown` field and a new
`ContextDependencyNode` type (`fiberAdapter.ts`),
`DiscoveredComponent`/`ComponentSyncInput`/`ComponentNode` each gained
a `contexts: readonly ContextSummary[]` field, `ComponentRegistry.sync()`
updates it unconditionally (structural, like `hooks`/`displayName`),
and the public `ComponentSnapshot` exposes it read-only.

**Validated end-to-end in Playground**, per the project's standing
rule for any Component Discovery change: `ContextProbe`, wrapped in a
`ThemeContext.Provider value="dark"`, reported exactly one context
entry (`ThemeContext="dark"`) — confirming the dedup logic actually
neutralizes the StrictMode duplicate observed during the raw-shape
experiment, and that `displayName` resolution works. A side finding,
not a bug: `InsightDebugPanel` itself showed a `contexts:
[Context={...full Insight instance...}]` entry, from the library's own
internal `useInsight()` (`useContext`-based) — `InsightContext` has no
`displayName` set today, so it falls back to the generic label. Left
as-is for this session (cosmetic; the library's own internal context
was never in scope for this feature), noted here as a cheap future
improvement if it ever becomes worth doing.

Files changed: `fiberAdapter.ts` (`FiberNode` gained `dependencies`;
new `ContextDependencyNode` type), `contextInspector.ts` (new —
`inspectContexts()`), `discoveredComponent.ts`, `traversal.ts`,
`componentMapper.ts`, `component.ts`, `componentRegistry.ts`,
`types.ts`, `createInsight.ts`.

Reason:

Closes the "Context tracking" item from Roadmap Phase 2 with a
zero-instrumentation, always-on technique consistent with Render and
Hook Tracking — no re-render, no Provider-tree walk, values already
sitting on the consuming fiber itself. The StrictMode duplicate-node
finding is recorded rather than silently worked around without
explanation, matching this project's existing standard (e.g. the
overcounting fix's regression history, 2026-07-26) of documenting
real, observed anomalies even when the design already handles them
defensively.

---

## 2026-08-04

### Removed orphaned EventBus/Subscription/SubscriptionRegistry from Core

`packages/core/src/events/` (`EventBus.ts`, `IEventBus.ts`,
`Subscription.ts`, `SubscriptionRegistry.ts`, plus their tests) has
been removed.

Context:

This subsystem was an independently-designed internal event system,
separate from the `mitt`-based implementation actually wired into
`Runtime` (see 2026-07-07, "Internal event system"). It was fully
implemented and had its own passing unit tests, but was never imported
by `Runtime`, `PluginManager`, `plugins/`, or any package outside
`core`, and was never re-exported from `packages/core/src/index.ts`.
A repo-wide search confirmed zero references to it anywhere in
production code.

Verification before removal:

Rather than deleting directly, the folder was first relocated outside
`packages/core/src/` (so it fell outside every `tsconfig`/`vitest`
include pattern) and the full Quality Gate (build, test, coverage,
typecheck, lint) was run and passed unchanged. This empirically
confirmed, not just reasoned about, that nothing in the live system
depended on it before the folder was permanently deleted.

Decision:

Removed rather than wired in. `Runtime`'s existing `mitt`-based event
system already provides everything the Runtime and its plugins
currently need (typed `emit`/`on`, unsubscribe-via-closure); adopting
the second implementation instead would have meant a larger,
higher-risk `Runtime` rewrite to replace working, already-tested code
with no new capability gained.

Reason:

Same no-placeholder-code principle already applied repeatedly in this
project (`RootRegistration`, `ComponentNode.children`,
`packages/core/src/insight/` stub files) — code without a real
consumer is removed rather than left as a second, confusing
implementation of something already solved elsewhere.

---

## 2026-08-04

### Added Insight.onChange(), replacing Playground's polling workaround

`Insight` gains `onChange(listener: () => void): () => void`.
`ComponentRegistry` gains a self-contained `subscribe()`/notify
mechanism, independent of `@react-insight/core`'s event system —
`ComponentRegistry` has never depended on `Runtime` or any Core type,
and wiring it through `PluginContext.emit()`/`on()` would have added a
new coupling for no benefit `sync()`/`markUnmounted()` don't already
need.

This closes the "reactive change API" candidate that had been listed
in `PROJECT_CONTEXT.md`'s Current Focus since Session 15, deferred
until a real non-demo consumer existed. Playground's
`InsightDebugPanel`, which had been polling `getComponents()` via
`setInterval(..., 500)` since Session 16, was that consumer —
`InsightDebugPanel` now subscribes via `insight.onChange()` instead.

Real bug found and fixed via Playground testing, not caught by unit
tests:

The first implementation called `notify()` synchronously, once per
`sync()`/`markUnmounted()` call. `componentDiscoveryPlugin`'s
`onCommit` handler calls `sync()` once per discovered component within
a single commit — for a Playground tree of 6 components, one real
commit fired 6 synchronous notifications. Because `InsightDebugPanel`
is itself part of the React tree being observed, each notification's
`forceRefresh()` triggered a new commit, which triggered 6 more
notifications, and so on: a self-sustaining feedback loop. Confirmed
in the browser: clicking "Increment" once produced `renders: 52` on
`InsightDebugPanel` and a hook value in the hundreds, growing
continuously. The previous polling implementation had never exposed
this, since its fixed 500ms interval incidentally throttled the loop
below a runaway rate.

Fix: `ComponentRegistry.scheduleNotify()` batches all `notify()` calls
within the same synchronous execution window into a single
`queueMicrotask()`-deferred notification, using a `pendingNotify` flag
to collapse repeated calls. This still lets the conceptual feedback
loop exist (`InsightDebugPanel` observing its own subtree is inherent
to how Component Discovery works), but caps it at one notification per
microtask tick rather than one per synced component, matching the
throttling behavior real DevTools-style tools use for the same reason.

A regression test (`componentRegistry.test.ts`, "collapses multiple
sync() calls within the same tick into a single notification")
reproduces the exact scenario that caused the bug, so a future change
that reintroduces per-call synchronous notification fails a test
instead of requiring rediscovery in a browser.

Files changed: `componentRegistry.ts` (`subscribe()`, `notify()`,
`scheduleNotify()`, wired into `sync()` and `markUnmounted()`),
`componentRegistry.test.ts`, `types.ts` (`Insight.onChange()`),
`createInsight.ts`, `createInsight.test.ts`,
`packages/playground/src/App.tsx` (`InsightDebugPanel` switched from
`setInterval` polling to `insight.onChange()`).

Reason:

Reinforces this project's standing pattern (see the `renderCount`
overcounting saga, 2026-07-26): a design that looks correct against a
single, simple test case can still hide a real bug that only a
live, real-React-tree test in Playground exposes — unit tests alone,
testing `ComponentRegistry` in isolation from any React tree, could
not have surfaced this specific feedback-loop failure mode.
