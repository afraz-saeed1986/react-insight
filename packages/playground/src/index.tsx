import { installReactDevtoolsHook } from "@react-insight/react";
installReactDevtoolsHook();

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createInsight, InsightProvider } from "@react-insight/react";

import { App } from "./App";

const container = document.querySelector<HTMLDivElement>("#app");

if (!container) {
  throw new Error("App element not found.");
}

const insight = createInsight();

createRoot(container).render(
  <StrictMode>
    <InsightProvider insight={insight}>
      <App />
    </InsightProvider>
  </StrictMode>,
);