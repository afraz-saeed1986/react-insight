import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createInsight } from "../createInsight";
import { getInternalInsight } from "./getInternalInsight";
import { useInsightLifecycle } from "./useInsightLifecycle";

function TestComponent() {
  const insight = createInsight();

  useInsightLifecycle(insight);

  return null;
}

describe("useInsightLifecycle", () => {
  it("creates the lifecycle plugin", () => {
    render(<TestComponent />);

    const insight = createInsight();
    const internalInsight = getInternalInsight(insight);

    expect(internalInsight.rootRegistry.size).toBe(0);
  });
});

function StrictModeTestComponent({ insight }: { insight: ReturnType<typeof createInsight> }) {
  useInsightLifecycle(insight);
  return null;
}

describe("useInsightLifecycle under StrictMode", () => {
  it("does not throw or log errors on the mount -> cleanup -> mount double-invoke", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const insight = createInsight();

    render(
      <StrictMode>
        <StrictModeTestComponent insight={insight} />
      </StrictMode>,
    );

    // Let the serialized register/unregister chain settle.
    await vi.waitFor(() => {
      expect(getInternalInsight(insight).rootRegistry.size).toBe(1);
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});