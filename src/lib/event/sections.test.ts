import { describe, expect, it } from "vitest";

import {
  AS_GUEST_DOOR,
  EVENT_ROOMS,
  legacyRoomAddress,
  legacySectionRoom,
  resolveEventSheet,
  resolveInitialEventSection,
  roomHref,
  roomOfHref,
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

/* ── The hub's places (`event=hub`, `settings=sheet`, 2026-09-20; `rooms=over`, 2026-10-03) ── */

describe("resolveEventSheet", () => {
  it("opens every place that rides ?room=: the sheets, the two rooms and the guests' view", () => {
    // Will's `rooms=over` (event-header r2): every room opens over the hub, one way in and out, so
    // Review and Guests ride the address Settings and the share kit already ride.
    expect(resolveEventSheet("share")).toBe("share");
    expect(resolveEventSheet("settings")).toBe("settings");
    expect(resolveEventSheet("review")).toBe("review");
    expect(resolveEventSheet("guests")).toBe("guests");
    expect(resolveEventSheet("as-guest")).toBe("as-guest");
  });
  it("opens nothing for an absent or unknown value", () => {
    // `?room=` is user-supplied and lands in an island's initial state, so an
    // unknown value must be inert rather than a thrown render.
    expect(resolveEventSheet(undefined)).toBeNull();
    expect(resolveEventSheet("")).toBeNull();
    expect(resolveEventSheet("reel")).toBeNull();
    expect(resolveEventSheet("guest")).toBeNull();
    expect(resolveEventSheet("../admin")).toBeNull();
  });
});

describe("the cards row's model", () => {
  it("ends on Settings, and no longer offers the album as a door", () => {
    expect(EVENT_ROOMS.at(-1)?.id).toBe("settings");
    expect(EVENT_ROOMS.map((r) => r.id)).not.toContain("album");
  });
  it("opens every room in its place over the hub: no card names a route of its own any more", () => {
    // ★ THE ONE WAY IN (`rooms=over`): a card's door is the hub's own address with the room on it, never a page
    // the hub leaves for. The reel is the one door that is not a place (`reel-card.tsx` draws it).
    for (const room of EVENT_ROOMS) {
      expect(Object.keys(room).sort()).toEqual(["id", "label"]);
    }
  });
  it("keeps See it as a guest after the rooms, its own door, never one of the four", () => {
    // The carried call `guest-door`: the payoff at the row's end. Kept off `EVENT_ROOMS` so every drawing that
    // maps the four rooms (the-wait's hub, the help's picture) still draws the four.
    expect(EVENT_ROOMS.map((r) => r.id)).not.toContain(AS_GUEST_DOOR.id);
    expect(AS_GUEST_DOOR.id).toBe("as-guest");
    expect(resolveEventSheet(AS_GUEST_DOOR.id)).toBe("as-guest");
  });
});

describe("roomHref", () => {
  it("is the hub's own address with the room on it", () => {
    expect(roomHref("e1", "review")).toBe("/dashboard/e1?room=review");
    expect(roomHref("e1", "guests")).toBe("/dashboard/e1?room=guests");
    expect(roomHref("e1", "settings")).toBe("/dashboard/e1?room=settings");
    expect(roomHref("e1", "as-guest")).toBe("/dashboard/e1?room=as-guest");
  });
});

describe("roomOfHref: an old way in, read as the room it opens", () => {
  const ORIGIN = "https://partyreel.com";
  it("reads the retired room routes as their rooms", () => {
    expect(roomOfHref("/dashboard/e1/review", "e1", ORIGIN)).toBe("review");
    expect(roomOfHref("/dashboard/e1/guests", "e1", ORIGIN)).toBe("guests");
    expect(roomOfHref("/dashboard/e1/guests#at-the-door", "e1", ORIGIN)).toBe(
      "guests",
    );
    expect(roomOfHref("/dashboard/e1/guests#invited", "e1", ORIGIN)).toBe(
      "guests",
    );
    expect(roomOfHref("/dashboard/e1/settings", "e1", ORIGIN)).toBe("settings");
    expect(roomOfHref(`${ORIGIN}/dashboard/e1/review`, "e1", ORIGIN)).toBe(
      "review",
    );
  });
  it("reads the hub's own address with a room on it", () => {
    expect(roomOfHref("/dashboard/e1?room=review", "e1", ORIGIN)).toBe(
      "review",
    );
    expect(roomOfHref("?room=guests", "e1", ORIGIN, "/dashboard/e1")).toBe(
      "guests",
    );
  });
  it("reads nothing that is not this event's room", () => {
    // Another event's room is a real navigation (its own hub), never a room opened over this one.
    expect(roomOfHref("/dashboard/e2/review", "e1", ORIGIN)).toBeNull();
    expect(roomOfHref("/dashboard/e1", "e1", ORIGIN)).toBeNull();
    expect(roomOfHref("/dashboard/e1?room=reel", "e1", ORIGIN)).toBeNull();
    expect(roomOfHref("/dashboard/e1/reel", "e1", ORIGIN)).toBeNull();
    expect(roomOfHref("/dashboard/e1/print", "e1", ORIGIN)).toBeNull();
    expect(roomOfHref("/e/abc?reel", "e1", ORIGIN)).toBeNull();
    expect(
      roomOfHref("https://evil.example/dashboard/e1/review", "e1", ORIGIN),
    ).toBeNull();
    expect(roomOfHref("", "e1", ORIGIN)).toBeNull();
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

describe("legacyRoomAddress: where an old deep link lands now", () => {
  it("opens Review and Guests over the hub", () => {
    expect(legacyRoomAddress("e1", "review", undefined)).toBe(
      "/dashboard/e1?room=review",
    );
    expect(legacyRoomAddress("e1", undefined, "reviews")).toBe(
      "/dashboard/e1?room=review",
    );
    expect(legacyRoomAddress("e1", "guests", undefined)).toBe(
      "/dashboard/e1?room=guests",
    );
  });
  it("sends the reel to its own door, which plays it or comes back to the hub", () => {
    expect(legacyRoomAddress("e1", "reel", undefined)).toBe(
      "/dashboard/e1/reel",
    );
    expect(legacyRoomAddress("e1", undefined, "reel")).toBe(
      "/dashboard/e1/reel",
    );
  });
  it("leaves the hub alone for the album and anything unknown", () => {
    expect(legacyRoomAddress("e1", "gallery", undefined)).toBeNull();
    expect(legacyRoomAddress("e1", undefined, "gallery")).toBeNull();
    expect(legacyRoomAddress("e1", undefined, undefined)).toBeNull();
    expect(legacyRoomAddress("e1", "bogus", "bogus")).toBeNull();
  });
});
