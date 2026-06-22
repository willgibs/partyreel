import { describe, expect, it } from "vitest";

import { type GridMedia } from "@/components/app/media-grid";
import { buildReelProps } from "@/lib/reel/build-reel-props";
import { THEME_CLASSIC } from "@/lib/reel/composition";

// Minimal GridMedia factory — only the fields buildReelProps reads.
function media(id: string, over: Partial<GridMedia> = {}): GridMedia {
  return {
    id,
    type: "photo",
    url: `https://r2/${id}/original`,
    previewUrl: `https://r2/${id}/preview`,
    status: "approved",
    ...over,
  };
}

function byIdOf(items: GridMedia[]): Map<string, GridMedia> {
  return new Map(items.map((m) => [m.id, m]));
}

const base = { theme: THEME_CLASSIC, seed: 1 };

describe("buildReelProps", () => {
  it("orders clips by orderedIds and prefers the preview url for photos", () => {
    const items = [media("a"), media("b"), media("c")];
    const props = buildReelProps({
      orderedIds: ["c", "a", "b"],
      byId: byIdOf(items),
      ...base,
    });
    expect(props.clips.map((c) => c.url)).toEqual([
      "https://r2/c/preview",
      "https://r2/a/preview",
      "https://r2/b/preview",
    ]);
    expect(props.clips.every((c) => c.type === "photo")).toBe(true);
  });

  it("falls back to the original url for a photo with no preview (backfill gap)", () => {
    const items = [media("a", { previewUrl: null })];
    const props = buildReelProps({
      orderedIds: ["a"],
      byId: byIdOf(items),
      ...base,
    });
    expect(props.clips[0].url).toBe("https://r2/a/original");
  });

  it("drops non-approved media (hidden/removed), mirroring ReelPanel", () => {
    const items = [
      media("a"),
      media("b", { status: "hidden" }),
      media("c", { status: "removed" }),
      media("d"),
    ];
    const props = buildReelProps({
      orderedIds: ["a", "b", "c", "d"],
      byId: byIdOf(items),
      ...base,
    });
    expect(props.clips.map((c) => c.url)).toEqual([
      "https://r2/a/preview",
      "https://r2/d/preview",
    ]);
  });

  it("hoists the cover media to the opening shot", () => {
    const items = [media("a"), media("b"), media("c")];
    const props = buildReelProps({
      orderedIds: ["a", "b", "c"],
      byId: byIdOf(items),
      coverMediaId: "c",
      ...base,
    });
    expect(props.clips[0].url).toBe("https://r2/c/preview");
    expect(props.clips.map((c) => c.url)).toEqual([
      "https://r2/c/preview",
      "https://r2/a/preview",
      "https://r2/b/preview",
    ]);
  });

  it("ignores an absent/foreign cover id (no reorder)", () => {
    const items = [media("a"), media("b")];
    const props = buildReelProps({
      orderedIds: ["a", "b"],
      byId: byIdOf(items),
      coverMediaId: "zzz",
      ...base,
    });
    expect(props.clips.map((c) => c.url)).toEqual([
      "https://r2/a/preview",
      "https://r2/b/preview",
    ]);
  });

  it("renders video by its poster in posterMode, full clip url when exporting", () => {
    const items = [media("v", { type: "video" })];
    const poster = buildReelProps({
      orderedIds: ["v"],
      byId: byIdOf(items),
      ...base,
    });
    expect(poster.clips[0]).toMatchObject({
      type: "video",
      url: "https://r2/v/preview",
      trimStartSec: 0,
      trimDurationSec: 3,
    });
    const exported = buildReelProps({
      orderedIds: ["v"],
      byId: byIdOf(items),
      posterMode: false,
      ...base,
    });
    expect(exported.clips[0].url).toBe("https://r2/v/original");
    expect(exported.posterMode).toBe(false);
  });

  it("emits an empty url for a null-preview video (poster placeholder)", () => {
    const items = [media("v", { type: "video", previewUrl: null })];
    const props = buildReelProps({
      orderedIds: ["v"],
      byId: byIdOf(items),
      ...base,
    });
    expect(props.clips[0]).toMatchObject({ type: "video", url: "" });
  });

  it("caps the reel to a length, keeping at least the first clip", () => {
    // photoHoldSec 2.4 + crossfade 0.5 → ~each photo finishes at (i+1)*2.4. A 5s cap keeps 2 photos.
    const items = Array.from({ length: 10 }, (_, i) => media(`p${i}`));
    const props = buildReelProps({
      orderedIds: items.map((m) => m.id),
      byId: byIdOf(items),
      lengthSeconds: 5,
      ...base,
    });
    expect(props.clips.length).toBe(2);
    expect(props.clips.map((c) => c.url)).toEqual([
      "https://r2/p0/preview",
      "https://r2/p1/preview",
    ]);
  });

  it("a length shorter than one clip still keeps the first clip", () => {
    const items = [media("a"), media("b")];
    const props = buildReelProps({
      orderedIds: ["a", "b"],
      byId: byIdOf(items),
      lengthSeconds: 0.1,
      ...base,
    });
    expect(props.clips.length).toBe(1);
    expect(props.clips[0].url).toBe("https://r2/a/preview");
  });

  it("threads theme + seed through unchanged", () => {
    const items = [media("a")];
    const props = buildReelProps({
      orderedIds: ["a"],
      byId: byIdOf(items),
      theme: THEME_CLASSIC,
      seed: 42,
    });
    expect(props.theme).toBe(THEME_CLASSIC);
    expect(props.seed).toBe(42);
  });
});
