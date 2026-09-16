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
 * ★ AND THE BLOG IS SWAPPED PER POST, BECAUSE THE SHEET IS PER POST. A file name
 * can only carry an id, and the bridge's whole finding is that the blog is 23
 * frontmatter lines rather than twelve files: fourteen of the 21 filled posts get
 * a DIFFERENT photograph from the one their cover's id is bridged with (the
 * timeline post keeps wedding-arch.jpg while the id `wedding-arch` is bridged by
 * bridge-ceremony.jpg, because the empty aisle is right for that post and wrong
 * for the footer strip). So a block that could only swap by id showed a walk
 * something the board's own sheet contradicts. The site does name a post: the
 * card is `a[data-cover-morph][href="/blog/<slug>"]` and the article's hero plate
 * is reachable through the canonical link in the head, so both carry a per-slug
 * rule that outranks the id rule on specificity and lands exactly what the sheet
 * shows. Every other route on the site reads the ids, and those keep the id rule.
 *
 * ★ `content` ON AN <img> IS A CHROME AND SAFARI BEHAVIOUR. Replacing the content
 * of a replaced element is how a stylesheet can swap a photograph without touching
 * a component; Firefox ignores it and the page simply shows today's frame, which
 * is a harmless failure and worth knowing before a walk. Will reviews in Chrome.
 * `:has()` (the article rule) is the same story on the same browsers.
 *
 * ★ THE SWAP NEVER MOVES A CROP, AND THAT IS TRUE OF THE REAL FIX TOO. `content`
 * replaces the image and leaves `object-position` alone, and `coverFor` derives
 * that position from the SLUG alone, so a frontmatter edit will not move it
 * either: a candidate lands at the post's own rung of the crop ladder on the walk
 * and after the wiring. The board's plates are drawn at that rung for the same
 * reason.
 *
 * Nothing here ships. The blocks exist so a ruling can be made in front of the
 * real pages; the wiring round changes files and manifest entries, not CSS.
 */

import {
  BRIDGE,
  BRIDGE_BY_ID,
  routeOutcome,
  routeOutcomeForId,
  type BridgePost,
} from "./bridge";
import { candidate } from "./candidates";
import {
  BARRED_IDS,
  IDS_TOTAL,
  MIX_IDS,
  MIX_POSTS,
  POSTS_FILLED,
} from "./decision";
import type { Route } from "./kit";
import { master, MASTERS } from "./shoot";

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
 * The blog card on the index and on an article's "Keep reading" row. PostCard
 * puts `data-cover-morph` on the link and the slug in its href, which is the
 * only place the running site names a post to a stylesheet.
 */
function cardSelector(slug: string): string {
  return `a[data-cover-morph][href="/blog/${slug}"] img`;
}

/**
 * The article's own hero plate. The page carries no slug in its body, but its
 * head carries `<link rel="canonical" href=".../blog/<slug>">`, so `:has()` on
 * the document reaches it. `$=` rather than `=` because the canonical is absolute
 * and its origin differs between localhost, a preview and production; a test
 * refuses a slug that is a suffix of another, which is the one way `$=` could
 * name two posts at once.
 */
function articleSelector(slug: string): string {
  return `html:has(link[rel="canonical"][href$="/blog/${slug}"]) [data-cover-plate="target"] img`;
}

/** One post's rule: what the sheet shows for it, on the card and on the article. */
function blogRule(post: BridgePost, route: Route): string {
  const out = routeOutcome(post, route);
  const shot = master(post.shot);
  const url =
    out.kind === "licensed" && out.key
      ? `/design/media-kit/${candidate(out.key).file}`
      : out.kind === "licensed"
        ? // Licensed with nothing to fill it: the two posts the corpus has no
          // frame for at all. The sheet leaves the plate empty; the site says so.
          slateUri(
            "None",
            "Nothing in the corpus fills this",
            `no licensed frame, ${post.cover} would have to stay`,
          )
        : // ★ The shot comes from the POST's vertical, so the conference post
          // wears K1 here and not the festival frame's shot, which is the whole
          // miscasting this route exists to end.
          slateUri(
            shot.code,
            shot.subject,
            `to be shot, replaces ${post.cover}`,
          );
  return `${cardSelector(post.slug)},\n${articleSelector(post.slug)} { content: url("${url}"); }`;
}

/**
 * Every block below is the board's own route function, asked of the twelve ids
 * AND of the 23 posts, and answered in CSS.
 *
 * ★ THE BLOCK IS BUILT BY THE ROUTE FUNCTIONS, NEVER BY A SECOND READING OF THE
 * MIX LIST. Round three's first cut matched the mix list against an id here and
 * against a candidate key on the sheet, so Mix put bridge-ceremony.jpg on a page
 * the board's own sheet showed wearing wedding-arch.jpg. A route means one thing
 * or the walk is a lie about what a ruling would ship.
 */
function blockFor(route: Route): string {
  return [
    ...Object.keys(BRIDGE_BY_ID).map((id) => {
      const out = routeOutcomeForId(id, route);
      return out.kind === "licensed" && out.key ? swap(id, out.key) : slate(id);
    }),
    // The per-post rules come last and outrank the id rules on specificity
    // ((0,2,2) and (0,3,3) against (0,1,1)), so order and weight agree.
    ...BRIDGE.map((post) => blogRule(post, route)),
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * B. LICENSED. The twelve replaced by the staged batch, by id, everywhere they
 * appear, and every blog cover replaced by the candidate its own post names.
 * Round one could fill eight; the second search filled all twelve.
 */
export const BRIDGE_CSS = `/* media-kit B: the licensed bridge, all twelve ids and all 23 posts, staged CC0 */
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
 * The slate itself: a code, two rows of subject, one line of why it is here.
 *
 * ★ SQUARE VIEWBOX, CENTRED TEXT, SHORT LINES. The first cut drew a 1200x800
 * slate with the type at the left margin, and every surface that shows a frame
 * cover-cropped it: the blog card is 4:5 and took 20 percent off each side, so
 * the shot's code was gone and the line started mid-word. A slate has to read in
 * a 4:5 card, a 1:1 tile, a 40:21 share card and a 120 px corridor frame, which
 * means a square source and nothing important outside the middle 60 percent.
 */
function slateUri(head: string, body: string, foot: string): string {
  const rows = wrap(body.split(",")[0], 26, 2);
  const svg = [
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000'>`,
    `<rect width='1000' height='1000' fill='%23141414'/>`,
    `<g font-family='system-ui,sans-serif' text-anchor='middle' fill='%23f5f5f5'>`,
    `<text x='500' y='420' font-size='128' font-weight='600'>${esc(head)}</text>`,
    rows
      .map(
        (row, i) =>
          `<text x='500' y='${520 + i * 46}' font-size='36' fill='%23a3a3a3'>${esc(row)}</text>`,
      )
      .join(""),
    `<text x='500' y='650' font-size='28' fill='%23737373'>${esc(foot)}</text>`,
    `</g></svg>`,
  ].join("");
  return `data:image/svg+xml,${svg}`;
}

/** The slate a manifest id becomes: the shot that replaces that frame. */
function slate(id: string): string {
  const m = SHOT_BY_ID.get(id);
  if (!m) return "";
  return `img[src*="mkt-${id}-01"] { content: url("${slateUri(m.code, m.subject, `to be shot, replaces ${id}`)}"); }`;
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
 * C. OURS. Every frame becomes the slate of the shot that replaces it, and every
 * blog cover the slate of the shot its own post is owed. Walked with this block
 * on, the site says exactly how much photography the route costs, frame by frame,
 * on the pages that carry it.
 */
export const SHOOT_CSS = `/* media-kit C: every frame as the shot that replaces it */
${blockFor("ours")}`;

/**
 * D. MIX, which is the recommendation: a licensed photograph only where the
 * frame is furniture, the slate everywhere the frame carries the argument. It is
 * the only block of the three that shows the site as it would actually look in
 * the weeks before the shoot, with every frame the shoot owes marked rather than
 * quietly left as it is.
 *
 * ★ ON THE TWELVE IDS THAT IS ONE FRAME, ON THE BLOG IT IS TWO. Mix keeps two
 * staged candidates licensed, but only one of the twelve ids is bridged by
 * either: the id `wedding-arch` is bridged by a ceremony with people in it,
 * which is not furniture, so it goes to the shoot with the rest. On the blog,
 * where a post names its candidate directly, both details survive, and the
 * per-post rules above are why a walk now shows both. decision.ts derives both
 * numbers from these same functions rather than counting the list.
 */
export const MIX_CSS = `/* media-kit D: the mix, licensed where the frame is furniture, the shoot everywhere else */
${blockFor("mix")}`;

/**
 * THE FOUR BLOCKS, IN WALKING ORDER: what is wrong, the recommendation, then the
 * two routes it sits between. Round two led with the exposure and ended on the
 * recommendation, which is the order an argument is BUILT in rather than the
 * order it is READ in.
 *
 * ★ THE LIST IS DATA, NOT JSX, so the board's apply section and any test read
 * one array. It is shaped for the kit's `ApplyToSite` (label, css, what) without
 * importing it: this module is read by a node test, and the kit's barrel is a
 * client tree. The board adds the board prefix to the label and the walk pages
 * from the spec, which is where the pages live now.
 */
export type ApplyBlockSpec = {
  id: string;
  label: string;
  css: string;
  /** One line: what this block changes, shown while it is not applied. */
  what: string;
};

export const APPLY_BLOCKS: readonly ApplyBlockSpec[] = [
  {
    id: "exposure",
    label: "The exposure",
    css: EXPOSURE_CSS,
    what: "Every frame with no provenance, outlined and drained. Media is the colour, so this is the site with everything we do not own taken out of it. Start here.",
  },
  {
    id: "mix",
    label: "Mix",
    css: MIX_CSS,
    what: `The recommendation: a licensed photograph only where the frame is furniture (${MIX_IDS} of the ${IDS_TOTAL} ids and ${MIX_POSTS} of the ${BRIDGE.length} covers, the ring detail and the empty aisle), the slate everywhere else. The site in the weeks between the ruling and the shoot.`,
  },
  {
    id: "ours",
    label: "Ours",
    css: SHOOT_CSS,
    what: "Every frame replaced by the slate of the shot that replaces it. This is the site saying what the shoot costs, page by page.",
  },
  {
    id: "licensed",
    label: "Licensed",
    css: BRIDGE_CSS,
    what: `The staged CC0 batch, by id everywhere the ${IDS_TOTAL} appear and by slug on every blog cover: ${POSTS_FILLED} of ${BRIDGE.length} filled and ${BRIDGE.length - POSTS_FILLED} left empty. Walk it to see why it loses: ${BARRED_IDS.join(" and ")} are filled by frames with a face and no release.`,
  },
];
