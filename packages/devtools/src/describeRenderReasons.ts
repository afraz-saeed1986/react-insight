import type { RenderReason } from "@react-insight/react";

/**
 * Turns the render reasons of a component into short, human-readable
 * lines. `hookLabel` names a state hook by its index so the panel can
 * show the resolved hook name when an inspection is available.
 */
export function describeRenderReasons(
  reasons: ReadonlyArray<RenderReason>,
  hookLabel: (index: number) => string,
): string[] {
  return reasons.map((reason) => {
    switch (reason.type) {
      case "mount":
        return "First render";
      case "props":
        return `Props changed: ${reason.keys.join(", ")}`;
      case "state":
        return `State changed: ${reason.hookIndices.map(hookLabel).join(", ")}`;
      case "context":
        return `Context changed: ${reason.names.join(", ")}`;
      case "parent":
        return "Parent re-rendered; no prop, state or context change detected (may be avoidable)";
      case "unknown":
        return "No cause detected";
    }
  });
}