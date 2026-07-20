import { describe, expect, it } from "vitest";

import { mapDiscoveredComponent } from "./componentMapper";
import type { DiscoveredComponent } from "./discoveredComponent";

describe("mapDiscoveredComponent", () => {
  it("maps structural and rendered fields", () => {
    const discovered: DiscoveredComponent = {
      id: "fiber-1",
      rootId: "root-1",
      displayName: "App",
      parentId: null,
      rendered: true,
    };

    expect(mapDiscoveredComponent(discovered)).toEqual({
      id: "fiber-1",
      rootId: "root-1",
      displayName: "App",
      parentId: null,
      rendered: true,
    });
  });

  it("passes through rendered: false unchanged", () => {
    const discovered: DiscoveredComponent = {
      id: "fiber-1",
      rootId: "root-1",
      displayName: "App",
      parentId: null,
      rendered: false,
    };

    expect(mapDiscoveredComponent(discovered).rendered).toBe(false);
  });
});