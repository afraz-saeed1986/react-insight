import { describe, expect, it } from "vitest";

import { InsightContext } from "./InsightContext";

describe("InsightContext", () => {
  it("has a displayName set, so Context Tracking resolves a real name instead of falling back to 'Context'", () => {
    expect(InsightContext.displayName).toBe("InsightContext");
  });
});