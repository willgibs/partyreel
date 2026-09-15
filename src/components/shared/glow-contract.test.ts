// @contract-for: src/components/shared/glow.tsx
// @contract-for: src/components/shared/glow-filter.tsx
// @policy: shared · The spill engine keeps its shape
// @refuses: a change to the lamp engine that renders as a hard-edged rectangle instead of light, with nothing else failing.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE SPILL ENGINE'S CONTRACT.
 *
 * Two halves. The source-text pins guard the failures that are SILENT: no
 * exception, no type error, and nothing visibly wrong on the surface you happen
 * to be developing on (the footer-contract.test.ts house pattern). The unit
 * tests cover the sampling math, which is real logic and testable without a
 * canvas.
 *
 * The engine was promoted into globals.css at round 0 (2026-09-01), so these
 * pins now guard PRODUCTION css that every route loads, and the keyframe
 * collision check below is load-bearing rather than precautionary. The sampling
 * math moved to sampled-palette.test.ts beside the module it tests.
 */

const ROOT = process.cwd();
/** Every file under a directory, recursively. Used by the singleton pins, which
 *  must scan the WHOLE tree: a second filter host anywhere is the defect. */
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.name === "node_modules"
      ? []
      : e.isDirectory()
        ? walk(join(dir, e.name))
        : [join(dir, e.name)],
  );
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
  it("uses the per-shape pause contract, not one hook for everything", () => {
    // useAmbientPause starts paused and stays paused offscreen, so a one-shot
    // wired to it never fires (or fires unwatched). `bloom` therefore takes
    // useInViewOnce. Losing this is invisible until someone notices a
    // celebration beat that simply never plays.
    expect(glowCode).toContain("useAmbientPause");
    expect(glowCode).toContain("useInViewOnce");
    expect(glowCode).toMatch(/const oneShot = shape === "bloom"/);
    expect(glowCode).toMatch(/oneShot \? arrival\.ref : ambient\.ref/);
    expect(glowCode).toMatch(/oneShot \? false : ambient\.paused/);
  });

  it("mirrors the pause state onto data-paused for CSS to read", () => {
    expect(glowCode).toContain('data-paused={paused ? "true" : "false"}');
  });

  it("always renders the base beside the band, UNCONDITIONALLY", () => {
    // ★ THE PIN THAT WAS TOO WEAK. The first version of this checked only that
    // both strings appear in the source, which passed while the band was
    // actually behind `{(!oneShot || inView) && ...}` and therefore absent at
    // runtime for every one-shot. That is invariant 2 broken in the one place
    // a source-text pin was supposed to protect.
    //
    // A swept layer rests fully off-layer, so a band without a base shows
    // NOTHING whenever it is paused: its default state below the fold, and its
    // reduced-motion state, since the global guard forces
    // animation-iteration-count: 1.
    expect(glowCode).toContain("<div data-glw-base />");
    expect(glowCode).toContain("<div data-glw-band />");
    const baseAt = glowCode.indexOf("data-glw-base");
    const bandAt = glowCode.indexOf("data-glw-band");
    expect(bandAt).toBeGreaterThan(baseAt);
    // Neither layer may sit behind a conditional or a ternary.
    for (const layer of ["data-glw-base", "data-glw-band"]) {
      const line = glowCode
        .split("\n")
        .find((l) => l.includes(layer) && l.includes("<div"));
      expect(line, layer).toBeTruthy();
      expect(line!.trim(), `${layer} is conditionally rendered`).toMatch(
        /^<div data-glw-(base|band) \/>$/,
      );
    }
  });

  it("arms a one-shot by attribute rather than by mounting it", () => {
    // A user-triggered bloom must not depend on an IntersectionObserver having
    // fired, and the resting light must be present from first paint.
    expect(glowCode).toMatch(/const armed =/);
    expect(glowCode).toContain("data-glw-armed");
    expect(glowCode).toMatch(/runId > 0/);
  });

  it("arms a one-shot against the VIEWPORT, not against its own height", () => {
    // The lamp is `position: absolute; inset: 0`, so its box is the CALLER's
    // wrapper and can be several viewports tall. An element-relative 0.35 is
    // unreachable there (35% of a 3000px lamp is more pixels than an 800px
    // screen holds), so the observer never trips and the one-shot never fires:
    // no error, no warning, just a beat that does not happen. The hook's
    // viewportFraction is the rescue (armingThreshold, use-in-view-once.ts, and
    // its own test pins the arithmetic); dropping it here would put the silent
    // failure straight back, and only on the tall surfaces nobody tests on.
    const glowFn = declBody(glowCode, "export function Glow(");
    expect(glowFn).toMatch(
      /useInViewOnce<HTMLDivElement>\([\s\S]*?viewportFraction:/,
    );
  });

  it("accepts no className", () => {
    const glowFn = declBody(glowCode, "export function Glow(");
    // Tailwind's filter/mask utilities live in the utilities layer, which
    // outranks everything the engine declares. One `blur-sm` from a caller
    // replaces `filter: url(#glw-warp) blur(...)` wholesale and the turbulence
    // warp vanishes with no error. This repo already paid for a
    // utilities-beats-base surprise once (the [data-reveal-chip] !importants).
    expect(glowFn).not.toMatch(/\bclassName\b/);
    // GlowFilter is exempt: it positions a zero-size <svg>, and carries none
    // of the engine's filter or mask properties.
    expect(stripComments(filterSrc)).toMatch(/className="absolute"/);
  });

  it("never renders the filter host itself", () => {
    // SVG ids are document-global; duplicates resolve by document order, which
    // is unstable under reconciliation and portals. Exactly one GlowFilter per
    // document, owned by the page, never by the effect.
    const glowFn = declBody(glowCode, "export function Glow(");
    expect(glowFn).not.toContain("feTurbulence");
    expect(glowFn).not.toContain("<filter");
  });
});

describe("the spill engine CSS", () => {
  it("declares the blur on the element, never only in a keyframe", () => {
    // get-pro-button's recipe puts blur() and saturate() INSIDE its keyframe.
    // Under the global reduced-motion guard (iteration-count 1, no fill-mode)
    // the element reverts to its unanimated style, so a keyframe-only blur
    // leaves hard-edged colour blobs. Same class of bug as the star note, one
    // step over.
    expect(engineCode).toMatch(
      /\[data-glw-field\]\s*\{[^}]*filter:\s*url\(#glw-warp\) blur\(var\(--glw-blur\)\)/,
    );
    const keyframeBlocks =
      engineCode.match(/@keyframes[^{]*\{[\s\S]*?\n\}/g) ?? [];
    for (const block of keyframeBlocks) {
      expect(block, `blur inside ${block.slice(0, 40)}`).not.toContain("blur(");
    }
  });

  it("ships the -webkit- pair on every mask declaration", () => {
    // iOS Safari is a first-class guest device on this product and still needs
    // the prefixed properties. The shipped footer gets this right; an engine
    // that did not would fail only on the phones that matter most.
    // Strip the @supports condition first: `@supports not (mask-image: ...)`
    // reads as a declaration to a naive scan and is not one.
    const decls = engineCode.replace(/@supports[^{]*\{/g, "{");
    const std = (decls.match(/(?<!-)\bmask-image:/g) ?? []).length;
    const pre = (decls.match(/-webkit-mask-image:/g) ?? []).length;
    expect(pre).toBe(std);
    const stdPos = (decls.match(/(?<!-)\bmask-position:/g) ?? []).length;
    const prePos = (decls.match(/-webkit-mask-position:/g) ?? []).length;
    expect(prePos).toBe(stdPos);
  });

  it("isolates, so the edge layers cannot paint over the lit content", () => {
    // Without `isolation`, [data-glw] is position:absolute at z-index auto and
    // creates no stacking context, so [data-glw-edge]'s z-index: 1 competes at
    // the PARENT's level and lands the ring on top of the very content the
    // light is meant to sit behind. It reads as "too strong" and sends you
    // tuning opacity instead of fixing the stack.
    expect(engineCode).toMatch(/\[data-glw\]\s*\{[^}]*isolation:\s*isolate/);
  });

  it("lets an ancestor drive the lamp's position", () => {
    // A custom property declared ON an element always beats the same property
    // inherited from an ancestor, so plain `--glw-from-x: 50%` defaults here
    // silently shadow any wrapper trying to move the lamp: pointer tracking,
    // a measured position, or a section setting the register for everything
    // inside it. Reading through a second name is what keeps those possible,
    // and it looks exactly like an indirection worth deleting.
    expect(engineCode).toMatch(/--glw-from-x:\s*var\(--glw-origin-x,/);
    expect(engineCode).toMatch(/--glw-from-y:\s*var\(--glw-origin-y,/);
  });

  it("keeps the scalar drive at the same specificity as the shared mask block", () => {
    // The bloom guard turned the shared block into four attribute selectors.
    // A bare [data-glw-drive="scalar"] override is two, loses, and the band
    // parks at the shared mask-position while --glw-t updates and changes
    // nothing at all. Both selectors must carry the same :not() so source
    // order decides.
    const scalarOverride = engineCode.slice(
      engineCode.indexOf("mask-position: calc(150%"),
    );
    expect(scalarOverride.length).toBeGreaterThan(0);
    const before = engineCode.slice(
      0,
      engineCode.indexOf("mask-position: calc(150%"),
    );
    const selector = before.slice(before.lastIndexOf("[data-glw]"));
    expect(selector).toContain(':not([data-glw-shape="bloom"])');
    expect(selector).toContain('[data-glw-drive="scalar"]');
  });

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
    // Every lab stylesheet, not one path: the open boards keep their sheets
    // under sandbox/ (glow-lab.css holds the glw-* recipes this must catch),
    // and a sheet that moves must stay in this net.
    const labDir = "src/app/(dev)/design";
    const labSheets = readdirSync(join(process.cwd(), labDir), {
      recursive: true,
    })
      .map(String)
      .filter((f) => f.endsWith(".css"))
      .map((f) => `${labDir}/${f}`);
    expect(labSheets.length, "no lab stylesheets found").toBeGreaterThan(1);
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

  it("rests the comet where its own animation starts", () => {
    // ★ Law 4's reduced-motion half, as a number. The animation lives inside
    // @media (prefers-reduced-motion: no-preference), so whatever the band
    // DECLARES is what a reduced-motion visitor sees permanently. That resting
    // value must be the from-keyframe (off-layer), never a point inside the
    // travel. It shipped as `50% 0` for two rounds, which with mask-size 280%
    // puts the comet's peak at dead centre of the box at full strength -- the
    // exact midpoint of the sweep, i.e. the worst case, forever, for the
    // visitors who opted out of motion.
    const from = engineCode.match(
      /@keyframes glw-mask-x\s*\{\s*from\s*\{[\s\S]*?[^-]mask-position:\s*([^;]+);/,
    );
    expect(from, "glw-mask-x from-keyframe not found").not.toBeNull();
    // Anchored on `mask-size: 280% 100%`, which is unique to the band's own
    // declaring block. Anchoring on the SELECTOR does not work: the declaring
    // rule is a four-part :not() compound split over five lines, and the naive
    // `[data-glw-drive="mask"] [data-glw-band]` matches the ANIMATION rule in
    // the no-preference block instead, which declares no position at all and
    // would have made this pin unfindable rather than wrong.
    const anchor = engineCode.indexOf("mask-size: 280% 100%");
    expect(anchor, "band mask-size anchor not found").toBeGreaterThan(-1);
    const rest = /[^-]mask-position:\s*([^;]+);/.exec(
      engineCode.slice(anchor, anchor + 400),
    );
    expect(rest, "resting mask-position not found").not.toBeNull();
    expect(rest![1].trim()).toBe(from![1].trim());
  });

  it("rests an UNARMED bloom where its own animation starts", () => {
    // ★ The same law, on the one shape the pin above cannot see. A bloom is
    // excluded from the comet mask, so nothing windows its band away: the two
    // states where its animation is not running (unarmed, and reduced motion,
    // which never enters the no-preference block at all) show whatever the band
    // DECLARES. That was `opacity: var(--glw-strength)` from the shared rule --
    // the beat fully lit before it fires, and permanently for anyone who opted
    // out of motion. The resting value has to be glw-bloom's own 0% keyframe.
    const from = engineCode.match(
      /@keyframes glw-bloom\s*\{\s*0%\s*\{([^}]*)\}/,
    );
    expect(from, "glw-bloom 0% keyframe not found").not.toBeNull();
    const fromOpacity = /opacity:\s*([^;]+);/.exec(from![1]);
    const fromScale = /scale:\s*([^;]+);/.exec(from![1]);
    expect(fromOpacity, "glw-bloom 0% declares no opacity").not.toBeNull();
    expect(fromScale, "glw-bloom 0% declares no scale").not.toBeNull();

    // OUTSIDE the no-preference block on purpose: a resting state declared
    // inside it is invisible to the visitors it exists for. Slice bounds are
    // asserted, never trusted (see declBody's note).
    const noPrefAt = engineCode.indexOf(
      "@media (prefers-reduced-motion: no-preference)",
    );
    expect(noPrefAt, "no-preference block not found").toBeGreaterThan(-1);
    const unconditional = engineCode.slice(0, noPrefAt);
    const restRule =
      /\[data-glw-shape="bloom"\]\s+\[data-glw-band\]\s*\{([^}]*)\}/.exec(
        unconditional,
      );
    expect(
      restRule,
      "the bloom band declares no resting state outside the no-preference block",
    ).not.toBeNull();
    expect(/opacity:\s*([^;]+);/.exec(restRule![1])?.[1].trim()).toBe(
      fromOpacity![1].trim(),
    );
    expect(/scale:\s*([^;]+);/.exec(restRule![1])?.[1].trim()).toBe(
      fromScale![1].trim(),
    );
  });

  it("has exactly one filter host, and the footer is now on it", () => {
    expect(engineCode).toContain("url(#glw-warp)");
    // This pin used to read `not.toContain`, because the footer ran its own
    // byte-identical copy of the turbulence under a different id. Retiring it
    // onto the engine is what round 0 was for: two engines painting one light
    // was the actual defect. What still has to hold is SINGULARITY, so assert
    // the id is declared exactly once in the repo (GlowFilter) and that the
    // old hand-rolled host is gone rather than merely renamed.
    expect(filterSrc).toContain('id="glw-warp"');
    expect(
      read("src/components/marketing/chrome/footer-glow.tsx"),
    ).not.toContain("<filter");
    expect(read("src/app/(marketing)/marketing.css")).not.toContain(
      "mkt-fglow",
    );
  });
});

/**
 * THE SINGLETON, AS OF ROUND 1 (2026-09-01). The footer stopped being the only
 * consumer, so the host moved to the root layout. Three failures are silent
 * enough to need pins: a second host reappearing (duplicate document-global
 * ids, resolved by document order, unstable under portals); the host going
 * missing entirely (every lamp left holding a dangling url(#glw-warp)); and
 * the module quietly becoming a client component, which would put glow.tsx's
 * hooks on every route in the app to render a static svg.
 */
describe("the turbulence field is a document singleton", () => {
  // Test files excluded, and not as a convenience: THIS file quotes both the
  // filter id and the <GlowFilter /> tag in its own assertions, so scanning
  // itself would report the guard as a second declaration site.
  const sources = walk(join(ROOT, "src")).filter(
    (f) =>
      (f.endsWith(".tsx") || f.endsWith(".ts")) &&
      !/\.test\.tsx?$/.test(f) &&
      !f.endsWith("vitest.setup.ts"),
  );

  it("declares the filter in exactly one module", () => {
    const declaring = sources.filter((f) =>
      readFileSync(f, "utf8").includes('id="glw-warp"'),
    );
    expect(sources.length, "no sources scanned").toBeGreaterThan(100);
    expect(declaring.map((f) => f.slice(ROOT.length + 1))).toEqual([
      "src/components/shared/glow-filter.tsx",
    ]);
  });

  it("mounts it exactly once, in the root layout", () => {
    const mounting = sources.filter((f) =>
      /<GlowFilter\s*\/>/.test(readFileSync(f, "utf8")),
    );
    expect(mounting.map((f) => f.slice(ROOT.length + 1))).toEqual([
      "src/app/layout.tsx",
    ]);
  });

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

/**
 * THE BEAM SIBLING'S ONE ENGINE-LEVEL INVARIANT.
 *
 * SPILL and BEAM are one doctrine with two mechanisms (design-system.md
 * "Light"), and the beam has exactly one knob that can go wrong the way an
 * engine defect goes wrong: silently, on somebody else's machine. `theme`
 * decides the whole opacity/saturation preset the effect is drawn at, and
 * `theme="auto"` resolves it from `prefers-color-scheme` -- the visitor's OS,
 * NOT next-themes and not the chapter the beam is sitting in. Our marketing
 * chapters force their own ground, so on a forced-dark chapter viewed from a
 * light-mode OS `auto` picks the light preset and the beam is drawn for a
 * ground it is not on. Nothing throws, and nobody developing on a dark OS ever
 * sees it.
 *
 * The vendored default happens to be 'dark' today, which is right for the one
 * production surface and wrong as a thing to rely on: it is upstream's choice,
 * a version bump can move it, and DO-NOT-RESTYLE means we would not be the ones
 * to notice. So every call site states its ground.
 *
 * Lives here rather than in border-beam-vendor.test.ts because that file guards
 * the vendored PACKAGE (its licence, its deviations, its palette) and this is a
 * rule about our call sites; it is also outside this track's claim.
 */
describe("every beam states the ground it is drawn for", () => {
  /** The opening tag at `at`, brace-aware so a `{cond ? a : b}` prop is not cut short. */
  const openingTag = (src: string, at: number): string | null => {
    let depth = 0;
    for (let i = at; i < src.length; i++) {
      const ch = src[i];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      else if (ch === ">" && depth === 0) return src.slice(at, i + 1);
    }
    return null;
  };

  // Every call site, production and lab. The vendored package declares the prop
  // and must not be scanned as a caller; test files are excluded for the same
  // reason as the singleton pins above (this one quotes `<BorderBeam` itself).
  const callSites = walk(join(ROOT, "src"))
    .filter(
      (f) =>
        f.endsWith(".tsx") &&
        !/\.test\.tsx?$/.test(f) &&
        !f.includes("/vendor/border-beam/"),
    )
    .map((f) => ({
      rel: f.slice(ROOT.length + 1),
      code: stripComments(readFileSync(f, "utf8")),
    }))
    .filter((f) => f.code.includes("<BorderBeam"));

  it("found the call sites at all", () => {
    // A pin that scans nothing passes forever. The engine's own guards were
    // caught doing exactly that twice.
    expect(callSites.map((f) => f.rel).sort()).toEqual([
      "src/app/(dev)/design/sandbox/glow-doctrine-variants.tsx",
      "src/app/(dev)/design/sandbox/glow-moments-variants.tsx",
      "src/components/marketing/sections/home/pro-card-beam.tsx",
    ]);
  });

  it("passes theme explicitly, and never 'auto'", () => {
    for (const { rel, code } of callSites) {
      let at = code.indexOf("<BorderBeam");
      expect(at, rel).toBeGreaterThan(-1);
      while (at !== -1) {
        const tag = openingTag(code, at);
        expect(tag, `${rel}: unterminated <BorderBeam tag`).not.toBeNull();
        expect(tag!, `${rel}: a beam with no theme`).toMatch(/\stheme=/);
        expect(tag!, `${rel}: a beam on the OS theme`).not.toMatch(
          /theme=\{?\s*["']auto["']/,
        );
        at = code.indexOf("<BorderBeam", at + 1);
      }
    }
  });
});
