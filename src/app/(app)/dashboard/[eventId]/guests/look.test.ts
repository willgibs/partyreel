import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  WHO_HOST,
  WHO_VERIFIED,
  type AlbumLinkTuple,
  type GuestWhoTuple,
  type HostWhoTuple,
} from "@/lib/events/album-wire";

import { albumLookItems, hostLookItems, type LookRowFacts } from "./look";

/**
 * A PERSON'S PHOTOGRAPHS AS A CARD DRAWS THEM (guests-room r1): a page of their rows and the album's own links, as the
 * items a tile and the viewer draw. Pinned: the links land where a tile and the viewer read them, a row the minter
 * dropped is no item, and ★ the album's side carries no address, by construction and by its source.
 */

const row = (id: string, type: "photo" | "video" = "photo"): LookRowFacts => ({
  id,
  type,
  width: 4,
  height: 3,
  duration: type === "video" ? 12.5 : null,
});

const FACE = ["https://cdn.test/a.webp", "seed-a", "/u/ana"] as const;

describe("the host's items", () => {
  const links: AlbumLinkTuple<HostWhoTuple>[] = [
    [
      "p1",
      "tile-1",
      "view-1",
      "dl-1",
      ["Ana", WHO_VERIFIED, "ana@example.com", FACE],
    ],
    // No preview: its tile IS the original, and it has no view of its own.
    ["p2", "orig-2", null, "dl-2", ["Ana", WHO_VERIFIED, "ana@example.com"]],
  ];

  it("draws the preview on the tile and the original in the viewer, the credit with her address", () => {
    const items = hostLookItems([row("p1"), row("p2", "video")], links, {
      p1: 3,
    });
    expect(items[0]).toMatchObject({
      id: "p1",
      url: "view-1",
      previewUrl: "tile-1",
      downloadUrl: "dl-1",
      status: "approved",
      uploaderName: "Ana",
      isVerified: true,
      isHost: false,
      uploaderEmail: "ana@example.com",
      uploaderFace: { avatarUrl: FACE[0], seed: "seed-a", href: "/u/ana" },
      likeCount: 3,
      width: 4,
      height: 3,
    });
    expect(items[1]).toMatchObject({
      url: "orig-2",
      previewUrl: null,
      type: "video",
      durationSeconds: 12.5,
      likeCount: 0,
    });
  });

  it("keeps the page's order, and a row the minter dropped is no item", () => {
    const items = hostLookItems([row("p2"), row("gone"), row("p1")], links);
    expect(items.map((i) => i.id)).toEqual(["p2", "p1"]);
  });
});

describe("the album's items", () => {
  const links: AlbumLinkTuple<GuestWhoTuple>[] = [
    ["p1", "tile-1", "view-1", "dl-1", ["Sam", 0, FACE]],
    ["p2", "tile-2", "view-2", "dl-2", ["Host", WHO_HOST]],
  ];

  it("names the sender, marks a typed name, and carries a face where the album shows one", () => {
    const [first, second] = albumLookItems([row("p1"), row("p2")], links);
    expect(first).toMatchObject({
      uploaderName: "Sam",
      isVerified: false,
      uploaderFace: { seed: "seed-a" },
    });
    expect(second.uploaderFace).toBeNull();
  });

  it("★ carries no address under any key: the guest's tuple has no slot for one", () => {
    const json = JSON.stringify(albumLookItems([row("p1")], links));
    expect(json).not.toMatch(/"uploaderEmail"/);
    expect(json).not.toContain("@example.com");
  });

  it("★ and its mapper never learns the word: the album's half of look.ts names no address", () => {
    const src = readFileSync(
      join(process.cwd(), "src/app/(app)/dashboard/[eventId]/guests/look.ts"),
      "utf8",
    );
    const albumHalf = src.slice(src.indexOf("export function albumLookItems"));
    expect(albumHalf).not.toMatch(/email/i);
    // Each mapper names its fields; neither spreads the tuple onto an item.
    expect(src).not.toMatch(/\.\.\.who\b/);
  });
});
