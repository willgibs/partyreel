import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE HOME PAGE'S TWO LAMPS (round 1, 2026-09-01).
 *
 * Source-text pins, and deliberately so. Nothing about how light LOOKS is
 * testable here -- vitest runs these in the node project with no DOM, no
 * layout, no paint and no canvas -- and the sibling home-sections.test.ts
 * cannot even import the section tree, because it transitively pulls
 * lib/env.ts, which throws without NEXT_PUBLIC_*. So this file guards the
 * handful of failures that are SILENT: no exception, no type error, and
 * nothing obviously wrong on the surface you happen to be looking at.
 *
 * What is NOT covered here, stated so nobody mistakes green for proof:
 * whether either lamp reads as light, whether the frame budget survives three
 * filtered layers on one page, and whether the sampled palette resolves before
 * anyone notices. Those are the live pass and Will's eye.
 */

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");
const HERO = "src/components/marketing/sections/home/cinema-hero.tsx";
const ALBUM = "src/components/marketing/sections/home/album.tsx";
const ALBUM_GLOW = "src/components/marketing/sections/home/album-glow.tsx";

describe("the hero underlight", () => {
  const src = read(HERO);

  it("sits after every scrim and before the copy", () => {
    // ★ THE PIN THAT CATCHES THE EXPENSIVE MISTAKE. Nothing in the hero creates
    // a stacking context, so its three positioned children paint in DOM ORDER.
    // Moved inside the wall wrapper the lamp lands UNDER all four scrims --
    // flat black/35, the to-t ramp, the vignette, the mobile ramp -- which
    // multiply to roughly an eighth at the copy's depth. The symptom is "the
    // light is too weak", the instinct is to raise --glw-strength, and then the
    // paused and reduced-motion states are eight times too hot.
    const lastScrim = src.lastIndexOf("sm:hidden");
    const glow = src.indexOf("<Glow");
    const container = src.indexOf("<Container");
    expect(lastScrim, "mobile scrim not found").toBeGreaterThan(-1);
    expect(glow, "<Glow not found").toBeGreaterThan(lastScrim);
    expect(container, "<Container not found").toBeGreaterThan(glow);
  });

  it("keeps the copy above the light", () => {
    // Container is a STATIC div (shared/container.tsx). Glow is absolutely
    // positioned, so without this class the wash paints OVER the H1 rather
    // than behind it, and law 4 ("sits behind content") is broken by one
    // missing word. The failure looks like "the effect is too strong".
    expect(src).toMatch(/<Container className="relative /);
  });

  it("lights from the wall it names, and samples it", () => {
    // colors is what makes this law 3 rather than decoration; drop the prop and
    // the lamp silently falls back to the house five with nothing to show for
    // the round. The ref must be on the wall itself -- the sampler reads the
    // <img> elements INSIDE the element it is handed.
    expect(src).toContain("useSampledPaletteFromDom(wallRef");
    expect(src).toMatch(/ref=\{wallRef\}\s*\n\s*data-mkt-wall/);
    expect(src).toContain("colors={wallColors ?? undefined}");
    expect(src).toMatch(/shape="seam"/);
  });
});

describe("the album straddle lamp", () => {
  const glow = read(ALBUM_GLOW);
  const album = read(ALBUM);

  it("throws UP, against the lab specimen it came from", () => {
    // ★ The lab stage is vertically mirrored from this surface: it puts paper
    // above and dark below and biases the throw DOWN. Here the card hangs up
    // out of the paper into the dark, so a copied inset would throw
    // dark-register light onto near-white paper -- the exact "dirty rather than
    // lit" failure SPILL_REGISTER.paper exists to fix. The box therefore
    // extends above the card and clips at the cut.
    expect(glow).toContain('top: "-4rem"');
    expect(glow).toContain('bottom: "calc(100% - 4rem + 1px)"');
    // origin low in the box, so the falloff climbs into the dark
    const fromY = glow.match(/"--glw-from-y":\s*"(\d+)%"/);
    expect(fromY, "--glw-from-y not found").not.toBeNull();
    expect(Number(fromY![1])).toBeGreaterThan(50);
  });

  it("only exists where the straddle does", () => {
    // No overhang below lg, so no lamp: law 1 applied honestly rather than as a
    // breakpoint convenience. minWidth also skips the canvas work on phones.
    expect(glow).toContain("lg:block");
    expect(glow).toContain("minWidth: 1024");
  });

  it("does not drag the album into the client bundle", () => {
    // A children slot, not a wrapper import. Adding "use client" to album.tsx
    // would pull SectionShell, MediaSplit, BrowserFrame, Reveal and Eyebrow
    // into the browser to support one decorative layer, and the eight tiles
    // would stop server-rendering.
    expect(album.replace(/\/\*[\s\S]*?\*\//g, "")).not.toContain(
      '"use client"',
    );
    expect(glow).toContain('"use client"');
    expect(album).toContain("<AlbumStraddleLamp>");
  });
});

describe("scarcity, as a property of the source", () => {
  it("puts no more than one lamp in either home section", () => {
    // Scarcity is a DISTANCE, not a count, and distance is a live measurement.
    // What IS checkable here is the thing that would quietly erode it: a second
    // lamp appearing inside a section that already has one.
    const dir = join(process.cwd(), "src/components/marketing/sections/home");
    const files = readdirSync(dir).filter(
      (f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx"),
    );
    expect(files.length, "no home sections scanned").toBeGreaterThan(10);
    const lit = files.filter((f) =>
      /<Glow\b/.test(readFileSync(join(dir, f), "utf8")),
    );
    // Exactly two, named: a third section lighting up is how "roughly a
    // viewport of unlit page between lamps" dies, one reasonable-looking
    // addition at a time.
    expect(lit.sort()).toEqual(["album-glow.tsx", "cinema-hero.tsx"]);
    for (const f of lit) {
      const n = (readFileSync(join(dir, f), "utf8").match(/<Glow\b/g) ?? [])
        .length;
      expect(n, `${f} renders ${n} lamps`).toBe(1);
    }
  });
});
