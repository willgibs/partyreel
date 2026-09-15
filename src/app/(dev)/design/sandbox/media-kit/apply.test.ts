import { describe, expect, it } from "vitest";

import { BRIDGE_CSS, EXPOSURE_CSS, MIX_CSS, SHOOT_CSS } from "./apply";
import {
  BRIDGE,
  BRIDGE_BY_ID,
  routeOutcome,
  routeOutcomeForId,
} from "./bridge";
import { candidate } from "./candidates";
import type { Route } from "./kit";
import { MIX_POSTS, POSTS_FILLED } from "./decision";
import { master } from "./shoot";

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
    expect(
      BRIDGE_CSS.split("\n").filter((l) => l.startsWith("img")).length,
    ).toBe(MARKETING_IMAGES.length);
  });

  it("the shoot block names a shot for every one of the twelve", () => {
    for (const image of MARKETING_IMAGES) {
      expect(SHOOT_CSS, image.id).toContain(`replaces ${image.id}`);
    }
  });

  /**
   * ★ THE BLOCK IS THE SHEET, ID BY ID. Round three's first cut built this block
   * by matching the mix list against a manifest id while the board's sheet
   * matched it against a candidate key, so Mix pasted bridge-ceremony.jpg onto a
   * page the sheet showed wearing wedding-arch.jpg. The assertion is no longer
   * "two licensed lines": it is that every one of the twelve wears exactly what
   * `routeOutcomeForId` says it wears, which is the function the sheet reads.
   */
  it("the mix block wears whatever the board's own route function says", () => {
    const licensedIds: string[] = [];
    for (const id of Object.keys(BRIDGE_BY_ID)) {
      const out = routeOutcomeForId(id, "mix");
      if (out.kind === "licensed" && out.key) {
        licensedIds.push(id);
        expect(MIX_CSS, id).toContain(
          `img[src*="mkt-${id}-01"] { content: url("/design/media-kit/${candidate(out.key).file}"); }`,
        );
      } else {
        expect(MIX_CSS, id).toContain(`replaces ${id}`);
      }
    }
    // Only the id half of the block: the per-slug rules below it are the same
    // question asked of a post, and they are counted in their own describe.
    const licensedLines = MIX_CSS.split("\n").filter(
      (l) => l.startsWith("img[src*=") && l.includes("/design/media-kit/"),
    );
    expect(licensedLines.length).toBe(licensedIds.length);
    // Mix has to change something, or the toggle is inert in the paste too.
    expect(licensedIds.length).toBeGreaterThan(0);
  });

  it("the three route blocks are three different pastes", () => {
    expect(new Set([BRIDGE_CSS, SHOOT_CSS, MIX_CSS]).size).toBe(3);
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
      expect(
        css.split("\n").every((l) => !l.startsWith(".mk-")),
        name,
      ).toBe(true);
    }
  });
});

/**
 * THE BLOG IS SWAPPED PER POST, AND THIS IS THE TEST THAT SAYS SO.
 *
 * ★ A FILE NAME CAN ONLY CARRY AN ID. The bridge's finding is that the blog is 23
 * frontmatter lines rather than twelve files, and 14 of the 21 filled posts name a
 * candidate that is NOT what their cover's id is bridged with. A block built on
 * ids alone therefore showed a walk a different photograph from the one the
 * board's own sheet showed for the same post, and it made the route table's blog
 * column unreachable: the Mix row promises two covers, and one id can change. The
 * blocks carry a per-slug rule now, and these assertions hold the two together.
 */
describe("the blog covers a block lands, post by post", () => {
  const ROUTES: [Route, string][] = [
    ["licensed", BRIDGE_CSS],
    ["ours", SHOOT_CSS],
    ["mix", MIX_CSS],
  ];

  /** The declaration line for one post: the rule is `card,\narticle { ... }`. */
  function ruleFor(css: string, slug: string): string {
    const line = css
      .split("\n")
      .find((l) => l.includes(`[href$="/blog/${slug}"]`));
    expect(line, slug).toBeTruthy();
    return line as string;
  }

  it("every post is named by its own slug, on the card and on the article", () => {
    for (const [route, css] of ROUTES) {
      for (const post of BRIDGE) {
        expect(css, `${route} ${post.slug}`).toContain(
          `a[data-cover-morph][href="/blog/${post.slug}"] img`,
        );
        expect(css, `${route} ${post.slug}`).toContain(
          `html:has(link[rel="canonical"][href$="/blog/${post.slug}"]) [data-cover-plate="target"] img`,
        );
      }
    }
  });

  it("a post wears what its own row wears, never what its cover id wears", () => {
    for (const [route, css] of ROUTES) {
      for (const post of BRIDGE) {
        const rule = ruleFor(css, post.slug);
        const out = routeOutcome(post, route);
        const where = `${route} ${post.slug}`;
        if (out.kind === "licensed" && out.key) {
          expect(rule, where).toContain(
            `/design/media-kit/${candidate(out.key).file}`,
          );
        } else if (out.kind === "licensed") {
          // The two posts nothing licensed can fill: the sheet leaves the plate
          // empty and the site says so rather than keeping today's frame.
          expect(rule, where).toContain("no licensed frame");
        } else {
          expect(rule, where).toContain(`replaces ${post.cover}`);
          expect(rule, where).toContain(master(post.shot).code);
        }
      }
    }
  });

  it("the 14 posts whose id bridges elsewhere really do land differently", () => {
    // Without this the fix is untestable: if every post agreed with its id, a
    // block built on ids would have been right all along.
    const diverging = BRIDGE.filter(
      (p) => p.candidate && BRIDGE_BY_ID[p.cover] !== p.candidate,
    );
    expect(diverging.length).toBeGreaterThan(0);
    for (const post of diverging) {
      const rule = ruleFor(BRIDGE_CSS, post.slug);
      expect(rule, post.slug).toContain(
        `/design/media-kit/${candidate(post.candidate as string).file}`,
      );
      expect(rule, post.slug).not.toContain(
        `/design/media-kit/${candidate(BRIDGE_BY_ID[post.cover]).file}`,
      );
    }
  });

  it("no slug is a suffix of another, so the canonical match names one post", () => {
    // The article rule matches the canonical href by suffix, because the origin
    // differs between localhost, a preview and production.
    for (const a of BRIDGE) {
      for (const b of BRIDGE) {
        if (a.slug === b.slug) continue;
        expect(b.slug.endsWith(`/${a.slug}`), `${b.slug} / ${a.slug}`).toBe(
          false,
        );
      }
    }
  });

  it("the route table's blog column is what a walk actually wears", () => {
    const wearing = (css: string) =>
      css
        .split("\n")
        .filter(
          (l) =>
            l.includes('[href$="/blog/') && l.includes("/design/media-kit/"),
        ).length;
    expect(wearing(MIX_CSS)).toBe(MIX_POSTS);
    expect(wearing(BRIDGE_CSS)).toBe(POSTS_FILLED);
    expect(wearing(SHOOT_CSS)).toBe(0);
  });
});
