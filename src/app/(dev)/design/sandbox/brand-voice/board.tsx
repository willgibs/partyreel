"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useLayoutEffect, useRef, useState } from "react";

import {
  BoardMeta,
  Stage,
  Toggle,
  type Ground,
  type Mode,
} from "@/components/dev/board";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { PageHero } from "@/components/marketing/system/page-hero";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Variant } from "../variant-frame";
import {
  ALBUM_PAGE,
  ARC,
  CURATION_PAGE,
  FEATURES,
  GUEST_SURFACES,
  HELP_HEADS,
  QUIET_SURFACES,
  REGISTERS,
  THESIS,
  UNFURL,
  UTILITY_HEROES,
  VOICES,
  arcDiff,
  featureDiff,
  featurePagesPaste,
  held,
  pageCardDiff,
  pick,
  sectionHeadersPaste,
  utilityDiff,
  voiceById,
  type ArcSection,
  type PageCard,
  type Surface,
  type Trio,
  type UtilityHero,
  type VoiceId,
  type WholePage,
} from "./voices";

/**
 * THE BRAND-VOICE BOARD, ROUND THREE (2026-09-14).
 *
 * WHAT ROUND TWO BUILT. Round one argued three voices on seven HEADERS; round
 * two walked WHOLE surfaces in the selected voice, because a voice is judged in
 * a paragraph and a page: the home arc's fifteen sections top to bottom on
 * their real grounds, two feature pages whole, the six pages' thirty identity
 * strings with the paste the infusion round runs, the app's quiet copy, and the
 * guest surfaces with Partyreel nearly silent.
 *
 * WHAT ROUND THREE CHANGED, which is the walk Will takes, taken first:
 *  1. THE DECISION IS ON TOP. The recommendation, its cost and the three things
 *     to look at open the board, the strongest candidate is the first column
 *     and the default, and twelve chapters are a one-click index in the bar.
 *     A fifteen-thousand-pixel board with its verdict at the bottom is a board
 *     nobody rules on.
 *  2. THE COST IS MEASURED, not asserted. A voice's price on a headline is how
 *     many rows the h1 takes, so the board MEASURES all three columns at the
 *     live canvas (RowCounts below) instead of printing a number typed into a
 *     sentence months ago. The same ruler runs under the thesis.
 *  3. THE PAGES THE ARC DOES NOT REACH. /help, /contact and /pricing carry the
 *     site's two most generic lines and were on no board; the guide's own
 *     surfaces table named a help article nothing had ever rendered. Chapter 9.
 *  4. LESS TO RULE ON. Two departures moved into the asks they had become, the
 *     twelve app and guest rewrites are marked as sweep work with the ONE row
 *     bible 4 already decides called out (compelled, not an eighth ask: its
 *     only choosable part, the noun, is ask 7), and the remaining departures
 *     are only the ones Will must answer.
 *
 * STANDING JUDGMENTS from round two, kept: candidate C retired as a column
 * (its one real question, the thesis, is chapter 5); every candidate ships as a
 * real TypeScript PASTE, since copy cannot be applied to the site as CSS; every
 * line a candidate HOLDS is marked and counted, because where a voice does not
 * bite is as much of the ruling as where it does. A was re-judged from the
 * ground up this round and keeps its column: it is the only answer that costs
 * the feature pages almost nothing, which is an argument, not a shade of B.
 *
 * The lines live in ./voices.ts so this file is layout only. Nothing here is
 * imported by production and no production byte changed on this track.
 *
 * ★ WHY THE STAGES FORCE data-inview: the marketing reveal grammar rests every
 * [data-mkt-reveal] slot at opacity 0 in BOTH motion preferences (marketing.css
 * chapter 1) and waits on the Reveal island. This is a READING board, so a
 * subhead that has to be scrolled into view is a subhead Will cannot rule on.
 * The wrapper sets the final state the CSS already defines, which is the house
 * convention (final states outside the media queries) rather than an override.
 * The sections take reveal="none" for the same reason, through the real prop.
 *
 * ★ WHY THE SECTIONS ARE COMPRESSED: the board judges the LINE, not the arc's
 * vertical rhythm, which belongs to the home page and is ruled elsewhere. The
 * type, the ground and the heading tiers are the real ones; only the air
 * between sections is compressed so a chapter reads as one stretch.
 */

/** The verdict, on top. A board this tall with its recommendation at the
 *  bottom is a board that gets scrolled, not ruled on. */
const LEAD = {
  what: "What Partyreel sounds like, argued where a voice is actually judged: whole pages. Three columns, one toggle, and every line a candidate keeps verbatim marked held. Twelve chapters, and seven asks at the foot that each answer in one word.",
  recommend: "B, the room.",
  because:
    "It is the only candidate built from the one thing only this product does, a code on a table becoming an album while the party is still going, and it is the reason a line here could not be said by a shared folder or a group chat.",
  second:
    "A, the house, is the cheap answer and a real one: it tunes the register the eight ratified lines already speak, and it barely touches the feature pages, which are finished.",
};

/** Three pointers, each an anchor. The round-three walk found that a stranger
 *  reads the first screen and then scrolls looking for the argument. */
const LOOK_AT = [
  {
    href: "#bv-2",
    label: "Chapter 2 to 4, the arc top to bottom",
    line: "Fifteen sections in shipped order on their real grounds. Read it once on Today and once on B; the bar counts what moved.",
  },
  {
    href: "#bv-6",
    label: "Chapters 6 and 7, the feature pages whole",
    line: "Cards and all. The ledgers count what a voice costs there, and the answer is almost nothing: the arc is unwritten while these pages are finished.",
  },
  {
    href: "#bv-9",
    label: "Chapter 9, the pages the arc does not reach",
    line: "/help, /contact and /pricing. Two of the site's most generic lines live here, and one of them is the model for the fence that keeps our support copy legal.",
  },
];

/** The twelve chapters, for the index in the bar. */
const CHAPTERS: { id: string; label: string }[] = [
  { id: "bv-1", label: "1 voice" },
  { id: "bv-2", label: "2 arc I" },
  { id: "bv-3", label: "3 arc II" },
  { id: "bv-4", label: "4 arc III" },
  { id: "bv-5", label: "5 thesis" },
  { id: "bv-6", label: "6 album" },
  { id: "bv-7", label: "7 curation" },
  { id: "bv-8", label: "8 strings" },
  { id: "bv-9", label: "9 help, contact, pricing" },
  { id: "bv-10", label: "10 the app" },
  { id: "bv-11", label: "11 guests" },
  { id: "bv-12", label: "12 unfurl" },
];

const QUESTION =
  "What Partyreel sounds like, argued on whole pages: the home arc top to bottom, two feature pages whole, the three pages a reader reaches when they are deciding or when something broke, the app's quiet copy and the guest surfaces, each in the selected voice beside today's.";

/** Every ask answers in ONE word. The recommendation is in the line, so a
 *  ruling can be "B, whole, take, email, yes, keep, album". */
const ASKS = [
  "The voice: B, A, or today (the agent recommends B)",
  "The seven provisional home headers: whole in the selected voice, or line by line from the ledgers (the agent recommends whole)",
  "The rest of the arc, its eyebrows, supporting lines and CTAs: take the selected voice, or hold today's (the agent recommends take)",
  "Bible 20's replacement, in one sentence: lead with what arrives, an absence may be the second beat, never the first, and never both. Yes, or send it back",
  "The thesis: keep in one album, or take as everyone saw it (the agent recommends keep)",
  "One noun for the thing: album everywhere, or album on the site and gallery on a guest's screen (the agent recommends album)",
  "The account-required unfurl line: email, or sign in (the agent recommends email)",
];

/** Only what Will must rule on that is not already an ask. Round two's other
 *  two departures became asks 4 and 6 and left. */
const DEPARTURES = [
  "Candidate C was RETIRED as a column, which is the board's judgment rather than a ruling. Across fifteen sections and two whole pages C read as B with everyone substituted in seven places, so it cost a third of the board and answered nothing B did not. Its one real question, the thesis, is chapter 5 and ask 5. Say the word and it comes back as a column.",
  "The five copy-alternative picks have lost their list: the queue item predates the docs consolidation and no list survives in the repo. The board reads it as the five headers carrying an appetite for a DIFFERENT line (liveDemo, album, curation, privacy, reel), marked with a dot in the ledgers. Correct it and the board adds the missing picks.",
  "The home page is about to carry two different counts. The hero variations propose 312 photos from 48 guests as a stand-in, and the decomposition band two sections below ships Built from 214 photos. Shot by 23 guests. Do 3 of the guide (only proof the product produced) makes that one source and one pair of numbers, read from the demo event, wherever the composition pass lands them.",
];

const VOICE_OPTIONS = VOICES.map((v) => ({ id: v.id, label: v.name }));

/** The real hrefs behind each section's chevron CTA, so the board renders the
 *  shipped LearnMoreLink rather than a look-alike. */
const CTA_HREF: Record<string, string> = {
  "film-strip": "/how-it-works",
  "no-app": "/features/guests",
  "full-quality": "/features/album",
  album: "/features/album",
  curation: "/features/curation",
  privacy: "/features/privacy",
  "reel-teaser": "/reel#styles",
  "events-teaser": "/events",
};

/* -------------------------------------------------------------------------
 * Small pieces
 * ---------------------------------------------------------------------- */

/** A numbered chapter with an anchor, so the index in the bar can reach it.
 *  `scroll-mt` clears the sticky bar, which is two rows tall once the index
 *  wraps. */
function Chapter({
  id,
  n,
  name,
  rationale,
  children,
}: {
  id: string;
  n: number;
  name: string;
  rationale: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-28">
      <Variant n={n} name={name} rationale={rationale} framed={false}>
        {children}
      </Variant>
    </div>
  );
}

/**
 * A chapter's stage and what reads beside or beneath it.
 *
 * ★ WHY THE PHONE CANVAS PUTS THE LEDGER BESIDE THE STAGE. A 375 stage sits in
 * a column three times its width, so the phone walk was twenty-three thousand
 * pixels of board with eight hundred of dead ground on either side of every
 * chapter, and the line being judged was a full screen away from the line it
 * replaces. Side by side, the phone walk is the same length as the desktop one
 * and the comparison is in one view. The desktop canvas keeps the ledger
 * underneath: at 1440 the stage already fills the column.
 *
 * The `lg:` here is deliberate and correct, unlike a prefix INSIDE a stage: it
 * is the board's own chrome, so the real browser viewport is exactly what it
 * should key off.
 */
function ChapterBody({
  mode,
  stage,
  aside,
}: {
  mode: Mode;
  stage: React.ReactNode;
  aside: React.ReactNode;
}) {
  if (mode === "phone") {
    return (
      <div className="grid items-start gap-6 lg:grid-cols-[375px_minmax(0,1fr)]">
        <div>{stage}</div>
        <div>{aside}</div>
      </div>
    );
  }
  return (
    <div>
      {stage}
      {aside}
    </div>
  );
}

/** The held marker: a candidate keeping the shipped line unchanged. */
function Held() {
  return (
    <span className="bv-held rounded-full border border-border px-1.5 py-px text-[10px] text-muted-foreground">
      held
    </span>
  );
}

/** A copy-to-clipboard block: a candidate is only ruled on if it can ship, and
 *  copy cannot be applied to the site as CSS, so the paste IS the artifact. */
function CopyPaste({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          void navigator.clipboard
            ?.writeText(text)
            .then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            })
            .catch(() => setCopied(false));
        }}
      >
        {copied ? "Copied" : label}
      </Button>
      <p className="text-[11px] text-muted-foreground">
        {text.split("\n").length} lines of real TypeScript, ready for the
        infusion round.
      </p>
    </div>
  );
}

/** The CTA row as the real components: chevron links where the section ships
 *  one, buttons where it ships buttons. */
function Cta({ id, text }: { id: string; text: string }) {
  if (!text) return null;
  const href = CTA_HREF[id];
  if (href) {
    return (
      <div className="mt-4 flex justify-center">
        <LearnMoreLink href={href}>{text}</LearnMoreLink>
      </div>
    );
  }
  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
      {text.split("·").map((label, i) => (
        <Button
          key={label}
          size="lg"
          variant={i === 0 ? "default" : "outline"}
          className="h-11 px-6 text-base"
        >
          {label.trim()}
        </Button>
      ))}
    </div>
  );
}

/** A claim row: the trust strip's four, a section's three or five titles. */
function Items({
  items,
  voice,
  strip,
}: {
  items: Trio[];
  voice: VoiceId;
  strip?: boolean;
}) {
  if (strip) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-y border-border/60 py-5">
        {items.map((t, i) => (
          <span key={i} className="text-sm text-muted-foreground">
            {pick(t, voice)}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="mt-6 flex flex-wrap items-start justify-center gap-x-8 gap-y-3">
      {items.map((t, i) => (
        <p key={i} className="font-heading text-lg">
          {pick(t, voice)}
        </p>
      ))}
    </div>
  );
}

/** Border (2) plus the worst rounding a fractional zoom can add. Dead ground,
 *  not a guess at the copy: it is the same number on every stage. */
const FIT_SLACK = 8;

/**
 * A Stage whose height is its CONTENT's height, measured rather than written.
 *
 * ★ WHY NO STAGE ON THIS BOARD CARRIES A LITERAL HEIGHT ANY MORE. A Stage is a
 * fixed box with `overflow: hidden`, so a number typed into it is a promise
 * about content that has to hold for three voices, two canvases, and every
 * window width the board is read at. That last one is not obvious and is the
 * reason round two's hand-tuned numbers failed review: a real marketing
 * component inside a Stage resolves its own `sm:`/`lg:` rungs against the REAL
 * browser window, not the canvas, so the arc's chapters measure up to 40px
 * taller in a 1512 window than in a narrow one, in the same voice. Two stages clipped a heading,
 * one of them the hero board 5 asks a ruling on, which is the worst possible
 * place to lose a word. A literal also cannot survive an edit to the copy
 * above it, and editing copy is the entire activity on a copy board.
 *
 * So the stage takes the height from the content: one layout pass before the
 * first paint (useLayoutEffect, so nothing is ever painted at the default
 * canvas height), then a ResizeObserver for the two things that move a wrap
 * afterwards, the webfont settling and the window resizing. The children drop
 * `min-h-full` for the same reason: the ground is the Stage's own background,
 * and content stretched to fill a box cannot be used to measure it.
 *
 * offsetHeight, not getBoundingClientRect: the Stage fits the lab column with
 * `zoom`, and a rect is in the zoomed frame while the height prop is not.
 */
function FitStage({
  mode,
  ground,
  swapKey,
  className,
  children,
}: {
  mode: Mode;
  ground: Ground;
  /** Remounts the inner block so the voice swap still animates. It is a level
   *  BELOW the measured node on purpose: a key change on the measured node
   *  would swap the element out from under the observer. */
  swapKey?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // scrollHeight as well as offsetHeight, so a descendant sitting a hair past
    // the block is inside the box; then FIT_SLACK, which is not a fudge for the
    // copy but for two mechanical facts: the Stage is border-box, so its 1px
    // border comes OUT of the height it is handed, and it fits the lab column
    // with a fractional `zoom`, which rounds the box at the device pixel. Both
    // showed up as a constant few-pixel clip on every stage at once, in every
    // voice, which is how you tell them from a line that does not fit.
    const sync = () =>
      setHeight(
        Math.ceil(Math.max(el.offsetHeight, el.scrollHeight)) + FIT_SLACK,
      );
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    window.addEventListener("resize", sync);
    // The webfont lands after the first layout and takes every wrap with it.
    document.fonts?.ready.then(sync).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
    // swapKey is a dependency, not just an RO's problem: a voice change swaps
    // every string in the stage at once, and the observer was measurably late
    // on it (a stage stayed a few pixels short until something else nudged it).
    // In a layout effect the new copy is measured before the frame is painted.
  }, [mode, swapKey]);

  return (
    <Stage mode={mode} ground={ground} height={height}>
      {/* flow-root, so a child's margin cannot collapse out of the thing being
          measured and hand back a height shorter than what is drawn. */}
      <div ref={ref} className="flow-root">
        <div
          key={swapKey}
          data-inview="true"
          data-bv-canvas={mode}
          data-bv-swap
          className={className}
        >
          {children}
        </div>
      </div>
    </Stage>
  );
}

/* -------------------------------------------------------------------------
 * The ruler: what a voice costs a headline, measured
 * ---------------------------------------------------------------------- */

/**
 * ★ WHY THE ROW COUNT IS MEASURED HERE RATHER THAN WRITTEN IN A SENTENCE.
 * The one price a longer voice pays on a marketing page is rows: an h1 that
 * takes four lines on a phone where today's takes three is the whole argument
 * against B, and round two carried that number as PROSE ("four rows at 375"),
 * typed once and never checked again. It was also unreadable off the board,
 * since only one column renders at a time.
 *
 * So the board measures. A shallow clone of the LIVE heading (same class list,
 * so it resolves the same restored ladder and the same face) is filled with
 * each candidate's line at the heading's own width, and the line boxes are
 * counted off a Range. Every number the board prints about wrapping comes from
 * the element the reader is looking at, at the canvas they are looking at.
 *
 * The count is true of TODAY'S ladder. The type-scale board proposes ladders
 * that would move the hero step, which would move these numbers with it; the
 * caption says so rather than pretending a rendered measurement is a constant.
 */
function rowsOf(el: HTMLElement, text: string): number {
  const probe = el.cloneNode(false) as HTMLElement;
  probe.textContent = text;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.left = "0";
  probe.style.top = "0";
  // offsetWidth, not the rect: a Stage fits the lab column with `zoom`, so the
  // rect is in the zoomed frame while layout px are not.
  probe.style.width = `${el.offsetWidth}px`;
  const parent = el.parentElement;
  if (!parent) return 0;
  parent.appendChild(probe);
  const range = document.createRange();
  range.selectNodeContents(probe);
  const tops = Array.from(range.getClientRects())
    .map((r) => r.top)
    .sort((a, b) => a - b);
  probe.remove();
  // Group by line box: a rect per text run, several runs to a row.
  let rows = 0;
  let last = Number.NEGATIVE_INFINITY;
  for (const t of tops) {
    if (t - last > 2) rows += 1;
    last = t;
  }
  return rows;
}

/** "B. The room" reads as "B" in a measured caption; Today stays a word. */
const shortLabel = (name: string) => (name === "Today" ? "today" : name[0]);

/** The home hero's h1 in all three columns, measured side by side so the cost
 *  can be read without toggling and holding two numbers in your head. */
const HERO_ROW_LINES = VOICES.map((v) => ({
  label: shortLabel(v.name),
  text: pick(ARC[0].header, v.id),
}));

/** The thesis pair, the two lines ask 5 chooses between. */
const THESIS_ROW_LINES = [
  { label: "in one album", text: THESIS.ruled },
  { label: "as everyone saw it", text: THESIS.alternative },
];

/** The measured caption under a stage. `selector` is resolved inside `host`. */
function RowCounts({
  host,
  selector,
  lines,
  mode,
  lead,
}: {
  host: React.RefObject<HTMLDivElement | null>;
  selector: string;
  /** Label and the exact string to set on the clone, in column order. */
  lines: { label: string; text: string }[];
  mode: Mode;
  lead: string;
}) {
  const [rows, setRows] = useState<number[] | null>(null);

  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    let live = true;
    const measure = () => {
      if (!live) return;
      const target = el.querySelector<HTMLElement>(selector);
      if (!target) return;
      setRows(lines.map((l) => rowsOf(target, l.text)));
    };
    measure();
    // The webfont lands after the first layout and takes every wrap with it.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      live = false;
    };
  }, [host, selector, lines, mode]);

  if (!rows) return null;
  return (
    <p className="bv-rows mt-2 text-[11px] leading-relaxed text-muted-foreground">
      <span className="text-foreground">
        {lead}{" "}
        {lines.map((l, i) => `${i > 0 ? " · " : ""}${l.label} ${rows[i]}`)}
        .{" "}
      </span>
      {/* One template string, not JSX text around an expression: the space
          after the canvas number kept disappearing through a reformat, and a
          caption that reads "1440on" is a caption nobody trusts the numbers
          in. */}
      <span>
        {`Measured at ${mode === "desktop" ? "1440" : "375"} on the heading above, at today\u2019s ladder: a ruling on the type scale moves these numbers with it.`}
      </span>
    </p>
  );
}

/* -------------------------------------------------------------------------
 * The arc
 * ---------------------------------------------------------------------- */

/** One arc section on the real shells, in the selected voice. */
function ArcBlock({
  section,
  voice,
  mode,
}: {
  section: ArcSection;
  voice: VoiceId;
  mode: Mode;
}) {
  // twMerge cannot drop SectionShell's `sm:py-24` with a bare `py-10`, and a
  // Tailwind prefix inside a Stage reads the REAL viewport, so the sm rung has
  // to be named explicitly or every chapter walks with 96px of dead air per cut.
  const pad = mode === "desktop" ? "py-10 sm:py-10" : "py-7 sm:py-7";

  if (section.id === "trust-strip") {
    return (
      <div className="px-6">
        <Items items={section.items ?? []} voice={voice} strip />
      </div>
    );
  }

  if (section.id === "decomposition") {
    return (
      <div className={`px-6 text-center ${pad}`}>
        <p className="mx-auto max-w-2xl font-heading text-2xl text-balance sm:text-3xl">
          {pick(section.support, voice)}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1">
          {(section.items ?? []).map((t, i) => (
            <span key={i} className="text-sm text-muted-foreground">
              {pick(t, voice)}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (section.tier === "hero") {
    return (
      <PageHero
        data-bv-type="hero-xl"
        className="w-full py-10"
        scale="xl"
        eyebrow={pick(section.eyebrow, voice)}
        heading={pick(section.header, voice)}
        subhead={pick(section.support, voice)}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {pick(section.cta, voice)
              .split("·")
              .map((label, i) => (
                <Button
                  key={label}
                  size="lg"
                  variant={i === 0 ? "default" : "outline"}
                  className="h-11 px-6 text-base"
                >
                  {label.trim()}
                </Button>
              ))}
          </div>
        }
      />
    );
  }

  return (
    <SectionShell
      data-bv-type={section.tier === "lg" ? "section-lg" : "section"}
      className={pad}
      reveal="none"
      scale={section.tier === "lg" ? "lg" : "default"}
      align={section.align === "left" ? "left" : "center"}
      eyebrow={pick(section.eyebrow, voice)}
      heading={pick(section.header, voice)}
      subhead={pick(section.support, voice)}
    >
      {section.items && <Items items={section.items} voice={voice} />}
      <Cta id={section.id} text={pick(section.cta, voice)} />
    </SectionShell>
  );
}

/** One chapter of the arc, on its real ground, in arc order. */
function ArcChapter({
  sections,
  voice,
  mode,
  ground,
}: {
  sections: ArcSection[];
  voice: VoiceId;
  mode: Mode;
  ground: Ground;
}) {
  return (
    <FitStage mode={mode} ground={ground} swapKey={voice}>
      {sections.map((s) => (
        <ArcBlock key={s.id} section={s} voice={voice} mode={mode} />
      ))}
    </FitStage>
  );
}

const SLOT_LABEL: Record<string, string> = {
  eyebrow: "Eyebrow",
  header: "Header",
  support: "Support",
  cta: "CTA",
  items: "Claims",
};

/** The ledger under a chapter: every slot, today beside the candidate, with
 *  held marked. This is the surface a line-by-line ruling is written on. */
function Ledger({
  sections,
  voice,
}: {
  sections: ArcSection[];
  voice: VoiceId;
}) {
  const rows = (s: ArcSection): { slot: string; trio: Trio | Trio[] }[] => {
    const out: { slot: string; trio: Trio | Trio[] }[] = [];
    if (s.eyebrow) out.push({ slot: "eyebrow", trio: s.eyebrow });
    if (s.header) out.push({ slot: "header", trio: s.header });
    if (s.support) out.push({ slot: "support", trio: s.support });
    if (s.items) out.push({ slot: "items", trio: s.items });
    if (s.cta) out.push({ slot: "cta", trio: s.cta });
    return out;
  };
  const join = (t: Trio | Trio[], id: VoiceId) =>
    Array.isArray(t) ? t.map((x) => pick(x, id)).join("  ·  ") : pick(t, id);
  const allHeld = (t: Trio | Trio[], id: VoiceId) =>
    Array.isArray(t) ? t.every((x) => held(x, id)) : held(t, id);

  // The dot was a `title` tooltip, which on a board nobody hovers is a mark
  // that means nothing. It says what it is now, once per ledger that has one.
  const hasPick = sections.some((s) => s.pick);

  return (
    <dl className="bv-arc-ledger mt-4 space-y-3 text-xs">
      {hasPick && (
        <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
          <span className="inline-block size-1.5 rounded-full bg-foreground/60" />
          <span>
            one of the five copy-alternative picks · ruled means the shipped
            line is already a ruling, so a rewrite is a bigger ask
          </span>
        </div>
      )}
      {sections.map((s) => (
        <div key={s.id} className="space-y-1.5">
          <dt className="flex flex-wrap items-baseline gap-x-2 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">{s.id}</span>
            {s.pick && (
              <span
                title="one of the five copy-alternative picks"
                className="inline-block size-1.5 rounded-full bg-foreground/60"
              />
            )}
            {s.ruled && <span>ruled</span>}
            {s.appetite && <span>{s.appetite}</span>}
          </dt>
          {rows(s).map(({ slot, trio }) => (
            <dd
              key={slot}
              className="grid gap-x-3 gap-y-0.5 sm:grid-cols-[4.5rem_minmax(0,1fr)]"
            >
              <span className="text-[11px] text-muted-foreground">
                {SLOT_LABEL[slot]}
              </span>
              <span className="space-y-0.5">
                <span className="block text-muted-foreground">
                  {join(trio, "today")}
                </span>
                {voice !== "today" &&
                  (allHeld(trio, voice) ? (
                    <span className="block">
                      <Held />
                    </span>
                  ) : (
                    <span className="block text-foreground">
                      {join(trio, voice)}
                    </span>
                  ))}
              </span>
            </dd>
          ))}
        </div>
      ))}
    </dl>
  );
}

/**
 * A section's card set, at the width the copy was measured in.
 *
 * ★ WHY THE WIDTHS ARE SPELLED, not `sm:`/`lg:`: album-copy.ts states the
 * bands it was written to (measured at 1440 in `text-sm leading-relaxed`: a
 * three-up column holds about 40 characters a row, a four-up about 34, and
 * two rows is the target for every body). A Tailwind breakpoint inside a Stage
 * reads the REAL viewport, so a `lg:w-1/3` here would put a desktop column
 * inside the 375 box and every band would be judged against the wrong wrap.
 */
function Cards({
  cards,
  voice,
  mode,
  columns = 3,
}: {
  cards: PageCard[];
  voice: VoiceId;
  mode: Mode;
  columns?: 3 | 4;
}) {
  const grid =
    mode === "desktop"
      ? `mx-auto mt-9 grid max-w-5xl gap-x-6 gap-y-7 text-left ${columns === 4 ? "grid-cols-4" : "grid-cols-3"}`
      : "mx-auto mt-7 grid max-w-sm gap-5 text-left";
  return (
    <div className={grid}>
      {cards.map((c, i) => (
        <div key={i} className="flex flex-col gap-1">
          <h3
            className={
              mode === "desktop"
                ? "font-heading text-lg"
                : "font-heading text-base"
            }
          >
            {pick(c.title, voice)}
          </h3>
          <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
            {pick(c.body, voice)}
          </p>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * A feature page, whole
 * ---------------------------------------------------------------------- */

function FeaturePageStage({
  page,
  voice,
  mode,
}: {
  page: WholePage;
  voice: VoiceId;
  mode: Mode;
}) {
  const strings = FEATURES.find((f) => f.slug === page.slug);
  const pad = mode === "desktop" ? "py-10 sm:py-10" : "py-7 sm:py-7";
  // The page's own chapters: consecutive same-ground sections share a stage,
  // exactly as PaperChapter groups them on the real route.
  const chunks: { ground: "cinema" | "paper"; items: typeof page.sections }[] =
    [];
  for (const s of page.sections) {
    const last = chunks[chunks.length - 1];
    if (last && last.ground === s.ground) last.items.push(s);
    else chunks.push({ ground: s.ground, items: [s] });
  }

  return (
    <div className="space-y-2">
      <FitStage mode={mode} ground="cinema" swapKey={voice}>
        <PageHero
          data-bv-type="hero-lg"
          className="w-full py-10"
          scale="lg"
          eyebrow={pick(strings?.navLabel, voice)}
          heading={pick(strings?.h1, voice)}
          subhead={pick(strings?.heroSub, voice)}
        />
      </FitStage>
      {chunks.map((chunk, i) => (
        <FitStage key={i} mode={mode} ground={chunk.ground} swapKey={voice}>
          <>
            {chunk.items.map((s, j) => (
              <SectionShell
                key={j}
                data-bv-type="section"
                className={pad}
                reveal="none"
                eyebrow={pick(s.eyebrow, voice)}
                heading={pick(s.header, voice)}
                subhead={pick(s.support, voice)}
              >
                {s.cards && (
                  <Cards
                    cards={s.cards}
                    voice={voice}
                    mode={mode}
                    columns={s.cardColumns}
                  />
                )}
                {s.cta && (
                  <div className="mt-5 flex justify-center">
                    <Button size="lg" className="h-11 px-6 text-base">
                      {pick(s.cta, voice)}
                    </Button>
                  </div>
                )}
              </SectionShell>
            ))}
          </>
        </FitStage>
      ))}
      <CardLedger page={page} voice={voice} />
    </div>
  );
}

/** What the cards cost, counted, with the reason a set holds written under it.
 *  The goal asked for the feature pages WHOLE, and a page's cards carry more
 *  words than every heading on it put together; both candidates come out low
 *  here, so the count has to be on the board rather than asserted. */
function CardLedger({ page, voice }: { page: WholePage; voice: VoiceId }) {
  const d = pageCardDiff(page, voice);
  const noted = page.sections.filter((s) => s.cards && s.cardNote);
  return (
    <div className="bv-card-ledger space-y-2 pt-3 text-xs leading-relaxed text-muted-foreground">
      <p>
        <span className="text-foreground">
          {voice === "today"
            ? `${d.cards} cards on this page, ${d.total} strings.`
            : `Cards: ${d.moved} of ${d.total} strings move, across ${d.cards} cards.`}
        </span>{" "}
        The titles and bodies are the shipped objects, imported rather than
        retyped, so the board cannot drift from the page.
      </p>
      {voice !== "today" &&
        noted.map((s) => (
          <p key={pick(s.eyebrow, "today") || pick(s.header, "today")}>
            <span className="text-foreground">
              {pick(s.eyebrow, "today") || pick(s.header, "today")}.{" "}
            </span>
            {s.cardNote}
          </p>
        ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * A quiet or guest surface
 * ---------------------------------------------------------------------- */

function SurfaceCard({ s, mode }: { s: Surface; mode: Mode }) {
  const unchanged =
    s.today.title === s.proposed.title &&
    s.today.body === s.proposed.body &&
    s.today.action === s.proposed.action;
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <p className="text-[11px] font-medium text-foreground">{s.surface}</p>
        <p className="text-[11px] text-muted-foreground">{s.where}</p>
        {unchanged && <Held />}
        {/* The one row on these two chapters a bible rule already decides,
            marked with the rule that owns it. Everything else here is the
            infusion round's ordinary work, shown so the register can be read,
            and round three marks the difference rather than leaving twelve
            rewrites all looking like rulings. The mark is never an ask: the
            asks are the seven in the bar, and this row's only choosable part
            (the noun) is ask 7. */}
        {s.compelled && (
          <span className="rounded-full bg-foreground px-1.5 py-px text-[10px] text-background">
            {s.compelled}
          </span>
        )}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
        {s.rule}
      </p>
      {/* mode, never a `sm:` prefix: a Tailwind breakpoint inside a Stage reads
          the REAL viewport, so sm:grid-cols-2 would put two columns in a
          375-wide box. */}
      <div
        className={
          mode === "desktop"
            ? "mt-2 grid grid-cols-2 gap-x-5 gap-y-3"
            : "mt-2 grid gap-y-3"
        }
      >
        {(["today", "proposed"] as const).map((col) => {
          const v = s[col];
          return (
            <div key={col}>
              <p className="text-[11px] text-muted-foreground">
                {col === "today" ? "Today" : "Proposed"}
              </p>
              <p
                className={
                  col === "today"
                    ? "text-sm text-muted-foreground"
                    : "text-sm text-foreground"
                }
              >
                {v.title}
              </p>
              {v.body && (
                <p className="mt-0.5 text-xs text-muted-foreground">{v.body}</p>
              )}
              {v.action && (
                <p className="mt-1.5 inline-flex rounded-md bg-foreground px-2.5 py-1 text-[11px] text-background">
                  {v.action}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        {s.note}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * The pages the arc does not reach
 * ---------------------------------------------------------------------- */

/** A help article's head, as the article renders it (the category badge and the
 *  title on its own ramp), with the description beneath, which is where the
 *  catalogue row and the search result read it. */
function HelpHead({
  category,
  title,
  description,
}: {
  category: string;
  title: string;
  description: string;
}) {
  return (
    <div data-bv-type="section-lg" className="mx-auto max-w-3xl px-6">
      <Badge variant="secondary">{category}</Badge>
      <h2 className="mt-4 font-heading text-balance">{title}</h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        The description, which the article page never shows: it is the catalogue
        row, the search result and the meta description.
      </p>
    </div>
  );
}

function UtilityChapter({ voice, mode }: { voice: VoiceId; mode: Mode }) {
  const util = utilityDiff(voice);
  const hero = (h: UtilityHero) => (
    <PageHero
      key={h.route}
      data-bv-type="hero-lg"
      className="w-full"
      scale="lg"
      eyebrow={pick(h.eyebrow, voice)}
      heading={pick(h.header, voice)}
      subhead={pick(h.support, voice)}
    />
  );
  return (
    <div className="space-y-2">
      <FitStage
        mode={mode}
        ground="cinema"
        swapKey={voice}
        className="space-y-12 py-12"
      >
        {UTILITY_HEROES.filter((h) => h.ground === "cinema").map(hero)}
        {HELP_HEADS.map((a) => (
          <HelpHead
            key={a.slug}
            category={a.category}
            title={a.title}
            description={a.description}
          />
        ))}
      </FitStage>
      <FitStage
        mode={mode}
        ground="paper"
        swapKey={voice}
        className="space-y-12 py-12"
      >
        {UTILITY_HEROES.filter((h) => h.ground === "paper").map(hero)}
      </FitStage>
      <div className="space-y-2 pt-3 text-xs leading-relaxed text-muted-foreground">
        <p>
          <span className="text-foreground">
            {voice === "today"
              ? `${util.total} lines across the three heroes.`
              : `${util.moved} of ${util.total} lines move across the three heroes.`}
          </span>{" "}
          Both article heads hold in every column, which is the finding rather
          than an omission: the 59 articles were written to the shape the guide
          prescribes, so a voice ruling costs the help catalogue nothing.
        </p>
        {UTILITY_HEROES.map((h) => (
          <p key={h.route}>
            <span className="text-foreground">{h.route}. </span>
            {h.note}
          </p>
        ))}
        {HELP_HEADS.map((a) => (
          <p key={a.slug}>
            <span className="text-foreground">/help/{a.slug}. </span>
            {a.note}
          </p>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * The board
 * ---------------------------------------------------------------------- */

const CHAPTER_1 = ARC.slice(0, 7);
const CHAPTER_PAPER = ARC.slice(7, 10);
const CHAPTER_CLOSE = ARC.slice(10);

export function BrandVoiceBoard() {
  const [mode, setMode] = useState<Mode>("desktop");
  const [voiceId, setVoiceId] = useState<VoiceId>("room");
  const voice = voiceById(voiceId);
  const desktop = mode === "desktop";
  const arc = arcDiff(voiceId);
  const feat = featureDiff(voiceId);
  // The two stages the ruler measures inside.
  const arcHeroRef = useRef<HTMLDivElement | null>(null);
  const thesisRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="bv-round-three flex flex-col gap-8 py-4">
      {/* THE VERDICT, ON TOP. Round three's walk: a stranger reads the first
          screen and then scrolls fifteen thousand pixels looking for the
          argument. It is here instead, with the three chapters that carry it. */}
      <div className="max-w-3xl space-y-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {LEAD.what}
        </p>
        <div className="rounded-lg border border-border bg-card px-5 py-4">
          <p className="text-[11px] font-medium text-muted-foreground">
            The recommendation
          </p>
          <p className="mt-1 font-heading text-2xl">{LEAD.recommend}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {LEAD.because}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {LEAD.second}
          </p>
        </div>
        <dl className="space-y-1.5 text-xs leading-relaxed">
          <dt className="text-[11px] font-medium text-muted-foreground">
            Look at first
          </dt>
          {LOOK_AT.map((l) => (
            <dd key={l.href}>
              <a
                href={l.href}
                className="text-foreground underline underline-offset-2"
              >
                {l.label}
              </a>
              <span className="text-muted-foreground"> {l.line}</span>
            </dd>
          ))}
        </dl>
      </div>

      {/* The switch follows the walk: the arc runs for several screens and a
          voice toggle at the top of it is a toggle nobody reaches. The index
          rides with it for the same reason (borrowed from the palette board's
          round two, which found the same thing on a board half this tall). */}
      <div className="bv-controls sticky top-0 z-20 -mx-2 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-background/95 px-2 py-3 backdrop-blur">
        <Toggle
          ariaLabel="Viewport"
          options={[
            { id: "desktop" as Mode, label: "Desktop" },
            { id: "phone" as Mode, label: "Phone 375" },
          ]}
          value={mode}
          onChange={setMode}
        />
        <Toggle
          ariaLabel="Voice"
          options={VOICE_OPTIONS}
          value={voiceId}
          onChange={setVoiceId}
        />
        <p className="text-[11px] text-muted-foreground">
          {voiceId === "today"
            ? "The shipped lines, the control."
            : `${voiceId === "room" ? "Recommended. " : ""}Moves ${arc.moved} of ${arc.total} lines in the arc, ${feat.moved} of ${feat.total} on the feature pages.`}
        </p>
        {/* One row, and it scrolls rather than wrapping: at 1440 the twelve fit
            on a line, and on a narrow window a wrapping index turned the
            sticky bar into four rows that ate a third of the viewport. */}
        <nav
          aria-label="Chapters"
          className="flex w-full items-center gap-x-3 overflow-x-auto whitespace-nowrap"
        >
          {CHAPTERS.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {c.label}
            </a>
          ))}
        </nav>
      </div>

      <Chapter
        id="bv-1"
        n={1}
        name="The voice, in one paragraph"
        rationale="The first ask, with what each answer costs. The three registers below are shown once, because round one found that they do not fork with the voice: only the marketing register's default sentence shape moves."
      >
        <div className="space-y-5">
          <div
            key={voice.id}
            data-bv-swap
            className="rounded-lg border border-border bg-card px-5 py-4"
          >
            <p className="text-[11px] font-medium text-muted-foreground">
              {voice.name}
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground">
              {voice.paragraph}
            </p>
            <p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">
              {voice.rationale}
            </p>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
              <span className="text-foreground">What it costs. </span>
              {voice.cost}
            </p>
          </div>
          <dl className="grid gap-3 sm:grid-cols-3">
            {REGISTERS.map((r) => (
              <div
                key={r.name}
                className="rounded-lg border border-border bg-card px-4 py-3"
              >
                <dt className="text-xs font-medium text-foreground">
                  {r.name}
                </dt>
                <dd className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {r.rule}
                </dd>
              </div>
            ))}
          </dl>
          <div className="rounded-lg border border-border bg-card px-5 py-4">
            <p className="text-[11px] font-medium text-muted-foreground">
              Bible 20&rsquo;s replacement, in one sentence (ask 5)
            </p>
            <p className="mt-2 max-w-3xl font-heading text-xl text-balance">
              Lead with what arrives; an absence may be the second beat, never
              the first, and never both.
            </p>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
              It keeps the ruled line (Scan, upload, done. No app to install.)
              and kills the doubled-absence one (Nothing to install. Nothing to
              sign up for.), which is the rule the whole arc below is written
              against.
            </p>
          </div>
        </div>
      </Chapter>

      <Chapter
        id="bv-2"
        n={2}
        name="The home arc, chapter one: the event"
        rationale="Seven sections in arc order on the cinema ground, on the real PageHero and SectionShell, in the selected voice. The ledger carries today beside it, line by line, with every held line marked, and the h1's rows are measured under the stage."
      >
        <ChapterBody
          mode={mode}
          stage={
            <div ref={arcHeroRef}>
              <ArcChapter
                sections={CHAPTER_1}
                voice={voiceId}
                mode={mode}
                ground="cinema"
              />
            </div>
          }
          aside={
            <>
              <RowCounts
                host={arcHeroRef}
                selector="[data-bv-type='hero-xl'] h1"
                lines={HERO_ROW_LINES}
                mode={mode}
                lead="The h1, in rows:"
              />
              <Ledger sections={CHAPTER_1} voice={voiceId} />
            </>
          }
        />
      </Chapter>

      <Chapter
        id="bv-3"
        n={3}
        name="The home arc, the paper chapter: the morning after"
        rationale="The three sections of the host's desk, on paper. album opens it as a left masthead at the lg tier, which is why its line has to carry more weight than the two beneath it."
      >
        <ChapterBody
          mode={mode}
          stage={
            <ArcChapter
              sections={CHAPTER_PAPER}
              voice={voiceId}
              mode={mode}
              ground="paper"
            />
          }
          aside={<Ledger sections={CHAPTER_PAPER} voice={voiceId} />}
        />
      </Chapter>

      <Chapter
        id="bv-4"
        n={4}
        name="The home arc, the close: the payoff"
        rationale="The last five, back on cinema. The arc has to land here in the same voice it opened in, which is the thing a header-by-header comparison cannot show."
      >
        <ChapterBody
          mode={mode}
          stage={
            <ArcChapter
              sections={CHAPTER_CLOSE}
              voice={voiceId}
              mode={mode}
              ground="cinema"
            />
          }
          aside={
            <>
              <Ledger sections={CHAPTER_CLOSE} voice={voiceId} />
              <div className="mt-5">
                <CopyPaste
                  label="Copy the SECTION_HEADERS paste"
                  text={sectionHeadersPaste(voiceId)}
                />
              </div>
            </>
          }
        />
      </Chapter>

      <Chapter
        id="bv-5"
        n={5}
        name="The thesis, both ways"
        rationale="All that survives of candidate C, on the surface it actually renders: the site's loudest line, at the hero tier, on cinema. One clause settles it, and the ruler under the pair says what the clause costs in rows."
      >
        <div className="space-y-3">
          {/* ★ THE STAGE THIS BOARD MOST HAD TO GET RIGHT. Ask 6 asks Will to
              choose between two lines, so a stage that clips one of them asks
              nothing. It did: a 520px box against 616px of content cut the
              word "it." off the second thesis at 1440, and at 375 the line
              stopped at "as". Measured now, like every other stage. */}
          <div ref={thesisRef}>
            <FitStage mode={mode} ground="cinema" className="space-y-10 py-12">
              <PageHero
                data-bv-type="hero-xl"
                className="w-full"
                scale="xl"
                heading={THESIS.ruled}
              />
              <PageHero
                data-bv-type="hero-xl"
                className="w-full"
                scale="xl"
                heading={THESIS.alternative}
              />
            </FitStage>
          </div>
          <RowCounts
            host={thesisRef}
            selector="[data-bv-type='hero-xl'] h1"
            lines={THESIS_ROW_LINES}
            mode={mode}
            lead="The thesis, in rows:"
          />
          <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
            {THESIS.note}
          </p>
        </div>
      </Chapter>

      <Chapter
        id="bv-6"
        n={6}
        name="A feature page, whole: /features/album"
        rationale="The page whole: the h1, the hero sub, every section eyebrow, header and supporting line, and every card with its title, in order, on the two grounds the page really uses. The cards are its body weight, so the ledger under the page counts what they cost."
      >
        <FeaturePageStage page={ALBUM_PAGE} voice={voiceId} mode={mode} />
      </Chapter>

      <Chapter
        id="bv-7"
        n={7}
        name="A feature page, whole: /features/curation"
        rationale="The second page, and the harder one: its whole body is one paper chapter of decisions, cards included, so the voice has to stay quiet enough to read as a working document and loud enough to still be marketing."
      >
        <FeaturePageStage page={CURATION_PAGE} voice={voiceId} mode={mode} />
      </Chapter>

      <Chapter
        id="bv-8"
        n={8}
        name="The thirty strings, as a paste"
        rationale="The shared identity layer behind all six feature pages: the nav label, the mega-panel one-liner, the h1, the hero sub and the directory line. navDescription holds its 45-character band and directoryLine its length band in every column, because the panel and the six hub doors wrap against them."
      >
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-xs">
              <thead>
                <tr className="border-b border-border text-left text-[11px] text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Page</th>
                  <th className="py-2 pr-3 font-medium">Slot</th>
                  <th className="py-2 pr-3 font-medium">Today</th>
                  <th className="py-2 font-medium">{voice.name}</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f) =>
                  (
                    [
                      ["navLabel", f.navLabel],
                      ["navDescription", f.navDescription],
                      ["h1", f.h1],
                      ["heroSub", f.heroSub],
                      ["directoryLine", f.directoryLine],
                    ] as const
                  ).map(([slot, trio], i) => (
                    <tr
                      key={`${f.slug}-${slot}`}
                      className="border-b border-border/50 align-top"
                    >
                      <td className="py-1.5 pr-3 text-muted-foreground">
                        {i === 0 ? f.slug : ""}
                      </td>
                      <td className="py-1.5 pr-3 text-muted-foreground">
                        {slot}
                      </td>
                      <td className="py-1.5 pr-3 text-muted-foreground">
                        {trio.today}
                      </td>
                      <td className="py-1.5 text-foreground">
                        {held(trio, voiceId) ? <Held /> : pick(trio, voiceId)}
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
          <CopyPaste
            label="Copy the FEATURE_PAGES paste"
            text={featurePagesPaste(voiceId)}
          />
        </div>
      </Chapter>

      <Chapter
        id="bv-9"
        n={9}
        name="The pages the arc does not reach: /help, /contact, /pricing"
        rationale="Round three's addition. The arc and the feature pages are where the site sells; these three are where a reader lands when they are deciding or when something broke, and they carry the site's two most generic lines. Two real help article heads close the last gap between the guide's surfaces table and this board."
      >
        <UtilityChapter voice={voiceId} mode={mode} />
      </Chapter>

      <Chapter
        id="bv-10"
        n={10}
        name="The quiet register, on real app copy"
        rationale="The dashboard's empty state, an error, two notifications, an email subject with its first line, and the account page's labels. Shown once, not per candidate: the quiet register does not fork with the voice, which is why three of these hold unchanged. Nothing here is a ruling; it is the register, and the sweep's own work."
      >
        <FitStage mode={mode} ground="app-light" className="px-8 py-6">
          <div className="flex flex-col gap-3">
            {QUIET_SURFACES.map((s) => (
              <SurfaceCard key={s.surface} s={s} mode={mode} />
            ))}
          </div>
        </FitStage>
      </Chapter>

      <Chapter
        id="bv-11"
        n={11}
        name="The guest register, with Partyreel nearly silent"
        rationale="The demo guest page's real lines: the door in its three states, the upload prompt, the empty album, the upload confirmation. Bible 4 is the whole rule here. Five of the six are sweep work like chapter 10; the marked one is compelled, not chosen, because the shipped line asks a guest for an account with us on the host's own page, which bible 4 already refuses. The rule decides it, so it is no ask: the noun it uses is ask 7, answered once for this line and the unfurl below."
      >
        <FitStage mode={mode} ground="app-light" className="px-8 py-6">
          <div className="flex flex-col gap-3">
            {GUEST_SURFACES.map((s) => (
              <SurfaceCard key={s.surface} s={s} mode={mode} />
            ))}
          </div>
        </FitStage>
      </Chapter>

      <Chapter
        id="bv-12"
        n={12}
        name="The unfurl, both ways"
        rationale="The parked ruling, on the surface it actually renders: what a host's group chat shows. The public variant sits above as the control, because the two lines have to read as one set. The grey plate in each card is a stand-in for the link preview's own thumbnail."
      >
        <FitStage mode={mode} ground="app-light" className="px-8 py-8">
          <div className="flex flex-col gap-5">
            <div className="max-w-md">
              <p className="text-[11px] font-medium text-muted-foreground">
                A public event, for reference
              </p>
              <div className="mt-1.5 overflow-hidden rounded-[var(--radius)] border border-border bg-card">
                <div className="h-10 bg-muted" />
                <div className="px-4 py-2.5">
                  <p className="text-sm font-medium">{UNFURL.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {UNFURL.publicLine}
                  </p>
                </div>
              </div>
            </div>
            <div
              className={
                desktop
                  ? "grid grid-cols-2 items-start gap-6"
                  : "flex flex-col gap-5"
              }
            >
              {UNFURL.options.map((o) => (
                <div key={o.id} className="space-y-1.5">
                  <p className="text-[11px] font-medium text-foreground">
                    {o.label}
                  </p>
                  <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
                    <div className="h-10 bg-muted" />
                    <div className="px-4 py-2.5">
                      <p className="text-sm font-medium">{UNFURL.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {o.line}
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {o.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </FitStage>
      </Chapter>

      <BoardMeta
        question={QUESTION}
        candidates={VOICES.filter((v) => v.id !== "today").map((v) => ({
          name: v.name,
          rationale: v.rationale,
        }))}
        asks={ASKS}
        departures={DEPARTURES}
      />
    </div>
  );
}
