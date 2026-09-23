import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { type GridMedia } from "@/components/app/media-grid";
import { buildReelProps } from "@/lib/reel/build-reel-props";
import { THEME_CLASSIC } from "@/lib/reel/engine/reel-types";

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

const base = { styleId: "classic", seed: 1 };

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

  it("always resolves a video to its poster still (never the mp4 url)", () => {
    const items = [media("v", { type: "video" })];
    const props = buildReelProps({
      orderedIds: ["v"],
      byId: byIdOf(items),
      ...base,
    });
    // A video ALWAYS draws its poster preview (the only decodable video source until the Pro motion
    // slice); the original mp4 url is NEVER emitted for a video, so the image-only loader can't choke.
    expect(props.clips[0]).toMatchObject({
      type: "video",
      url: "https://r2/v/preview",
      trimStartSec: 0,
      trimDurationSec: 3,
    });
    expect(props.clips[0].url).not.toBe("https://r2/v/original");
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

  it("resolves the styleId to its theme + threads styleId/orientation/seed through", () => {
    const items = [media("a")];
    const props = buildReelProps({
      orderedIds: ["a"],
      byId: byIdOf(items),
      styleId: "classic",
      orientation: "landscape",
      seed: 42,
    });
    expect(props.theme).toBe(THEME_CLASSIC); // the Cinematic mood resolves to THEME_CLASSIC
    expect(props.styleId).toBe("classic");
    expect(props.orientation).toBe("landscape");
    expect(props.seed).toBe(42);
  });

  it("populates clip width/height from the media rows (drives fitClip)", () => {
    const items = [media("a", { width: 1920, height: 1080 })];
    const props = buildReelProps({
      orderedIds: ["a"],
      byId: byIdOf(items),
      ...base,
    });
    expect(props.clips[0].width).toBe(1920);
    expect(props.clips[0].height).toBe(1080);
  });

  it("resolves a video to its poster for a treatment style too (mood/treatment distinction gone)", () => {
    // The old posterMode footgun let a mood route video to the mp4 url in export while a treatment
    // stayed on the poster. That branch is gone: EVERY style (mood or treatment) now draws the poster.
    const items = [media("v", { type: "video" })];
    const treatment = buildReelProps({
      orderedIds: ["v"],
      byId: byIdOf(items),
      styleId: "polaroid", // a treatment
      seed: 1,
    });
    const mood = buildReelProps({
      orderedIds: ["v"],
      byId: byIdOf(items),
      styleId: "classic", // a mood
      seed: 1,
    });
    expect(treatment.clips[0].url).toBe("https://r2/v/preview");
    expect(mood.clips[0].url).toBe("https://r2/v/preview");
  });
});

/**
 * The GUEST side of the same filter (R3 Track A). A guest-facing GridMedia is built by toGridItems,
 * whose source rows are approved BY CONSTRUCTION (the anon RPC and the unlock query both select
 * approved media only - GuestMediaRow doesn't even carry a status column). Before toGridItems stamped
 * `status`, every guest item arrived UNDEFINED and this filter dropped the whole reel: a guest reel
 * that renders an empty timeline, with nothing anywhere saying why.
 *
 * The fix belongs in the stamp, NOT in relaxing the filter: the host's items carry a real status, and
 * the filter is what keeps a hidden photo out of a rendered/published reel.
 */
describe("buildReelProps over guest-shaped items", () => {
  // Exactly the shape toGridItems emits for a guest: presigned urls + attribution, no host-only
  // fields (no likeCount, no uploaderEmail), and the stamped status.
  function guestItem(id: string, over: Partial<GridMedia> = {}): GridMedia {
    return {
      id,
      type: "photo",
      url: `https://r2/${id}/original`,
      downloadUrl: `https://r2/${id}/attachment`,
      previewUrl: `https://r2/${id}/preview`,
      status: "approved",
      uploaderName: "Sam",
      isHost: false,
      // The identity reshape: a guest item now carries its standing too (unverified here, the
      // name-only shape). The reel filters on `status`, never on identity, and this fixture is the
      // guard that adding a field to the guest payload did not change that.
      isVerified: false,
      width: 3024,
      height: 4032,
      durationSeconds: null,
      ...over,
    };
  }

  it("renders a full timeline from stamped guest items", () => {
    const items = [guestItem("g1"), guestItem("g2"), guestItem("g3")];
    const props = buildReelProps({
      orderedIds: ["g1", "g2", "g3"],
      byId: byIdOf(items),
      ...base,
    });
    expect(props.clips.map((c) => c.url)).toEqual([
      "https://r2/g1/preview",
      "https://r2/g2/preview",
      "https://r2/g3/preview",
    ]);
  });

  it("drops EVERY item when the status stamp is missing (the bug this pins)", () => {
    const items = [
      guestItem("g1", { status: undefined }),
      guestItem("g2", { status: undefined }),
    ];
    const props = buildReelProps({
      orderedIds: ["g1", "g2"],
      byId: byIdOf(items),
      ...base,
    });
    // An empty reel, silently. This is why the stamp lives in toGridItems.
    expect(props.clips).toEqual([]);
  });

  it("toGridItems stamps the status (source pin - the module is server-only)", () => {
    const src = readFileSync(
      join(process.cwd(), "src/lib/r2/grid-items.ts"),
      "utf8",
    );
    expect(src).toContain('status: "approved" as const');
  });
});
