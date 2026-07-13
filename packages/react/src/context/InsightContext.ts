import { createContext } from "react";

import type { Insight } from "../types";

export const InsightContext = createContext<Insight | null>(null);
