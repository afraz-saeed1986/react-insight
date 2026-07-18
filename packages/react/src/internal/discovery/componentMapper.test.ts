import { describe, expect, it } from "vitest";

import { mapDiscoveredComponent } from "./componentMapper";
import type { DiscoveredComponent } from "./discoveredComponent";

describe("mapDiscoveredComponent", () => {
  it("maps structural fields only", () => {
    const discovered: DiscoveredComponent = {
      id: "fiber-1",
      rootId: "root-1",
      displayName: "App",
      parentId: null,
    };

    expect(mapDiscoveredComponent(discovered)).toEqual({
      id: "fiber-1",
      rootId: "root-1",
      displayName: "App",
      parentId: null,
    });
  });
});