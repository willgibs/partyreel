// @policy: engineering · One type ladder, and every heading on it
// @refuses: a step or radius token theme.css and cn() disagree on, a step name the color namespace already owns, a heading ramp coming back, a paper stack out of order at either end, and a stock, arbitrary or inline size on a heading.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { cn, RADIUS_TOKENS, TYPE_STEPS } from "@/lib/utils";

/**
 * THE LADDER FAILS SILENTLY IN FIVE WAYS, AND THIS IS ALL FIVE (the type
 * wirings, Will's rulings 2026-09-17 and 2026-09-18).
 *
 * 1. A NAME THE COLOR NAMESPACE ALREADY OWNS. Tailwind v4 resolves a `text-*`
 *    class as a COLOR before a font size, so `--text-card` beside the
 *    long-standing `--color-card` would have been a token no className could
 *    ever reach. That is why the card step ships as `card-title`. Nothing tells
 *    you: the class simply paints the text the card colour.
 *
 * 2. A STEP `cn()` HAS NEVER HEARD OF. tailwind-merge does not read our
 *    stylesheet, so an unknown `text-*` falls into its `text-color` group and
 *    is dropped by any real colour in the same call: `cn("font-heading
 *    text-chapter text-white")` returned `font-heading text-white` until
 *    utils.ts declared the ladder. Measured on the blog list's own h2. The
 *    corner ladder's custom tokens (`tile`, `float`, `action`) are the same
 *    trap one room over: unknown to tailwind-merge, a token corner and a stock
 *    one both survived `cn()` and the stylesheet's alphabet picked, so their
 *    parity is pinned here too.
 *
 * 3. A RAMP COMING BACK. The four-breakpoint ramps are what the ladder
 *    replaced (a step is a pair, not a list of sizes). A stock pair like
 *    `text-xl sm:text-2xl` also JUMPS at 640 where a clamp does not, which let
 *    a sub-head out-shout its own h2 from 640 to 775 as well as at a phone.
 *
 * 4. THE ORDER BREAKING AT ONE END. The first wiring moved every marketing
 *    step four rungs, which put the paper h2 (`prose`, 18) under its own
 *    sub-head (20) at 375 while 1440 looked right, so nobody reviewing a
 *    desktop saw it. Will: "We should have a very clear heading hierarchy on
 *    mobile as well." The law is the ORDER now, read off the tokens here.
 *
 * 5. A HEADING OFF THE LADDER. "We really shouldn't have any one-off adding
 *    instances. Everything should be addressed in our design system type
 *    ladder" (Will, 2026-09-18). A stock size (`text-xs` to `text-9xl`) or an
 *    arbitrary one (`text-[22px]`) on a heading tag, a `*Title` / `*Heading`
 *    component or any element in the heading face is a one-off by definition.
 *    The scan found 126 when this landed; every one that is a heading moved
 *    onto the step its role calls for, and the rest are named below.
 *    `elevation-policy.test.ts`'s refusal of stock shadows is the precedent,
 *    and its allow-list's rule is this one's: every exception by name, with a
 *    reason that survives being read aloud.
 *
 * The ladder's NUMBERS are not pinned here, and never should be: a contract
 * guards function, never a look, and Will retunes a step without asking a test.
 * The ORDER is function (it is what broke), so it is pinned, and it passes for
 * any retune that keeps a heading above the one it heads.
 */
const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const theme = read("src/app/theme.css");

/**
 * Every `--text-<name>` declared in theme.css. The `--` filter drops the
 * companions: `--text-display--line-height` captures as `display--line-height`,
 * and a companion is not a step.
 */
const declared = [...theme.matchAll(/^\s*--text-([a-z0-9-]+):\s/gm)]
  .map((m) => m[1])
  .filter((name) => !name.includes("--"));

/**
 * A step's two ends in rem, read off its token. A clamp built through (375,
 * phone) and (1440, desktop) pins to its floor at 375 and its ceiling at 1440,
 * so the floor and the ceiling ARE the two ends (the Library reads them the
 * same way); a flat token is one value at both.
 */
function ends(step: string): [number, number] {
  const m = new RegExp(`^\\s*--text-${step}:\\s*([^;]+);`, "m").exec(theme);
  if (!m) throw new Error(`--text-${step} is not declared`);
  const rems = [...m[1].matchAll(/(-?[\d.]+)rem/g)].map((r) => Number(r[1]));
  if (!m[1].startsWith("clamp(")) return [rems[0], rems[0]];
  return [rems[0], rems[rems.length - 1]];
}

/* ─────────────────────── the heading scan (way 5) ─────────────────────── */

/** Not production surfaces: the lab, its kit, the key-gated tuner, vendored code. */
const OUTSIDE = [
  "src/app/(dev)/",
  "src/components/dev/",
  "src/components/lab/",
  "src/components/vendor/",
];

type Exception = {
  /**
   * `depicted`: every heading-face element in the file is type DRAWN inside a
   * picture (a device, a screen, a printed sign, an asset plate, an emblem),
   * sized by the picture rather than by the page. A picture of a heading is
   * not a heading, and a viewport clamp would size it by the wrong box.
   * `label`: a heading TAG set in Inter as a small label, there for the
   * document outline; design-system.md's one written exception. Only a heading
   * tag NOT wearing the heading face is excused, so a real heading in the same
   * file is still held.
   * `unstyled`: renders where no stylesheet exists, so an inline size is the
   * only size it can have.
   */
  kind: "depicted" | "label" | "unstyled";
  /** Exactly how many elements the exception excuses in the file: a hole that
   *  grows (or a fix that leaves the count stale) fails the gate. */
  count: number;
  why: string;
};

/**
 * THE ALLOW-LIST. Short on purpose; an entry added to make a red gate green,
 * without a reason that would survive being read aloud, is the regression this
 * file exists to stop.
 */
const EXCEPTIONS: Record<string, Exception> = {
  // ── depicted: type drawn inside a picture ──
  "src/components/marketing/sections/features/album/entry-phone.tsx": {
    kind: "depicted",
    count: 3,
    why: "the guest entry sheet and the album, drawn inside a phone at reduced scale",
  },
  "src/components/marketing/sections/features/album/visibility-frames.tsx": {
    kind: "depicted",
    count: 2,
    why: "the private-album gate drawn inside two album frames (each cell's caption title is a real heading, on the ladder)",
  },
  "src/components/marketing/sections/features/privacy/access-switch.tsx": {
    kind: "depicted",
    count: 2,
    why: "the password gate and the private lock drawn over a pictured album",
  },
  "src/components/marketing/sections/features/guests/profiles-section.tsx": {
    kind: "depicted",
    count: 2,
    why: "a guest's profile card drawn beside the copy (aria-hidden); the section h2 is on the ladder",
  },
  "src/components/marketing/sections/features/qr/entry-flow.tsx": {
    kind: "depicted",
    count: 1,
    why: "the entry modal's resting state drawn as a card, word for word",
  },
  "src/components/marketing/sections/features/qr/print-shop.tsx": {
    kind: "depicted",
    count: 2,
    why: "a printed welcome sign and table card (aria-hidden): type on a pictured print",
  },
  "src/components/marketing/press/press-sheet.tsx": {
    kind: "depicted",
    count: 1,
    why: "the typeface's asset plate in the press kit: a picture of the face, sized to its plate like the marks beside it",
  },
  "src/components/marketing/help/help-emblems.tsx": {
    kind: "depicted",
    count: 1,
    why: "the troubleshooting emblem's question mark, a glyph drawn inside a 26px pictogram",
  },
  // ── label: an Inter label inside a heading tag (design-system.md) ──
  "src/app/admin/metrics/page.tsx": {
    kind: "label",
    count: 1,
    why: "the admin metric band's 14px label (the event feed header's cousin)",
  },
  "src/app/admin/announcements/page.tsx": {
    kind: "label",
    count: 1,
    why: "the announcements list's 14px label, the metric band's twin",
  },
  "src/components/app/dashboard/feed-section.tsx": {
    kind: "label",
    count: 1,
    why: "the dashboard's 11px uppercase section label",
  },
  "src/components/app/dashboard/empty-section-teaser.tsx": {
    kind: "label",
    count: 1,
    why: "the dashboard's 11px uppercase section label, on its empty teaser",
  },
  // ── unstyled ──
  "src/app/global-error.tsx": {
    kind: "unstyled",
    count: 1,
    why: "the root error boundary replaces the whole document, stylesheet included, so its h1 is sized inline",
  },
};
// (The feed's own section header, the guest album's "Guests" h2, the public
// profile's one section label and the report queue's two are the other Inter
// labels design-system.md allows; they size a child span, not the heading tag,
// so this scan never sees them and they need no entry. The profile page's
// entry went when its two sections became one and both labels took that form,
// 2026-09-19.)

function filesUnder(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { recursive: true })
    .map(String)
    .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
    .map((f) => `${dir}/${f}`.replace(/\\/g, "/"));
}

const sources = filesUnder("src").filter(
  (f) =>
    !/\.test\.tsx?$/.test(f) &&
    !f.endsWith(".d.ts") &&
    !OUTSIDE.some((dir) => f.startsWith(dir)),
);

/** A class token's utility with its variants stripped (`sm:`, `group-data-[x]/y:`,
 *  `[&>p]:`) and its important mark dropped, bracket-aware. */
function utilityOf(token: string): { variants: string; base: string } {
  let depth = 0;
  let cut = -1;
  for (let i = 0; i < token.length; i++) {
    const ch = token[i];
    if (ch === "[" || ch === "(") depth++;
    else if (ch === "]" || ch === ")") depth--;
    else if (ch === ":" && depth === 0) cut = i;
  }
  return {
    variants: cut < 0 ? "" : token.slice(0, cut + 1),
    base: token.slice(cut + 1).replace(/^!|!$/g, ""),
  };
}

const STOCK = /^text-(?:xs|sm|base|lg|xl|[2-9]xl)(?:\/\S+)?$/;
const STEP = new RegExp(`^text-(?:${[...TYPE_STEPS].join("|")})$`);
/** An arbitrary `text-[…]` that is a SIZE, not a colour (a bare var() is a
 *  colour to Tailwind unless it is hinted `length:`). */
function arbitrarySize(base: string): boolean {
  const m = /^text-\[(.+)\]$/.exec(base);
  if (!m) return false;
  const v = m[1];
  return (
    /^(?:length|size):/.test(v) ||
    /^-?[\d.]+(?:px|rem|em|vw|vh|svh|dvh|%|ch|lh|cqi|cqw)$/.test(v) ||
    /^(?:clamp|calc|min|max)\(/.test(v)
  );
}

/** Every string literal under a node, template parts included. */
function literals(node: ts.Node, out: string[] = []): string[] {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    out.push(node.text);
  else if (ts.isTemplateExpression(node)) {
    out.push(node.head.text);
    for (const span of node.templateSpans) {
      literals(span.expression, out);
      out.push(span.literal.text);
    }
    return out;
  }
  // forEachChild STOPS at the first truthy return, so the callback returns
  // nothing: `cn("a", b)` would otherwise yield the callee and no strings.
  ts.forEachChild(node, (child) => {
    literals(child, out);
  });
  return out;
}

type Hit = {
  file: string;
  line: number;
  tag: string;
  headingTag: boolean;
  face: boolean;
  what: string;
};

function scan(rel: string): Hit[] {
  const sf = ts.createSourceFile(
    rel,
    read(rel),
    ts.ScriptTarget.Latest,
    true,
    rel.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const hits: Hit[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sf);
      const headingTag = /^h[1-6]$/.test(tag);
      const component = /^[A-Z]\w*(?:Title|Heading)$/.test(
        tag.split(".").pop() ?? "",
      );
      let cls: ts.Node | undefined;
      let style: ts.Node | undefined;
      for (const attr of node.attributes.properties) {
        if (!ts.isJsxAttribute(attr) || !attr.initializer) continue;
        const name = attr.name.getText(sf);
        if (name === "className") cls = attr.initializer;
        if (name === "style") style = attr.initializer;
      }
      const tokens = (cls ? literals(cls) : [])
        .join(" ")
        .split(/\s+/)
        .filter(Boolean);
      // The FACE is the bare utility: `prose-headings:font-heading` dresses a
      // wrapper's descendants, which are sized by its prose modifiers instead.
      const face = tokens.includes("font-heading");
      if (headingTag || component || face) {
        const sizes = tokens.filter((token) => {
          const { variants, base } = utilityOf(token);
          // A step behind a breakpoint is a ramp between two steps.
          return (
            STOCK.test(base) ||
            arbitrarySize(base) ||
            (variants !== "" && STEP.test(base))
          );
        });
        if (headingTag && style && /\bfontSize\b/.test(style.getText(sf)))
          sizes.push("style={{ fontSize }}");
        if (sizes.length > 0) {
          const line =
            sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
          // One hit per ELEMENT: `text-base sm:text-lg` is one heading off
          // the ladder, not two, and the exception counts are elements.
          hits.push({
            file: rel,
            line,
            tag,
            headingTag,
            face,
            what: sizes.join(" "),
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return hits;
}

const hits = sources.flatMap(scan);

function excused(hit: Hit): boolean {
  const exception = EXCEPTIONS[hit.file];
  if (!exception) return false;
  if (exception.kind === "label") return hit.headingTag && !hit.face;
  if (exception.kind === "unstyled") return hit.what.startsWith("style=");
  return true;
}

describe("the type ladder", () => {
  it("declares ten steps in theme.css, each with its own leading and tracking", () => {
    expect(declared).toHaveLength(10);
    for (const step of declared) {
      expect(theme, step).toContain(`--text-${step}--line-height:`);
      expect(theme, step).toContain(`--text-${step}--letter-spacing:`);
    }
  });

  it("is the same list theme.css and cn() are working from", () => {
    // Way 2. utils.ts teaches tailwind-merge the ladder; a step added to one
    // file and not the other is dropped from every className that also names a
    // colour, with nothing to see in the source.
    expect([...TYPE_STEPS].sort()).toEqual([...declared].sort());
  });

  it("teaches cn() every radius token theme.css maps, so a token corner overrides a stock one", () => {
    // Way 2, one room over. The custom tokens are the self-mapped lines of the
    // theme block (`--radius-tile: var(--radius-tile)`); the derived sm..2xl
    // steps carry Tailwind's own names and need no teaching.
    const custom = [
      ...theme.matchAll(/^\s*--radius-([a-z0-9-]+):\s*var\(--radius-\1\);/gm),
    ].map((m) => m[1]);
    expect([...RADIUS_TOKENS].sort()).toEqual([...custom].sort());
    for (const name of custom) {
      // The last class wins in both directions, never the stylesheet's alphabet.
      expect(cn("rounded-md", `rounded-${name}`)).toBe(`rounded-${name}`);
      expect(cn(`rounded-${name}`, "rounded-full")).toBe("rounded-full");
    }
  });

  it("gives no step a name the color namespace already owns", () => {
    // Way 1. `text-<name>` would resolve as a color and the size would be
    // unreachable. The board named the card step `card`, against `--color-card`.
    const colors = new Set(
      [...theme.matchAll(/^\s*--color-([a-z0-9-]+):\s/gm)].map((m) => m[1]),
    );
    const clashes = declared.filter((step) => colors.has(step));
    expect(clashes, clashes.join(", ")).toEqual([]);
  });

  it("keeps the three system components on one class each, with no ramp", () => {
    // Way 3. PageHero and SectionShell hold their scales in a table and
    // PageHeading has one default; a breakpoint-prefixed size in any of the
    // three means a ramp is back and the phone end has stopped being designed.
    for (const rel of [
      "src/components/marketing/system/page-hero.tsx",
      "src/components/marketing/system/section-shell.tsx",
      "src/components/shared/page-heading.tsx",
    ]) {
      const code = read(rel).replace(/\/\*[\s\S]*?\*\//g, "");
      expect(code, rel).not.toMatch(/\b(sm|md|lg|xl|2xl):text-(xs|sm|base|\d)/);
    }
  });

  it("keeps the paper stack in order at a phone AND at 1440", () => {
    // Way 4. The page title over the prose h2 over the sub-head it heads, read
    // off the tokens at both ends: a retune that keeps the order passes.
    const stack = ["title", "prose", "subhead"];
    for (const end of [0, 1] as const) {
      const sizes = stack.map((step) => ends(step)[end]);
      for (let i = 1; i < stack.length; i++) {
        expect(
          sizes[i - 1],
          `${stack[i - 1]} must stay above ${stack[i]} at ${end ? 1440 : 375}`,
        ).toBeGreaterThan(sizes[i]);
      }
    }
  });
});

describe("every heading on the ladder", () => {
  it("scanned the production tree, and every excepted file still exists", () => {
    expect(sources.length).toBeGreaterThan(400);
    for (const rel of Object.keys(EXCEPTIONS)) {
      // A reason for a file that has left is a hole nobody is watching.
      expect(existsSync(join(ROOT, rel)), rel).toBe(true);
    }
  });

  it("sets no heading on a stock, arbitrary or inline size", () => {
    // Way 5. Name the step the element's ROLE calls for (the table in
    // docs/systems/design-system.md); if no step fits, the role is the open
    // question, never the size.
    const offenders = hits
      .filter((hit) => !excused(hit))
      .map((hit) => `${hit.file}:${hit.line} <${hit.tag}> ${hit.what}`);
    expect(
      offenders,
      "a heading off the ladder: put it on the step its role calls for (theme.css), never a stock or arbitrary size",
    ).toEqual([]);
  });

  it("keeps each exception to exactly the elements it names", () => {
    for (const [rel, exception] of Object.entries(EXCEPTIONS)) {
      const n = hits.filter((hit) => hit.file === rel && excused(hit)).length;
      expect(
        n,
        `${rel} (${exception.kind}): ${n} excused, the list says ${exception.count}`,
      ).toBe(exception.count);
    }
  });
});
