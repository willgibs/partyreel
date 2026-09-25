import { describe, expect, it } from "vitest";

import type { GridMedia } from "@/components/app/media-grid";
import { MAX_REEL_SECONDS } from "@/lib/constants/tiers";
import { buildReelProps } from "@/lib/reel/build-reel-props";

import { FPS } from "./constants";
import {
  encodeReel,
  ENCODE_TAIL_SEC,
  MAX_ENCODE_FRAMES,
  MAX_ENCODE_SECONDS,
} from "./encode";
import { engineStyleDuration } from "./registry";
import { STYLE_CATALOG } from "./style-registry";

/**
 * THE ENCODER'S CEILING (encode.ts): the longest plan's cap plus a style's own tail, held as a
 * constant of the encoder, so a clip can never run away once the stored reel's server-side size
 * cap is gone. What is pinned: the ceiling is derived from the plans (a longer plan moves it), every
 * style capped at the longest plan fits under it with a mixed album of photographs and videos, and
 * anything past it is refused before a single asset is decoded.
 */

function album(n: number): Map<string, GridMedia> {
  const byId = new Map<string, GridMedia>();
  for (let i = 0; i < n; i++) {
    byId.set(`m${i}`, {
      id: `m${i}`,
      type: i % 7 === 3 ? "video" : "photo",
      url: `https://r2.test/o/${i}.jpg`,
      previewUrl: `https://r2.test/p/${i}.webp`,
      status: "approved",
      width: i % 2 ? 3000 : 2000,
      height: i % 2 ? 2000 : 3000,
    });
  }
  return byId;
}

describe("the encoder's ceiling", () => {
  it("is the longest plan's cap plus the style tail", () => {
    const longest = Math.max(...Object.values(MAX_REEL_SECONDS));
    expect(MAX_ENCODE_SECONDS).toBe(longest + ENCODE_TAIL_SEC);
    expect(MAX_ENCODE_FRAMES).toBe(MAX_ENCODE_SECONDS * FPS);
  });

  it("holds every style, capped at the longest plan, in both orientations", () => {
    const longest = Math.max(...Object.values(MAX_REEL_SECONDS));
    const byId = album(200);
    const ids = [...byId.keys()];
    for (const style of STYLE_CATALOG) {
      for (const orientation of ["portrait", "landscape"] as const) {
        const props = buildReelProps({
          orderedIds: ids,
          byId,
          styleId: style.id,
          seed: 4242,
          orientation,
          lengthSeconds: longest,
          watermark: false,
        });
        const frames = engineStyleDuration(style.id, props);
        expect(
          frames,
          `${style.id} ${orientation}: ${frames / FPS}s past the ceiling`,
        ).toBeLessThanOrEqual(MAX_ENCODE_FRAMES);
      }
    }
  });

  it("refuses anything past it before decoding a thing", async () => {
    const byId = album(400);
    const props = buildReelProps({
      orderedIds: [...byId.keys()],
      byId,
      styleId: "classic",
      seed: 1,
      // Uncapped: the whole album, which no creator would ever hand the encoder.
      lengthSeconds: null,
    });
    expect(engineStyleDuration("classic", props)).toBeGreaterThan(
      MAX_ENCODE_FRAMES,
    );
    // No document, no canvas, no network in this project: reaching any of them would throw
    // something else, so a RangeError proves the refusal came first.
    await expect(encodeReel(props)).rejects.toBeInstanceOf(RangeError);
  });
});
