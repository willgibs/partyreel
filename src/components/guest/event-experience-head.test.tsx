import { readFileSync } from "node:fs";
import { join } from "node:path";

import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  CoverGround,
  createHeadBridge,
  HeadStills,
  pickCoverIds,
  stillsFromSeed,
  type HeadBridgeState,
} from "@/components/guest/event-experience-head";
import type { GallerySeed } from "@/lib/events/gallery-seed";
import type { GalleryReel } from "@/lib/events/gallery-reel";
import type { LiveMediaItem } from "@/lib/reel/live/items";

/**
 * THE EVENT'S HEAD (`event-header` r1: `guest=cover`, `host=shared`): which photographs a cover shows, how it draws
 * them, and how the head hears the album it stands above. What is pinned is the rule and the hooks the next lane
 * lands on (door-reveal's `[data-head-still]`), never a picture.
 */

const REEL: GalleryReel = {
  showReel: true,
  liveReelEnabled: true,
  styleId: null,
  clip: null,
};

function live(i: number, over: Partial<LiveMediaItem> = {}): LiveMediaItem {
  return {
    id: `m${i}`,
    type: "photo",
    url: "",
    status: "approved",
    reelEligible: true,
    drawable: true,
    ...over,
  };
}

const T0 = 1_790_000_000_000_000;
/** A full album's seed: newest first, each item's preview link minted unless `unlinked` names it. */
function fullSeed(
  n: number,
  opts: { reel?: GalleryReel | null; unlinked?: string[] } = {},
): GallerySeed {
  const ids = Array.from({ length: n }, (_, i) => `m${i + 1}`);
  return {
    kind: "full",
    sync: {
      ok: true,
      kind: "manifest",
      access: "full",
      gate: null,
      v: 1,
      attr: 1,
      entries: ids.map((id, i) => [id, 640, 480, 2 | 4, T0 - i] as const),
      next: null,
      total: n,
      reel: opts.reel === undefined ? REEL : opts.reel,
    },
    etag: '"a1"',
    links: {
      ok: true,
      access: "full",
      gate: null,
      b: 1,
      now: Date.now(),
      links: ids
        .filter((id) => !opts.unlinked?.includes(id))
        .map((id) => [id, `https://r2.test/p/${id}.webp`, null, "", null]),
      missing: [],
    },
  } as unknown as GallerySeed;
}

describe("which photographs a cover shows", () => {
  it("★ the reel's own opening while the album has a reel: each once, at most six", () => {
    const items = Array.from({ length: 12 }, (_, i) => live(i + 1));
    const ids = pickCoverIds(items, { eventId: "event-1", reelOn: true });
    expect(ids.length).toBeGreaterThan(1);
    expect(ids.length).toBeLessThanOrEqual(6);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("the album's newest otherwise, never a clip or a still with nothing to draw", () => {
    const items = [
      live(1),
      live(2, { reelEligible: false }),
      live(3, { type: "video", drawable: false }),
      live(4),
    ];
    expect(pickCoverIds(items, { eventId: "event-1", reelOn: false })).toEqual([
      "m1",
      "m4",
    ]);
  });

  it("stops at six newest", () => {
    const items = Array.from({ length: 9 }, (_, i) => live(i + 1));
    expect(
      pickCoverIds(items, { eventId: "event-1", reelOn: false }),
    ).toHaveLength(6);
  });
});

describe("the cover from the page's own seed (the first paint)", () => {
  it("★ draws only the stills whose links the seed carries", () => {
    const stills = stillsFromSeed(
      fullSeed(3, { reel: { ...REEL, showReel: false }, unlinked: ["m2"] }),
      "event-1",
    );
    expect(stills.map((s) => s.id)).toEqual(["m1", "m3"]);
    expect(stills[0]!.tile).toBe("https://r2.test/p/m1.webp");
  });

  it("follows the same rule as the live album: the reel's opening while it plays", () => {
    const seed = fullSeed(8);
    const fromSeed = stillsFromSeed(seed, "event-1").map((s) => s.id);
    const items = (
      seed as Extract<GallerySeed, { kind: "full" }>
    ).sync.entries.map(([id]) => live(Number(id.slice(1))));
    expect(fromSeed).toEqual(
      pickCoverIds(items, { eventId: "event-1", reelOn: true }),
    );
  });

  it("a teaser's own photographs stand in, newest first; a locked page has none", () => {
    const teaser = {
      kind: "teaser",
      sync: {
        items: [
          { id: "t1", type: "photo", url: "u1", previewUrl: "p1" },
          { id: "t2", type: "video", url: "v2", previewUrl: null },
          { id: "t3", type: "photo", url: "u3", previewUrl: null },
        ],
      },
    } as unknown as GallerySeed;
    expect(stillsFromSeed(teaser, "event-1")).toEqual([
      { id: "t1", tile: "p1" },
      { id: "t3", tile: "u3" },
    ]);
    expect(stillsFromSeed({ kind: "locked" }, "event-1")).toEqual([]);
  });
});

describe("the cover's photographs, drawn", () => {
  const stills = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      id: `m${i + 1}`,
      tile: `https://r2.test/p/m${i + 1}.webp`,
    }));

  it("draws nothing without a still, so the house light under it shows", () => {
    const { container } = render(<HeadStills stills={[]} />);
    expect(container.querySelector("[data-head-stills]")).toBeNull();
  });

  it("stands one photograph still: no cycle, at rest", () => {
    const { container } = render(<HeadStills stills={stills(1)} />);
    const imgs = container.querySelectorAll("img[data-head-still]");
    expect(imgs).toHaveLength(1);
    expect(imgs[0]).toHaveAttribute("data-rest");
    expect(imgs[0]).not.toHaveAttribute("data-cycle");
  });

  it("★ dissolves several through six slots, addressable by slot (door-reveal's landing)", () => {
    const { container } = render(<HeadStills stills={stills(2)} />);
    const imgs = [...container.querySelectorAll("img[data-head-still]")];
    expect(imgs).toHaveLength(6);
    expect(imgs.map((img) => img.getAttribute("data-head-still"))).toEqual([
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
    ]);
    // An album of two cycles its two three times round; the first is the one at rest.
    expect(imgs.map((img) => img.getAttribute("src"))).toEqual(
      [...Array(3).fill([stills(2)[0]!.tile, stills(2)[1]!.tile])].flat(),
    );
    expect(imgs[0]).toHaveAttribute("data-rest");
    expect(imgs.filter((img) => img.hasAttribute("data-rest"))).toHaveLength(1);
    expect(imgs.every((img) => img.hasAttribute("data-cycle"))).toBe(true);
    expect(imgs[0]).toHaveAttribute("loading", "eager");
    expect(imgs[1]).toHaveAttribute("loading", "lazy");
  });

  it("never draws one photograph twice in its own count", () => {
    const { container } = render(
      <HeadStills stills={[...stills(2), stills(2)[0]!]} />,
    );
    expect(
      container
        .querySelector("[data-head-stills]")
        ?.getAttribute("data-head-stills"),
    ).toBe("2");
  });

  it("reports a still whose link died, by id, to the album's watchdog", () => {
    const onStillError = vi.fn();
    const { container } = render(
      <HeadStills stills={stills(1)} onStillError={onStillError} />,
    );
    fireEvent.error(container.querySelector("img")!);
    expect(onStillError).toHaveBeenCalledWith("m1");
  });
});

describe("the head hears the album it stands above", () => {
  const state = (ids: string[], available = true): HeadBridgeState => ({
    stills: ids.map((id) => ({ id, tile: `https://r2.test/p/${id}.webp` })),
    reportExpiry: () => {},
    reel: {
      available,
      open: () => {},
      preload: () => {},
      viewAsked: false,
    },
  });

  it("tells its listeners when the album's word changes, and only then", () => {
    const bridge = createHeadBridge();
    const heard = vi.fn();
    const stop = bridge.subscribe(heard);
    const word = state(["m1"]);
    bridge.set(word);
    bridge.set(word);
    expect(heard).toHaveBeenCalledTimes(1);
    expect(bridge.get()).toBe(word);
    stop();
    bridge.set(null);
    expect(heard).toHaveBeenCalledTimes(1);
  });

  it("★ the cover draws the seed's stills first, then the live album's, and a failed seed leaves it on its light", async () => {
    const bridge = createHeadBridge();
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <CoverGround
          seed={Promise.resolve(fullSeed(1, { reel: null }))}
          bridge={bridge}
          eventId="event-1"
        />,
      ));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const srcs = () =>
      [...container.querySelectorAll("img[data-head-still]")].map((img) =>
        img.getAttribute("src"),
      );
    expect(srcs()).toEqual(["https://r2.test/p/m1.webp"]);
    await act(async () => {
      bridge.set(state(["m9"]));
    });
    expect(srcs()).toEqual(["https://r2.test/p/m9.webp"]);

    const failed = Promise.reject(new Error("read failed"));
    failed.catch(() => {});
    let other!: HTMLElement;
    await act(async () => {
      ({ container: other } = render(
        <CoverGround
          seed={failed as Promise<GallerySeed>}
          bridge={createHeadBridge()}
          eventId="event-1"
        />,
      ));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(other.querySelector("[data-head-stills]")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("the head's sheet", () => {
  const sheet = readFileSync(
    join(process.cwd(), "src/components/guest/event-experience-head.css"),
    "utf8",
  ).replace(/\/\*[\s\S]*?\*\//g, "");

  it("★ stands still under reduced motion: every animation sits behind no-preference", () => {
    const gates = [
      ...sheet.matchAll(/@media \(prefers-reduced-motion: no-preference\)/g),
    ];
    expect(gates.length).toBeGreaterThan(0);
    // Outside the gates, nothing animates: the rest state is the still frame.
    let outside = sheet;
    for (const block of sheet.matchAll(
      /@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}/g,
    )) {
      outside = outside.replace(block[0], "");
    }
    outside = outside.replace(/@keyframes [\w-]+ \{[\s\S]*?\n\}/g, "");
    expect(outside).not.toMatch(/\banimation\s*:/);
  });

  it("names every keyframe with the head's own prefix", () => {
    for (const [, name] of sheet.matchAll(/@keyframes\s+([\w-]+)/g)) {
      expect(name).toMatch(/^head-/);
    }
  });
});
