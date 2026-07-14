import type { Runtime } from "@react-insight/core";

import type { Insight } from "../types";

import type { RootRegistry } from "./rootRegistry";
/**
 * Internal symbol used to associate an Insight instance
 * with its underlying Runtime.
 *
 * This symbol is intentionally not exported from the public API.
 */
export const runtimeSymbol: unique symbol = Symbol("runtime");

export interface RuntimeHolder {
  readonly [runtimeSymbol]: Runtime;
  readonly rootRegistry: RootRegistry;
}

/**
 * Internal representation of an Insight instance.
 *
 * This type augments the public Insight API with the internal Runtime reference.
 */
export type InternalInsight = Insight & RuntimeHolder;
