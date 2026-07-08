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
