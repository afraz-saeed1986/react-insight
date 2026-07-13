import { useContext } from "react";

import { InsightContext } from "../context";
import type { Insight } from "../types";

export function useInsight(): Insight {
  const insight = useContext(InsightContext);

  if (insight === null) {
    throw new Error("useInsight must be used within an <InsightProvider>.");
  }

  return insight;
}
