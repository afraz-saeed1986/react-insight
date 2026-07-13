import { describe, expect, it } from "vitest";

import { createInsight } from "./createInsight";

describe("createInsight", () => {
  it("creates an Insight instance", () => {
    const insight = createInsight();

    expect(insight).toBeDefined();
  });

  it("exposes the public API", () => {
    const insight = createInsight();

    expect(insight.use).toBeTypeOf("function");
    expect(insight.destroy).toBeTypeOf("function");
  });

  it("does not expose the Runtime", () => {
    const insight = createInsight();

    expect("runtime" in insight).toBe(false);
  });

  it("destroys successfully", async () => {
    const insight = createInsight();

    await expect(insight.destroy()).resolves.toBeUndefined();
  });
});
