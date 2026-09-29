import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import MarketingHome from "@/app/(marketing)/(cinema)/page";

import { CinemaHero } from "./cinema-hero";
import { printSizes } from "./cinema-hero-card";
import { FRAME_SIZES, OBJECT_PRINTS, STREAM_FRAMES } from "./hero-stream";

/**
 * THE HOME'S FIRST PAINT FETCHES EACH PHOTOGRAPH ONCE (build 19's red-team, 2026-09-29: every load at a
 * desk logged "preloaded but not used" for the card's four prints).
 *
 * React's server render preloads every eager image it draws, one `<link rel=preload>` per srcset and
 * sizes, so an eager image is a preload whether anyone asked for one or not. The card's prints are
 * stand-ins on the band's own photographs (until ASSETS row 33), and each asked for its own small
 * window: a second preload of a photograph the band was already fetching bigger, which Chrome then drew
 * from the band's copy, leaving the small one unused. Pinned on the server's own HTML: no photograph
 * is preloaded twice, and a print of a band photograph asks exactly what the band's frame asks.
 *
 * ★ AND ACROSS THE WHOLE PAGE, NOT ONLY THE HERO (build 20's red-team): the switching photograph six
 * sections down preloaded the golden photograph a second time at full bleed, beside the hero's copy,
 * and Chrome then drew the bigger one everywhere and left the hero's unused. A hero-only render could
 * not see it, so the page is rendered whole, and its first paint preloads the hero's photographs and
 * nothing further down: the hero is the home's first screen at every width.
 */

/** The file a preload or an image asks for: the photograph's name in `/_next/image?url=`. */
function photographOf(srcset: string): string {
  const first = srcset.split(",")[0].trim().split(" ")[0];
  const url = new URL(first.replace(/&amp;/g, "&"), "https://partyreel.com");
  const source = url.searchParams.get("url") ?? url.pathname;
  return source.split("/").pop() ?? source;
}

function imagePreloads(html: string): { photo: string; sizes: string }[] {
  return [...html.matchAll(/<link rel="preload" as="image"[^>]*>/g)].map(
    ([tag]) => ({
      photo: photographOf(/imageSrcSet="([^"]+)"/.exec(tag)?.[1] ?? ""),
      sizes: /imageSizes="([^"]+)"/.exec(tag)?.[1] ?? "",
    }),
  );
}

/** Each photograph preloaded more than once, with its count. */
function preloadedTwice(preloads: { photo: string }[]): [string, number][] {
  const seen = new Map<string, number>();
  for (const p of preloads) seen.set(p.photo, (seen.get(p.photo) ?? 0) + 1);
  return [...seen].filter(([, n]) => n > 1);
}

describe("the home hero's first paint", () => {
  const html = renderToString(<CinemaHero />);
  const preloads = imagePreloads(html);

  it("preloads something (a scan that finds nothing is a broken scan)", () => {
    expect(preloads.length).toBeGreaterThan(0);
  });

  it("★ never preloads one photograph twice", () => {
    expect(
      preloadedTwice(preloads),
      "photographs preloaded more than once",
    ).toEqual([]);
  });

  it("★ a print of a band photograph asks for the band's copy, so it adds no preload", () => {
    for (const print of OBJECT_PRINTS) {
      const onBand = (STREAM_FRAMES as readonly string[]).includes(print.photo);
      expect(onBand, `${print.photo} is a band photograph today`).toBe(true);
      expect(printSizes(print.photo)).toBe(FRAME_SIZES);
    }
    // Every preload is the band's size: the prints brought none of their own.
    expect(new Set(preloads.map((p) => p.sizes))).toEqual(
      new Set([FRAME_SIZES]),
    );
  });

  it("a print of a photograph the band does not carry asks for its own window again", () => {
    expect(printSizes("a-photograph-of-its-own")).not.toBe(FRAME_SIZES);
    expect(printSizes("a-photograph-of-its-own")).toMatch(
      /^\(min-width: \d+px\) \d+px, \(min-width: \d+px\) \d+px, \d+px$/,
    );
  });
});

describe("the home page's first paint, every section of it", () => {
  const page = imagePreloads(renderToString(<MarketingHome />));
  const hero = imagePreloads(renderToString(<CinemaHero />));
  const key = (p: { photo: string; sizes: string }) =>
    `${p.photo} @ ${p.sizes}`;

  it("★ never preloads one photograph twice, however many sections paint it", () => {
    expect(page.length).toBeGreaterThan(0);
    expect(
      preloadedTwice(page),
      "photographs preloaded more than once",
    ).toEqual([]);
  });

  it("★ preloads what its first screen paints and nothing further down", () => {
    // A section below the hero that draws an eager image spends the first
    // paint on a photograph the reader cannot see yet: it loads lazily.
    expect(page.map(key).sort()).toEqual(hero.map(key).sort());
  });
});
