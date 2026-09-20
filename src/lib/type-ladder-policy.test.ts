// @policy: engineering · One type ladder, and every heading and sentence on it
// @refuses: a step or radius token theme.css and cn() disagree on, a step name the color namespace already owns, a heading ramp coming back, a stack out of order at either end, a bottom rung under the floor, a stock, arbitrary or inline size on a heading, and an off-step size or a hand-set label tracking on body copy outside the allow-list.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { cn, RADIUS_TOKENS, TYPE_STEPS } from "@/lib/utils";

/**
 * THE LADDER FAILS SILENTLY IN SIX WAYS, AND THIS IS ALL SIX (the type
 * wirings, Will's rulings 2026-09-17, 2026-09-18 and 2026-09-20).
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
 * 6. A SENTENCE OFF THE LADDER (the body wiring, 2026-09-20, `body-type` r1).
 *    Under `card-title` the site had no ladder at all: 372 `text-sm`, 244
 *    `text-xs`, 98 `text-[11px]`, 76 `text-[10px]`, 26 `text-[15px]`, 20
 *    `text-[9px]`, plus 80 hand-set trackings on uppercase labels. Six steps
 *    now name those sizes (`copy`, `reading`, `working`, `caption`, `label`,
 *    `micro`), and the BODY SCAN below holds every non-heading element to
 *    them: a size that resolves to anything but 10, 12, 14 or 16 is off, and
 *    so is any tracking but 0.08em on an uppercase label. An arbitrary size
 *    also carries NO leading of its own — `text-[15px]` inherits the
 *    preflight's 1.5 and computes to 22.5, off the 4px grid — which is the
 *    silent half: the size is visible in the source, the leading never is.
 *
 * ★ WAY 6 IS AN ALLOW-LIST THAT ONLY SHRINKS, NOT A HARD FAIL, AND ON PURPOSE.
 * Four other wiring lanes were open the night this landed and they own files
 * this sweep may not touch. So the body scan ships the way the heading table
 * ships: every survivor named, counted and reasoned, and the count pinned so
 * the hole cannot grow. A `pending` entry is one an app-shape lane is already
 * rebuilding; it goes RED when that element disappears, which is the signal to
 * delete the entry, not to widen it. Flipping the scan to a hard fail once the
 * list is empty is one line (`BODY_EXCEPTIONS` to `{}`).
 *
 * ★ WHAT NEITHER SCAN SEES, SAID OUT LOUD: a class string that never reaches a
 * JSX attribute. Both walk JSX opening elements, so a size inside a `cva`
 * variant table or a plain const map (Button's four sizes, for one) is
 * invisible here. That is deliberate — a string in a table may never be worn,
 * and guessing which ones are is how an allow-list starts lying — and it is
 * why Button's own sizes are a ROUND (`buttons-pairs`), not a lint.
 *
 * The ladder's NUMBERS are not pinned here, and never should be: a contract
 * guards function, never a look, and Will retunes a step without asking a test.
 * The ORDER is function (it is what broke), so it is pinned, and it passes for
 * any retune that keeps a heading above the one it heads and the floor at the
 * bottom.
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
function endsOf(name: string): [number, number] {
  const m = new RegExp(`^\\s*${name}:\\s*([^;]+);`, "m").exec(theme);
  if (!m) throw new Error(`${name} is not declared`);
  const rems = [...m[1].matchAll(/(-?[\d.]+)rem/g)].map((r) => Number(r[1]));
  if (!m[1].startsWith("clamp(")) return [rems[0], rems[0]];
  return [rems[0], rems[rems.length - 1]];
}

/** A step's two ends, in rem. Its leading's two ends are `endsOf` on the
 *  companion, which is how the leading rule below reads them. */
const ends = (step: string): [number, number] => endsOf(`--text-${step}`);

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

type BodyException = {
  /**
   * `depicted`: type DRAWN inside a picture (a phone, a printed sign, a badge,
   * a pictured dialog), sized by the picture and not by the page, exactly as
   * the heading table means it. A caption inside a 180px-wide drawn phone is
   * 8px BECAUSE the phone is small, and a viewport clamp would size it by the
   * wrong box.
   * `relative`: sized in `em` to whatever it sits in, so it has no one number
   * to hold to a rung — an initial inside a 14px avatar, an OTP digit in its
   * box, a price suffix riding a display numeral, an inline plate in a
   * paragraph.
   * `lane`: a LANE BOUNDARY kept the sweep out — another manifest owned the
   * file the night the ladder landed, or no manifest owned it at all. Nothing
   * is wrong with these sizes except that this lane could not touch them; the
   * `type-sync` follow-up deletes the entry and the size together.
   * `pending`: an element an app-shape lane is rebuilding on the label step.
   * It goes RED when that element disappears, which is the signal to DELETE
   * the entry at that merge — never to widen it.
   * `board`: a board on the desk rules this surface's sizes. Will's own
   * verdicts put two here: the admin ("our internal admin portal favors
   * information density and can break away from this if helpful") and the
   * button rung ("not a direct selection, more work required" -> round two,
   * `buttons-pairs`).
   */
  kind: "depicted" | "relative" | "lane" | "pending" | "board";
  /** Exactly how many elements the exception excuses, so the hole cannot grow. */
  count: number;
  why: string;
};

/**
 * THE BODY ALLOW-LIST, AND IT ONLY SHRINKS. Everything the sweep could reach
 * moved onto a step; this is what it could not reach, each named with the
 * reason it could not. An entry added to turn a red gate green, for a file
 * this lane could have swept, is the regression the list exists to stop.
 */
const BODY_EXCEPTIONS: Record<string, BodyException> = {
  // ── depicted: type drawn inside a picture ──
  "src/components/marketing/sections/how-it-works/guest-pictures.tsx": {
    kind: "depicted",
    count: 18,
    why: "the guest's six steps drawn as pictures: a phone's chrome, a sheet, a sign, an album tile, each sized by its own drawing",
  },
  "src/components/marketing/sections/how-it-works/host-pictures.tsx": {
    kind: "depicted",
    count: 14,
    why: "the host's six steps, the same drawings from the other side",
  },
  "src/components/marketing/sections/features/album/entry-phone.tsx": {
    kind: "depicted",
    count: 6,
    why: "the guest entry sheet and the album, drawn inside a phone at reduced scale (the heading table excuses its headings for the same reason)",
  },
  "src/components/marketing/sections/events/event-artifacts.tsx": {
    kind: "depicted",
    count: 5,
    why: "the conference badge and the trip tag: every size is a `hero ? bigger : smaller` pair sized by the artifact, not the page",
  },
  "src/components/marketing/sections/features/qr/entry-flow.tsx": {
    kind: "depicted",
    count: 3,
    why: "the entry modal's resting state drawn as a card, word for word",
  },
  "src/components/marketing/sections/features/album/visibility-frames.tsx": {
    kind: "depicted",
    count: 2,
    why: "the private-album gate drawn inside two album frames",
  },
  "src/components/marketing/sections/features/sharing/zip-modal-demo.tsx": {
    kind: "depicted",
    count: 2,
    why: "the download dialog drawn as a picture of itself, its numeral included",
  },
  "src/components/marketing/sections/features/guests/attribution-hero.tsx": {
    kind: "depicted",
    count: 1,
    why: "an initial inside a 14px drawn avatar on a pictured tile",
  },
  "src/components/marketing/sections/features/shared/feature-door.tsx": {
    kind: "depicted",
    count: 1,
    why: "the same 14px drawn avatar in the doors' chip (the door's own chip moved onto the floor)",
  },
  "src/components/marketing/sections/how-it-works/picture-parts.tsx": {
    kind: "depicted",
    count: 1,
    why: "a drawn phone's status bar clock (the file's real toggle chip took the caption step)",
  },
  "src/components/marketing/sections/pricing/calculator.tsx": {
    kind: "depicted",
    count: 1,
    why: "a clip's running time printed inside a drawn thumbnail (the slider's own labels took the floor)",
  },
  "src/components/marketing/sections/features/privacy/access-switch.tsx": {
    kind: "depicted",
    count: 1,
    why: "the password gate drawn over a pictured album",
  },
  "src/components/marketing/sections/features/guests/profiles-section.tsx": {
    kind: "depicted",
    count: 1,
    why: "a guest's profile card drawn beside the copy (aria-hidden)",
  },
  "src/components/marketing/sections/features/qr/print-shop.tsx": {
    kind: "depicted",
    count: 1,
    why: "a printed welcome sign and table card: type on a pictured print",
  },
  "src/components/marketing/press/press-sheet.tsx": {
    kind: "depicted",
    count: 1,
    why: "the press kit's asset plates, sized to their plates like the marks beside them",
  },
  // ── relative: sized in em to its container, so it has no one number ──
  "src/components/marketing/mdx/spec-shared.tsx": {
    kind: "relative",
    count: 3,
    why: "the MDX inline plates (0.8em and 0.85em) ride whatever line they sit in, from a caption to a lede",
  },
  "src/components/app/account-avatar-form.tsx": {
    kind: "relative",
    count: 1,
    why: "an avatar's initial, sized to the size-16 circle around it",
  },
  "src/components/ui/input-otp.tsx": {
    kind: "relative",
    count: 1,
    why: "one OTP digit, sized to its size-11 box (shadcn's own component)",
  },
  "src/components/marketing/sections/home/price-pop.tsx": {
    kind: "relative",
    count: 1,
    why: "the /mo suffix at 0.55em, sized to the price numeral it rides",
  },
  // ── lane: a lane boundary kept the sweep out (a `type-sync` follow-up) ──
  "src/components/marketing/chrome/marketing-footer.tsx": {
    kind: "lane",
    count: 6,
    why: "voice-wiring owns the footer this round (it is rewriting every line in it)",
  },
  "src/components/guest/entry-modal.tsx": {
    kind: "lane",
    count: 4,
    why: "voice-wiring owns the entry modal (his gate line); two of the four are button text as well",
  },
  "src/components/guest/enter-event-prompt.tsx": {
    kind: "lane",
    count: 2,
    why: "voice-wiring owns it (his gate line, verbatim); both are button text as well",
  },
  "src/components/marketing/sections/home/pricing-teaser.tsx": {
    kind: "lane",
    count: 2,
    why: "voice-wiring owns it (the Pro line's sibling)",
  },
  "src/components/marketing/sections/features/album/how-much-fits.tsx": {
    kind: "lane",
    count: 1,
    why: "voice-wiring owns it (the Pro line's sibling)",
  },
  "src/components/marketing/sections/home/no-app.tsx": {
    kind: "lane",
    count: 1,
    why: 'voice-wiring owns it ("No app required.")',
  },
  "src/components/marketing/sections/events/event-statement.tsx": {
    kind: "lane",
    count: 1,
    why: "no manifest owns it this round: a section lede at a flat 18, which is exactly what `copy` is for",
  },
  "src/components/marketing/sections/features/qr/qr-hero.tsx": {
    kind: "lane",
    count: 1,
    why: "no manifest owns it this round: a hero lede at a flat 18",
  },
  "src/components/marketing/sections/reel/reel-hero.tsx": {
    kind: "lane",
    count: 1,
    why: "no manifest owns it this round: a hero lede at a flat 18",
  },
  "src/components/marketing/sections/reel/wysiwyg-section.tsx": {
    kind: "lane",
    count: 1,
    why: "no manifest owns it this round: one aria-hidden decorative arrow at 18 (home-wiring moved the 11 px label onto the label pair at its merge, 2026-09-20; one element remains, type-sync's)",
  },
  // ── pending: an app-shape lane is rebuilding the element ──
  "src/app/(guest)/u/[slug]/page.tsx": {
    kind: "pending",
    count: 1,
    why: "home-wiring rebuilds the profile as an owner mode: one uppercase section label on the label step, one avatar initial",
  },
  "src/components/app/event-feed/feed-section-header.tsx": {
    kind: "pending",
    count: 1,
    why: "hub-wiring rebuilds the feed header on the label step",
  },
  "src/components/app/event-feed/event-feed-action-bar.tsx": {
    kind: "pending",
    count: 1,
    why: "hub-wiring rebuilds the action bar on the label step",
  },
  // ── board: a board on the desk rules this surface's sizes ──
  "src/app/admin/forensics/page.tsx": {
    kind: "board",
    count: 3,
    why: "three health numerals: a number that is the SUBJECT of its block, and the admin's density is Will's to break away (the `admin` board is on the desk)",
  },
  "src/components/admin/metric-card.tsx": {
    kind: "board",
    count: 1,
    why: "the admin metric card's numeral, the forensics trio's twin",
  },
  "src/components/admin/admin-shell.tsx": {
    kind: "board",
    count: 1,
    why: "the operator badge in the admin bar, the `admin` board's own chrome",
  },
  "src/components/admin/admin-not-found-screen.tsx": {
    kind: "board",
    count: 1,
    why: "the same operator badge on the admin 404",
  },
  "src/components/app/export/export-dialog.tsx": {
    kind: "board",
    count: 1,
    why: "the export size numeral: a number that is the subject of its block, and `export-flow` is on the desk",
  },
  "src/components/marketing/chrome/mobile-menu.tsx": {
    kind: "board",
    count: 2,
    why: "the phone sheet's nav rows at 18: nav, not body copy, and `site-chrome` has the board",
  },
  "src/components/guest/password-gate.tsx": {
    kind: "board",
    count: 2,
    why: 'button text, which `body-type` r1 sent to round two: "not a direct selection, more work required" (`buttons-pairs`)',
  },
};

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

/* ──────────────────────── the body scan (way 6) ───────────────────────── */

/**
 * Tailwind's own stock sizes as NUMBERS. The body scan compares a sentence
 * with the ladder's rungs, never with a class name, so `text-sm` and
 * `text-[14px]` are one answer and a rename can never smuggle a size past it.
 */
const STOCK_PX: Record<string, number> = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
  "6xl": 60,
  "7xl": 72,
  "8xl": 96,
  "9xl": 128,
};

/**
 * The four rungs a sentence may sit on: what the six body steps resolve to.
 * `copy` travels 16 -> 18 and its 18 is reachable ONLY through the step — a
 * hard `text-lg` jumps at no breakpoint and brings 1.75rem of leading with it,
 * which is the pair the step exists to replace.
 */
const BODY_RUNGS = new Set([10, 12, 14, 16]);

/** His tracking, and the only one an uppercase label may still spell by hand. */
const LABEL_TRACKING = "tracking-[0.08em]";

/**
 * A size token as px, or null when it cannot be resolved to a number (an `em`
 * is relative to its parent, a clamp to the viewport). Null is a failure, not
 * a pass: a size nobody can resolve is a size nobody reviewed.
 */
function sizePx(base: string): number | null {
  const stock = /^text-(xs|sm|base|lg|xl|[2-9]xl)(?:\/\S+)?$/.exec(base);
  if (stock) return STOCK_PX[stock[1]] ?? null;
  const arb = /^text-\[(?:length:|size:)?(-?[\d.]+)(px|rem)\]$/.exec(base);
  if (!arb) return null;
  return arb[2] === "rem" ? Number(arb[1]) * 16 : Number(arb[1]);
}

type Hit = {
  file: string;
  line: number;
  tag: string;
  headingTag: boolean;
  face: boolean;
  what: string;
};

/** One non-heading element carrying something off the body ladder. */
type BodyHit = { file: string; line: number; tag: string; what: string };

function scan(rel: string): { headings: Hit[]; body: BodyHit[] } {
  const sf = ts.createSourceFile(
    rel,
    read(rel),
    ts.ScriptTarget.Latest,
    true,
    rel.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const hits: Hit[] = [];
  const body: BodyHit[] = [];
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
      const at = () =>
        sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
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
          // One hit per ELEMENT: `text-base sm:text-lg` is one heading off
          // the ladder, not two, and the exception counts are elements.
          hits.push({
            file: rel,
            line: at(),
            tag,
            headingTag,
            face,
            what: sizes.join(" "),
          });
        }
      } else {
        // EVERY ELEMENT THE HEADING SCAN DOES NOT CLAIM IS BODY, so one
        // element has exactly one home and neither scan reports the other's.
        const off: string[] = [];
        for (const token of tokens) {
          const { base } = utilityOf(token);
          // Any DECLARED step passes, heading steps included: PageHero's
          // sub-head slot is a real <p class="text-subhead"> and is on the
          // ladder. What is refused is a size that is on no step at all.
          if (STEP.test(base)) continue;
          if (!STOCK.test(base) && !arbitrarySize(base)) continue;
          const px = sizePx(base);
          if (px === null || !BODY_RUNGS.has(px)) off.push(token);
        }
        // An uppercase label's tracking is the step's job now (`text-label`
        // carries 0.08em). A hand-set one beats the step through --tw-tracking,
        // silently, which is why the sweep deleted them rather than pairing
        // them; 0.08em survives because it agrees with the step.
        if (tokens.some((t) => utilityOf(t).base === "uppercase")) {
          for (const token of tokens) {
            const { base } = utilityOf(token);
            if (base.startsWith("tracking-") && base !== LABEL_TRACKING)
              off.push(token);
          }
        }
        if (off.length > 0)
          body.push({ file: rel, line: at(), tag, what: off.join(" ") });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { headings: hits, body };
}

const scanned = sources.map(scan);
const hits = scanned.flatMap((s) => s.headings);
const bodyHits = scanned.flatMap((s) => s.body);

function excused(hit: Hit): boolean {
  const exception = EXCEPTIONS[hit.file];
  if (!exception) return false;
  if (exception.kind === "label") return hit.headingTag && !hit.face;
  if (exception.kind === "unstyled") return hit.what.startsWith("style=");
  return true;
}

describe("the type ladder", () => {
  it("declares sixteen steps in theme.css, each with its own leading and tracking", () => {
    // Ten heading steps (2026-09-17/18) and six body steps (2026-09-20).
    expect(declared).toHaveLength(16);
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

  it("keeps the body steps descending, and micro on the floor at both ends", () => {
    // Way 4 at the bottom of the ladder. The order is what Will ruled — a read
    // over the app's working body over a caption over the floor — and the
    // FLOOR is the part that can be said out loud ("nothing under 10"), so it
    // is the part a retune must not quietly undo. `caption` and `label` are
    // deliberately level: one size, two jobs.
    const descending = ["copy", "reading", "working", "caption", "micro"];
    for (const end of [0, 1] as const) {
      const sizes = descending.map((step) => ends(step)[end]);
      for (let i = 1; i < descending.length; i++) {
        expect(
          sizes[i - 1],
          `${descending[i - 1]} must stay at or above ${descending[i]} at ${end ? 1440 : 375}`,
        ).toBeGreaterThanOrEqual(sizes[i]);
      }
      expect(ends("label")[end], "label is the caption step's twin").toBe(
        ends("caption")[end],
      );
      for (const step of declared) {
        expect(
          ends(step)[end],
          `${step} may not go under the floor (micro) at ${end ? 1440 : 375}`,
        ).toBeGreaterThanOrEqual(ends("micro")[end]);
      }
    }
  });

  it("gives every body step a leading of 2 x size - 8, on the 4px grid", () => {
    // `leading=length`. It is the rule Will picked over a ratio because it
    // lands every rung on the 4px grid, and it is function: an arbitrary size
    // carries NO leading and silently inherits the preflight's 1.5, which is
    // how `text-[15px]` came to compute at 22.5. Read off the tokens, so a
    // retune that keeps the rule passes.
    for (const step of [
      "copy",
      "reading",
      "working",
      "caption",
      "label",
      "micro",
    ]) {
      for (const end of [0, 1] as const) {
        const size = ends(step)[end] * 16;
        const leading = endsOf(`--text-${step}--line-height`)[end] * 16;
        expect(leading, `${step} at ${end ? 1440 : 375}`).toBeCloseTo(
          2 * size - 8,
          1,
        );
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

describe("every sentence on the ladder", () => {
  it("names a file that still exists for every body exception", () => {
    for (const rel of Object.keys(BODY_EXCEPTIONS)) {
      // A reason for a file that has left is a hole nobody is watching.
      expect(existsSync(join(ROOT, rel)), rel).toBe(true);
    }
  });

  it("sets no body copy on a size that is off the ladder", () => {
    // Way 6. Resolve the size to a number and hold it to a rung: 16 for what a
    // guest reads, 14 for the app's working body, 12 for a caption or a label,
    // 10 for the floor, and marketing's 16 -> 18 only through `text-copy`.
    const offenders = bodyHits
      .filter((hit) => !BODY_EXCEPTIONS[hit.file])
      .map((hit) => `${hit.file}:${hit.line} <${hit.tag}> ${hit.what}`);
    expect(
      offenders,
      "body copy off the ladder: name the step its role calls for (text-reading, text-working, text-copy, text-caption, text-label, text-micro), never a stock or arbitrary size",
    ).toEqual([]);
  });

  it("keeps each body exception to exactly the elements it names", () => {
    // The count is the whole mechanism: an allow-list that only shrinks. A
    // `pending` entry going red means its element is GONE and the entry should
    // be deleted, which is the one red this file asks you to welcome.
    for (const [rel, exception] of Object.entries(BODY_EXCEPTIONS)) {
      const n = bodyHits.filter((hit) => hit.file === rel).length;
      expect(
        n,
        `${rel} (${exception.kind}): ${n} off the ladder, the list says ${exception.count}`,
      ).toBe(exception.count);
    }
  });
});
