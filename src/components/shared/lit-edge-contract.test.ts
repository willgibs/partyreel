// @contract-for: src/components/shared/masonry.tsx
// @contract-for: src/components/marketing/sections/shared/inline-reel-player.tsx
// @contract-for: src/components/marketing/frames/reel-frame.tsx
// @contract-for: src/components/marketing/frames/gallery-frame.tsx
// @contract-for: src/components/marketing/frames/phone-frame.tsx
// @contract-for: src/components/marketing/frames/qr-frame.tsx
// @contract-for: src/components/marketing/frames/live-qr.tsx
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * THE BRIGHT EDGE'S CONTRACT: `data-lit` (the light board's face ruling, Will,
 * 2026-09-17; the rule and its reasons are at [data-lit] in src/app/globals.css).
 *
 * ★ EVERY FAILURE THIS GUARDS IS SILENT, AND TWO OF THEM ALREADY HAPPENED. The
 * board's round seven painted the edge UNDER the photograph it was meant to
 * edge (an inset box-shadow sits below an element's children), so its "with
 * it" picture was its "as today" picture to the pixel, and the review came back
 * "Genuinely cannot see it in action here". Round eight put it on a wrapper
 * with a hand-typed radius, and the review came back "The transparent border
 * radius also revealed some mismatches". Neither threw, neither failed a type
 * check, and neither looked wrong in the source. So the source is the contract.
 *
 * FUNCTION ONLY. Nothing here reads an alpha, a gradient stop or a colour: Will
 * retunes how the edge LOOKS without asking a test. What is held is where the
 * hook may sit, what the rule may be made of, and the one ground it exists on.
 *
 * THE HEADER NAMES SEVEN HOSTS, THE TABLE BELOW HOLDS ALL THIRTEEN. A
 * `@contract-for` line puts this contract on that component's block in the
 * Library, which is right for the seven that live in the Library's own
 * directories. The other six (the guest's upload tiles, the event card, the
 * dashboard arrivals strip, the reel's poster card, the canvas player, the
 * /features/qr hero) are product files the index does not list:
 * naming them would pull each one into it, where each then owes a `for` line
 * and the gallery's event-card entry has to drop its `file`. They are bound by
 * exactly the same assertions; they are just not advertised twice.
 *
 * ★ THE GUEST'S IN-FLIGHT TILES ARE IN THE TABLE, AND THE GUEST MASONRY IS NOT
 * ANY MORE (the `guest-upload` wiring, 2026-09-21). Its landed tiles have come
 * from `shared/masonry.tsx` since the two albums became one, and `batch=one` +
 * `held=tile` moved the last two boxes it drew itself into
 * `guest/upload/stack-tile.tsx` — the stack a pick in flight collapses into, and
 * the tile a held upload waits on. Both keep the hook, which is the whole reason
 * they are named here: a photograph must not gain or lose an edge at the moment
 * it finishes uploading, and the only way to hold that is to bind every one of
 * those boxes to one rule.
 */
const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

/**
 * THE THREE KINDS OF SURFACE, AND EVERY HOST BY NAME. The ruling is "a photo, a
 * player, the QR card" plus the framed screens the board drew them in; a fourth
 * kind is a design decision, not a refactor, so a `data-lit` anywhere else in
 * production fails here until somebody adds the file WITH its kind. A card, a
 * menu and a button already have their step and their ring, and an edge on
 * those is a third outline: that is why the list is closed.
 */
type Kind = "media" | "screen" | "qr";
const HOSTS: Record<string, Kind> = {
  "src/components/shared/masonry.tsx": "media",
  "src/components/guest/upload/stack-tile.tsx": "media",
  "src/components/app/event-card.tsx": "media",
  "src/components/app/dashboard/just-arrived.tsx": "media",
  "src/components/reel/poster-card.tsx": "media",
  "src/lib/reel/engine/player.tsx": "media",
  "src/components/marketing/sections/shared/inline-reel-player.tsx": "media",
  "src/components/marketing/frames/reel-frame.tsx": "media",
  "src/components/marketing/frames/gallery-frame.tsx": "media",
  "src/components/marketing/frames/phone-frame.tsx": "screen",
  "src/components/marketing/frames/qr-frame.tsx": "qr",
  "src/components/marketing/frames/live-qr.tsx": "qr",
  "src/components/marketing/sections/features/qr/qr-hero.tsx": "qr",
};

/** Not production surfaces (the same fence the elevation policy uses): the lab
 *  draws the hook on purpose, and its two glow boards still carry a lab-local
 *  rule of the same name. */
const OUTSIDE = [
  "src/app/(dev)/",
  "src/components/dev/",
  "src/components/lab/",
  "src/components/vendor/",
];

type Host = {
  file: string;
  value: string | null;
  /** The element's `className` attribute, as source text. */
  className: string;
  /** The element's `style` attribute, as source text. */
  style: string;
};

/** Every JSX element in a file that carries `data-lit`, with its opening tag. */
function hostsIn(rel: string): Host[] {
  const source = ts.createSourceFile(
    rel,
    read(rel),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const found: Host[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxAttribute(node) && node.name.getText(source) === "data-lit") {
      const init = node.initializer;
      // A bare `data-lit` renders "true", which `[data-lit="border"]` and the
      // host table below would both misread, so only a string literal counts:
      // written plainly, in braces, or as the lit arm of `cond ? "" : undefined`
      // (a surface that is lit in one of its states, the poster card's still).
      const literal = (e: ts.Expression | undefined): string | null =>
        !e
          ? null
          : ts.isStringLiteral(e)
            ? e.text
            : ts.isConditionalExpression(e) &&
                e.whenFalse.getText(source) === "undefined"
              ? literal(e.whenTrue)
              : null;
      const value =
        init && ts.isStringLiteral(init)
          ? init.text
          : init && ts.isJsxExpression(init)
            ? literal(init.expression)
            : null;
      // The hook's siblings on the same element. Read attribute by attribute
      // and never as one string: the hook's own value is the word "border".
      const sibling = (name: string) =>
        node.parent.properties
          .find(
            (p): p is ts.JsxAttribute =>
              ts.isJsxAttribute(p) && p.name.getText(source) === name,
          )
          ?.initializer?.getText(source) ?? "";
      found.push({
        file: rel,
        value,
        className: sibling("className"),
        style: sibling("style"),
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

const production = readdirSync(join(ROOT, "src"), { recursive: true })
  .map((f) => `src/${String(f)}`)
  .filter(
    (f) =>
      f.endsWith(".tsx") &&
      !/\.test\.tsx$/.test(f) &&
      !OUTSIDE.some((dir) => f.startsWith(dir)),
  );

const hosts = production
  .filter((f) => read(f).includes("data-lit"))
  .flatMap(hostsIn);

/** The class tokens inside a className's string literals (it may be a plain
 *  string, a `cn(...)` call or a template). Comments go first: a why-comment
 *  inside `cn()` says "border" and "rounded" in plain English. */
const classes = (className: string) =>
  [
    ...className
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
      .matchAll(/(["'`])((?:(?!\1)[^\\]|\\.)*)\1/g),
  ].flatMap((m) => m[2].split(/\s+/).filter(Boolean));

/** A utility that gives an element a border WIDTH (not a colour or a style). */
const BORDER_WIDTH = /^border(?:-[xytrbles])?(?:-(?:\d+|\[\d[^\]]*\]))?$/;
/** Tailwind's plain 1px border, which is the width the rule pushes out by. */
const ONE_PX_BORDER = /^border$/;
const CLIPS = /^overflow-(?:hidden|clip|auto|scroll|x-hidden|y-hidden)$/;

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
  it("sits on the three kinds of surface, every host named, and nowhere else", () => {
    expect(hosts.length).toBeGreaterThan(0);
    const found = [...new Set(hosts.map((h) => h.file))].sort();
    expect(
      found,
      "a lit surface the contract does not know (add it to HOSTS with its kind and to the header), or a host that lost its hook",
    ).toEqual(Object.keys(HOSTS).sort());
    for (const h of hosts) {
      expect(
        h.value === "" || h.value === "border",
        `${h.file}: data-lit takes "" or "border" as a string literal`,
      ).toBe(true);
    }
  });

  it("sits on the box that owns the radius, never on a wrapper", () => {
    // The edge inherits its corner from whatever carries the hook. On a box
    // with no radius of its own it draws a square rim round a rounded picture,
    // which is the mismatch Will caught. (event-card.tsx is the standing trap:
    // its outer wrapper is the one with data-media-tile, and it is square.)
    for (const h of hosts) {
      const rounded =
        classes(h.className).some((c) => /(^|:)rounded(-|$)/.test(c)) ||
        /borderRadius/.test(h.style);
      expect(rounded, `${h.file}: the lit element declares no radius`).toBe(
        true,
      );
    }
  });

  it("lands on a bordered surface's own border, which must be 1px and must not clip", () => {
    // `overflow: hidden` clips at the PADDING box, exactly where a border ends,
    // so on a clipping host the edge is drawn on the border and then cut off
    // to the pixel, with nothing to see in the source.
    for (const h of hosts) {
      const tokens = classes(h.className);
      const widths = tokens.filter((c) => BORDER_WIDTH.test(c));
      if (h.value === "border") {
        expect(
          widths.length === 1 && ONE_PX_BORDER.test(widths[0]),
          `${h.file}: data-lit="border" needs Tailwind's plain 1px \`border\` (found: ${widths.join(" ") || "none"})`,
        ).toBe(true);
        expect(
          tokens.filter((c) => CLIPS.test(c)),
          `${h.file}: a bordered lit surface must not clip; round or clip the child instead`,
        ).toEqual([]);
      } else {
        expect(
          widths,
          `${h.file}: this surface wears a border, so the hook is data-lit="border"`,
        ).toEqual([]);
      }
    }
  });

  it("pushes the edge out by the border's width, reset on every host", () => {
    // CSS cannot read a border's width from a pseudo-element, so the value
    // rides a custom property. It INHERITS, so it is reset on every host: a
    // photograph inside a lit phone must not take the bezel's width. The 1px
    // is Tailwind's `border`, the same fact the test above holds on the hosts.
    const base = litRules.find(
      (r) => r.selector === "[data-lit]" && r.body.includes("--lit-border"),
    );
    const bordered = litRules.find((r) => r.selector === '[data-lit="border"]');
    expect(base?.body).toMatch(/--lit-border:\s*0px\s*;/);
    expect(bordered?.body).toMatch(/--lit-border:\s*1px\s*;/);
    // Equal specificity, so the reset has to come first or it wins.
    expect(css.indexOf('[data-lit="border"] {')).toBeGreaterThan(
      css.indexOf("--lit-border: 0px"),
    );
  });

  it("is drawn by a pseudo-element above the image, with the host's own corner, and never takes a tap", () => {
    const rule = generating.after;
    expect(rule, "the generating rule is missing").toMatch(/content\s*:/);
    // Exactly one rule generates it: a second `content` is a second edge.
    expect(
      litRules.flatMap((r) => r.body.match(/(^|[\s;{])content\s*:/g) ?? []),
    ).toHaveLength(1);
    expect(rule).toMatch(/position:\s*absolute\s*;/);
    expect(rule).toMatch(/inset:\s*calc\(-1 \* var\(--lit-border\)\)\s*;/);
    expect(rule).toMatch(/pointer-events:\s*none\s*;/);
    // Inherited, never typed: one radius declaration, and it says `inherit`.
    expect(rule.match(/border-radius\s*:/g)).toHaveLength(1);
    expect(rule).toMatch(/border-radius:\s*inherit\s*;/);
    // Never the element's own shadow: an inset box-shadow paints BELOW the
    // element's children, and a media tile's child is its photograph.
    for (const r of litRules) {
      expect(r.body, `${r.selector} sets a box-shadow`).not.toMatch(
        /box-shadow\s*:/,
      );
    }
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

  it("exists on dark grounds only, through the one definition of dark", () => {
    // Absent on paper BY CONSTRUCTION: the rule that generates the edge sits
    // inside `@variant dark`, which compiles through theme.css's single
    // definition, so there is no second fence to drift and no pseudo-element
    // on a light ground at all (a gallery can hold hundreds of photographs).
    expect(
      generating.after,
      "the generating rule left `@variant dark`",
    ).toMatch(/content\s*:/);
    expect(read("src/app/theme.css")).toContain(
      "@custom-variant dark (&:is(.dark *):not(.surface-paper *));",
    );
    // ...and absent under nothing else. The only other thing that may switch
    // it off is the environment (forced colours, a printed sheet), never a
    // state, a hover or a second ground rule.
    const hiding = litRules.filter((r) => /display\s*:\s*none/.test(r.body));
    expect(hiding.map((r) => r.selector)).toEqual(["[data-lit]::after"]);
    expect(css).toMatch(
      /@media \(forced-colors: active\), print\s*\{\s*\[data-lit\]::after\s*\{\s*display:\s*none;/,
    );
  });
});
