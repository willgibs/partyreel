import { describe, expect, it } from "vitest";

import { EVENT_TABS, resolveInitialEventTab } from "@/lib/event/tabs";

describe("resolveInitialEventTab", () => {
  it("passes through valid tabs", () => {
    expect(resolveInitialEventTab("uploads")).toBe("uploads");
    expect(resolveInitialEventTab("reel")).toBe("reel");
  });
  it("defaults unknown / absent to uploads", () => {
    expect(resolveInitialEventTab(undefined)).toBe("uploads");
    expect(resolveInitialEventTab("")).toBe("uploads");
    expect(resolveInitialEventTab("bogus")).toBe("uploads");
    // "reviews" isn't a tab yet (a later round) -> falls back, never resolves to a missing panel.
    expect(resolveInitialEventTab("reviews")).toBe("uploads");
  });
  it("lists the current tabs", () => {
    expect([...EVENT_TABS]).toEqual(["uploads", "reel"]);
  });
});
