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
