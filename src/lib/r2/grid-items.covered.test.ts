/**
 * A COVERED ITEM IS NEVER SIGNED (build 23's NIT-7, carried to the albums grid by crumbs-21). The albums
 * feed and the drill-in hand `toModerationFeedItems` the set the rule's one home answers
 * (`readCoveredItems`), and an item in it leaves the builder with no url of any kind: nothing of its
 * picture can reach the operator's browser, whatever the grid draws. Every other item is signed as before.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ModerationMediaItem } from "@/lib/moderation/operator-actions";
import { filesUnder, read } from "@/testing/source-tree";

vi.mock("server-only", () => ({}));
const signed: string[] = [];
const calls: { key: string; stable?: boolean; downloadFilename?: string }[] =
  [];
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async (args: {
    key: string;
    stable?: boolean;
    downloadFilename?: string;
  }) => {
    signed.push(args.key);
    calls.push(args);
    return `signed:${args.key}`;
  },
}));

const { toModerationFeedItems } = await import("@/lib/r2/grid-items");

const item = (
  n: number,
  previewKey: string | null = `events/e1/m${n}.preview.webp`,
): ModerationMediaItem => ({
  id: `m${n}`,
  type: n === 2 ? "video" : "photo",
  status: "approved",
  createdAt: "2026-09-29T12:00:00.000Z",
  originalKey: `events/e1/m${n}.jpg`,
  previewKey,
  eventId: "e1",
  eventName: "Maya & Jay",
  hostId: "h1",
  hostLabel: "Maya",
});

beforeEach(() => {
  signed.length = 0;
  calls.length = 0;
});

describe("the operator's grid items", () => {
  it("★ signs nothing of a covered item and marks it covered; the rest are signed as before", async () => {
    const tiles = await toModerationFeedItems(
      [item(1), item(2), item(3)],
      new Set(["m2"]),
    );
    expect(tiles.map((t) => [t.id, Boolean(t.covered)])).toEqual([
      ["m1", false],
      ["m2", true],
      ["m3", false],
    ]);
    const covered = tiles[1];
    expect(covered).toEqual({
      id: "m2",
      type: "video",
      covered: true,
      status: "approved",
      eventId: "e1",
      eventName: "Maya & Jay",
      hostLabel: "Maya",
    });
    expect(signed.some((key) => key.includes("m2"))).toBe(false);
    expect(tiles[0]).toMatchObject({ url: "signed:events/e1/m1.jpg" });
  });

  // ★ RESHAPED ON PURPOSE (crumbs-78; scar kept: a call handed no set covers nothing). The expired reason: an item
  // was signed twice, its original inline and as an attachment; a row with a preview is signed a third time now,
  // its tile's.
  it("covers nothing when it is handed no set", async () => {
    const tiles = await toModerationFeedItems([item(1)]);
    expect(tiles[0].covered).toBeFalsy();
    expect(signed).toHaveLength(3);
  });
});

/**
 * ★ THE OPERATOR'S TILES DRAW PREVIEWS (crumbs-78). The feed (60 tiles) and a drill-in page (500) signed only each
 * original, so every tile fetched a full-size photograph, or a clip's first frame, to draw a square. Each row's
 * preview is signed beside its original now, and the grid draws `previewUrl ?? url`; the original stays signed for
 * the viewer and Save, and is a tile's picture only on a row with no preview.
 */
describe("the operator's tiles draw previews", () => {
  it("★ signs each row's preview beside its original, and hands the tile both", async () => {
    const tiles = await toModerationFeedItems([item(1)]);
    expect(tiles[0]).toMatchObject({
      url: "signed:events/e1/m1.jpg",
      downloadUrl: "signed:events/e1/m1.jpg",
      previewUrl: "signed:events/e1/m1.preview.webp",
    });
    // Signed like the original, stably: the browser keeps a tile it has already drawn across a refresh.
    expect(
      calls.find((c) => c.key === "events/e1/m1.preview.webp"),
    ).toMatchObject({ stable: true });
    expect(
      calls.filter((c) => c.key === "events/e1/m1.jpg").map((c) => c.stable),
    ).toEqual([true, true]);
  });

  it("★ a row with no preview is signed twice, has no previewUrl, and its tile keeps the original", async () => {
    const tiles = await toModerationFeedItems([item(3, null)]);
    expect(tiles[0]).toMatchObject({
      url: "signed:events/e1/m3.jpg",
      previewUrl: null,
    });
    expect(signed).toEqual(["events/e1/m3.jpg", "events/e1/m3.jpg"]);
  });

  it("★ a covered item's preview is never signed either", async () => {
    await toModerationFeedItems([item(1), item(2)], new Set(["m2"]));
    expect(signed.filter((key) => key.includes("m2"))).toEqual([]);
    expect(signed.filter((key) => key.includes("m1"))).toHaveLength(3);
  });

  it("signs a video's preview too: its tile draws the picture, never the clip", async () => {
    const tiles = await toModerationFeedItems([item(2)]);
    expect(tiles[0]).toMatchObject({
      type: "video",
      previewUrl: "signed:events/e1/m2.preview.webp",
    });
  });
});

/** Every source file under a directory, recursively. */
function sources(dir: string): string[] {
  return filesUnder(dir).filter(
    (path) => /\.(ts|tsx)$/.test(path) && !/\.test\.tsx?$/.test(path),
  );
}

describe("every grid the operator meets asks the rule first", () => {
  it("★ each caller of toModerationFeedItems reads the covered set and hands it over", () => {
    const callers = sources("src").filter(
      (path) =>
        !path.endsWith("lib/r2/grid-items.ts") &&
        read(path).includes("toModerationFeedItems("),
    );
    expect(callers.length).toBeGreaterThanOrEqual(2);
    for (const path of callers) {
      const src = read(path);
      expect(src, path).toContain("readCoveredItems(");
      expect(src, path).toMatch(/toModerationFeedItems\([^)]*,\s*covered\)/);
    }
  });
});
