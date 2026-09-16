"use client";

/**
 * THE CONTACT SHEET AT THE REAL CARD SIZE (round six, the catalog, 2026-09-16).
 *
 * A catalog of places to buy photographs is only worth looking at if you can
 * see the photographs, and rounds four and five showed them as 90px squares in
 * a six-column grid. A small square asks nothing of a photograph: it hides the
 * crop, flatters the composition and makes thirteen catalogues look alike. So
 * every frame on this board is now drawn as the thing it would become, at the
 * pixel size it would be, on the ground it would land on.
 *
 * ★ THE REAL CARD IS 320 BY 400 ON PAPER, AND BOTH HALVES OF THAT WERE WRONG
 * BEFORE. The blog library is `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` with
 * `gap-4` inside a `max-w-7xl px-8` container beside an `11rem` rail: at 1440
 * that is (1216 - 176 - 48 - 32) / 3 = 320 exactly, and 4:5 makes it 400. And
 * the section it sits in is a `PaperChapter`, not the dark stage the page opens
 * on, which round four's surface check had wrong: it judged every frame on
 * cinema. A photograph reads differently against paper than against a dark
 * room, which is the whole reason the ground is part of the specimen.
 *
 * ★ NEVER SCALED, NEVER ZOOMED (Will, 2026-09-15: "the iframe previews throw
 * off anything related to size"). These are literal pixel boxes inside a
 * horizontal scroller. A card that will not fit its column scrolls; it does not
 * shrink, because the size is the thing being judged.
 *
 * ★ EVERY FRAME IS A PLAIN <img> POINTING AT THE SOURCE'S OWN CDN, and that is
 * a decision rather than a limitation. next/image would proxy each thumbnail
 * through our optimizer, leaving a cached copy of another company's watermarked
 * comp on our infrastructure. A sourcing board must never do that: our servers
 * never see the bytes, and a frame that stops answering degrades to a labelled
 * slate rather than to a broken tile, which is the sheet telling the truth
 * about a catalogue that moved.
 *
 * ★ THE PLATE IS THE PRODUCTION CARD'S ANATOMY, HAND-BUILT, AND THE REAL
 * COMPONENT IS ONE SECTION DOWN. PostCard takes a `BlogListItem` and renders
 * next/image, so it cannot be handed a hotlinked comp without breaking the rule
 * above. Rather than fake the real thing twice, the board shows this exact
 * anatomy here and the REAL PostCard on the REAL page in the frames below,
 * wearing the same frames through a stylesheet. Anything that drifts between
 * the two is visible on one screen.
 */

import { useState } from "react";

import { BeforeAfter, type Mode } from "@/components/lab";
import { Caption } from "@/components/marketing/system/caption";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import {
  CANDIDATE_CLAUSE,
  CANDIDATE_LICENSE,
  CANDIDATE_RETRIEVED,
  CANDIDATES,
} from "./candidates";
import { type Frame } from "./catalogue";
import {
  drawableVerticals,
  sheetFor,
  type SourceCard,
  type Vertical,
  VERTICAL_LABEL,
} from "./sources";
import { VERTICAL_OF_ID } from "./vertical-map";

/** The real card, at the two canvases: 1440 gives 320, 375 gives 343. */
export const PLATE = {
  desktop: { w: 320, h: 400 },
  phone: { w: 343, h: 429 },
} as const;

/**
 * The three rungs of the crop ladder the blog actually produces. `coverFor`
 * derives the position from the SLUG, so a frame lands at one of these and not
 * at centre: a photograph that only survives a centre crop fails on the site.
 */
const LADDER = ["50% 38%", "50% 50%", "62% 50%"];

/** A real post per kind of event, so the card reads like the card it is. */
const POST: Record<Vertical, { title: string; tags: string[] }> = {
  weddings: {
    title: "QR code for wedding photos: the complete guest photo sharing guide",
    tags: ["Weddings", "How-to"],
  },
  birthdays: {
    title: "How to collect every birthday party photo before anyone leaves",
    tags: ["Parties", "How-to"],
  },
  corporate: {
    title: "Conference photo sharing without an app: what works",
    tags: ["Corporate", "How-to"],
  },
  festivals: {
    title: "The group chat is where party photos go to die",
    tags: ["Parties", "Compared"],
  },
  trips: {
    title: "Bachelorette and group trip photos: one album for the whole crew",
    tags: ["How-to"],
  },
};

/* ── One card ──────────────────────────────────────────────────────────── */

export function CoverPlate({
  frame,
  vertical,
  source,
  index,
  mode,
}: {
  frame: Frame;
  vertical: Vertical;
  /** The source's name, for the slate a dead hotlink falls back to. */
  source: string;
  index: number;
  mode: Mode;
}) {
  const [dead, setDead] = useState(false);
  const { w, h } = PLATE[mode];
  const post = POST[vertical];
  return (
    <a
      href={frame.page}
      target="_blank"
      rel="noreferrer"
      data-mkt-develop
      style={{ "--i": index % 6, width: w, height: h } as React.CSSProperties}
      className="group relative block shrink-0 overflow-hidden bg-muted transition-transform duration-200 ease-emphasis active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
    >
      {dead ? (
        <span className="absolute inset-0 grid place-items-center bg-[repeating-linear-gradient(135deg,transparent,transparent_7px,var(--border)_7px,var(--border)_8px)] p-4 text-center">
          <Caption className="text-[11px] leading-snug">
            {source} did not answer
          </Caption>
        </span>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- the source's
              own thumbnail from the source's own CDN; see the header. */}
          <img
            src={frame.thumb}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setDead(true)}
            className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-emphasis group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            style={{ objectPosition: LADDER[index % LADDER.length] }}
          />
          {/* The production card's rest scrim, and its hover lift. */}
          <span
            aria-hidden
            className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10 transition-opacity duration-[180ms] ease-emphasis group-hover:opacity-70 motion-reduce:transition-none"
          />
          <span className="absolute inset-x-0 top-0 flex flex-wrap gap-1 p-4 sm:p-5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-black/35 px-2 py-0.5 text-[10px] tracking-wide text-white/90 backdrop-blur-[2px]"
              >
                {tag}
              </span>
            ))}
          </span>
          <span className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4 sm:p-5">
            <span className="line-clamp-2 font-heading text-base leading-tight text-balance text-white sm:text-lg">
              {post.title}
            </span>
            <span className="flex flex-wrap items-center gap-x-1.5 text-xs text-white/65">
              <span className="font-medium text-white">Partyreel Team</span>
              <span
                aria-hidden
                className="size-0.5 shrink-0 rounded-full bg-white/40"
              />
              <span>28 Aug 2026</span>
            </span>
          </span>
        </>
      )}
    </a>
  );
}

/* ── One source's frames, in a row of real cards ───────────────────────── */

/** The kind of event a source can actually draw, falling back to one it has. */
export function shownVertical(
  sourceId: string,
  wanted: Vertical,
): Vertical | null {
  const drawable = drawableVerticals(sourceId);
  return drawable.includes(wanted) ? wanted : (drawable[0] ?? null);
}

export function ContactStrip({
  source,
  vertical,
  mode,
  count = 4,
  className,
}: {
  source: SourceCard;
  vertical: Vertical;
  mode: Mode;
  count?: number;
  className?: string;
}) {
  const shown = shownVertical(source.id, vertical);
  const sheet = shown ? sheetFor(source.id, shown) : null;

  if (!sheet || !shown) return <NoSheet source={source} mode={mode} />;

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {/* Four words, not a sentence: thirteen strips carry this line, and the
            board's reading budget is spent on the facts rather than on the
            same caption thirteen times. What the frames ARE (the source's own
            thumbnails, hotlinked, never copied) is the section's argument. */}
        <Caption className="text-[10px] tabular-nums">
          {VERTICAL_LABEL[shown]} · {PLATE[mode].w} x {PLATE[mode].h}
        </Caption>
        {/* ★ SAY WHEN THE SHEET IS NOT THE KIND OF EVENT THAT WAS ASKED FOR. A
            source with nothing for the chosen one falls back to a kind it does
            have, which is more useful than a blank and is a lie unless it is
            labelled in the same glance. */}
        {shown !== vertical && (
          <span className="rounded-full bg-destructive/15 px-1.5 py-px text-[10px] font-medium text-destructive">
            nothing for {VERTICAL_LABEL[vertical].toLowerCase()}
          </span>
        )}
      </div>
      {/* The scroller, never a scale: the size is what is being judged. */}
      <div data-lab-bleed className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex w-fit gap-4">
          {sheet.frames.slice(0, count).map((f, i) => (
            <CoverPlate
              key={f.thumb}
              frame={f}
              vertical={shown}
              source={source.name}
              index={i}
              mode={mode}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * A PLACE WHOSE CATALOGUE CANNOT BE DRAWN, drawn as the card it cannot fill.
 *
 * ★ A HOLE, NOT A VOID. Six of the thirteen refuse a plain client, and an
 * earlier draft gave them a plain white box at the plate's own height, which
 * reads as a rendering failure rather than as a finding. The hatch is the same
 * language a dead hotlink falls back to, and it means the same thing: nothing
 * to show, and here is exactly why. Keeping the plate's footprint is the point
 * too, because the size of the card this place cannot fill is the fact.
 *
 * ★ AND THE REASON IS THIS SOURCE'S, NEVER A CATEGORY'S. Round four printed one
 * categorical sentence under all of them; it was false for four, and writing
 * them out one at a time is what proved a seventh was not refusing at all.
 * `plan.test.ts` refuses a source with neither a sheet nor a reason.
 */
function NoSheet({
  source,
  mode,
  bare,
}: {
  source: SourceCard;
  mode: Mode;
  /** Inside a pair the kind and the size are the pair's caption, said once. */
  bare?: boolean;
}) {
  const { w, h } = PLATE[mode];
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {!bare && (
        <Caption className="text-[10px] tabular-nums">
          Nothing · {w} x {h}
        </Caption>
      )}
      <div
        style={{ width: w, height: h }}
        className="mk-hole grid max-w-full place-items-center p-5"
      >
        <span className="bg-background/85 p-3 text-center">
          <Caption className="text-[11px] leading-snug">
            <span className="text-foreground">No frames.</span>{" "}
            {source.noSheet ?? "No reason recorded, which is itself a defect."}
          </Caption>
        </span>
      </div>
    </div>
  );
}

/* ── The other real size: the share card ───────────────────────────────── */

/**
 * 1200 by 630, centre-cropped, ignoring the crop ladder entirely. It is the
 * surface a stranger meets first, in a message from a friend, and it is the one
 * geometry nothing on the site can tune per frame.
 */
export function ShareCard({ frame }: { frame: Frame }) {
  return (
    <div
      style={{ width: 1200, height: 630 }}
      className="relative shrink-0 overflow-hidden bg-[#0d0d0d]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- see the header. */}
      <img
        src={frame.thumb}
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
      />
      <span aria-hidden className="absolute inset-0 bg-black/30" />
      <span
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-black/90 to-transparent to-60%"
      />
      <span className="absolute top-20 left-20 flex items-center gap-5">
        <span className="size-14 rounded-2xl bg-[#fafafa]" />
        <span className="text-[28px] text-[#e4e4e7]">Partyreel Blog</span>
      </span>
      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-[22px] px-20 pb-20">
        <span className="font-heading text-[58px] leading-[1.08] font-bold tracking-[-0.02em] text-[#fafafa]">
          What a QR code at the door actually does
        </span>
        <span className="text-[28px] text-[#d4d4d8]">Will Gibson</span>
      </span>
    </div>
  );
}

/** The first frame a source can draw for a kind of event, or null. */
export function firstFrame(sourceId: string, vertical: Vertical): Frame | null {
  const shown = shownVertical(sourceId, vertical);
  if (!shown) return null;
  return sheetFor(sourceId, shown)?.frames[0] ?? null;
}

/* ── The frame that is on the site today ───────────────────────────────── */

/**
 * THE STAND-IN THE SITE IS WEARING RIGHT NOW, in the same card.
 *
 * ★ A CARD WALKED IN A GALLERY IS STILL JUDGED AS A DIFFERENCE (the stepped
 * review, 2026-09-16). Round six drew each place's contact sheet alone, which
 * asks the reviewer to remember what the blog looks like today while he reads
 * thirteen of them. The production still is right there in `MARKETING_IMAGES`,
 * so the card opens with it: one 320 by 400 plate from `public/marketing/img`,
 * then the same plate from the source, nothing else different.
 *
 * ★ AND FOR TWO KINDS OF EVENT THERE IS NOTHING TO DRAW, WHICH IS THE POINT.
 * The twelve stills are six weddings, three birthdays and three festivals: the
 * site has no conference frame and no trip frame at all. That absence is the
 * reason the conference rooms are the only line of the bridge paid for one
 * frame at a time, so it is drawn as the same card-shaped hole a refusing
 * catalogue gets rather than quietly skipped.
 */
const STAND_IN = new Map(MARKETING_IMAGES.map((m) => [m.id, m] as const));

/** The first production still of a kind of event, or null when there is none. */
export function standInFor(vertical: Vertical): Frame | null {
  const id = MARKETING_IMAGES.map((m) => m.id).find(
    (i) => VERTICAL_OF_ID[i] === vertical,
  );
  const image = id ? STAND_IN.get(id) : undefined;
  return image ? { thumb: image.src, page: image.src } : null;
}

function StandInPlate({ vertical, mode }: { vertical: Vertical; mode: Mode }) {
  const frame = standInFor(vertical);
  const { w, h } = PLATE[mode];
  if (!frame) {
    return (
      <div
        style={{ width: w, height: h }}
        className="mk-hole grid max-w-full place-items-center p-5"
      >
        <span className="bg-background/85 p-3 text-center">
          <Caption className="text-[11px] leading-snug">
            <span className="text-foreground">Nothing on the site.</span> No{" "}
            {VERTICAL_LABEL[vertical].toLowerCase()} frame ships today.
          </Caption>
        </span>
      </div>
    );
  }
  return (
    <CoverPlate
      frame={frame}
      vertical={vertical}
      source="The site"
      index={0}
      mode={mode}
    />
  );
}

/**
 * ONE PLACE, AGAINST THE PAGE AS IT STANDS: today's frame, then the source's.
 *
 * ★ ONE SCROLLING ROW, NEVER TWO STACKED ONES. `BeforeAfter` wraps by design,
 * which is right for two specimens that fit side by side; here each half is a
 * literal 320 by 400 card and the pair is 1,300 pixels wide inside a 430-pixel
 * column, so wrapping put the before a full card above the after and made each
 * of thirteen cards nine hundred pixels tall. The board's own rule settles it
 * (round six: "never scaled, never zoomed", so a card that will not fit its
 * column scrolls): `flex-nowrap` and the scroller the contact sheets already
 * use, with the two captions still under the judged area.
 *
 * ★ THE KIND OF EVENT IS RESOLVED ONCE AND BOTH HALVES WEAR IT. A source with
 * nothing for conferences falls back to a kind it does have, and the stand-in
 * follows it: otherwise the pair would differ in two ways at once and the card
 * would be comparing a wedding with a festival.
 */
export function SourceSwap({
  source,
  vertical,
  mode,
  count = 3,
}: {
  source: SourceCard;
  vertical: Vertical;
  mode: Mode;
  count?: number;
}) {
  const shown = shownVertical(source.id, vertical);
  const sheet = shown ? sheetFor(source.id, shown) : null;
  const kind = shown ?? vertical;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <Caption className="text-[10px] tabular-nums">
          {VERTICAL_LABEL[kind]} · {PLATE[mode].w} x {PLATE[mode].h}
        </Caption>
        {/* ★ SAY WHEN THE SHEET IS NOT THE KIND OF EVENT THAT WAS ASKED FOR. A
            source with nothing for the chosen one falls back to a kind it does
            have, which is more useful than a blank and is a lie unless it is
            labelled in the same glance. */}
        {shown !== null && shown !== vertical && (
          <span className="rounded-full bg-destructive/15 px-1.5 py-px text-[10px] font-medium text-destructive">
            nothing for {VERTICAL_LABEL[vertical].toLowerCase()}
          </span>
        )}
      </div>
      <div data-lab-bleed className="-mx-1 overflow-x-auto px-1 pb-1">
        <BeforeAfter
          className="w-fit flex-nowrap"
          labels={["As today", `With ${source.name}`]}
          before={<StandInPlate vertical={kind} mode={mode} />}
          after={
            sheet && shown ? (
              <span className="flex w-fit gap-4">
                {sheet.frames.slice(0, count).map((f, i) => (
                  <CoverPlate
                    key={f.thumb}
                    frame={f}
                    vertical={shown}
                    source={source.name}
                    index={i}
                    mode={mode}
                  />
                ))}
              </span>
            ) : (
              <NoSheet source={source} mode={mode} bare />
            )
          }
        />
      </div>
    </div>
  );
}

/* ── What an entry would have to say ───────────────────────────────────── */

/**
 * THE PROVENANCE RULE, DRAWN RATHER THAN DESCRIBED.
 *
 * The rule question is a policy call with nothing to look at, so what the step
 * puts under it is the thing the rule is ABOUT: one still that ships today,
 * with the single unverified line it carries beside the six facts the rule
 * would require. Both records are real. The left is the entry in
 * `marketing-media.ts`; the right is the staged CC0 candidate of the same
 * subject, whose six fields `provenance.test.ts` already pins field for field
 * against the JSON beside the file.
 */
const RULED_ID = "wedding-golden";

/** The release field in words: a token nobody outside this board can read. */
const PEOPLE_IN_WORDS: Record<string, string> = {
  none: "Nobody in frame",
  unidentifiable: "In frame, not identifiable",
  identifiable: "Identifiable, so not without a release",
};

export function EntryFacts({ mode }: { mode: Mode }) {
  const today = STAND_IN.get(RULED_ID);
  const staged = CANDIDATES.find((c) => c.key === RULED_ID);
  if (!today || !staged) return null;
  const six: readonly (readonly [string, string])[] = [
    ["Photographer", staged.author],
    ["Where it came from", "Wikimedia Commons, the file page"],
    ["Licence", CANDIDATE_LICENSE],
    ["The clause, quoted", CANDIDATE_CLAUSE],
    ["Fetched", CANDIDATE_RETRIEVED],
    ["The people", PEOPLE_IN_WORDS[staged.people]],
  ];
  return (
    <BeforeAfter
      // ★ TOPS, NOT BOTTOMS. The kit aligns the two halves at the baseline,
      // which is right when the captions are the only thing under them; here
      // the right half carries six rows of facts under its card, so aligning
      // the bottoms would drop the left card half a card lower than the one it
      // is being compared with.
      className="items-start"
      labels={["The line it carries today", "The six the rule would want"]}
      before={
        <span className="flex flex-col gap-2">
          <CoverPlate
            frame={{ thumb: today.src, page: today.src }}
            vertical="weddings"
            source="The site"
            index={0}
            mode={mode}
          />
          <span
            style={{ maxWidth: PLATE[mode].w }}
            className="block text-[11px] leading-snug text-destructive"
          >
            {today.credit.license}
          </span>
        </span>
      }
      after={
        <span className="flex flex-col gap-2">
          <CoverPlate
            frame={{
              thumb: `/design/media-kit/${staged.file}`,
              page: staged.sourceUrl,
            }}
            vertical="weddings"
            source="The staged batch"
            index={0}
            mode={mode}
          />
          <dl
            style={{ maxWidth: PLATE[mode].w }}
            className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-[11px] leading-snug"
          >
            {six.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-pretty">{value}</dd>
              </div>
            ))}
          </dl>
        </span>
      }
    />
  );
}
