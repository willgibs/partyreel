/**
 * "APPLY TO THE SITE": the media-kit board's candidates as real CSS, applied to
 * the running site through the shell's candidate block (the review wave's second
 * round). A palette board hands the site a token block; this board's candidates
 * are photographs, so what it hands the site is a block that REPLACES them, which
 * is the same judgement made on the real pages instead of on a stage.
 *
 * ★ THE SELECTORS ARE THE PRODUCTION FILE NAMES, not a stage class. Every still
 * is `public/marketing/img/mkt-<id>-01.jpg`, and next/image keeps that name inside
 * its optimizer query (`?url=%2Fmarketing%2Fimg%2Fmkt-wedding-golden-01.jpg`), so
 * one substring selector catches the frame in both forms on every surface it
 * appears on: the blog card, the footer strip, the nav panel, a feature mock.
 *
 * ★ `content` ON AN <img> IS A CHROME AND SAFARI BEHAVIOUR. Replacing the content
 * of a replaced element is how a stylesheet can swap a photograph without touching
 * a component; Firefox ignores it and the page simply shows today's frame, which
 * is a harmless failure and worth knowing before a walk. Will reviews in Chrome.
 *
 * Nothing here ships. The blocks exist so a ruling can be made in front of the
 * real pages; the wiring round changes files and manifest entries, not CSS.
 */

import { BRIDGE_BY_ID, routeOutcomeForId } from "./bridge";
import { candidate } from "./candidates";
import { MASTERS } from "./shoot";

/** The pages to walk with a block applied. Quoted in BoardMeta. */
export const WALK = [
  "/",
  "/pricing",
  "/help",
  "/contact",
  "/blog",
  "/blog/qr-code-for-wedding-photos",
  "/features/album",
];

/** Every marketing still, plus the two reel posters, by their real file names. */
const ALL_FRAMES = [
  'img[src*="mkt-"]',
  'img[src*="hero-candidate-0"]',
  'video[poster*="hero-candidate-0"]',
].join(",\n");

/** The shot a frame's id inherits, for the slate. Declared above the blocks
 *  because every block below is built at module init and may reach for it. */
const SHOT_BY_ID = new Map(
  MASTERS.flatMap((m) => m.replaces.map((id) => [id, m] as const)),
);

/**
 * A. THE EXPOSURE. Outline every frame whose provenance we cannot state and drain
 * the colour out of it. Bible 1 says the media is the colour, so a site walked
 * with this block on is the site with everything we do not own taken out of it,
 * which is the argument in one glance rather than in a paragraph.
 */
export const EXPOSURE_CSS = `/* media-kit A: every frame with no provenance, outlined and drained */
${ALL_FRAMES},
video[src*="/marketing/reels/"] {
  outline: 2px solid oklch(0.58 0.21 25);
  outline-offset: -2px;
  filter: grayscale(1) contrast(1.04);
}`;

function swap(id: string, key: string): string {
  return `img[src*="mkt-${id}-01"] { content: url("/design/media-kit/${candidate(key).file}"); }`;
}

/**
 * Every block below is the board's own route function, asked of the twelve ids
 * and answered in CSS.
 *
 * ★ THE BLOCK IS BUILT BY `routeOutcomeForId`, NEVER BY A SECOND READING OF THE
 * MIX LIST. Round three's first cut matched the mix list against an id here and
 * against a candidate key on the sheet, so Mix put bridge-ceremony.jpg on a page
 * the board's own sheet showed wearing wedding-arch.jpg. A route means one thing
 * or the walk is a lie about what a ruling would ship.
 */
function blockFor(route: "licensed" | "mix"): string {
  return Object.keys(BRIDGE_BY_ID)
    .map((id) => {
      const out = routeOutcomeForId(id, route);
      return out.kind === "licensed" && out.key ? swap(id, out.key) : slate(id);
    })
    .filter(Boolean)
    .join("\n");
}

/**
 * B. LICENSED. The twelve replaced by the staged batch, by id, everywhere they
 * appear. Round one could fill eight; the second search filled all twelve.
 */
export const BRIDGE_CSS = `/* media-kit B: the licensed bridge, all twelve, staged CC0 */
${blockFor("licensed")}`;

/** Wrap to at most `lines` rows of `max` characters, breaking on spaces. */
function wrap(text: string, max: number, lines: number): string[] {
  const out: string[] = [];
  let row = "";
  for (const word of text.split(" ")) {
    if (!row) row = word;
    else if (row.length + 1 + word.length <= max) row += ` ${word}`;
    else {
      out.push(row);
      row = word;
      if (out.length === lines) break;
    }
  }
  if (out.length < lines && row) out.push(row);
  return out.slice(0, lines);
}

/**
 * The slate a frame becomes under the Ours block.
 *
 * ★ SQUARE VIEWBOX, CENTRED TEXT, SHORT LINES. The first cut drew a 1200x800
 * slate with the type at the left margin, and every surface that shows a frame
 * cover-cropped it: the blog card is 4:5 and took 20 percent off each side, so
 * the shot's code was gone and the line started mid-word. A slate has to read in
 * a 4:5 card, a 1:1 tile, a 40:21 share card and a 120 px corridor frame, which
 * means a square source and nothing important outside the middle 60 percent.
 */
function slate(id: string): string {
  const m = SHOT_BY_ID.get(id);
  if (!m) return "";
  const rows = wrap(m.subject.split(",")[0], 26, 2);
  const svg = [
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000'>`,
    `<rect width='1000' height='1000' fill='%23141414'/>`,
    `<g font-family='system-ui,sans-serif' text-anchor='middle' fill='%23f5f5f5'>`,
    `<text x='500' y='420' font-size='128' font-weight='600'>${esc(m.code)}</text>`,
    rows
      .map(
        (row, i) =>
          `<text x='500' y='${520 + i * 46}' font-size='36' fill='%23a3a3a3'>${esc(row)}</text>`,
      )
      .join(""),
    `<text x='500' y='650' font-size='28' fill='%23737373'>to be shot, replaces ${esc(id)}</text>`,
    `</g></svg>`,
  ].join("");
  return `img[src*="mkt-${id}-01"] { content: url("data:image/svg+xml,${svg}"); }`;
}

/**
 * Text going into an UNENCODED `data:image/svg+xml,` URI inside a CSS url("...").
 *
 * ★ PERCENT-ENCODE, NEVER ENTITY-ENCODE. The first cut wrote `&#183;` for a
 * separator and the whole slate silently fell back to today's photograph on every
 * page: a bare `&` ends the data URI's parse, the image fails to load, and an
 * <img> whose `content` fails just renders its own src, so nothing looks broken.
 * Caught by driving the real blog with the block applied, not by the build, and
 * the reason an XML entity cannot be the fix is that its own `&` is the problem.
 *
 * So: `%` first (or it double-encodes the escapes below), then the four
 * characters that would end the URI, the CSS string or an XML attribute.
 */
function esc(s: string): string {
  return s
    .replace(/%/g, "%25")
    .replace(/&/g, "%26")
    .replace(/#/g, "%23")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/"/g, "%22")
    .replace(/'/g, "%27");
}

/**
 * C. OURS. Every frame becomes the slate of the shot that replaces it. Walked
 * with this block on, the site says exactly how much photography the route costs,
 * frame by frame, on the pages that carry it.
 */
export const SHOOT_CSS = `/* media-kit C: every frame as the shot that replaces it */
${Object.keys(BRIDGE_BY_ID).map(slate).filter(Boolean).join("\n")}`;

/**
 * D. MIX, which is the recommendation: a licensed photograph only where the
 * frame is furniture, the slate everywhere the frame carries the argument. It is
 * the only block of the three that shows the site as it would actually look in
 * the weeks before the shoot.
 *
 * ★ ON THE TWELVE IDS THAT IS ONE FRAME, NOT TWO. Mix keeps two staged
 * candidates licensed, but only one of the twelve ids is bridged by either: the
 * id `wedding-arch` is bridged by a ceremony with people in it, which is not
 * furniture, so it goes to the shoot with the rest. On the blog, where a post
 * names its candidate directly, Mix is still two covers. decision.ts derives
 * both numbers from this same function rather than counting the list.
 */
export const MIX_CSS = `/* media-kit D: the mix, licensed where the frame is furniture, the shoot everywhere else */
${blockFor("mix")}`;
