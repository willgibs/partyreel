/**
 * THE PLAN: what to buy, where, per vertical, and what it comes to (round four,
 * 2026-09-15). The sourcing sheet is the evidence; this is the answer, and it is
 * the only part of the board a reviewer has to agree with.
 *
 * ★ EVERY NUMBER HERE IS DERIVED FROM `SOURCES`, NOT TYPED INTO A SENTENCE. A row
 * names a source id and a quantity; the money comes from that source's own
 * `firstSpend`, and plan.test.ts refuses a row whose source does not exist, a
 * spend that does not match the source's price, and a total that is not the sum of
 * the rows. Round three's worst fault was a count written into prose that its own
 * rule had since moved; a number on a board has to be computed or it will lie.
 *
 * ★ THE PLAN IS A BRIDGE AND IT SAYS SO IN ITS OWN TOTALS. Licensing the
 * photographs is cheap and licensing the film is not, and that asymmetry is the
 * argument: the clips line costs more than every photograph in the kit put
 * together, and it is the one line a shoot deletes outright, because a film of
 * strangers cannot carry a product whose claim is that the frames came from the
 * party you were at.
 */

import {
  type SourceCard,
  SOURCES,
  type Vertical,
  VERTICAL_LABEL,
  WEBSUMMIT_CC,
} from "./sources";

export type PlanRow = {
  /** A vertical, or the clips the hero films need. */
  key: Vertical | "clips";
  label: string;
  /** The source id this row buys from. Must exist in SOURCES. */
  sourceId: string;
  /** What you actually do, in one instruction. */
  buy: string;
  /** USD for this row. Zero when a line above already paid for it. */
  spend: number;
  /** Why the number is what it is, including why it can be zero. */
  spendNote: string;
  /** The second choice, and when to reach for it. */
  fallback: string;
};

const byId = new Map<string, SourceCard>(SOURCES.map((s) => [s.id, s]));

/** The recommended source's card, for the row's price and clause. */
export function planSource(row: PlanRow): SourceCard {
  const s = byId.get(row.sourceId);
  // A row naming a source that does not exist is a board that lies quietly, so it
  // throws here rather than rendering an empty card. plan.test.ts pins it too.
  if (!s)
    throw new Error(`plan row ${row.key} names unknown source ${row.sourceId}`);
  return s;
}

/** The subscription month itself, exported so a board can quote it without
 *  typing "$20" into a sentence (the board's oldest rule; see decision.ts). */
export const UNSPLASH_MONTH = byId.get("unsplash-plus")!.firstSpend!;
export const ISTOCK_FRAME = byId.get("istock")!.firstSpend!;
const ARTGRID_YEAR = byId.get("artgrid")!.firstSpend!;

/** The number of hard frames budgeted at the per-image source. */
export const HARD_FRAMES = 3;

export const PLAN: PlanRow[] = [
  {
    key: "weddings",
    label: VERTICAL_LABEL.weddings,
    sourceId: "unsplash-plus",
    buy: "One month of Unsplash+, and download the whole kit inside it.",
    spend: UNSPLASH_MONTH,
    spendNote:
      "The single month is the whole photographic spend for all five verticals, not for this one. It sits on the first row because a reviewer reads the first row.",
    fallback:
      "Stocksy at $35 a frame for the one wedding photograph that carries a page. This is the vertical the corpus is already deepest in, so the fallback is about quality rather than coverage.",
  },
  {
    key: "birthdays",
    label: VERTICAL_LABEL.birthdays,
    sourceId: "unsplash-plus",
    buy: "The same month. Download to the call sheet's B1 to B6.",
    spend: 0,
    spendNote: "Covered by the month above.",
    fallback:
      "iStock Essentials at $12 for a frame with a guest holding a phone up, which is the hardest single subject on the call sheet and the one this product actually needs.",
  },
  {
    key: "corporate",
    label: VERTICAL_LABEL.corporate,
    sourceId: "istock",
    buy: `Budget ${HARD_FRAMES} frames at iStock Essentials for the conference rooms, on top of the month.`,
    spend: ISTOCK_FRAME * HARD_FRAMES,
    spendNote: `${HARD_FRAMES} frames at $${ISTOCK_FRAME}. This is the vertical round three could not fill at all from the free corpus, and a curated premium library is thin on it too, so it is the one line worth paying per frame for.`,
    fallback: `Web Summit's Flickr archive, free, ${WEBSUMMIT_CC.toLocaleString("en-US")} photographs under CC BY 2.0, if question 3 answers "Only the frame's subject" and a credit line is acceptable. The catalogue is far better than anything the money buys; the licence is worse.`,
  },
  {
    key: "festivals",
    label: VERTICAL_LABEL.festivals,
    sourceId: "unsplash-plus",
    buy: "The same month. This is the vertical the free corpus already covers, so nothing extra is bought.",
    spend: 0,
    spendNote: "Covered by the month above.",
    fallback:
      "The 22 CC0 frames already staged under public/design/media-kit/, which fill this vertical better than any other. They stay a bridge, never a ship.",
  },
  {
    key: "trips",
    label: VERTICAL_LABEL.trips,
    sourceId: "unsplash-plus",
    buy: "The same month. The free corpus covers trips completely, so this is a taste upgrade rather than a gap.",
    spend: 0,
    spendNote: "Covered by the month above.",
    fallback: "Flickr under CC BY 2.0, which is deepest here of all five.",
  },
  {
    key: "clips",
    label: "The vertical films",
    sourceId: "artgrid",
    buy: "Park it. Shoot the clips at the same event as the photographs.",
    spend: 0,
    spendNote: `Artgrid is the only clip licence on the sheet that survives cancellation, and it is $${ARTGRID_YEAR} a year with no cheap single month, which is more than every photograph in this plan put together. The recommendation is to spend nothing here: the film is asset row 1 and rows 4, and one night produces both.`,
    fallback:
      "If a film is needed before a shoot can be booked, Artgrid is the line to buy and the number to expect. Mixkit and Coverr are free and neither can be shipped: one is revocable, and the other returned 23 AI generations and 34 iStock results in a single page of its own search.",
  },
];

/** The photographic spend: what a single yes actually costs. */
export const TOTAL = PLAN.reduce((n, r) => n + r.spend, 0);

/** The same plan at the promotion that was running on the sheet's date. */
export const UNSPLASH_PROMO = 7;
export const TOTAL_PROMO = TOTAL - UNSPLASH_MONTH + UNSPLASH_PROMO;

/** What the clips would add if they were licensed rather than shot. */
export const CLIPS_IF_LICENSED = ARTGRID_YEAR;

/** Rows that cost money, so the board can say how few there are. */
export const PAID_ROWS = PLAN.filter((r) => r.spend > 0);

/**
 * The comparison that decides the round. Round three read the whole asset log and
 * found one night of photography closes nine of its twelve rows; this is what the
 * licensed bridge closes and what it leaves open, so the two can be read together.
 */
export const BRIDGE_LIMITS = [
  "A licensed frame is a room we were not in. Every marketing claim this product makes is that the photographs came from the party you were at, and a bought frame is the one thing that cannot be true of.",
  "It closes the photographs and nothing else. Rows 1, 4, 5, 8 and 11 of the asset log are a film, eight vertical clips, a demo event's own album, a hand-and-phone cutout and a deliberately overlapping pair, and no licence delivers any of them.",
  "It expires in one direction. Unsplash+ frames downloaded this month are licensed forever, but the library is not re-downloadable after the month, so the shape of the site is fixed at whatever was pulled before the subscription lapsed.",
  "It is reversible and cheap, which is the case for doing it now: the bridge costs less than a dinner and can be thrown away the day the shoot happens, and the twelve stills on the site today are wrong on every one of those days.",
];
