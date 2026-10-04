import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

// cards.ts is `server-only` (seed.ts hashes with node:crypto at call time); the unit project has no react-server
// condition, so the guard is stood in for (the pattern seed.test.ts uses).
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/avatar-storage", () => ({
  getAvatarUrl: async () => null,
}));

import type { GuestListItem } from "@/lib/db/queries/social";

import { splitGuestList, withAvatarUrls } from "./cards";

const seed = (id: string) => createHash("sha256").update(id).digest("hex");

/**
 * THE GUEST LIST'S TWO HALVES, EACH WITH ITS COLOUR (`splitGuestList`, small-fixes): a profile card is hydrated by
 * `withAvatarUrls` (its account's colour), and a typed name comes back with the colour of her own guest ROW, hashed
 * here on the server like every seed: never the raw row id, never her name.
 */
describe("splitGuestList", () => {
  const items: GuestListItem[] = [
    {
      id: "u-leah",
      displayName: "Leah",
      slug: "leah",
      avatarMarker: null,
    },
    { kind: "unverified", id: "g-sam-1", displayName: "Sam" },
    { kind: "unverified", id: "g-sam-2", displayName: "Sam" },
  ];

  it("★ gives a typed name the colour of her own guest row, hashed, never her row id or her name", () => {
    const { cards, unverified } = splitGuestList(items);
    expect(cards.map((c) => c.id)).toEqual(["u-leah"]);
    expect(unverified.map((u) => u.seed)).toEqual([
      seed("g-sam-1"),
      seed("g-sam-2"),
    ]);
    for (const u of unverified) {
      expect(u.seed).toMatch(/^[0-9a-f]{64}$/);
      expect(u.seed).not.toBe(u.id);
      expect(u.seed).not.toBe(seed(u.displayName));
    }
  });

  it("two people who typed the same name are two colours, in the list's own order", () => {
    const { unverified } = splitGuestList(items);
    expect(unverified.map((u) => u.id)).toEqual(["g-sam-1", "g-sam-2"]);
    expect(unverified[0].seed).not.toBe(unverified[1].seed);
  });

  it("changes nothing else about an entry: its kind, id and name come back as they went in", () => {
    const { unverified } = splitGuestList(items);
    expect(unverified[0]).toMatchObject({
      kind: "unverified",
      id: "g-sam-1",
      displayName: "Sam",
    });
    // Nothing but those and the colour: no field a browser should not hold rides beside them.
    expect(Object.keys(unverified[0]).sort()).toEqual([
      "displayName",
      "id",
      "kind",
      "seed",
    ]);
  });

  it("a profile card keeps its own account's colour through withAvatarUrls, the half it was always hydrated by", async () => {
    const { cards } = splitGuestList(items);
    const [leah] = await withAvatarUrls(cards);
    expect(leah.seed).toBe(seed("u-leah"));
  });
});
