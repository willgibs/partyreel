"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { SectionShell } from "@/components/marketing/system/section-shell";

import { type Close, CloseBlock } from "./close";
import { type Fit, FitBlock } from "./fit";
import { type Opening, PageTop } from "./opening";
import { type Phone, PhonePlans } from "./phone";
import { type Pair, type PassPlace, PlanBlock, type SizePick } from "./plans";
import { Scene, Widths } from "./scene";
import { type Sheet, SheetBlock } from "./sheet";
import { PRICING_PAGE } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is a part of the real pricing
 * page, at a real width, on the ground that part actually stands on.
 *
 * ★ ONE PAGE, EIGHT DECISIONS, ONE STATE. Three of the eight are staged behind
 * the pair, and their previews read the board's live state rather than a world
 * the board assumed: the size control is drawn on the card he picked, the pass
 * takes its seat in the row he picked, and the phone stacks or swipes however
 * many cards that row actually has. Coming back to the opening after answering
 * the pair redraws it with the pair he chose, which is what makes these eight
 * questions one board instead of eight boards in a coat.
 *
 * ★ TWO WIDTHS EVERYWHERE, BOTH REAL. Every option draws at 1440 and again at
 * 375 inside a `Frame`, so every `sm:` and `lg:` in the shipped components
 * resolves against the width being judged rather than the lab page's own, and
 * a phone option is a phone rather than a narrow div. The phone decision draws
 * its own 375 column and says so (`tile: "phone"` in the spec).
 *
 * ★ AND EVERY CAPTION IS MEASURED IN THE FRAME (scene.tsx): how tall the part
 * runs, and how far down its first price lands. If a caption and the words
 * above it disagree, the caption is the truth.
 */

/* ── The board's live state, read once per preview ───────────────────────── */

const pairOf = (v: string | undefined): Pair =>
  v === "two" || v === "even" ? v : "pro";
const sizeOf = (v: string | undefined): SizePick =>
  v === "selector" || v === "slider" ? v : "rows";
const passOf = (v: string | undefined): PassPlace =>
  v === "under" || v === "first" ? v : "beside";

/* ── 1. What the page opens on ───────────────────────────────────────────── */

/** The first screen is 900 px of laptop plus enough to see where the cards
 *  start, which is the whole point of the fold rule. */
function opening(o: Opening) {
  return function OpeningPreview(s: BoardState) {
    return (
      <Widths
        id={`opening-${o}`}
        // The opening that starts on paper takes the paper ground and the
        // paper header, the way the `(paper)` route group renders a page.
        ground={o === "plans" ? "paper" : "cinema"}
        desktopH={1180}
        phoneH={1400}
        fold
        note="The first screen, the fold ruled at 900."
        render={() => (
          <PageTop
            opening={o}
            pair={pairOf(s.pair)}
            size={sizeOf(s.size)}
            pass={passOf(s.pass)}
          />
        )}
      />
    );
  };
}

/* ── 2, 3, 4. The plan block, under its three axes ───────────────────────── */

/** The plans in their real chapter: paper, in the page's own section rhythm. */
function Plans({
  pair,
  size,
  pass,
}: {
  pair: Pair;
  size: SizePick;
  pass: PassPlace;
}) {
  return (
    <PaperChapter>
      <SectionShell id="plans">
        <PlanBlock pair={pair} size={size} pass={pass} />
      </SectionShell>
    </PaperChapter>
  );
}

function plans(
  id: string,
  over: (s: BoardState) => { pair: Pair; size: SizePick; pass: PassPlace },
  note: string,
  heights: { desktop: number; phone: number },
) {
  return function PlansPreview(s: BoardState) {
    return (
      <Widths
        id={id}
        ground="paper"
        desktopH={heights.desktop}
        phoneH={heights.phone}
        note={note}
        render={() => <Plans {...over(s)} />}
      />
    );
  };
}

const pairPreview = (pair: Pair, note: string) =>
  plans(
    `pair-${pair}`,
    (s) => ({ pair, size: sizeOf(s.size), pass: passOf(s.pass) }),
    note,
    { desktop: 1120, phone: 2250 },
  );

const sizePreview = (size: SizePick, note: string) =>
  plans(
    `size-${size}`,
    (s) => ({ pair: pairOf(s.pair), size, pass: passOf(s.pass) }),
    note,
    { desktop: 1120, phone: 1780 },
  );

const passPreview = (pass: PassPlace, note: string) =>
  plans(
    `pass-${pass}`,
    (s) => ({ pair: pairOf(s.pair), size: sizeOf(s.size), pass }),
    note,
    { desktop: 1280, phone: 1780 },
  );

/* ── 5. Find your size ───────────────────────────────────────────────────── */

/** ONE HEIGHT FOR ALL THREE, and that is the point: this decision is largely
 *  about how much page the block spends, so a frame sized per option would
 *  hide the very thing being judged. Today's wall runs 1,056 px against the
 *  flat lines' 537, and the empty room under the short ones says so. */
const fit = (f: Fit, note: string) => (
  <Widths
    id={`fit-${f}`}
    desktopH={1100}
    phoneH={1030}
    note={note}
    render={() => <FitBlock fit={f} />}
  />
);

/* ── 6. The grid, the table, the band ────────────────────────────────────── */

const sheet = (v: Sheet, note: string, h: { desktop: number; phone: number }) => (
  <Widths
    id={`sheet-${v}`}
    desktopH={h.desktop}
    phoneH={h.phone}
    note={note}
    render={() => <SheetBlock sheet={v} />}
  />
);

/* ── 7. The questions and the close ──────────────────────────────────────── */

const close = (v: Close, note: string, h: { desktop: number; phone: number }) => (
  <Widths
    id={`close-${v}`}
    desktopH={h.desktop}
    phoneH={h.phone}
    note={note}
    render={() => <CloseBlock close={v} />}
  />
);

/* ── 8. The page in a hand ───────────────────────────────────────────────── */

function phone(p: Phone, note: string, h: number) {
  return function PhonePreview(s: BoardState) {
    return (
      <Scene id={`phone-${p}`} w={375} h={h} ground="paper" title="375" note={note}>
        <PhonePlans
          phone={p}
          pair={pairOf(s.pair)}
          size={sizeOf(s.size)}
          pass={passOf(s.pass)}
        />
      </Scene>
    );
  };
}

const SHEET = { desktop: 2720, phone: 2400 };
const CLOSE = { desktop: 1200, phone: 1350 };
const PHONE_H = 1900;

const PREVIEWS: PreviewsFor<typeof PRICING_PAGE> = {
  "opening.line": opening("line"),
  "opening.plans": opening("plans"),
  "opening.fork": opening("fork"),

  "pair.two": pairPreview("two", "Free and Pro as equal halves, Pro in ink."),
  "pair.pro": pairPreview("pro", "Pro across the row; Free one line beneath."),
  "pair.even": pairPreview("even", "Both on paper, the badge doing the pointing."),

  "size.selector": sizePreview("selector", "One price showing, two hidden behind the switch."),
  "size.rows": sizePreview("rows", "All three prices at once, the cadence in the head."),
  "size.slider": sizePreview("slider", "The price, the stats and the button follow the thumb."),

  "pass.under": passPreview("under", "The ticket after the plans, as today."),
  "pass.beside": passPreview("beside", "The pass in the row, on the cards' own grammar."),
  "pass.first": passPreview("first", "The one-event answer as the page's opening offer."),

  "fit.wall": fit("wall", "The ruled album fill: drag it and the wall fills."),
  "fit.cut": fit("cut", "No calculator: what each plan holds, in three lines."),
  "fit.ask": fit("ask", "The two inputs that change the answer, and the receipt."),

  // One height per width again: today's 2,676 px against the folded 1,401 is
  // the decision, so the frames are sized to hold the longest at 1440 and to
  // window the phone (the caption says how much of it is on screen).
  "sheet.both": sheet("both", "The tiles, the table and the band, as today.", SHEET),
  "sheet.table": sheet("table", "The table alone, the shared floor closing it.", SHEET),
  "sheet.fold": sheet("fold", "The tiles, and the matrix behind one line.", SHEET),

  "close.eight": close("eight", "Eight questions folded, then the band.", CLOSE),
  "close.four": close("four", "Four open in two columns, then the band.", CLOSE),
  "close.none": close("none", "The band alone, and the page is over.", CLOSE),

  // ★ ONE FRAME HEIGHT FOR ALL THREE. The question is how much scroll the
  // plans spend in a hand, so three frames sized to their own content would
  // draw every option the same height and hide the answer.
  "phone.stack": phone("stack", "One card under another, the laptop's order.", PHONE_H),
  "phone.swipe": phone("swipe", "A snapping row, the next card peeking.", PHONE_H),
  "phone.tabs": phone("tabs", "Two tabs, one side of the fork at a time.", PHONE_H),
};

export function PricingPageBoard() {
  return <ExplorationBoard spec={PRICING_PAGE} previews={PREVIEWS} />;
}
