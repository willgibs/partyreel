import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE LIGHT ENGINE'S MECHANISMS. Nothing here pins how the light looks (the
 * brand kit shows it, and it is tuned freely); what is held is what breaks
 * something else when it goes: the offscreen pause (performance), reduced
 * motion and forced colours (accessibility), the no-mask fallback that keeps
 * an unmasked field off the content, keyframe names that cannot shadow
 * another sheet's (the engine lives in globals.css, which every route loads),
 * the knobs the engine really reads, and the filter host staying a server
 * component so no route pays for glow machinery it does not draw.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const glowSrc = read("src/components/shared/glow.tsx");
const glowCode = stripComments(glowSrc);
const filterSrc = read("src/components/shared/glow-filter.tsx");

/**
 * ★ SLICE BOUNDS ARE ASSERTED, NEVER TRUSTED (round 1, 2026-09-01). Two pins
 * below used to slice `indexOf(A)` -> `indexOf("export function GlowFilter(")`.
 * When round 1 moved GlowFilter into its own module that second index became
 * -1, and `slice(start, -1)` does not throw: it quietly returns everything but
 * the last character, so both pins kept passing over the WRONG text. Same class
 * as the four guards the round-0 sweep found unable to fail, and it appeared
 * here as a SIDE EFFECT of an unrelated refactor, which is exactly why the
 * bound has to be checked rather than assumed.
 */
const declBody = (src: string, from: string) => {
  const a = src.indexOf(from);
  expect(a, `slice start not found: ${from}`).toBeGreaterThan(-1);
  // The next TOP-LEVEL export after the marker, or EOF when it is the last one.
  // Searched from `a`, never from 0: searching the whole string would find an
  // export ABOVE the marker and silently invert the range.
  const b = src.indexOf("\nexport ", a + from.length);
  const body = src.slice(a, b === -1 ? src.length : b);
  expect(body.length, `empty slice for ${from}`).toBeGreaterThan(200);
  return body;
};
const globalsCss = read("src/app/globals.css");
// The engine block only: everything appended under the SPILL banner, which the
// promotion put at the END of globals.css, so this slice runs banner -> EOF.
// If anything is ever appended BELOW the engine this silently widens, so the
// keyframe-namespace test below doubles as the tripwire for that.
const bannerAt = globalsCss.indexOf("SPILL: the light engine");
const engineCode = stripComments(globalsCss.slice(bannerAt));

describe("the spill primitive", () => {
  it("mirrors the pause state onto data-paused for CSS to read", () => {
    expect(glowCode).toContain('data-paused={paused ? "true" : "false"}');
  });
});

describe("the spill engine CSS", () => {
  it("carries the forced-colors, print and no-mask fallbacks", () => {
    // A purely decorative colour layer is exactly where these belong, and the
    // repo has no other instance of any of them.
    expect(engineCode).toMatch(/@media \(forced-colors: active\)/);
    expect(engineCode).toMatch(/@media print/);
    expect(engineCode).toMatch(/@supports not \(mask-image/);
  });
  it("hides the WHOLE lamp where masking is unsupported", () => {
    // ★ The guard used to hide the band and the edge and claim it was keeping
    // the lamp "lit and still, rather than showing an unmasked colour slab".
    // The FALLOFF is a mask too -- [data-glw]'s own radial, a seam's linear
    // ramp, and a halo's mask, which is the one that CLEARS the centre so the
    // backlit object is not painted over. Without masking, hiding only the
    // moving parts leaves exactly the unmasked field the guard exists to
    // prevent. There is no lit-and-still state to keep, so the lamp goes.
    const at = engineCode.indexOf("@supports not (mask-image");
    expect(at, "the no-mask fallback is gone").toBeGreaterThan(-1);
    const open = engineCode.indexOf("{", at);
    const close = engineCode.indexOf("\n}", at);
    expect(open, "no-mask fallback has no block").toBeGreaterThan(at);
    expect(close, "no-mask fallback is unterminated").toBeGreaterThan(open);
    const body = engineCode.slice(open, close);
    expect(body).toMatch(/\[data-glw\]\s*\{/);
    expect(
      body,
      "hiding only the moving layers leaves the field",
    ).not.toContain("[data-glw-band]");

    // The condition names ONLY the unprefixed property, on purpose. Lightning
    // CSS prefixes it at build time into
    // `not ((-webkit-mask-image: ...) or (mask-image: ...))`, which is the test
    // we actually want (every mask here ships the -webkit- pair, so a prefixed-
    // only engine masks fine and must not take the fallback). Measured in the
    // production build: the block is NOT compiled away. Writing the `or` by
    // hand would double-prefix.
    const condition = engineCode.slice(at, open);
    expect(condition).not.toContain("-webkit-mask-image");
  });
  it("keeps every animation inside the no-preference block", () => {
    // House convention: FINAL states sit outside the media queries (a
    // reduced-motion jump still arrives), motion lives inside no-preference.
    const noPref = engineCode.slice(
      engineCode.indexOf("@media (prefers-reduced-motion: no-preference)"),
    );
    // ★ THIS WAS /^\s{2}animation:/ AND MATCHED ZERO DECLARATIONS. Every
    // animation here sits inside `@media { selector { ... } }`, so it is
    // FOUR-space indented and a two-space anchor could never hit it: the loop
    // body never ran and the arrival-default contract was unguarded from the
    // day it was written. Anchored to \s* and pinned below, because the whole
    // failure mode of a loop-shaped assertion is passing over nothing.
    const decls = [...engineCode.matchAll(/^\s*animation:.*$/gm)];
    expect(decls.length, "no animation declarations found").toBeGreaterThan(4);
    for (const m of decls) {
      expect(noPref, m[0].trim()).toContain(m[0].trim());
    }
  });
  it("namespaces every keyframe it adds under glw-", () => {
    for (const m of engineCode.matchAll(/@keyframes\s+([\w-]+)/g)) {
      expect(m[1].startsWith("glw-"), m[1]).toBe(true);
    }
  });
  it("does not collide with a keyframe name already defined elsewhere", () => {
    // Keyframes are document-global and the last definition wins. The lab once
    // carried nine collisions with production (deleted in the library round;
    // src/app/keyframe-uniqueness.test.ts holds the count at zero); the engine
    // must not add one.
    const names = (rel: string) =>
      [...read(rel).matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]);
    const mine = [...engineCode.matchAll(/@keyframes\s+([\w-]+)/g)].map(
      (m) => m[1],
    );
    // ★ THIS SET INVERTED AT THE PROMOTION. globals.css used to be "elsewhere";
    // it is now the engine's OWN home, so reading it whole would compare the
    // engine against itself and fail on every name. design.css moved the other
    // way and is now wholly elsewhere (it kept the lab-only glw-skel / glw-fly
    // / glw-tilefly recipes, which is exactly what this must catch).
    // Every lab stylesheet, not one path: a standing board keeps its sheet
    // under sandbox/ beside the board, and a sheet that moves must stay in
    // this net.
    const labDir = "src/app/(dev)/design";
    const labSheets = readdirSync(join(process.cwd(), labDir), {
      recursive: true,
    })
      .map(String)
      .filter((f) => f.endsWith(".css"))
      .map((f) => `${labDir}/${f}`);
    // The lab's own sheet is always there; a board's joins it while the board
    // stands. A floor counting boards' sheets went red as boards retired.
    expect(labSheets, "the net lost the lab's own sheet").toContain(
      "src/app/(dev)/design/design.css",
    );
    const elsewhere = new Set([
      ...names("src/app/(marketing)/marketing.css"),
      ...labSheets.flatMap(names),
      // globals.css minus the engine block itself. Slice the RAW file, then
      // strip: the banner lives inside a CSS comment, so it cannot be found
      // in the comment-stripped text (indexOf would return -1 and quietly
      // hand back the whole file, including the engine's own keyframes).
      ...[
        ...stripComments(globalsCss.slice(0, bannerAt)).matchAll(
          /@keyframes\s+([\w-]+)/g,
        ),
      ].map((m) => m[1]),
    ]);
    for (const name of mine) expect(elsewhere.has(name), name).toBe(false);
    expect(mine.length).toBeGreaterThan(0);
  });
});

describe("the turbulence field", () => {
  it("has no knob the engine does not read", () => {
    // ★ THE --glw-span CLASS (removed round 1). That key sat in GlowVars for a
    // whole round after the engine stopped declaring it: it typechecked, it
    // autocompleted, and setting it did nothing at all. A knob that tunes
    // nothing is worse than a missing one, because the caller believes it
    // worked and goes looking elsewhere for the reason it did not.
    const varsType = declBody(glowCode, "export type GlowVars");
    const keys = [...varsType.matchAll(/"(--glw-[\w-]+)"/g)].map((m) => m[1]);
    expect(keys.length, "no GlowVars keys parsed").toBeGreaterThan(8);
    const dead = keys.filter((k) => !engineCode.includes(k));
    expect(dead, `GlowVars keys the engine never reads: ${dead}`).toEqual([]);
  });
  it("keeps the host a server component", () => {
    // No directive and no hook call: the whole point of splitting it out of
    // glow.tsx. A `use client` here is ~2KB of glow machinery on /admin.
    // ★ Comments stripped FIRST: glow-filter.tsx's own docstring explains why
    // it has no "use client", so the raw source contains the literal and a
    // naive check fails on the very comment documenting the rule it enforces.
    const code = stripComments(filterSrc);
    expect(code).not.toContain('"use client"');
    expect(code).not.toMatch(/\buse[A-Z]\w*\(/);
  });
});
