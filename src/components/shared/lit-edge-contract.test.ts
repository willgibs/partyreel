import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE BRIGHT EDGE'S MECHANISMS: `data-lit` (the rule is at [data-lit] in
 * src/app/globals.css). Where the edge sits and how it looks are shown in the
 * brand kit and tuned freely; what is held here is what would break something
 * else: the pseudo-element that draws the edge sits over a photograph and must
 * never take a tap, the host becomes a containing block without overriding a
 * layout's own positioning, and forced colours and print drop the edge.
 */
const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

/* ── globals.css, with its comments gone (they quote the old selectors) ─── */
const css = read("src/app/globals.css").replace(/\/\*[\s\S]*?\*\//g, "");

/** The body of the block that starts at `open` (the index of its `{`). */
function body(text: string, open: number): string {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}" && --depth === 0) return text.slice(open + 1, i);
  }
  throw new Error("unbalanced braces in globals.css");
}

/** Every rule whose selector mentions [data-lit], with its whole body (the
 *  generating rule nests `@variant dark` and `&::after` inside one of them). */
const litRules = [...css.matchAll(/([^{};]*\[data-lit[^{};]*)\{/g)].map(
  (m) => ({
    selector: m[1].trim().replace(/\s+/g, " "),
    body: body(css, m.index + m[0].length - 1),
  }),
);

/** The one rule that GENERATES the edge: `&::after` inside `@variant dark`
 *  inside a `[data-lit]` rule. Empty strings when the nesting is broken. */
const generating = (() => {
  const host = litRules.find(
    (r) => r.selector === "[data-lit]" && r.body.includes("@variant dark"),
  );
  if (!host) return { dark: "", after: "" };
  const at = host.body.indexOf("@variant dark");
  const dark = body(host.body, host.body.indexOf("{", at));
  const nested = dark.indexOf("&::after");
  return {
    dark,
    after: nested < 0 ? "" : body(dark, dark.indexOf("{", nested)),
  };
})();

describe("the bright edge: data-lit", () => {
  it("draws the edge with one pseudo-element that never takes a tap", () => {
    const rule = generating.after;
    expect(rule, "the generating rule is missing").toMatch(/content\s*:/);
    // It sits above the photograph it edges, so a tap must pass through it.
    expect(rule).toMatch(/pointer-events:\s*none\s*;/);
  });

  it("makes the host a containing block without taking over its positioning", () => {
    // `position: relative` in @layer base: a host that is `absolute` or
    // `sticky` by utility keeps that (utilities outrank base), and one that is
    // not positioned cannot let the edge escape and ring an ancestor.
    const layers = [...css.matchAll(/@layer base\s*\{/g)].map((m) =>
      body(css, m.index + m[0].length - 1),
    );
    expect(
      layers.some((l) =>
        /\[data-lit\]\s*\{\s*position:\s*relative\s*;\s*\}/.test(l),
      ),
    ).toBe(true);
  });

  it("drops the edge under forced colours and in print", () => {
    expect(css).toMatch(
      /@media \(forced-colors: active\), print\s*\{\s*\[data-lit\]::after\s*\{\s*display:\s*none;/,
    );
  });
});
