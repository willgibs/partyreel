import { describe, expect, it } from "vitest";

import { EVENT_TABS, resolveInitialEventTab } from "@/lib/event/tabs";

describe("resolveInitialEventTab", () => {
  it("passes through valid explicit tabs", () => {
    expect(resolveInitialEventTab("gallery")).toBe("gallery");
    expect(resolveInitialEventTab("reel")).toBe("reel");
  });
  it("defaults unknown / absent to gallery", () => {
    expect(resolveInitialEventTab(undefined)).toBe("gallery");
    expect(resolveInitialEventTab("")).toBe("gallery");
    expect(resolveInitialEventTab("bogus")).toBe("gallery");
  });
  it("gates 'reviews' on moderation being on (never a dead tab)", () => {
    expect(resolveInitialEventTab("reviews")).toBe("gallery");
    expect(resolveInitialEventTab("reviews", { moderationOn: false })).toBe(
      "gallery",
    );
    expect(resolveInitialEventTab("reviews", { moderationOn: true })).toBe(
      "reviews",
    );
  });
  it("surfaces reviews first when moderation is on AND a queue waits (no explicit tab)", () => {
    expect(
      resolveInitialEventTab(undefined, {
        moderationOn: true,
        hasPending: true,
      }),
    ).toBe("reviews");
    // No queue -> gallery.
    expect(
      resolveInitialEventTab(undefined, {
        moderationOn: true,
        hasPending: false,
      }),
    ).toBe("gallery");
    // Moderation off -> gallery regardless of pending.
    expect(
      resolveInitialEventTab(undefined, {
        moderationOn: false,
        hasPending: true,
      }),
    ).toBe("gallery");
    // An explicit non-reviews tab still wins over the default surfacing.
    expect(
      resolveInitialEventTab("reel", { moderationOn: true, hasPending: true }),
    ).toBe("reel");
  });
  it("lists the current tabs", () => {
    expect([...EVENT_TABS]).toEqual(["gallery", "reel", "reviews"]);
  });
});
