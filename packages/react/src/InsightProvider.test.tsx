import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { createInsight } from "./createInsight";
import { InsightProvider } from "./InsightProvider";
import { useInsight } from "./hooks";

function TestComponent() {
  const insight = useInsight();

  return (
    <div>{typeof insight.use === "function" ? "connected" : "missing"}</div>
  );
}

describe("InsightProvider", () => {
  it("provides the Insight instance through context", () => {
    const insight = createInsight();

    render(
      <InsightProvider insight={insight}>
        <TestComponent />
      </InsightProvider>,
    );

    expect(screen.getByText("connected")).toBeDefined();
  });

  it("throws when used outside InsightProvider", () => {
    function TestComponent() {
      useInsight();

      return null;
    }

    expect(() => render(<TestComponent />)).toThrow(
      "useInsight must be used within an <InsightProvider>.",
    );
  });
});
