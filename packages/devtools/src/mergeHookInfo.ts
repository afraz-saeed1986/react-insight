import type { ComponentSnapshot, InspectedHookName } from "@react-insight/react";

type HookSummary = ComponentSnapshot["hooks"][number];

export interface HookRow {
  readonly index: number;
  readonly kind: HookSummary["kind"];
  /** Exact hook name, only known after an on-demand inspection. */
  readonly hookName: string | undefined;
  readonly customHookName: string | undefined;
  readonly value: HookSummary["value"];
}

/**
 * Joins the always-on structural hook summary with the on-demand
 * resolved hook names, by hook index. Names whose index has no
 * matching structural hook are ignored.
 */
export function mergeHookInfo(
  hooks: ComponentSnapshot["hooks"],
  hookNames: ReadonlyArray<InspectedHookName> | undefined,
): readonly HookRow[] {
  const namesByIndex = new Map<number, InspectedHookName>();

  for (const name of hookNames ?? []) {
    namesByIndex.set(name.index, name);
  }

  return hooks.map((hook) => {
    const name = namesByIndex.get(hook.index);

    return {
      index: hook.index,
      kind: hook.kind,
      hookName: name?.hookName,
      customHookName: name?.customHookName,
      value: hook.value,
    };
  });
}