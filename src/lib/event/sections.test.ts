import { describe, expect, it } from "vitest";

import {
  EVENT_SECTIONS,
  orderedSections,
  resolveInitialEventSection,
} from "@/lib/event/sections";

describe("resolveInitialEventSection", () => {
  it("passes through valid explicit sections", () => {
    expect(resolveInitialEventSection("gallery", undefined)).toBe("gallery");
    expect(resolveInitialEventSection("reel", undefined)).toBe("reel");
    expect(resolveInitialEventSection("review", undefined)).toBe("review");
    expect(resolveInitialEventSection("all", undefined)).toBe("all");
  });
  it("defaults unknown / absent to all", () => {
    expect(resolveInitialEventSection(undefined, undefined)).toBe("all");
    expect(resolveInitialEventSection("", undefined)).toBe("all");
    expect(resolveInitialEventSection("bogus", undefined)).toBe("all");
  });
  it("translates the legacy ?eventTab= deep links (reviews -> review)", () => {
    expect(resolveInitialEventSection(undefined, "gallery")).toBe("gallery");
    expect(resolveInitialEventSection(undefined, "reel")).toBe("reel");
    expect(resolveInitialEventSection(undefined, "reviews")).toBe("review");
    expect(resolveInitialEventSection(undefined, "bogus")).toBe("all");
  });
  it("prefers the new ?section= over a legacy ?eventTab=", () => {
    expect(resolveInitialEventSection("reel", "gallery")).toBe("reel");
  });
});

describe("orderedSections", () => {
  it("floats review to the top when moderation is on AND a queue waits", () => {
    expect(
      orderedSections({ moderationOn: true, hasPending: true }),
    ).toEqual(["review", "gallery", "reel"]);
  });
  it("sinks review to the bottom when caught up", () => {
    expect(
      orderedSections({ moderationOn: true, hasPending: false }),
    ).toEqual(["gallery", "reel", "review"]);
  });
  it("sinks review to the bottom when moderation is off (the teaser), even with pending", () => {
    expect(
      orderedSections({ moderationOn: false, hasPending: true }),
    ).toEqual(["gallery", "reel", "review"]);
  });
  it("always returns every section exactly once", () => {
    for (const moderationOn of [true, false]) {
      for (const hasPending of [true, false]) {
        const order = orderedSections({ moderationOn, hasPending });
        expect([...order].sort()).toEqual([...EVENT_SECTIONS].sort());
      }
    }
  });
});
