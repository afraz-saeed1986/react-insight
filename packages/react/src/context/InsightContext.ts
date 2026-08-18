import { createContext } from "react";

import type { Insight } from "../types";

export const InsightContext = createContext<Insight | null>(null);

// Without this, Context Tracking's inspectContexts() (see
// internal/discovery/contextInspector.ts) has no displayName to read
// from this Context and falls back to the generic label "Context" for
// every consuming application's own useInsight() usage. Setting it
// here is the same public, DevTools-supported convention Context
// Tracking already resolves for application-defined contexts. See
// DECISIONS.md, 2026-07-29.
InsightContext.displayName = "InsightContext";