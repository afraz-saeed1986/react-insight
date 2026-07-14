import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
