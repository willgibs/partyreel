import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE AURORA FIELD'S MECHANISMS. Source-text pins, the footer-contract.test.ts
 * house pattern, because each failure here is SILENT: a second light engine
 * beside the one in globals.css, a field that paints over the copy, a fence
 * that hides the chapter's own words on paper, a field on the expensive drive.
 * How the field looks (its register, its placement, its clock) is the brand
 * kit's to show and tuned freely.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const SRC = "src/components/marketing/system/section-light.tsx";
const src = read(SRC);
const code = stripComments(src);

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
    // Light has a direction, and a direction is the caller's to turn: a bottom
    // seam is a top seam flipped on its own axis, so the engine keeps one seam
    // shape rather than growing a `seam-bottom`.
    expect(code).toMatch(/scale:\s*"1 -1"/);
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

  it("takes the transform drive, the one the compositor can run", () => {
    // A mask-position drive repaints the band every frame; a translate stays
    // on the compositor, which matters at chapter scale.
    for (const tag of glowTags()) {
      expect(tag, "the field must take the cheap drive").toContain(
        'drive="transform"',
      );
    }
  });
});

describe("the aurora keeps the copy visible", () => {
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
});
