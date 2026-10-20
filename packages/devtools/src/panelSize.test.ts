import { describe, expect, it } from "vitest";

import {
  PANEL_SIZE_STORAGE_KEY,
  clampNumber,
  parsePanelSize,
  readPanelSize,
  writePanelSize,
} from "./panelSize";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

describe("clampNumber", () => {
  it("keeps a value inside the range", () => {
    expect(clampNumber(5, 1, 10)).toBe(5);
    expect(clampNumber(0, 1, 10)).toBe(1);
    expect(clampNumber(99, 1, 10)).toBe(10);
  });
});

describe("parsePanelSize", () => {
  const empty = { height: null, detailsWidth: null };

  it("returns empty values when nothing is stored", () => {
    expect(parsePanelSize(null)).toEqual(empty);
  });

  it("reads both sizes", () => {
    expect(parsePanelSize('{"height":400,"detailsWidth":500}')).toEqual({
      height: 400,
      detailsWidth: 500,
    });
  });

  it("reads a partial value", () => {
    expect(parsePanelSize('{"height":400,"detailsWidth":null}')).toEqual({
      height: 400,
      detailsWidth: null,
    });
  });

  it("ignores invalid JSON and non-object values", () => {
    expect(parsePanelSize("garbage")).toEqual(empty);
    expect(parsePanelSize("5")).toEqual(empty);
    expect(parsePanelSize("null")).toEqual(empty);
  });

  it("ignores values that are not positive numbers", () => {
    expect(
      parsePanelSize('{"height":"400","detailsWidth":-5}'),
    ).toEqual(empty);
    expect(parsePanelSize('{"height":0}')).toEqual(empty);
  });
});

describe("readPanelSize / writePanelSize", () => {
  it("round-trips through storage under the documented key", () => {
    const storage = fakeStorage();

    writePanelSize({ height: 420, detailsWidth: 380 }, storage);

    expect(storage.data.has(PANEL_SIZE_STORAGE_KEY)).toBe(true);
    expect(readPanelSize(storage)).toEqual({ height: 420, detailsWidth: 380 });
  });

  it("returns empty values when storage is unavailable", () => {
    expect(readPanelSize(null)).toEqual({ height: null, detailsWidth: null });
  });

  it("returns empty values when reading throws", () => {
    const storage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => undefined,
    };

    expect(readPanelSize(storage)).toEqual({ height: null, detailsWidth: null });
  });

  it("does not throw when writing fails or storage is unavailable", () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
    };

    expect(() => writePanelSize({ height: 1, detailsWidth: 1 }, storage)).not.toThrow();
    expect(() => writePanelSize({ height: 1, detailsWidth: 1 }, null)).not.toThrow();
  });
});