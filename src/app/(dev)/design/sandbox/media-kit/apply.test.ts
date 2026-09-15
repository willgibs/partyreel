import { describe, expect, it } from "vitest";

import { BRIDGE_CSS, EXPOSURE_CSS, MIX_CSS, SHOOT_CSS } from "./apply";
import { BRIDGE_BY_ID, MIX_LICENSED } from "./bridge";
import { candidate } from "./candidates";

import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * THE APPLIED BLOCKS, CHECKED (the media-kit track, round two).
 *
 * ★ THIS TEST EXISTS BECAUSE OF A SILENT FAILURE. The first cut of the Ours block
 * put an XML entity in the slate's SVG, and a bare `&` ends an unencoded data
 * URI: every frame on every page fell back to today's photograph, and an <img>
 * whose `content` fails to load renders its own src, so the page looked entirely
 * normal and the block looked applied. Nothing but driving the real site with it
 * on would have caught it, which is exactly the class of bug a test should take
 * over from a walk.
 */

const BLOCKS: [string, string][] = [
  ["exposure", EXPOSURE_CSS],
  ["bridge", BRIDGE_CSS],
  ["shoot", SHOOT_CSS],
  ["mix", MIX_CSS],
];

/** Everything between `url("data:` and the closing quote, per block. */
function dataUris(css: string): string[] {
  return [...css.matchAll(/url\("(data:[^"]*)"\)/g)].map((m) => m[1]);
}

describe("the blocks a board hands the running site", () => {
  it("no data URI carries a raw ampersand, which would end its parse", () => {
    for (const [name, css] of BLOCKS) {
      for (const uri of dataUris(css)) {
        expect(uri.includes("&"), `${name}: ${uri.slice(0, 80)}`).toBe(false);
      }
    }
  });

  it("every data URI is a well formed, closed SVG", () => {
    for (const [name, css] of BLOCKS) {
      for (const uri of dataUris(css)) {
        expect(uri.startsWith("data:image/svg+xml,<svg "), name).toBe(true);
        expect(uri.endsWith("</svg>"), name).toBe(true);
        // Tag balance: a truncated slate renders nothing and looks like nothing.
        expect((uri.match(/</g) ?? []).length, name).toBe(
          (uri.match(/>/g) ?? []).length,
        );
      }
    }
  });

  it("the licensed block swaps every one of the twelve, by its real file name", () => {
    for (const image of MARKETING_IMAGES) {
      const file = image.src.split("/").pop()?.replace(".jpg", "");
      expect(BRIDGE_CSS, image.id).toContain(`img[src*="${file}"]`);
      expect(BRIDGE_CSS, image.id).toContain(
        `/design/media-kit/${candidate(BRIDGE_BY_ID[image.id]).file}`,
      );
    }
    expect(BRIDGE_CSS.split("\n").filter((l) => l.startsWith("img")).length).toBe(
      MARKETING_IMAGES.length,
    );
  });

  it("the shoot block names a shot for every one of the twelve", () => {
    for (const image of MARKETING_IMAGES) {
      expect(SHOOT_CSS, image.id).toContain(`replaces ${image.id}`);
    }
  });

  it("the mix is licensed on exactly the two details and a slate on the rest", () => {
    const licensedLines = MIX_CSS.split("\n").filter((l) =>
      l.includes("/design/media-kit/"),
    );
    expect(licensedLines.length).toBe(MIX_LICENSED.length);
    for (const id of MIX_LICENSED) {
      expect(MIX_CSS).toContain(`/design/media-kit/${candidate(BRIDGE_BY_ID[id]).file}`);
    }
  });

  it("a slate keeps its type inside the middle of a square, so no crop loses it", () => {
    // Every surface cover-crops: 4:5 takes 20 percent off the sides of a square,
    // 40:21 takes half the height. Centred text on a 1000 square is the only
    // shape that survives all of them, so the viewBox and the anchor are pinned.
    for (const uri of dataUris(SHOOT_CSS)) {
      expect(uri).toContain("viewBox='0 0 1000 1000'");
      expect(uri).toContain("text-anchor='middle'");
      for (const x of uri.matchAll(/<text x='(\d+)'/g)) {
        expect(Number(x[1]), uri.slice(0, 60)).toBe(500);
      }
      // Two rows of 26 characters at 36 px is about 470 px wide, inside the 600
      // a 4:5 crop of a 1000 square leaves.
      for (const t of uri.matchAll(/font-size='36'[^>]*>([^<]*)</g)) {
        expect(t[1].length, t[1]).toBeLessThanOrEqual(26);
      }
    }
  });

  it("the exposure block selects the stills, the posters and the reels", () => {
    expect(EXPOSURE_CSS).toContain('img[src*="mkt-"]');
    expect(EXPOSURE_CSS).toContain('img[src*="hero-candidate-0"]');
    expect(EXPOSURE_CSS).toContain('video[src*="/marketing/reels/"]');
  });

  it("every block is real CSS against production selectors, never a stage class", () => {
    // The wave's rule for an applied block: a stage-local class would make the
    // walk a lie, because nothing on the real site carries it.
    for (const [name, css] of BLOCKS) {
      expect(css.includes("[data-mk"), name).toBe(false);
      expect(css.trim().length, name).toBeGreaterThan(0);
      expect(css.split("\n").every((l) => !l.startsWith(".mk-")), name).toBe(true);
    }
  });
});
