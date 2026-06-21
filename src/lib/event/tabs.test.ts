import { describe, expect, it } from "vitest";

import { EVENT_TABS, resolveInitialEventTab } from "@/lib/event/tabs";

describe("resolveInitialEventTab", () => {
  it("passes through valid tabs", () => {
    expect(resolveInitialEventTab("gallery")).toBe("gallery");
    expect(resolveInitialEventTab("reel")).toBe("reel");
  });
  it("defaults unknown / absent to gallery", () => {
    expect(resolveInitialEventTab(undefined)).toBe("gallery");
    expect(resolveInitialEventTab("")).toBe("gallery");
    expect(resolveInitialEventTab("bogus")).toBe("gallery");
    // "reviews" isn't a tab yet (a later round) -> falls back, never resolves to a missing panel.
    expect(resolveInitialEventTab("reviews")).toBe("gallery");
  });
  it("lists the current tabs", () => {
    expect([...EVENT_TABS]).toEqual(["gallery", "reel"]);
  });
});
