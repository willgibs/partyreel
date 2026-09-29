import { describe, expect, it } from "vitest";

import {
  guestEventCardProps,
  sortGuestEventCards,
  type GuestEventRow,
} from "./guest-events";

/**
 * THE GUEST CARD'S MASKING, PINNED (guest by upload, 2026-09-22). A Guest card is a window onto
 * somebody else's album, so it may never show more than that album would to this person: an Only me
 * album is blank and locked, one behind a password or a gate is named and linked but never pictured,
 * and only an open album shows a cover. The recency is the guest's own latest upload.
 */
function row(over: Partial<GuestEventRow> = {}): GuestEventRow {
  return {
    eventId: "e1",
    name: "Summer Party",
    eventDate: "2026-07-04",
    visibility: "open",
    qrToken: "qr123",
    hostName: "Alex",
    lastUploadAt: "2026-09-20T10:00:00Z",
    ...over,
  };
}

describe("guestEventCardProps", () => {
  it("open album: links to it, pictures it, names its host", () => {
    const card = guestEventCardProps(row(), "https://cdn/cover.jpg");
    expect(card.accessible).toBe(true);
    expect(card.href).toBe("/e/qr123");
    expect(card.name).toBe("Summer Party");
    expect(card.coverUrl).toBe("https://cdn/cover.jpg");
    expect(card.byline).toBe("Hosted by Alex");
    expect(card.passwordProtected).toBe(false);
    expect(card.lastUploadAt).toBe("2026-09-20T10:00:00Z");
  });

  it("password album: named and linked, never pictured, even if a cover is passed", () => {
    const card = guestEventCardProps(
      row({ visibility: "password" }),
      "https://cdn/should-not-appear.jpg",
    );
    expect(card.accessible).toBe(true);
    expect(card.href).toBe("/e/qr123");
    expect(card.coverUrl).toBeNull();
    expect(card.passwordProtected).toBe(true);
  });

  it("private album: blank and locked, whatever the row carries", () => {
    const card = guestEventCardProps(
      row({ visibility: "private" }),
      "https://cdn/should-not-appear.jpg",
    );
    expect(card.accessible).toBe(false);
    expect(card.href).toBeNull();
    expect(card.name).toBe("Private event");
    expect(card.name).not.toContain("Summer");
    expect(card.byline).toBeNull();
    expect(card.coverUrl).toBeNull();
  });

  // ★ The doors (event-settings r1) store a gated album private, with its gate. Read without the gate,
  // every Guest card went dark the moment its host chose "only people already in" after the party,
  // while the album itself still opened for her: a card is for someone past the door.
  it.each(["approve", "invite", "closed"])(
    "a gated album (private, gate %s): named and linked, never pictured",
    (gate) => {
      const card = guestEventCardProps(
        row({ visibility: "private", gate }),
        "https://cdn/should-not-appear.jpg",
      );
      expect(card.accessible).toBe(true);
      expect(card.href).toBe("/e/qr123");
      expect(card.name).toBe("Summer Party");
      expect(card.byline).toBe("Hosted by Alex");
      expect(card.coverUrl).toBeNull();
      expect(card.passwordProtected).toBe(false);
    },
  );

  it("fails closed: a gate this build does not know locks the card as Only me does", () => {
    const card = guestEventCardProps(
      row({ visibility: "private", gate: "someday" }),
      null,
    );
    expect(card.accessible).toBe(false);
    expect(card.href).toBeNull();
  });

  it("an unnamed host leaves no byline, and an undated event says so", () => {
    const card = guestEventCardProps(
      row({ hostName: "  ", eventDate: null }),
      null,
    );
    expect(card.byline).toBeNull();
    expect(card.dateLabel).toBe("No date set");
  });
});

describe("sortGuestEventCards", () => {
  it("puts the album you added to most recently first", () => {
    const older = guestEventCardProps(
      row({ eventId: "old", lastUploadAt: "2026-01-01T00:00:00Z" }),
      null,
    );
    const newer = guestEventCardProps(
      row({ eventId: "new", lastUploadAt: "2026-09-01T00:00:00Z" }),
      null,
    );
    expect(sortGuestEventCards([older, newer]).map((c) => c.eventId)).toEqual([
      "new",
      "old",
    ]);
  });
});
