// @contract-for: src/components/marketing/system/section-light.tsx
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE AURORA FIELD'S CONTRACT.
 *
 * Source-text pins, the footer-contract.test.ts house pattern, because every
 * failure guarded here is SILENT: no exception, no type error, and nothing
 * visibly wrong on the ground you happen to be developing on. A field that
 * freezes, a field that paints over the copy, a field lighting a white page, a
 * field parked mid-sweep for the people who asked for less motion -- all four
 * render, all four look deliberate, and none of them throws.
 *
 * It guards FUNCTION, never look: no register value, no band height and no
 * placement default is pinned here. Those are Will's to move.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const SRC = "src/components/marketing/system/section-light.tsx";
const src = read(SRC);
const code = stripComments(src);
const globals = read("src/app/globals.css");

/** Every `<Glow ... />` tag in the component, brace-aware so a spread prop or a
 *  ternary does not cut one short. */
const glowTags = (): string[] => {
  const out: string[] = [];
  let at = code.indexOf("<Glow");
  while (at !== -1) {
    let depth = 0;
    for (let i = at; i < code.length; i++) {
      const ch = code[i];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      else if (ch === ">" && depth === 0) {
        out.push(code.slice(at, i + 1));
        break;
      }
    }
    at = code.indexOf("<Glow", at + 1);
  }
  return out;
};

describe("the aurora field is the engine, mounted", () => {
  it("renders the primitive and nothing of its own", () => {
    // The whole reason this component exists is that the site was once three
    // near-identical underlight files; a fourth copy of the light itself would
    // be the same mistake one level up. It owns PLACEMENT and the register, and
    // every photon comes from the engine.
    const tags = glowTags();
    expect(tags.length, "no <Glow> mounted").toBeGreaterThan(1);
    for (const tag of tags) {
      expect(tag, "a lamp with no shape").toMatch(/\sshape=/);
    }
    // No second engine: no colour field, no keyframe, no filter of its own.
    for (const forbidden of [
      "radial-gradient",
      "linear-gradient",
      "@keyframes",
      "feTurbulence",
      "data-glw-base",
      "data-glw-band",
    ]) {
      expect(code, `${forbidden} belongs to the engine`).not.toContain(
        forbidden,
      );
    }
  });

  it("turns the bottom band rather than growing a second shape", () => {
    // Law 2 is about a VECTOR, and a vector is the caller's to turn: a bottom
    // seam is a top seam flipped on its own axis, so the engine keeps one seam.
    // A `shape="seam-bottom"` appearing in the engine is the regression this
    // names.
    expect(code).toMatch(/scale:\s*"1 -1"/);
  });

  it("never hands the lamp a className", () => {
    // Tailwind's filter and mask utilities outrank everything the engine
    // declares, so one `blur-sm` would replace `filter: url(#glw-warp)
    // blur(...)` wholesale and the turbulence would vanish with no error and
    // nothing failing. The primitive refuses the prop; this refuses the habit,
    // on the component most likely to want a wrapper class.
    for (const tag of glowTags()) {
      expect(tag, "a className on the lamp").not.toMatch(/\bclassName\b/);
    }
  });

  it("reads the slow clock from its token, never as a literal", () => {
    // ★ A LITERAL HERE DOES NOT JUST DRIFT, IT SPLITS THE PAGE'S CLOCK. The
    // field runs a MULTIPLE of the lamp cadence, so the ratio has to follow
    // --spill-cadence (and the tuner knob that writes it) rather than restate
    // a number beside it. The token is declared in globals.css for a second
    // reason the light board paid for: `vars` lands inline and outranks the
    // engine's own --glw-dur, so an UNDECLARED cadence freezes the band at a
    // lit base instead of falling back, which reads as a design choice.
    expect(code).toMatch(/"--glw-dur":\s*"var\(--aurora-cadence\)"/);
    expect(code, "a hard-coded duration").not.toMatch(/"--glw-dur":\s*"\d/);
    expect(globals).toMatch(
      /--aurora-cadence:\s*calc\(var\(--spill-cadence\) \* 3\);/,
    );
  });

  it("keeps the register in one object every lamp spreads", () => {
    // One register, declared once. Will ruled accent the global register and
    // left the numbers open, so what has to hold is that moving them is ONE
    // edit rather than a hunt through per-placement literals.
    expect(code).toMatch(/const AURORA_VARS: GlowVars = \{/);
    for (const tag of glowTags()) {
      expect(tag, "a lamp that does not take the register").toContain(
        "...AURORA_VARS",
      );
    }
  });

  it("never clips the lamp it mounts", () => {
    // glow-placement.test.ts's law, stated where it is easiest to break: the
    // blurred falloff clips to a hard rectangle inside an overflow-hidden
    // ancestor, which reads as a grey box and got the album straddle reverted.
    // This component IS the wrapper, so it must never carry the class.
    expect(code).not.toMatch(/\boverflow-hidden\b/);
    expect(code).not.toMatch(/overflow:\s*["']?hidden/);
  });

  it("puts the content after the light, in its own positioned wrapper", () => {
    // Nothing here creates a stacking context for the children, so a static
    // content wrapper lets the absolutely-positioned lamp paint OVER the H1.
    // The symptom is "the effect is too strong", and it sends you tuning
    // opacity instead of fixing the stack.
    const at = code.indexOf("{children}");
    expect(at, "nothing renders the children").toBeGreaterThan(-1);
    const tag = code.slice(code.lastIndexOf("<div", at), at);
    expect(tag, "the content wrapper is not positioned").toMatch(/relative/);
    expect(at, "the content is declared before the light").toBeGreaterThan(
      code.lastIndexOf("<Glow"),
    );
  });
});

describe("the aurora never lights a paper ground", () => {
  it("marks the LIGHT with data-section-light, never the content", () => {
    // ★ THE ATTRIBUTE IS WHAT THE FENCE HIDES. Put it on the outer wrapper and
    // `display: none` would take the chapter's own copy with it, on every paper
    // page, silently. Every occurrence must therefore sit on an aria-hidden
    // lamp box.
    const hooks = [...code.matchAll(/data-section-light/g)];
    expect(hooks.length, "nothing carries the fence's hook").toBeGreaterThan(1);
    for (const m of hooks) {
      const openTag = code.lastIndexOf("<div", m.index);
      const tag = code.slice(openTag, m.index);
      expect(tag, "data-section-light on a box that is not the light").toMatch(
        /aria-hidden/,
      );
    }
    const at = code.indexOf("{children}");
    const contentTag = code.slice(code.lastIndexOf("<div", at), at);
    expect(
      contentTag,
      "the content wrapper carries the fence's hook: paper would hide the chapter",
    ).not.toContain("data-section-light");
  });

  it("is fenced in CSS, mirroring the dark variant inverted", () => {
    // Will, 2026-09-17: "No light ground usage is a decision for now." A prop
    // or a review note cannot hold that: a chapter turns to paper a round
    // later and nobody re-reads the lamp. The selector has to be BOTH halves --
    // a paper chapter lives INSIDE a forced-dark cinema wrapper, and a cinema
    // page in an explicit-light session has no `.dark` on <html> -- which is
    // exactly what theme.css's `&:is(.dark *):not(.surface-paper *)` says.
    const strip = globals.replace(/\/\*[\s\S]*?\*\//g, "");
    const at = strip.indexOf("[data-section-light]:not(.dark *)");
    expect(at, "the light-ground fence is gone").toBeGreaterThan(-1);
    const rule = strip.slice(at, strip.indexOf("}", at));
    expect(rule).toContain(".surface-paper [data-section-light]");
    expect(rule).toMatch(/display:\s*none/);
    // Scoped to the field, never widened to the engine: the seams that already
    // ship have their own paper history and are not this fence's to unlight.
    expect(rule, "the fence must not reach every lamp").not.toMatch(
      /\.surface-paper \[data-glw\]/,
    );
  });
});

describe("the aurora rests on the engine's designed still", () => {
  it("takes the transform drive, and the drive declares where it parks", () => {
    // ★ LAW 4's REDUCED-MOTION HALF, ONE DRIVE OVER. Every engine animation
    // lives inside @media (prefers-reduced-motion: no-preference), so whatever
    // the band DECLARES is what a reduced-motion visitor sees permanently. The
    // mask drive was fixed in round 1; the transform drive had no resting
    // translate at all, which parks the comet's peak dead centre at full
    // strength -- and this component is the first shipped lamp on it, at
    // chapter scale, which is the worst place to find out.
    for (const tag of glowTags()) {
      expect(tag, "the field must take the cheap drive").toContain(
        'drive="transform"',
      );
    }
    const engine = globals
      .slice(globals.indexOf("SPILL: the light engine"))
      .replace(/\/\*[\s\S]*?\*\//g, "");
    const noPrefAt = engine.indexOf(
      "@media (prefers-reduced-motion: no-preference)",
    );
    expect(noPrefAt, "no-preference block not found").toBeGreaterThan(-1);
    const unconditional = engine.slice(0, noPrefAt);
    const at = unconditional.indexOf(
      '[data-glw-drive="transform"] [data-glw-band]',
    );
    expect(
      at,
      "the transform band declares nothing outside no-preference",
    ).toBeGreaterThan(-1);
    const rest = /translate:\s*([^;]+);/.exec(
      unconditional.slice(at, unconditional.indexOf("}", at)),
    );
    expect(rest, "the transform band has no resting translate").not.toBeNull();
    // ...and it is the animation's own from-keyframe, so the animated path is
    // unchanged down to the frame and only the still moves.
    const from = engine.match(
      /@keyframes glw-drift-x\s*\{\s*from\s*\{\s*translate:\s*([^;]+);/,
    );
    expect(from, "glw-drift-x from-keyframe not found").not.toBeNull();
    expect(rest![1].trim()).toBe(from![1].trim());
  });
});

/**
 * THE PLACEMENT LAW (Will, 2026-09-17, asked which of the four placements the
 * site takes): "I think we go with a mix of all of them. The Aurora infusion
 * into our site identity should feel custom and bespoke, not a couple of
 * identity components reused everywhere in the same way constantly."
 *
 * What a test can hold of that is the part that fails silently: a default
 * creeping back (every new call site then looks like the last one without
 * anybody choosing it), and one page stamping the same composition twice.
 * Which composition a section takes is Will's and the call site's, never this
 * file's.
 */
describe("the aurora is composed for the place", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = join(dir, name);
      return statSync(full).isDirectory() ? walk(full) : [full];
    });

  /** Every production `<SectionLight ...>` opening tag, by the folder it lives in. */
  const mounts = walk(join(ROOT, "src/components"))
    .filter((f) => f.endsWith(".tsx") && !f.endsWith("section-light.tsx"))
    .flatMap((f) => {
      const text = stripComments(read(f.slice(ROOT.length + 1)));
      return [...text.matchAll(/<SectionLight\b[^>]*>/g)].map((m) => ({
        page: f.slice(ROOT.length + 1).split("/").slice(0, -1).join("/"),
        tag: m[0].replace(/\s+/g, " "),
      }));
    });

  it("found the call sites at all", () => {
    // A pin that scans nothing passes forever.
    expect(mounts.length, "no production mount found").toBeGreaterThan(1);
  });

  it("has no default placement to reach for", () => {
    expect(code, "a default placement crept back").not.toMatch(
      /placement\s*=\s*"/,
    );
    for (const { tag } of mounts) {
      expect(tag, "a mount that names no placement").toMatch(/\splacement=/);
    }
  });

  it("never stamps one composition twice on a page", () => {
    const seen = new Map<string, string>();
    for (const { page, tag } of mounts) {
      const key = `${page} :: ${tag}`;
      expect(seen.has(key), `${page} repeats ${tag}`).toBe(false);
      seen.set(key, tag);
    }
  });
});
