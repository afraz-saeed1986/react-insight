import type { Insight } from "../types";

import type { InternalInsight } from "./runtime";

/**
 * Returns the internal implementation behind the public Insight API.
 *
 * This function is the only place where the React package narrows
 * the public Insight facade to its internal representation.
 *
 * The cast is safe because createInsight() is the only supported way
 * to create an Insight instance, and it always returns an InternalInsight.
 */
export function getInternalInsight(insight: Insight): InternalInsight {
  return insight as InternalInsight;
}
