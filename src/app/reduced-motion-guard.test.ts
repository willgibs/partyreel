import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE REDUCED-MOTION GUARD CLAMPS WHAT DECLARES A TRANSITION AND CREATES NONE (crumbs-25, from `lab-focus`).
 *
 * `globals.css` clamps every duration to 0.01ms under `prefers-reduced-motion: reduce` (never 0: radix's
 * exit-unmount and the lightbox's settle wait on `transitionend`/`animationend`, which a zero duration never
 * fires). It once did that with the duration alone, and `transition-property` is `all` by default, so every
 * style a script wrote to an element became a transition: a size read in the same task as its write was the
 * old one (measured in headless Chrome 154: `el.style.width = "300px"` then `el.offsetWidth` read the old
 * width under the guard and the new one without it). The lab's stage fitted four phones stacked at 11% on
 * it, and any production measurer that writes then reads was open to the same.
 *
 * The guard's shape is now what keeps that away, and jsdom has no transitions, no `prefers-reduced-motion`
 * and no cascade layers to run it against, so this reads the sheet:
 *  - the default property is `none`, and NOT `!important`: a transition a component declares (a utility, a
 *    sheet, an inline style) outranks it and keeps its own property, clamped by the duration below, so its
 *    `transitionend` still fires; one that declares none gets none, as it does with motion allowed. An
 *    `!important` `none` would take the declared ones away, and `all` (or nothing) is the bug;
 *  - it sits in `@layer base`, where a declared transition in any later layer or outside every layer wins;
 *  - the durations stay 0.01ms and `!important`, never 0.
 * (A real browser proves the rest: the stale read is gone on a plain element, a declared transition still
 * ends, and the lab's stage fits as it did with its own exemption, which went: `design.css`.)
 */

const globals = readFileSync(
  join(process.cwd(), "src/app/globals.css"),
  "utf8",
);

/** The text between the `{` that follows `from` and its matching `}`, and where the block starts. */
function blockAfter(
  text: string,
  from: number,
): { body: string; open: number } {
  const open = text.indexOf("{", from);
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "{") depth++;
    if (text[i] === "}" && --depth === 0)
      return { body: text.slice(open + 1, i), open };
  }
  throw new Error("an unclosed block");
}

/** `name: value` declarations of a rule body (comments dropped), with whether each is `!important`. */
function declarations(body: string) {
  const out = new Map<string, { value: string; important: boolean }>();
  const clean = body.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const [, name, raw] of clean.matchAll(/([a-z-]+)\s*:\s*([^;{}]+);/g)) {
    const important = /!important\s*$/.test(raw);
    out.set(name, {
      value: raw.replace(/!important\s*$/, "").trim(),
      important,
    });
  }
  return out;
}

/** The guard: `@layer base { @media (prefers-reduced-motion: reduce) { *, ::before, ::after { ... } } }`. */
function guard(text: string) {
  const at = text.indexOf("GLOBAL REDUCED-MOTION GUARD");
  if (at < 0) throw new Error("the guard's comment is missing");
  const layerAt = text.indexOf("@layer", at);
  const layerHead = text.slice(layerAt, text.indexOf("{", layerAt)).trim();
  const layer = blockAfter(text, layerAt);
  const mediaAt = layer.body.indexOf("@media");
  const mediaHead = layer.body
    .slice(mediaAt, layer.body.indexOf("{", mediaAt))
    .trim();
  const media = blockAfter(layer.body, mediaAt);
  const ruleHead = media.body.slice(0, media.body.indexOf("{")).trim();
  const rule = blockAfter(media.body, 0);
  return { layerHead, mediaHead, ruleHead, decls: declarations(rule.body) };
}

describe("the reduced-motion guard", () => {
  const g = guard(globals);

  it("is a universal rule in the base layer, under reduced motion", () => {
    expect(g.layerHead).toBe("@layer base");
    expect(g.mediaHead).toBe("@media (prefers-reduced-motion: reduce)");
    expect(g.ruleHead.split(/\s*,\s*/).sort()).toEqual([
      "*",
      "::after",
      "::before",
    ]);
  });

  it("clamps every duration to 0.01ms, never 0, over any declaration", () => {
    for (const property of ["animation-duration", "transition-duration"]) {
      expect(g.decls.get(property), property).toEqual({
        value: "0.01ms",
        important: true,
      });
    }
    expect(g.decls.get("animation-iteration-count")).toEqual({
      value: "1",
      important: true,
    });
  });

  it("★ creates no transition where none is declared: the default property is none, and yields to a declared one", () => {
    const property = g.decls.get("transition-property");
    expect(
      property,
      "the guard leaves `transition-property` at `all`, so every style a script writes is a transition and a size read in the same task is the old one",
    ).toBeDefined();
    expect(property!.value).toBe("none");
    expect(
      property!.important,
      "an !important `none` would take away every transition a component declares, and with it the transitionend its exit waits on",
    ).toBe(false);
  });
});

describe("the scan itself", () => {
  const sample = (body: string) =>
    `/* GLOBAL REDUCED-MOTION GUARD. */\n@layer base {\n  @media (prefers-reduced-motion: reduce) {\n    *,\n    ::before,\n    ::after {\n${body}\n    }\n  }\n}\n`;

  it("reads the property, its value and whether it is important", () => {
    const g = guard(
      sample(
        "      transition-duration: 0.01ms !important;\n      transition-property: none;",
      ),
    );
    expect(g.decls.get("transition-duration")).toEqual({
      value: "0.01ms",
      important: true,
    });
    expect(g.decls.get("transition-property")).toEqual({
      value: "none",
      important: false,
    });
  });

  it("sees a guard that leaves the property alone, or forces it", () => {
    expect(
      guard(sample("      transition-duration: 0.01ms !important;")).decls.has(
        "transition-property",
      ),
    ).toBe(false);
    expect(
      guard(sample("      transition-property: none !important;")).decls.get(
        "transition-property",
      )?.important,
    ).toBe(true);
  });

  it("ignores a comment's own colons and semicolons", () => {
    const g = guard(
      sample(
        "      /* transition-property: all; */\n      transition-duration: 0.01ms !important;",
      ),
    );
    expect(g.decls.has("transition-property")).toBe(false);
  });
});
