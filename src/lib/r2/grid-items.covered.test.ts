/**
 * A COVERED ITEM IS NEVER SIGNED (build 23's NIT-7, carried to the albums grid by crumbs-21). The albums
 * feed and the drill-in hand `toModerationFeedItems` the set the rule's one home answers
 * (`readCoveredItems`), and an item in it leaves the builder with no url of any kind: nothing of its
 * picture can reach the operator's browser, whatever the grid draws. Every other item is signed as before.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ModerationMediaItem } from "@/lib/moderation/operator-actions";

vi.mock("server-only", () => ({}));
const signed: string[] = [];
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async ({ key }: { key: string }) => {
    signed.push(key);
    return `signed:${key}`;
  },
}));

const { toModerationFeedItems } = await import("@/lib/r2/grid-items");

const item = (n: number): ModerationMediaItem => ({
  id: `m${n}`,
  type: n === 2 ? "video" : "photo",
  status: "approved",
  createdAt: "2026-09-29T12:00:00.000Z",
  originalKey: `events/e1/m${n}.jpg`,
  eventId: "e1",
  eventName: "Maya & Jay",
  hostId: "h1",
  hostLabel: "Maya",
});

beforeEach(() => {
  signed.length = 0;
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

  it("covers nothing when it is handed no set", async () => {
    const tiles = await toModerationFeedItems([item(1)]);
    expect(tiles[0].covered).toBeFalsy();
    expect(signed).toHaveLength(2);
  });
});

/** Every source file under a directory, recursively. */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)
      ? [path]
      : [];
  });
}

describe("every grid the operator meets asks the rule first", () => {
  it("★ each caller of toModerationFeedItems reads the covered set and hands it over", () => {
    const callers = sources(join(process.cwd(), "src")).filter(
      (path) =>
        !path.endsWith(join("lib", "r2", "grid-items.ts")) &&
        readFileSync(path, "utf8").includes("toModerationFeedItems("),
    );
    expect(callers.length).toBeGreaterThanOrEqual(2);
    for (const path of callers) {
      const src = readFileSync(path, "utf8");
      expect(src, path).toContain("readCoveredItems(");
      expect(src, path).toMatch(/toModerationFeedItems\([^)]*,\s*covered\)/);
    }
  });
});
