import { describe, expect, it } from "vitest";

import {
  EVENT_ROOMS,
  EVENT_ROOM_CRUMB,
  legacySectionRoom,
  resolveEventSheet,
  resolveInitialEventSection,
} from "@/lib/event/sections";

describe("resolveInitialEventSection", () => {
  it("passes through valid explicit sections", () => {
    expect(resolveInitialEventSection("gallery", undefined)).toBe("gallery");
    expect(resolveInitialEventSection("reel", undefined)).toBe("reel");
    expect(resolveInitialEventSection("review", undefined)).toBe("review");
    expect(resolveInitialEventSection("guests", undefined)).toBe("guests");
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

/* ── The hub's rooms and sheets (`event=hub`, `settings=sheet`, 2026-09-20) ── */

describe("resolveEventSheet", () => {
  it("opens only the two surfaces that are sheets", () => {
    expect(resolveEventSheet("share")).toBe("share");
    expect(resolveEventSheet("settings")).toBe("settings");
  });
  it("opens nothing for an absent or unknown value", () => {
    // `?room=` is user-supplied and lands in an island's initial state, so an
    // unknown value must be inert rather than a thrown render.
    expect(resolveEventSheet(undefined)).toBeNull();
    expect(resolveEventSheet("")).toBeNull();
    expect(resolveEventSheet("review")).toBeNull();
    expect(resolveEventSheet("../admin")).toBeNull();
  });
});

describe("the cards row's model", () => {
  it("ends on Settings, and no longer offers the album as a door", () => {
    expect(EVENT_ROOMS.at(-1)?.id).toBe("settings");
    expect(EVENT_ROOMS.map((r) => r.id)).not.toContain("album");
  });
  it("gives every room a segment, and the two cards that are not routes none", () => {
    // Settings is a sheet; the Highlight reel is a door to the view (or its
    // guidance before the second photo), drawn by its own card. Neither may
    // grow a segment the row would turn into a room link.
    for (const room of EVENT_ROOMS) {
      if (room.id === "settings" || room.id === "reel") {
        expect(room.segment).toBeNull();
      } else expect(room.segment).toBe(room.id);
    }
  });
  it("names a crumb for every room that is a route", () => {
    for (const room of EVENT_ROOMS) {
      if (!room.segment) continue;
      expect(
        EVENT_ROOM_CRUMB[room.segment],
        `${room.id} has no crumb`,
      ).toBeTruthy();
    }
  });
});

describe("legacySectionRoom", () => {
  it("sends a retired ?section= deep link to the room that holds it now", () => {
    expect(legacySectionRoom("review", undefined)).toBe("review");
    expect(legacySectionRoom("reel", undefined)).toBe("reel");
    expect(legacySectionRoom("guests", undefined)).toBe("guests");
  });
  it("translates the even older ?eventTab= alias too", () => {
    // These were in browser histories before ?section= existed, and the whole
    // point of keeping both resolvers is that neither generation 404s.
    expect(legacySectionRoom(undefined, "reviews")).toBe("review");
    expect(legacySectionRoom(undefined, "reel")).toBe("reel");
  });
  it("keeps the album on the hub, because the album IS the hub", () => {
    expect(legacySectionRoom("gallery", undefined)).toBeNull();
    expect(legacySectionRoom("all", undefined)).toBeNull();
    expect(legacySectionRoom(undefined, undefined)).toBeNull();
    expect(legacySectionRoom("nonsense", undefined)).toBeNull();
  });
});
