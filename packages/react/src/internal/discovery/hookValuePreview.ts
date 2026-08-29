/**
 * A "leaf" preview: either a real primitive value, or a type
 * descriptor for anything that isn't safely/cheaply representable
 * (nested object/array, function, class instance, DOM node, etc).
 * Leaves never recurse — this is what makes preview generation
 * inherently safe against circular references without needing a
 * `seen` set: there is no path by which previewHookValue() can ever
 * call itself on the same (or any) object more than one level deep.
 */
export type HookValueLeaf =
  | string
  | number
  | boolean
  | null
  | undefined
  | { readonly __type: string };

export type HookValuePreview =
  | HookValueLeaf
  | { readonly __type: "array"; readonly length: number; readonly items: readonly HookValueLeaf[] }
  | { readonly __type: "object"; readonly keys: Readonly<Record<string, HookValueLeaf>> };

// Bounds cost and output size for large arrays/objects. This is a
// preview for display, not a full snapshot — deliberately lossy above
// this size rather than unbounded.
const MAX_PREVIEW_ENTRIES = 20;

// Bounds cost/output size for long strings the same way
// MAX_PREVIEW_ENTRIES already bounds arrays/objects. Without this,
// previewLeaf() would embed an arbitrarily large string verbatim in
// every hook/context value preview. Confirmed as a real, not merely
// theoretical, issue via Playground once ref-value preview was added:
// Playground's own InsightDebugPanel holds a full JSON-serialized
// component snapshot in a ref (lastSnapshotRef), which is exactly the
// "arbitrary large string" case this preview must stay safe against.
// See DECISIONS.md.
const MAX_STRING_LENGTH = 200;

function describeType(value: object): string {
  const ctorName = (value as { constructor?: { name?: string } }).constructor?.name;
  return ctorName && ctorName !== "Object" ? ctorName : "object";
}

function previewLeaf(value: unknown): HookValueLeaf {
  if (value === null) return null;

  const type = typeof value;

  if (type === "string") {
    const str = value as string;
    return str.length > MAX_STRING_LENGTH
      ? `${str.slice(0, MAX_STRING_LENGTH)}… (${str.length} chars total)`
      : str;
  }

  if (type === "number" || type === "boolean" || type === "undefined") {
    return value as HookValueLeaf;
  }

  if (Array.isArray(value)) {
    return { __type: `array(${value.length})` };
  }

  if (type === "function") {
    return { __type: "function" };
  }

  if (type === "object") {
    return { __type: describeType(value as object) };
  }

  // symbol, bigint
  return { __type: type };
}

/**
 * Produces a shallow, circular-safe preview of a hook's current
 * value. Only used for hooks classified as `kind: "state"` (i.e.
 * useState/useReducer) — see hookInspector.ts. Never recurses past
 * one level: nested objects/arrays/functions/class instances are
 * replaced with a type descriptor rather than walked further.
 */
export function previewHookValue(value: unknown): HookValuePreview {
  if (value === null || typeof value !== "object") {
    return previewLeaf(value);
  }

  if (Array.isArray(value)) {
    return {
      __type: "array",
      length: value.length,
      items: value.slice(0, MAX_PREVIEW_ENTRIES).map(previewLeaf),
    };
  }

  const typeName = describeType(value);

  if (typeName !== "object") {
    return { __type: typeName };
  }

  const entries = Object.entries(value as Record<string, unknown>).slice(0, MAX_PREVIEW_ENTRIES);
  const keys: Record<string, HookValueLeaf> = {};

  for (const [key, entryValue] of entries) {
    keys[key] = previewLeaf(entryValue);
  }

  return { __type: "object", keys };
}