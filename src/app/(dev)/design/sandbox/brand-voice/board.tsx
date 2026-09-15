"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useEffect, useState } from "react";

import { BoardPage, type Ground, type Mode, Paste } from "@/components/lab";
import { ImagePlus } from "lucide-react";

import { EventCard } from "@/components/app/event-card";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { PageHero } from "@/components/marketing/system/page-hero";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MAX_EVENTS, planById, plansForTier } from "@/lib/constants/tiers";
import { formatBytes } from "@/lib/utils";

import {
  ChapterFrame,
  COLUMNS,
  useAnchorAfterSettle,
  VOICE_TAG,
  VoiceCanvas,
  VoiceFrames,
} from "./frames";
import { BRAND_VOICE } from "./spec";
import {
  ALBUM_PAGE,
  APP_USE,
  ARC,
  CURATION_PAGE,
  FEATURES,
  GUEST_USE,
  HELP_HEADS,
  MARKETING_USE,
  REGISTERS,
  THESIS,
  UNFURL,
  USE_GROUPS,
  UTILITY_HEROES,
  VOICES,
  arcDiff,
  featureDiff,
  featurePagesPaste,
  held,
  pageCardDiff,
  pick,
  sameInAll,
  say,
  sectionHeadersPaste,
  slot,
  useTally,
  utilityDiff,
  voiceById,
  type ArcSection,
  type PageCard,
  type Trio,
  type UseCase,
  type UtilityHero,
  type VoiceId,
  type WholePage,
} from "./voices";

/**
 * THE BRAND-VOICE BOARD (round five, the Library x Lab migration wave,
 * 2026-09-15). What the board ARGUES lives in `spec.ts` now, and only there:
 * the question, the verdict, the seven one-word calls, the candidates, the
 * departures and the thirteen sections with their ledes. What is left here is
 * what a board should be and nothing else: the evidence for each declared
 * section, as a function of the declared state.
 *
 * ★ AND EVERY SPECIMEN MOVED INTO A REAL DOCUMENT. The reason, and the
 * hand-restored heading ladder it retires, are written down once in
 * `frames.tsx`. In one line: a Stage is a div, so a breakpoint prefix inside it
 * reads the browser rather than the canvas, and on a board whose whole argument
 * is where a sentence breaks, that is the argument.
 *
 * WHAT ROUND FOUR BUILT, unchanged by the migration:
 *  1. USAGE COMES FIRST. Will, on round three: "there's a handful of notes
 *     about the voices, but not a lot of actual usage examples that I can get a
 *     feel for each voice through... I would love to see the brand voices
 *     previewed on a few different production UI areas across marketing and
 *     app." So the board opens on the voices WRITING: sixteen real surfaces,
 *     each written three ways, on the component that ships it. Then ten
 *     chapters price a ruling on whole pages.
 *  2. EVERY COMPARISON SHOWS A DIFFERENCE. "A lot just have the exact same
 *     versions with a note that says unchanged... it's absolutely useless for a
 *     brand voice comparison." In the usage sections every voice WRITES every
 *     line; where all three land on the same string anyway, the row carries the
 *     REASON, never the word unchanged. The counter states both numbers and
 *     counts an unexplained match as a defect, out loud.
 *  3. THE APP'S UI IS OPEN (Will, 2026-09-15), so the app surfaces render as UI
 *     rather than as text in a card, which is what made the quiet register hard
 *     to judge at all.
 *
 * STANDING JUDGMENTS from round two, kept: candidate C retired as a column (its
 * one real question, the thesis, is its own section); every candidate ships as
 * a real TypeScript PASTE, since copy cannot be applied to the site as CSS; and
 * every line a candidate HOLDS is marked and counted, because where a voice
 * does not bite is as much of the ruling as where it does.
 *
 * The lines live in ./voices.ts so this file is layout only. Nothing here is
 * imported by production and no production byte changed on this track.
 *
 * ★ WHY THE SECTIONS ARE COMPRESSED: the board judges the LINE, not the arc's
 * vertical rhythm, which belongs to the home page and is ruled elsewhere. The
 * type, the ground and the heading tiers are the real ones; only the air
 * between sections is compressed so a chapter reads as one stretch.
 */

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

/** The held marker: a candidate keeping the shipped line unchanged. */
function Held() {
  return (
    <span className="bv-held rounded-full border border-border px-1.5 py-px text-[10px] text-muted-foreground">
      held
    </span>
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
  // ★ THE CLONE AND THE RANGE BELONG TO THE FRAME'S DOCUMENT, not to this one.
  // The heading being measured lives inside an iframe now, and a Range created
  // here and pointed at a node there is a cross-document Range: the engines
  // that do not throw on it measure against the wrong layout box, which is
  // worse, because the number still prints.
  const doc = el.ownerDocument;
  const probe = el.cloneNode(false) as HTMLElement;
  probe.textContent = text;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.left = "0";
  probe.style.top = "0";
  probe.style.width = `${el.offsetWidth}px`;
  const parent = el.parentElement;
  if (!parent) return 0;
  parent.appendChild(probe);
  const range = doc.createRange();
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

/** The thesis pair, the two lines the thesis ask chooses between. */
const THESIS_ROW_LINES = [
  { label: "in one album", text: THESIS.ruled },
  { label: "as everyone saw it", text: THESIS.alternative },
];

/**
 * The measured caption under a frame. `selector` is resolved inside `node`.
 *
 * ★ IT TAKES A NODE, NOT A REF, because the thing it measures is in another
 * document and arrives later than this component does. A frame portals its
 * scene in only once the frame's own document exists, so a ref read in a layout
 * effect is null on the first pass and nothing ever re-runs it. A state-held
 * node IS the dependency: the effect runs when the scene lands, and again when
 * the canvas or the copy moves.
 */
function RowCounts({
  node,
  selector,
  lines,
  mode,
  lead,
}: {
  node: HTMLElement | null;
  selector: string;
  /** Label and the exact string to set on the clone, in column order. */
  lines: { label: string; text: string }[];
  mode: Mode;
  lead: string;
}) {
  const [rows, setRows] = useState<number[] | null>(null);

  useEffect(() => {
    if (!node) return;
    let live = true;
    const measure = () => {
      if (!live) return;
      const target = node.querySelector<HTMLElement>(selector);
      if (!target) return;
      setRows(lines.map((l) => rowsOf(target, l.text)));
    };
    measure();
    // The webfont lands after the first layout and takes every wrap with it,
    // and it is the FRAME's font set that matters here, not this page's. The
    // whole chain is guarded: a frame's document can hold a FontFaceSet whose
    // `ready` is still undefined (frames.tsx has the measurement).
    try {
      node.ownerDocument.fonts?.ready?.then(measure).catch(() => {});
    } catch {
      // A document torn down between the read and the call.
    }
    return () => {
      live = false;
    };
  }, [node, selector, lines, mode]);

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
        {`Measured at ${mode === "desktop" ? "1440" : "375"} inside the frame above, at today\u2019s ladder: a ruling on the type scale moves these numbers with it.`}
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

/** One chapter of the arc, in arc order, in ONE document on its real ground. */
function ArcChapter({
  id,
  sections,
  voice,
  mode,
  ground,
  caption,
  bodyRef,
}: {
  id: string;
  sections: ArcSection[];
  voice: VoiceId;
  mode: Mode;
  ground: Ground;
  caption?: React.ReactNode;
  bodyRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <ChapterFrame
      id={id}
      mode={mode}
      ground={ground}
      title={VOICE_TAG[voice]}
      caption={caption}
      bodyRef={bodyRef}
    >
      {/* Keyed on the voice so a swap remounts and re-animates: switching
          voices is an occasional act, so it gets the standard beat under 300ms
          (board.css, which the frame's document inherits with the page's other
          sheets) and the eye lands on the new sentence rather than on a move. */}
      <div key={voice} data-bv-swap>
        {sections.map((s) => (
          <ArcBlock key={s.id} section={s} voice={voice} mode={mode} />
        ))}
      </div>
    </ChapterFrame>
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
      <ChapterFrame
        id={`${page.slug}-hero`}
        mode={mode}
        ground="cinema"
        title={VOICE_TAG[voice]}
        caption={`The hero of /features/${page.slug}, on cinema.`}
      >
        <PageHero
          data-bv-type="hero-lg"
          className="w-full py-10"
          scale="lg"
          eyebrow={pick(strings?.navLabel, voice)}
          heading={pick(strings?.h1, voice)}
          subhead={pick(strings?.heroSub, voice)}
        />
      </ChapterFrame>
      {chunks.map((chunk, i) => (
        <ChapterFrame
          key={i}
          id={`${page.slug}-chunk-${i}`}
          mode={mode}
          ground={chunk.ground}
          title={VOICE_TAG[voice]}
          caption={`${chunk.items.length} ${chunk.items.length === 1 ? "section" : "sections"} of the page, on ${chunk.ground}, in shipped order.`}
        >
          <div key={voice} data-bv-swap>
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
          </div>
        </ChapterFrame>
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
      <ChapterFrame
        id="utility-cinema"
        mode={mode}
        ground="cinema"
        title={VOICE_TAG[voice]}
        caption="/help and /contact, and two real help article heads."
        className="space-y-12 py-12"
      >
        <div key={voice} data-bv-swap className="space-y-12">
          {UTILITY_HEROES.filter((h) => h.ground === "cinema").map(hero)}
          {HELP_HEADS.map((a) => (
            <HelpHead
              key={a.slug}
              category={a.category}
              title={a.title}
              description={a.description}
            />
          ))}
        </div>
      </ChapterFrame>
      <ChapterFrame
        id="utility-paper"
        mode={mode}
        ground="paper"
        title={VOICE_TAG[voice]}
        caption="/pricing, on the paper ground the page ships on."
        className="space-y-12 py-12"
      >
        <div key={voice} data-bv-swap className="space-y-12">
          {UTILITY_HEROES.filter((h) => h.ground === "paper").map(hero)}
        </div>
      </ChapterFrame>
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
 * THE VOICES IN USE (round four): the same real surface, written three ways
 * ---------------------------------------------------------------------- */

/**
 * ★ THE ONE LAYOUT RULE, and why it is not the same for every surface.
 *
 * Nothing on this board is scaled: a frame is a document at its canvas's exact
 * pixels, so a specimen is judged at the pixels it ships at. That leaves one
 * honest question per surface, which is how to get three of them in front of a
 * reader at once. The three answers are in `frames.tsx`:
 *
 *  - `VoiceFrames`, three documents, for anything whose WIDTH is part of the
 *    judgment: a hero, a chapter, a card row, the pricing pair, the wizard.
 *    Stacked at 1440 and abreast at 375, because three 375 documents fit a
 *    desktop window and three 1440 documents fit nothing.
 *  - `VoiceCanvas`, one document, for chrome whose real width is already under
 *    400px: an event card in the dashboard's own three-up grid, a toast at
 *    sonner's 356, a notification row. Three of them side by side IS the
 *    shipped layout, at the shipped width.
 *  - `ChapterFrame`, one document in the SELECTED voice, for a whole arc
 *    chapter or a whole feature page, with the ledger beside it.
 */

/**
 * The line table under a surface: every slot, three columns, and the reason a
 * row is the same in all three where it is.
 *
 * ★ THIS TABLE IS THE ANSWER TO THE ROUND'S SECOND NOTE. Round three's app and
 * guest chapters printed today beside one proposal, and where the proposal
 * kept the line the row read "unchanged", which tells a reader nothing about
 * any voice. Here three voices write every line, so a difference is always on
 * screen; and where all three land on the same string, the row says WHY in a
 * sentence a reader can disagree with.
 */
function LineTable({ u }: { u: UseCase }) {
  return (
    <dl className="bv-lines mt-4 space-y-2.5 text-xs">
      {u.lines.map((l) => {
        const same = sameInAll(l.trio);
        return (
          <div key={l.slot} className="space-y-1">
            <dt className="flex flex-wrap items-baseline gap-x-2 text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">{l.slot}</span>
              {l.compelled && (
                <span className="rounded-full bg-foreground px-1.5 py-px text-[10px] text-background">
                  {l.compelled}
                </span>
              )}
              {same && <span>the same in every voice</span>}
            </dt>
            {same ? (
              <dd className="space-y-1">
                <p className="text-foreground">{l.trio.today}</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {l.same ??
                    "No reason given, which is a defect on this board: a row the same in all three has to say why."}
                </p>
              </dd>
            ) : (
              <dd className="grid gap-x-4 gap-y-1 lg:grid-cols-3">
                {COLUMNS.map((id) => (
                  <div key={id} className="min-w-0">
                    <p className="text-[10px] text-muted-foreground/70">
                      {VOICE_TAG[id]}
                    </p>
                    <p
                      className={
                        id === "today"
                          ? "text-muted-foreground"
                          : "text-foreground"
                      }
                    >
                      {l.trio[id]}
                    </p>
                  </div>
                ))}
              </dd>
            )}
          </div>
        );
      })}
    </dl>
  );
}

/** One surface: what it is, where it lives, the rule it obeys, the specimens,
 *  the lines, and what separates the voices here. */
function UseFrame({ u, children }: { u: UseCase; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t border-border pt-6 first:border-t-0 first:pt-0">
      <div className="max-w-3xl">
        <p className="text-sm font-medium">{u.surface}</p>
        <p className="text-[11px] text-muted-foreground">{u.where}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          <span className="text-foreground">The rule. </span>
          {u.rule}
        </p>
      </div>
      {children}
      <LineTable u={u} />
      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
        <span className="text-foreground">What separates them here. </span>
        {u.distinction}
      </p>
    </section>
  );
}

/* --- the specimens ----------------------------------------------------- */

/** The pricing pair, in the shipped markup with the shipped numbers: every
 *  figure renders from tiers.ts, so a voice can never move one. */
function PricingPair({ voice, mode }: { voice: VoiceId; mode: Mode }) {
  const free = planById("free");
  const pro = plansForTier("pro")[0];
  const u = MARKETING_USE.find((c) => c.id === "pricing-card") as UseCase;
  const line = (name: string) => say(u, name, voice);
  return (
    <div
      className={
        mode === "desktop"
          ? "mx-auto grid max-w-4xl grid-cols-2 gap-5 px-6 py-10"
          : "mx-auto flex max-w-sm flex-col gap-5 px-4 py-8"
      }
    >
      <div className="flex flex-col rounded-2xl border bg-card p-6 ring-1 ring-foreground/5">
        <h3 className="font-heading text-xl">{free.name}</h3>
        <p className="mt-2 text-sm text-pretty text-muted-foreground">
          {line("free-tagline")}
        </p>
        <p className="mt-3 font-heading text-4xl tabular-nums">
          {free.priceLabel}
        </p>
        <ul className="mt-6 flex-1 space-y-2.5 text-sm">
          <li>{MAX_EVENTS.free} event, every guest, the album and the reel</li>
          <li>{line("free-item")}</li>
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">
          {formatBytes(free.storageBytes)} of storage
        </p>
        <Button variant="outline" className="mt-5 w-full">
          {line("free-cta")}
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground/70">
          {line("free-note")}
        </p>
      </div>
      <div className="relative flex flex-col rounded-2xl bg-foreground p-6 text-background">
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border bg-card px-2.5 py-0.5 text-[10px] font-medium tracking-[0.14em] text-foreground uppercase">
          Most popular
        </span>
        <h3 className="font-heading text-xl">Pro</h3>
        <p className="mt-2 text-sm text-pretty text-background/75">
          {line("pro-tagline")}
        </p>
        <p className="mt-3 font-heading text-4xl tabular-nums">
          {pro.priceLabel}
        </p>
        <ul className="mt-6 flex-1 space-y-2.5 text-sm">
          <li>Photos and video, an album for every event</li>
          <li>{line("pro-item")}</li>
        </ul>
        <p className="mt-6 text-sm text-background/70">
          {formatBytes(pro.storageBytes)} of storage
        </p>
        <Button className="mt-5 w-full bg-background text-foreground hover:bg-background/90">
          Get Pro at {pro.priceLabel}
        </Button>
        <p className="mt-3 text-center text-xs text-background/60">
          {line("pro-note")}
        </p>
      </div>
    </div>
  );
}

/** The dashboard's empty Events section, in the shipped composition (the ghost
 *  pack behind, the lockup centred on it). */
function DashboardEmpty({ voice, mode }: { voice: VoiceId; mode: Mode }) {
  const u = APP_USE.find((c) => c.id === "dashboard-empty") as UseCase;
  const ghosts = ["g01", "g02", "g03", "g04", "g05", "g06"];
  return (
    <div
      className={
        mode === "desktop"
          ? "mx-auto max-w-5xl px-8 py-10"
          : "mx-auto max-w-sm px-4 py-8"
      }
    >
      <div className="relative">
        <div
          aria-hidden
          className={
            mode === "desktop"
              ? "grid grid-cols-3 gap-3 opacity-25 grayscale"
              : "grid grid-cols-2 gap-3 opacity-25 grayscale"
          }
        >
          {ghosts.map((g) => (
            // eslint-disable-next-line @next/next/no-img-element -- the shipped decorative ghost pack
            <img
              key={g}
              src={`/guest-ghost/${g}.webp`}
              alt=""
              loading="lazy"
              className="aspect-[16/10] w-full rounded-xl object-cover"
            />
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="space-y-1.5">
            <h3 className="font-heading text-2xl text-balance">
              {say(u, "heading", voice)}
            </h3>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              {say(u, "body", voice)}
            </p>
          </div>
          <Button size="lg">{say(u, "action", voice)}</Button>
        </div>
      </div>
    </div>
  );
}

/** The create-event wizard's first step, in the shipped card, with the step
 *  rail that carries the step names. */
function WizardCard({ voice, mode }: { voice: VoiceId; mode: Mode }) {
  const u = APP_USE.find((c) => c.id === "wizard") as UseCase;
  const steps = say(u, "steps", voice).split("·");
  return (
    <div className={mode === "desktop" ? "px-8 py-10" : "px-4 py-8"}>
      <div className="mx-auto w-full max-w-xl rounded-xl border border-border bg-card p-6">
        <h3 className="font-heading text-lg">{say(u, "title", voice)}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {say(u, "description", voice)}
        </p>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-3 text-xs">
          {steps.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={
                  i === 0
                    ? "flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-medium text-brand-foreground"
                    : "flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground"
                }
              >
                {i + 1}
              </span>
              <span
                className={
                  i === 0
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }
              >
                {label.trim()}
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Event name</p>
            <Input placeholder="Maya & Sam’s Wedding" readOnly />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">
              Description{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </p>
            <Textarea
              rows={2}
              placeholder="A note your guests will see when they join."
              readOnly
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">
              Event date{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </p>
            <Input placeholder="2026-03-14" readOnly />
            <p className="text-xs text-muted-foreground">
              {say(u, "date-helper", voice)}
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost">Cancel</Button>
          <Button>Continue</Button>
        </div>
        <div className="mt-6 space-y-3 border-t border-border pt-4">
          <div>
            <p className="text-sm font-medium">{say(u, "qr-title", voice)}</p>
            <p className="text-sm text-muted-foreground">
              {say(u, "qr-body", voice)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Your event link</p>
            <p className="text-sm text-muted-foreground">
              {say(u, "share-body", voice)}
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground/70">
            Steps two and three, their headings only: the QR picker and the
            share step render the same copy on their own screens.
          </p>
        </div>
      </div>
    </div>
  );
}

/** A toast, at sonner's own width. */
function ToastCard({
  text,
  tone = "default",
}: {
  text: string;
  tone?: "default" | "warning";
}) {
  return (
    <div
      className={
        tone === "warning"
          ? "rounded-lg border border-warning/40 bg-card px-4 py-3 text-sm shadow-lg"
          : "rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-lg"
      }
    >
      {text}
    </div>
  );
}

/** The notification bell's panel rows. */
function NotificationPanel({ voice }: { voice: VoiceId }) {
  const u = APP_USE.find((c) => c.id === "notification") as UseCase;
  const rows: [string, string][] = [
    [say(u, "pending-title", voice), say(u, "pending-body", voice)],
    [say(u, "storage-title", voice), say(u, "storage-body", voice)],
  ];
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-card">
      {rows.map(([title, body]) => (
        <div key={title} className="px-4 py-3">
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
          <p className="mt-1 text-[11px] text-muted-foreground/70">2h ago</p>
        </div>
      ))}
    </div>
  );
}

/** The two errors: the password sign-in a guest actually meets (the credential
 *  mismatch, not the unreachable validation fallback above it in the file), and
 *  the toast a refused upload raises. */
function ErrorPanel({ voice }: { voice: VoiceId }) {
  const u = APP_USE.find((c) => c.id === "error") as UseCase;
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card px-4 py-4">
        <p className="text-sm font-medium">Sign in</p>
        <div className="mt-2 space-y-2">
          <Input placeholder="you@example.com" readOnly />
          <Input placeholder="Password" readOnly />
        </div>
        <p className="mt-2 text-sm text-destructive">
          {say(u, "signin", voice)}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-lg">
        <p className="text-sm font-medium">{say(u, "upload-title", voice)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {say(u, "upload-body", voice)}
        </p>
      </div>
    </div>
  );
}

/** The account page's settings list and the one description that moves. */
function AccountPanel({ voice }: { voice: VoiceId }) {
  const u = APP_USE.find((c) => c.id === "account") as UseCase;
  const labels = say(u, "labels", voice).split("·");
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-4">
      <ul className="space-y-1.5 text-sm">
        {labels.map((l, i) => (
          <li
            key={l}
            className={i === 1 ? "font-medium" : "text-muted-foreground"}
          >
            {l.trim()}
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-border pt-3">
        <p className="text-sm font-medium">Public profile</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {say(u, "profile-help", voice)}
        </p>
      </div>
    </div>
  );
}

/** A guest's door, in the entry modal's own lockup. */
function GuestDoor({
  voice,
  gate,
}: {
  voice: VoiceId;
  gate: "public" | "gated" | "private";
}) {
  const u = GUEST_USE.find((c) => c.id === "guest-door") as UseCase;
  const body =
    gate === "public"
      ? say(u, "public-body", voice)
      : gate === "gated"
        ? say(u, "gated-body", voice)
        : say(u, "private-body", voice);
  const title =
    gate === "private"
      ? "Maya & Jay's Wedding is private"
      : gate === "gated"
        ? "See all the photos"
        : say(u, "title", voice);
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-6 text-center">
      <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        {gate === "public"
          ? "You are invited"
          : gate === "gated"
            ? "One step"
            : "Private"}
      </p>
      <p className="font-heading text-[22px] leading-tight text-balance">
        {title}
      </p>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      <Button size="lg" className="mt-1 w-full">
        {say(u, "action", voice)}
      </Button>
    </div>
  );
}

/** The upload sheet a guest sees: the dropzone, the host's review note, the
 *  save card, and the toast a finished upload raises. */
function UploadSheet({ voice }: { voice: VoiceId }) {
  const u = GUEST_USE.find((c) => c.id === "upload-sheet") as UseCase;
  return (
    <div className="space-y-3 px-4 py-5">
      <div className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 px-6 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-background text-primary shadow-sm">
          <ImagePlus className="size-6" />
        </div>
        <p className="text-sm font-medium">{say(u, "dropzone-title", voice)}</p>
        <p className="text-xs text-muted-foreground">
          {say(u, "dropzone-hint", voice)}
        </p>
      </div>
      <p className="rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
        {say(u, "moderation", voice)}
      </p>
      <div className="rounded-xl border border-border bg-card p-5 text-center">
        <p className="font-heading text-lg">{say(u, "save-title", voice)}</p>
        <p className="mx-auto mt-1 mb-4 max-w-xs text-[15px] text-muted-foreground">
          {say(u, "save-body", voice)}
        </p>
        <Button className="w-full">Save this event</Button>
      </div>
      <ToastCard text={say(u, "confirmation", voice)} />
    </div>
  );
}

/** The empty album a guest lands on. */
function GuestEmpty({ voice }: { voice: VoiceId }) {
  const u = GUEST_USE.find((c) => c.id === "guest-empty") as UseCase;
  const ghosts = [
    "g01",
    "g02",
    "g03",
    "g04",
    "g05",
    "g06",
    "g01",
    "g02",
    "g03",
  ];
  return (
    <div className="relative px-3 py-5">
      <div
        aria-hidden
        className="grid grid-cols-3 gap-1.5 opacity-25 grayscale"
      >
        {ghosts.map((g, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- the shipped decorative ghost pack
          <img
            key={i}
            src={`/guest-ghost/${g}.webp`}
            alt=""
            loading="lazy"
            className="aspect-square w-full rounded-[3px] object-cover"
          />
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-heading text-2xl text-balance">
          {say(u, "heading", voice)}
        </p>
        <Button size="lg">{say(u, "action", voice)}</Button>
      </div>
    </div>
  );
}

/** The inactivity mail: the inbox row, then the mail itself. */
function EmailCard({ voice }: { voice: VoiceId }) {
  const u = GUEST_USE.find((c) => c.id === "email") as UseCase;
  return (
    <div className="space-y-3 px-4 py-5">
      <div className="rounded-lg border border-border bg-card px-3 py-2.5">
        <p className="text-[11px] text-muted-foreground">Partyreel</p>
        <p className="mt-0.5 text-sm font-medium">{say(u, "subject", voice)}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {say(u, "first", voice)}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card px-4 py-4">
        <p className="font-heading text-lg">{say(u, "headline", voice)}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {say(u, "first", voice)}
        </p>
        <Button className="mt-4 w-full">{say(u, "button", voice)}</Button>
      </div>
    </div>
  );
}

/* --- the three usage chapters ------------------------------------------ */

/** The marketing five: the surfaces a reader meets before they sign up. */
function MarketingUseChapter({ mode }: { mode: Mode }) {
  const byId = (id: string) =>
    MARKETING_USE.find((u) => u.id === id) as UseCase;
  const hero = byId("home-hero");
  const chapter = byId("album-chapter");
  const cards = byId("feature-cards");
  const help = byId("help-open");
  const cardTrio = (n: number): PageCard => ({
    title: slot(cards, `card${n}-title`),
    body: slot(cards, `card${n}-body`),
  });
  const cardSet = [cardTrio(1), cardTrio(2), cardTrio(3)];
  return (
    <div className="space-y-8">
      <UseFrame u={hero}>
        <VoiceFrames
          id="use-hero"
          mode={mode}
          ground="cinema"
          render={(v) => (
            <PageHero
              data-bv-type="hero-xl"
              className="w-full py-10"
              scale="xl"
              eyebrow={say(hero, "eyebrow", v)}
              heading={say(hero, "heading", v)}
              subhead={say(hero, "subhead", v)}
              actions={
                <div className="flex flex-wrap items-center gap-3">
                  {say(hero, "cta", v)
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
          )}
        />
      </UseFrame>

      <UseFrame u={chapter}>
        <VoiceFrames
          id="use-chapter"
          mode={mode}
          ground="paper"
          render={(v) => (
            <SectionShell
              data-bv-type="section-lg"
              className={mode === "desktop" ? "py-10 sm:py-10" : "py-7 sm:py-7"}
              reveal="none"
              scale="lg"
              align="left"
              eyebrow={say(chapter, "eyebrow", v)}
              heading={say(chapter, "heading", v)}
              subhead={say(chapter, "subhead", v)}
            >
              <Cta id="album" text={say(chapter, "cta", v)} />
            </SectionShell>
          )}
        />
      </UseFrame>

      <UseFrame u={cards}>
        <VoiceFrames
          id="use-cards"
          mode={mode}
          ground="paper"
          render={(v) => (
            <SectionShell
              data-bv-type="section"
              className={mode === "desktop" ? "py-10 sm:py-10" : "py-7 sm:py-7"}
              reveal="none"
              eyebrow="Getting in"
              heading="Scan, and they’re in."
              subhead={say(cards, "subhead", v)}
            >
              <Cards cards={cardSet} voice={v} mode={mode} />
            </SectionShell>
          )}
        />
      </UseFrame>

      <UseFrame u={byId("pricing-card")}>
        <VoiceFrames
          id="use-pricing"
          mode={mode}
          ground="paper"
          render={(v) => <PricingPair voice={v} mode={mode} />}
        />
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          The card is the shipped markup with the shipped numbers: the price,
          the storage and the event cap all render from tiers.ts, so no voice
          can move one. The photo stacks, the cadence toggle and the Pro size
          selector are left off because they carry no copy, and two of the five
          feature lines are shown rather than all five.
        </p>
      </UseFrame>

      <UseFrame u={help}>
        <VoiceFrames
          id="use-help"
          mode={mode}
          ground="paper"
          render={(v) => (
            <div
              data-bv-type="section-lg"
              className="mx-auto max-w-3xl px-6 py-10"
            >
              <Badge variant="secondary">Troubleshooting</Badge>
              <h2 className="mt-4 font-heading text-balance">
                {say(help, "title", v)}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {say(help, "description", v)}
              </p>
              <p className="mt-5 text-[15px] leading-relaxed">
                {say(help, "first", v)}
              </p>
            </div>
          )}
        />
      </UseFrame>
    </div>
  );
}

/** The host's app, on the app ground the dock selects. */
function AppUseChapter({ mode, ground }: { mode: Mode; ground: Ground }) {
  const byId = (id: string) => APP_USE.find((u) => u.id === id) as UseCase;
  const card = byId("event-card");
  const toast = byId("toast");
  return (
    <div className="space-y-8">
      <UseFrame u={byId("dashboard-empty")}>
        <VoiceFrames
          id="use-dash"
          mode={mode}
          ground={ground}
          render={(v) => <DashboardEmpty voice={v} mode={mode} />}
        />
      </UseFrame>

      <UseFrame u={card}>
        {/* Three cards side by side IS the dashboard's own grid at 1440, so the
            row layout here is the shipped layout rather than a board's. */}
        <VoiceCanvas
          id="use-card"
          mode={mode}
          ground={ground}
          width={352}
          render={(v) => (
            <EventCard
              href="#"
              name="Maya & Jay's Wedding"
              coverUrl="/guest-ghost/g03.webp"
              dateLabel="14 March 2026"
              itemsLabel={say(card, "items", v)}
              statusLabel={say(card, "status", v)}
              pendingCount={3}
            />
          )}
        />
        {/* The one line on this specimen the board cannot swap: the amber
            chip's text is written INSIDE event-card.tsx rather than passed in,
            so all three cards say the shipped words and the row below is where
            the candidates differ. Worth knowing before the sweep: two of these
            three pills are props and the third is a component edit. */}
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          The amber chip reads the same on all three cards on purpose: its words
          are hardcoded in event-card.tsx while the other two pills arrive as
          props from the dashboard. The row below is where the candidates part,
          and the difference is a component edit rather than a label change.
        </p>
      </UseFrame>

      <UseFrame u={byId("wizard")}>
        <VoiceFrames
          id="use-wizard"
          mode={mode}
          ground={ground}
          render={(v) => <WizardCard voice={v} mode={mode} />}
        />
      </UseFrame>

      <UseFrame u={toast}>
        <VoiceCanvas
          id="use-toast"
          mode={mode}
          ground={ground}
          width={356}
          render={(v) => (
            <div className="space-y-3">
              <ToastCard text={say(toast, "review-on", v)} />
              <ToastCard text={say(toast, "hidden", v)} tone="warning" />
            </div>
          )}
        />
      </UseFrame>

      <UseFrame u={byId("error")}>
        <VoiceCanvas
          id="use-error"
          mode={mode}
          ground={ground}
          width={356}
          render={(v) => <ErrorPanel voice={v} />}
        />
      </UseFrame>

      <UseFrame u={byId("notification")}>
        <VoiceCanvas
          id="use-notif"
          mode={mode}
          ground={ground}
          width={380}
          render={(v) => <NotificationPanel voice={v} />}
        />
      </UseFrame>

      <UseFrame u={byId("account")}>
        <VoiceCanvas
          id="use-account"
          mode={mode}
          ground={ground}
          width={380}
          render={(v) => <AccountPanel voice={v} />}
        />
      </UseFrame>
    </div>
  );
}

/** A guest's phone, and the one mail. Always 375: these surfaces only ever
 *  render there, and three of them fit a 1440 window side by side. */
function GuestUseChapter({ ground }: { ground: Ground }) {
  const byId = (id: string) => GUEST_USE.find((u) => u.id === id) as UseCase;
  return (
    <div className="space-y-8">
      <UseFrame u={byId("guest-door")}>
        <VoiceFrames
          id="use-door"
          mode="phone"
          ground={ground}
          render={(v) => (
            <div className="flex flex-col gap-3 px-4 py-5">
              <GuestDoor voice={v} gate="public" />
              <GuestDoor voice={v} gate="gated" />
              <GuestDoor voice={v} gate="private" />
            </div>
          )}
        />
      </UseFrame>

      <UseFrame u={byId("upload-sheet")}>
        <VoiceFrames
          id="use-upload"
          mode="phone"
          ground={ground}
          render={(v) => <UploadSheet voice={v} />}
        />
      </UseFrame>

      <UseFrame u={byId("guest-empty")}>
        <VoiceFrames
          id="use-empty"
          mode="phone"
          ground={ground}
          render={(v) => <GuestEmpty voice={v} />}
        />
      </UseFrame>

      <UseFrame u={byId("email")}>
        <VoiceFrames
          id="use-email"
          mode="phone"
          ground={ground}
          render={(v) => <EmailCard voice={v} />}
        />
      </UseFrame>
    </div>
  );
}

/**
 * The headnote over chapter 1: the rule these chapters obey, and the count
 * that proves it. Will's second note was that a comparison showing the same
 * string in both columns with "unchanged" under it teaches nothing, so the
 * board states its own compliance as a number rather than a promise, and
 * counts an unexplained match as a defect out loud.
 */
function UsageNote() {
  const t = useTally(USE_GROUPS.map((g) => g.cases));
  return (
    <div className="max-w-3xl space-y-2 rounded-lg border border-border bg-card px-5 py-4 text-xs leading-relaxed text-muted-foreground">
      <p>
        <span className="text-foreground">
          {t.differ} of {t.rows} lines differ across the three columns.
        </span>{" "}
        The other {t.same} are the same in every voice and each one says why, in
        a sentence you can disagree with: a button the host is about to press, a
        help title that is also the search string, an empty state that was
        already written in the voice. A row the same in all three WITHOUT a
        reason is a defect on this board, and there{" "}
        {t.unexplained === 1 ? "is" : "are"} {t.unexplained} of them.
      </p>
      <p>
        Two different questions live on this board and round three had them in
        one table, which is what produced the useless rows. Here every voice
        WRITES every line, so a difference is always on screen. What a rewrite
        would actually MOVE, and what it would leave alone, is counted in the
        ledgers from chapter 5 on.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * The board
 * ---------------------------------------------------------------------- */

const CHAPTER_1 = ARC.slice(0, 7);
const CHAPTER_PAPER = ARC.slice(7, 10);
const CHAPTER_CLOSE = ARC.slice(10);

/**
 * The ledger beside the frame at 375, under it at 1440.
 *
 * ★ A 375 DOCUMENT SITS IN A COLUMN THREE TIMES ITS WIDTH. Round three walked
 * the phone canvas at twenty-three thousand pixels with eight hundred of dead
 * ground either side of every chapter, and the line being judged a full screen
 * away from the line it replaces. Side by side, the phone walk is the same
 * length as the desktop one and the comparison is in one view. The `lg:` here
 * is the BOARD's own chrome, so keying off the real browser viewport is exactly
 * right, unlike a prefix inside a specimen.
 */
function LedgerBeside({
  mode,
  frame,
  ledger,
}: {
  mode: Mode;
  frame: React.ReactNode;
  ledger: React.ReactNode;
}) {
  if (mode === "phone") {
    return (
      <div className="grid items-start gap-6 lg:grid-cols-[375px_minmax(0,1fr)]">
        <div className="min-w-0">{frame}</div>
        <div className="min-w-0">{ledger}</div>
      </div>
    );
  }
  return (
    <div>
      {frame}
      {ledger}
    </div>
  );
}

/** What the selected voice costs, in the dock, because it is a fact about the
 *  whole page rather than about one specimen. */
function MovedCount({ voice }: { voice: VoiceId }) {
  const arc = arcDiff(voice);
  const feat = featureDiff(voice);
  return (
    <span className="text-[11px] text-muted-foreground tabular-nums">
      {voice === "today"
        ? "The shipped lines, the control."
        : `Moves ${arc.moved} of ${arc.total} arc lines, ${feat.moved} of ${feat.total} feature strings.`}
    </span>
  );
}

export function BrandVoiceBoard() {
  // ★ THE RULER'S TWO HEADINGS ARE HELD AS STATE, NOT AS REFS. They live inside
  // a frame's document and arrive when the scene portals in, which is after
  // this component's first effect; a ref read then is null and nothing re-runs
  // it. A state-held node is the dependency the measurement needs.
  const [arcHeroNode, setArcHeroNode] = useState<HTMLElement | null>(null);
  const [thesisNode, setThesisNode] = useState<HTMLElement | null>(null);
  useAnchorAfterSettle(BRAND_VOICE.id);

  return (
    <BoardPage
      spec={BRAND_VOICE}
      dock={(state) => <MovedCount voice={state.voice as VoiceId} />}
      evidence={(id, state) => {
        const voiceId = state.voice as VoiceId;
        const voice = voiceById(voiceId);
        const mode = state.canvas as Mode;
        const ground = state.app as Ground;

        switch (id) {
          case "marketing":
            return (
              <div className="space-y-6">
                <UsageNote />
                <MarketingUseChapter mode={mode} />
              </div>
            );

          case "app":
            return <AppUseChapter mode={mode} ground={ground} />;

          case "guest":
            return <GuestUseChapter ground={ground} />;

          case "voice":
            return (
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
                    Bible 20&rsquo;s replacement, in one sentence
                  </p>
                  <p className="mt-2 max-w-3xl font-heading text-xl text-balance">
                    Lead with what arrives; an absence may be the second beat,
                    never the first, and never both.
                  </p>
                  <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
                    It keeps the ruled line (Scan, upload, done. No app to
                    install.) and kills the doubled-absence one (Nothing to
                    install. Nothing to sign up for.), which is the rule the
                    whole arc below is written against.
                  </p>
                </div>
              </div>
            );

          case "arc-event":
            return (
              <LedgerBeside
                mode={mode}
                frame={
                  <ArcChapter
                    id="arc-event"
                    sections={CHAPTER_1}
                    voice={voiceId}
                    mode={mode}
                    ground="cinema"
                    caption="The first seven sections of the home arc, in shipped order, on cinema."
                    bodyRef={setArcHeroNode}
                  />
                }
                ledger={
                  <>
                    <RowCounts
                      node={arcHeroNode}
                      selector="[data-bv-type='hero-xl'] h1"
                      lines={HERO_ROW_LINES}
                      mode={mode}
                      lead="The h1, in rows:"
                    />
                    <Ledger sections={CHAPTER_1} voice={voiceId} />
                  </>
                }
              />
            );

          case "arc-paper":
            return (
              <LedgerBeside
                mode={mode}
                frame={
                  <ArcChapter
                    id="arc-paper"
                    sections={CHAPTER_PAPER}
                    voice={voiceId}
                    mode={mode}
                    ground="paper"
                    caption="The host's desk: three sections on paper, the album chapter as a left masthead."
                  />
                }
                ledger={<Ledger sections={CHAPTER_PAPER} voice={voiceId} />}
              />
            );

          case "arc-close":
            return (
              <LedgerBeside
                mode={mode}
                frame={
                  <ArcChapter
                    id="arc-close"
                    sections={CHAPTER_CLOSE}
                    voice={voiceId}
                    mode={mode}
                    ground="cinema"
                    caption="The last five sections, back on cinema, where the arc has to land."
                  />
                }
                ledger={
                  <>
                    <Ledger sections={CHAPTER_CLOSE} voice={voiceId} />
                    <div className="mt-5">
                      <Paste
                        label="The SECTION_HEADERS paste, for marketing-voice.ts"
                        code={sectionHeadersPaste(voiceId)}
                      />
                    </div>
                  </>
                }
              />
            );

          case "thesis":
            return (
              <div className="space-y-3">
                <ChapterFrame
                  id="thesis"
                  mode={mode}
                  ground="cinema"
                  title="The ruled line, and the alternative"
                  caption="Both at the hero tier, in one document, so the pair is read at the size it ships at."
                  className="space-y-10 py-12"
                  bodyRef={setThesisNode}
                >
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
                </ChapterFrame>
                <RowCounts
                  node={thesisNode}
                  selector="[data-bv-type='hero-xl'] h1"
                  lines={THESIS_ROW_LINES}
                  mode={mode}
                  lead="The thesis, in rows:"
                />
                <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
                  {THESIS.note}
                </p>
              </div>
            );

          case "album-page":
            return (
              <FeaturePageStage page={ALBUM_PAGE} voice={voiceId} mode={mode} />
            );

          case "curation-page":
            return (
              <FeaturePageStage
                page={CURATION_PAGE}
                voice={voiceId}
                mode={mode}
              />
            );

          case "strings":
            return (
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
                        ).map(([slotName, trio], i) => (
                          <tr
                            key={`${f.slug}-${slotName}`}
                            className="border-b border-border/50 align-top"
                          >
                            <td className="py-1.5 pr-3 text-muted-foreground">
                              {i === 0 ? f.slug : ""}
                            </td>
                            <td className="py-1.5 pr-3 text-muted-foreground">
                              {slotName}
                            </td>
                            <td className="py-1.5 pr-3 text-muted-foreground">
                              {trio.today}
                            </td>
                            <td className="py-1.5 text-foreground">
                              {held(trio, voiceId) ? (
                                <Held />
                              ) : (
                                pick(trio, voiceId)
                              )}
                            </td>
                          </tr>
                        )),
                      )}
                    </tbody>
                  </table>
                </div>
                <Paste
                  label="The FEATURE_PAGES paste, for feature-pages.ts"
                  code={featurePagesPaste(voiceId)}
                />
              </div>
            );

          case "utility":
            return <UtilityChapter voice={voiceId} mode={mode} />;

          case "unfurl":
            return (
              <ChapterFrame
                id="unfurl"
                mode={mode}
                ground="app-light"
                title="A host's group chat"
                caption="The grey plate in each card is a stand-in for the link preview's own thumbnail."
                className="px-8 py-8"
              >
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
                      mode === "desktop"
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
                            <p className="text-sm font-medium">
                              {UNFURL.title}
                            </p>
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
              </ChapterFrame>
            );

          default:
            return null;
        }
      }}
    />
  );
}
