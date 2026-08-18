import { describe, expect, it } from "vitest";

import type { ComponentSnapshot } from "./index";

// Type-level regression guard: this only compiles if ComponentSnapshot
// is actually exported from the package's public entry point (./index),
// not merely defined internally in ./types. If the export is ever
// removed from index.ts, `pnpm typecheck` fails here.
function assertComponentSnapshotShape(snapshot: ComponentSnapshot): string {
  return snapshot.id;
}

describe("public exports", () => {
  it("exports ComponentSnapshot as a named public type", () => {
    expect(typeof assertComponentSnapshotShape).toBe("function");
  });
});