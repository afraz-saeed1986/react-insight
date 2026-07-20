# React Runtime Architecture

> Status: Draft
>
> Last Updated: 2026-07-18
>
> This document defines the long-term architecture of the React runtime package. It serves as the primary architectural reference for all React-specific runtime features, including component discovery, tracking, inspection, and future DevTools integration.

---

# 1. Vision

## Purpose

The React runtime is responsible for observing React applications and transforming React-specific runtime information into a framework-independent internal model that can be consumed by the rest of React Insight.

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

---

## Performance

Runtime observation must minimize unnecessary allocations and repeated traversal.

Additional runtime work should only occur when new capabilities require it.

Performance optimizations should never compromise architectural clarity.

---

## Internal First

All runtime APIs are internal unless a real public consumer requires otherwise.

Public APIs are introduced only when justified by actual usage.

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
                        React Fiber Adapter
                               │
                               ▼
                        Fiber Traversal
                               │
                               ▼
                       Component Mapper
                               │
                               ▼
                     Component Registry
                               │
               ┌───────────────┼────────────────┐
               ▼               ▼                ▼
        Render Tracking   Hook Tracking   Context Tracking
               │               │                │
               └───────────────┼────────────────┘
                               ▼
                       Timeline / Inspector
```

---

## Data Flow

The runtime processes information in the following order:

1. React commits a tree update.
2. The Hook Adapter receives the commit notification.
3. The Fiber Adapter extracts the runtime entry point.
4. The Traversal layer walks the Fiber tree.
5. The Mapper converts Fibers into domain models.
6. The Registry synchronizes the Component graph.
7. Tracking systems observe registry changes.
8. Inspector and future DevTools consume tracking data.

Every layer only knows about the layer directly below it.

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

---

### Clear Ownership

Each layer owns exactly one concern.

| Layer         | Responsibility                        |
| ------------- | ------------------------------------- |
| Hook Adapter  | Receive React runtime notifications   |
| Fiber Adapter | Expose React runtime entry points     |
| Traversal     | Walk Fiber structures                 |
| Mapper        | Translate Fiber into Component models |
| Registry      | Own Component graph                   |
| Tracking      | Observe runtime evolution             |
| Inspector     | Present information                   |

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

──────────────────────────────────────────────

Mapper

──────────────────────────────────────────────

Domain Model

Component Registry
Tracking
Inspector
Timeline
```

Everything above the Mapper is React-specific.

Everything below the Mapper is React Insight domain logic.

The Mapper is therefore considered the architectural boundary between React internals and the React Insight domain.

# 6. Runtime Architecture Model

This section defines the concrete contract of every layer in the
pipeline described in Section 5. It is the final architectural
reference before implementation begins. No layer may be implemented
with a contract different from what is defined here without a new
entry in `DECISIONS.md`.

---

## Hook Adapter

**Responsibility**

Safely connect to `__REACT_DEVTOOLS_GLOBAL_HOOK__`: install it if
absent, chain any existing `onCommitFiberRoot` / `onCommitFiberUnmount`
callbacks instead of overwriting them, and isolate errors thrown by
downstream code so they never reach React's renderer.

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

**Input**

A single Fiber reference (from the Fiber Adapter).

**Output**

A list of minimal, extracted records — not raw Fiber references —
containing only the fields required downstream: an identifier, a
display name, and a parent identifier.

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

## Mapper

**Responsibility**

Pure, stateless translation of a single extracted Traversal record
into the structural shape of a `ComponentNode` (`id`, `rootId`,
`displayName`, `parentId` only).

**Input**

One extracted record from Traversal.

**Output**

A partial `ComponentNode` containing only structural fields
(`ComponentSyncInput`).

**Must not know**

- Whether this component is new, updated, or being removed.
- `mountedAt`, `unmountedAt`, or `status` — these are lifecycle
  decisions, not structural ones.
- `ComponentRegistry` internals or any existing stored state.

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
mount or an update (`sync()`), and remove state on explicit unmount
notifications (`unregister()`). Own `mountedAt`, `unmountedAt`, and
`status`.

**Input**

`ComponentSyncInput` values (from Mapper, via `sync()`) and component
ids to remove (from the Hook Adapter → Fiber Adapter → Traversal
unmount path, via `unregister()`).

**Output**

A query API for consumers: `get(id)`, `has(id)`, `values()`, `size`.

**Must not know**

- Fiber, Traversal, or how discovery happened.

**Implementation status**

Change-event emission and root-scoped querying (`getByRoot`) are not
implemented yet — see "Deferred Concerns" below. `register()` (which
throws on a duplicate id) is retained separately from `sync()` for
callers where a duplicate id is a genuine error rather than an update.

---

## Cross-Layer Data Rules

| Boundary                     | Model that crosses it                            | Allowed below this boundary?                              |
| ---------------------------- | ------------------------------------------------ | --------------------------------------------------------- |
| React → Hook Adapter         | Raw React callback arguments                     | No — never leaves Hook Adapter                            |
| Hook Adapter → Fiber Adapter | Internal runtime event (raw Fiber/FiberRoot ref) | No — never leaves Fiber Adapter                           |
| Fiber Adapter → Traversal    | Single Fiber entry point                         | No — never leaves Traversal                               |
| Traversal → Mapper           | `DiscoveredComponent` (no Fiber reference)       | No — internal contract only between Traversal and Mapper  |
| Mapper → Registry → Plugins  | `ComponentSyncInput` / `ComponentNode`           | Yes — the only models allowed to travel the full pipeline |

No type whose name or shape depends on React Fiber may cross the
Mapper boundary. This is the same boundary already defined in
"Architectural Boundary" above.

---

## Deferred Concerns

The following are explicitly out of scope for this contract and are
tracked in `DECISIONS.md`:

- Renderer identity (`rendererId`) — see 2026-07-18.
- `onPostCommitFiberRoot` — see 2026-07-18.
- `ComponentRegistry` change-event emission through the Core event
  system — no current consumer (no Plugin observes Registry changes
  yet); Plugins that need discovery results call the Registry's query
  API directly today.
- `ComponentRegistry.getByRoot()` — no current consumer; discovery
  currently assumes a single root (see `DECISIONS.md`, 2026-07-18 —
  single React application per page).

Each may be introduced later without breaking this contract, provided
a real consumer is identified first.
