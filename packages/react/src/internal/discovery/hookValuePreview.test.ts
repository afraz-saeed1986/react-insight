import { describe, expect, it } from "vitest";
import { previewHookValue } from "./hookValuePreview";

describe("previewHookValue", () => {
  it("returns primitives unchanged", () => {
    expect(previewHookValue(42)).toBe(42);
    expect(previewHookValue("hello")).toBe("hello");
    expect(previewHookValue(true)).toBe(true);
    expect(previewHookValue(null)).toBe(null);
    expect(previewHookValue(undefined)).toBe(undefined);
  });

  it("previews a plain object shallowly, one level deep", () => {
    expect(previewHookValue({ count: 1, label: "x" })).toEqual({
      __type: "object",
      keys: { count: 1, label: "x" },
    });
  });

  it("describes nested objects/arrays inside an object as a type only, not recursed", () => {
    expect(previewHookValue({ nested: { a: 1 }, list: [1, 2] })).toEqual({
      __type: "object",
      keys: {
        nested: { __type: "object" },
        list: { __type: "array(2)" },
      },
    });
  });

  it("previews an array shallowly, one level deep", () => {
    expect(previewHookValue([1, "two", true])).toEqual({
      __type: "array",
      length: 3,
      items: [1, "two", true],
    });
  });

  it("describes nested objects/arrays inside an array as a type only, not recursed", () => {
    expect(previewHookValue([{ a: 1 }, [1, 2]])).toEqual({
      __type: "array",
      length: 2,
      items: [{ __type: "object" }, { __type: "array(2)" }],
    });
  });

  it("describes functions as a type descriptor, never invoking them", () => {
    let called = false;
    const fn = () => {
      called = true;
    };

    expect(previewHookValue(fn)).toEqual({ __type: "function" });
    expect(previewHookValue({ handler: fn })).toEqual({
      __type: "object",
      keys: { handler: { __type: "function" } },
    });
    expect(called).toBe(false);
  });

  it("describes class instances by constructor name", () => {
    class Point {
      constructor(
        public x: number,
        public y: number,
      ) {}
    }

    expect(previewHookValue(new Point(1, 2))).toEqual({ __type: "Point" });
  });

  it("handles a self-referential (circular) object without throwing", () => {
    const circular: Record<string, unknown> = { name: "loop" };
    circular.self = circular;

    expect(() => previewHookValue(circular)).not.toThrow();
    expect(previewHookValue(circular)).toEqual({
      __type: "object",
      keys: { name: "loop", self: { __type: "object" } },
    });
  });

  it("caps large arrays instead of previewing every entry", () => {
    const big = Array.from({ length: 100 }, (_, i) => i);
    const result = previewHookValue(big);

    expect(result).toMatchObject({ __type: "array", length: 100 });
    expect((result as unknown as { items: unknown[] }).items).toHaveLength(20);
  });

  it("caps large objects instead of previewing every key", () => {
    const big: Record<string, number> = {};
    for (let i = 0; i < 100; i += 1) big[`k${i}`] = i;

    const result = previewHookValue(big);

    expect(Object.keys((result as unknown as { keys: object }).keys)).toHaveLength(20);
  });

  
  it("truncates long strings instead of embedding them verbatim", () => {
    const long = "x".repeat(500);
    const result = previewHookValue(long) as string;

    expect(result.length).toBeLessThan(500);
    expect(result.startsWith("x".repeat(200))).toBe(true);
    expect(result).toContain("500 chars total");
  });

  it("leaves short strings unchanged", () => {
    expect(previewHookValue("hello")).toBe("hello");
  });

  it("truncates long strings nested inside an object, not just at the top level", () => {
    const long = "y".repeat(300);
        const result = previewHookValue({ big: long }) as unknown as { keys: { big: string } };

    expect(result.keys.big.length).toBeLessThan(300);
    expect(result.keys.big).toContain("300 chars total");
  });


});