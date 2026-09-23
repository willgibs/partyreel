// @contract-for: src/lib/events/event-guests.ts
import { describe, expect, it } from "vitest";

import {
  guestCount,
  resolveEventGuests,
  type GuestRowFacts,
} from "./event-guests";

/**
 * THE ONE COUNT (guest by upload, Will 2026-09-22): "Uploaded 1 photo? You're a guest." The hub's
 * Guests card, the hub's header and the album's header all read this, so what is pinned is WHO
 * counts and how many times, never how a surface words it.
 */
const HOST = "host-1";

const row = (over: Partial<GuestRowFacts> & { id: string }): GuestRowFacts => ({
  user_id: null,
  display_name: null,
  verified_at: null,
  ...over,
});

function resolve(rows: GuestRowFacts[], approved: string[]) {
  return resolveEventGuests({
    hostId: HOST,
    approvedGuestIds: new Set(approved),
    rows,
  });
}

describe("who is a guest", () => {
  it("counts a row only when it carries an approved upload", () => {
    const guests = resolve(
      [
        row({ id: "g1", display_name: "Sam" }),
        row({ id: "g2", display_name: "Priya" }),
      ],
      ["g1"],
    );
    expect(guests.unverifiedRows).toEqual([{ id: "g1", displayName: "Sam" }]);
    expect(guestCount(guests)).toBe(1);
  });

  it("counts a confirmed guest once per PERSON, however many rows they minted", () => {
    const guests = resolve(
      [
        row({ id: "g1", user_id: "u1", verified_at: "2026-09-22T10:00:00Z" }),
        row({ id: "g2", user_id: "u1", verified_at: "2026-09-22T11:00:00Z" }),
        row({ id: "g3", user_id: "u2", verified_at: "2026-09-22T12:00:00Z" }),
      ],
      ["g1", "g2", "g3"],
    );
    expect(guests.verifiedUserIds.sort()).toEqual(["u1", "u2"]);
    expect(guestCount(guests)).toBe(2);
  });

  it("counts a named unconfirmed guest once per ROW: two people can both type Sam", () => {
    const guests = resolve(
      [
        row({ id: "g1", display_name: "Sam" }),
        row({ id: "g2", display_name: "Sam" }),
      ],
      ["g1", "g2"],
    );
    expect(guestCount(guests)).toBe(2);
  });

  it("keys confirmed on verified_at, never on a bare user id (an unconfirmed sign-up keeps its typed name)", () => {
    const guests = resolve(
      [row({ id: "g1", user_id: "u1", display_name: "Sam" })],
      ["g1"],
    );
    expect(guests.verifiedUserIds).toEqual([]);
    expect(guests.unverifiedRows).toEqual([{ id: "g1", displayName: "Sam" }]);
  });

  it("never counts a nameless row, which has nothing to show", () => {
    const guests = resolve(
      [row({ id: "g1" }), row({ id: "g2", display_name: "   " })],
      ["g1", "g2"],
    );
    expect(guestCount(guests)).toBe(0);
  });

  it("never counts the host, even through a row of their own", () => {
    const guests = resolve(
      [
        row({ id: "g1", user_id: HOST, verified_at: "2026-09-22T10:00:00Z" }),
        row({ id: "g2", user_id: HOST, display_name: "Host typed a name" }),
        row({ id: "g3", display_name: "Sam" }),
      ],
      ["g1", "g2", "g3"],
    );
    expect(guests.verifiedUserIds).toEqual([]);
    expect(guests.unverifiedRows).toEqual([{ id: "g3", displayName: "Sam" }]);
  });

  it("drops a guest whose every upload is gone, and a restore brings them back", () => {
    const rows = [row({ id: "g1", display_name: "Sam" })];
    expect(guestCount(resolve(rows, []))).toBe(0);
    expect(guestCount(resolve(rows, ["g1"]))).toBe(1);
  });

  it("trims the typed name it hands on", () => {
    const guests = resolve([row({ id: "g1", display_name: "  Sam  " })], ["g1"]);
    expect(guests.unverifiedRows).toEqual([{ id: "g1", displayName: "Sam" }]);
  });
});
