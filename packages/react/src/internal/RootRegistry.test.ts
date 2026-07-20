import { describe, expect, it } from "vitest";

import { RootRegistry } from "./rootRegistry";
import { createInternalRoot } from "./root";

describe("RootRegistry", () => {
  it("starts empty", () => {
    const registry = new RootRegistry();

    expect(registry.size).toBe(0);
    expect(registry.list()).toEqual([]);
  });

  it("registers a root", () => {
    const registry = new RootRegistry();
    const root = createInternalRoot();

    registry.register(root);

    expect(registry.size).toBe(1);
  });

  it("returns a registered root", () => {
    const registry = new RootRegistry();
    const root = createInternalRoot();

    registry.register(root);

    expect(registry.get(root.id)).toBe(root);
  });

  it("reports whether a root exists", () => {
    const registry = new RootRegistry();
    const root = createInternalRoot();

    expect(registry.has(root.id)).toBe(false);

    registry.register(root);

    expect(registry.has(root.id)).toBe(true);
  });

  it("unregisters a root", () => {
    const registry = new RootRegistry();
    const root = createInternalRoot();

    registry.register(root);
    registry.unregister(root.id);

    expect(registry.size).toBe(0);
    expect(registry.has(root.id)).toBe(false);
  });

  it("clears all roots", () => {
    const registry = new RootRegistry();

    registry.register(createInternalRoot());
    registry.register(createInternalRoot());

    expect(registry.size).toBe(2);

    registry.clear();

    expect(registry.size).toBe(0);
  });

  it("throws when registering the same root twice", () => {
    const registry = new RootRegistry();
    const root = createInternalRoot();

    registry.register(root);

    expect(() => registry.register(root)).toThrow("is already registered");
  });

  it("records a commit, incrementing commitCount and setting lastCommittedAt", () => {
    const registry = new RootRegistry();
    const root = createInternalRoot();
    registry.register(root);

    expect(registry.recordCommit(root.id)).toBe(true);

    const updated = registry.get(root.id);
    expect(updated?.commitCount).toBe(1);
    expect(updated?.lastCommittedAt).not.toBeNull();
  });

  it("accumulates commitCount across multiple commits", () => {
    const registry = new RootRegistry();
    const root = createInternalRoot();
    registry.register(root);

    registry.recordCommit(root.id);
    registry.recordCommit(root.id);
    registry.recordCommit(root.id);

    expect(registry.get(root.id)?.commitCount).toBe(3);
  });

  it("returns false when recording a commit for an unregistered root", () => {
    const registry = new RootRegistry();
    const root = createInternalRoot();

    expect(registry.recordCommit(root.id)).toBe(false);
  });
  
});
