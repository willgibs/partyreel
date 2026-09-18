// @policy: marketing · One manifest gates the marketing media
// @refuses: an asset in public/marketing with no manifest entry, or an entry pointing at a file that is not there.

import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  MARKETING_IMAGES,
  MARKETING_REELS,
  marketingImage,
} from "./marketing-media";

/**
 * The manifest is the ONE gate between public/marketing/ and the components (see the module
 * header). These pins hold both directions: every entry resolves to a real file, and every file
 * is reachable through an entry, so an orphaned asset or a dead reference fails the build instead
 * of shipping a broken frame. There is deliberately no pin on where an image came from: an image on
 * the site is one we hold the rights to, and nothing tracks them (Will, 2026-09-17).
 */

const PUBLIC_DIR = join(process.cwd(), "public");
const MARKETING_DIR = join(PUBLIC_DIR, "marketing");

function filesUnder(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.name.startsWith("."))
    .map((entry) => entry.name);
}

describe("marketing media manifest", () => {
  it("every referenced file exists on disk", () => {
    for (const image of MARKETING_IMAGES) {
      expect(existsSync(join(PUBLIC_DIR, image.src)), image.src).toBe(true);
    }
    for (const reel of MARKETING_REELS) {
      expect(existsSync(join(PUBLIC_DIR, reel.src)), reel.src).toBe(true);
      expect(existsSync(join(PUBLIC_DIR, reel.poster)), reel.poster).toBe(true);
    }
  });

  it("every file under public/marketing/ has a manifest entry (no orphans)", () => {
    const referenced = new Set([
      ...MARKETING_IMAGES.map((m) => m.src),
      ...MARKETING_REELS.flatMap((r) => [r.src, r.poster]),
    ]);
    for (const sub of ["img", "reels", "posters"]) {
      for (const name of filesUnder(join(MARKETING_DIR, sub))) {
        expect(
          referenced.has(`/marketing/${sub}/${name}`),
          `orphan: ${sub}/${name}`,
        ).toBe(true);
      }
    }
  });

  it("ids are unique and the lookup round-trips", () => {
    const ids = MARKETING_IMAGES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(marketingImage(id).id).toBe(id);
    expect(() => marketingImage("no-such-id")).toThrow();
  });

  it("orientation matches the recorded dimensions", () => {
    for (const image of MARKETING_IMAGES) {
      const expected = image.height > image.width ? "portrait" : "landscape";
      expect(image.orientation, image.id).toBe(expected);
    }
  });

  it("reel recipes reference known image ids and 1/24s shot boundaries", () => {
    for (const reel of MARKETING_REELS) {
      for (const clipId of reel.recipe.clipIds) {
        expect(() => marketingImage(clipId)).not.toThrow();
      }
      for (const boundary of reel.shotBoundaries) {
        // 24fps frames: boundary * 24 must land on an integer (within float noise).
        expect(
          Math.abs(boundary * 24 - Math.round(boundary * 24)),
          `${reel.id}@${boundary}`,
        ).toBeLessThan(1e-6);
      }
    }
  });
});
