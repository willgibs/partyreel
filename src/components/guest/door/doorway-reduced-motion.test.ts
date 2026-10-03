import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ★ UNDER REDUCED MOTION THE DOOR LEAVES AS A FADE, NEVER A CUT (door-reveal's promise; red-team 44's LOW: it cut).
 *
 * `globals.css`'s guard clamps every transition to 0.01ms under `prefers-reduced-motion: reduce` with an `!important`
 * in `@layer base` (`reduced-motion-guard.test.ts`). An important declaration reverses the layers' order: one in an
 * earlier layer beats one in a later layer and one outside every layer. So the door's 200ms fade, declared plainly in
 * `@layer components`, lost to the guard's 0.01ms, and the stage went in a frame. It survives only where the guard
 * stands, `@layer base`, as `!important`, with a selector that out-specifies the guard's `*`.
 *
 * jsdom has no cascade layers, no transitions and no `prefers-reduced-motion`, so this reads the sheets (as the guard's
 * own test does); a real browser under `--force-prefers-reduced-motion` measures the fade.
 */

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const doorway = read("src/components/guest/door/doorway.css");
const globals = read("src/app/globals.css");

/** The text between the `{` that follows `from` and its matching `}`. */
function blockAfter(text: string, from: number): string {
  const open = text.indexOf("{", from);
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "{") depth++;
    if (text[i] === "}" && --depth === 0) return text.slice(open + 1, i);
  }
  throw new Error("an unclosed block");
}

const uncomment = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/**
 * Every rule in `css` (its selector and body), with the layer and the media query it stands in: a small walk of the
 * sheet's blocks, enough for these two sheets' shapes.
 */
function rules(css: string) {
  const text = uncomment(css);
  const out: {
    selector: string;
    body: string;
    layer: string | null;
    media: string | null;
  }[] = [];
  const walk = (body: string, layer: string | null, media: string | null) => {
    let i = 0;
    while (i < body.length) {
      const open = body.indexOf("{", i);
      if (open < 0) break;
      const head = body.slice(i, open).trim().split(/;\s*/).pop()!.trim();
      const inner = blockAfter(body, open);
      const end = open + inner.length + 2;
      if (head.startsWith("@layer")) walk(inner, head.slice(6).trim(), media);
      else if (head.startsWith("@media")) walk(inner, layer, head);
      else if (!head.startsWith("@"))
        out.push({ selector: head, body: inner, layer, media });
      i = end;
    }
  };
  walk(text, null, null);
  return out;
}

/** Specificity of a simple compound selector made of attributes, classes and type: [ids, classes+attrs, types]. */
function specificity(selector: string): [number, number, number] {
  if (selector === "*" || selector.startsWith("::")) {
    return [0, 0, selector.startsWith("::") ? 1 : 0];
  }
  const ids = (selector.match(/#[\w-]+/g) ?? []).length;
  const attrs = (selector.match(/\[[^\]]+\]|\.[\w-]+|:(?!:)[\w-]+/g) ?? [])
    .length;
  const types = (selector.match(/(^|[\s>+~])[a-z][\w-]*/g) ?? []).length;
  return [ids, attrs, types];
}

const outranks = (a: [number, number, number], b: [number, number, number]) =>
  a[0] !== b[0] ? a[0] > b[0] : a[1] !== b[1] ? a[1] > b[1] : a[2] > b[2];

const REDUCE = "@media (prefers-reduced-motion: reduce)";
const CLOSED = '[data-door-stage][data-state="closed"]';

describe("the door's reduced-motion fade, against the global guard", () => {
  const guard = rules(globals).find(
    (r) => r.media === REDUCE && r.selector.split(/\s*,\s*/).includes("*"),
  );
  const fade = rules(doorway).find(
    (r) =>
      r.media === REDUCE && r.selector === CLOSED && /transition/.test(r.body),
  );

  it("reads the guard where it stands: `@layer base`, an !important 0.01ms on every element", () => {
    expect(guard?.layer).toBe("base");
    expect(guard?.body).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
  });

  it("★ stands in the guard's own layer, so its !important is not outranked by the layer order", () => {
    expect(fade, "the stage's reduced-motion fade is gone").toBeDefined();
    expect(
      fade!.layer,
      "an !important in a later layer, or outside every layer, loses to the guard's in `@layer base`",
    ).toBe("base");
  });

  it("★ fades for 200ms, !important, under a selector that out-specifies the guard's", () => {
    const transition = fade!.body.match(/transition\s*:\s*([^;]+);/)?.[1] ?? "";
    expect(transition).toMatch(/opacity 200ms/);
    expect(transition).toMatch(/visibility 0s linear 200ms/);
    expect(transition.trim()).toMatch(/!important$/);
    expect(outranks(specificity(fade!.selector), specificity("*"))).toBe(true);
  });
});
