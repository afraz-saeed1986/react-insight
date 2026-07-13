import type { PropsWithChildren } from "react";

import { InsightContext } from "./context";
import type { Insight } from "./types";

export interface InsightProviderProps extends PropsWithChildren {
  insight: Insight;
}

export function InsightProvider({ insight, children }: InsightProviderProps) {
  return (
    <InsightContext.Provider value={insight}>
      {children}
    </InsightContext.Provider>
  );
}
