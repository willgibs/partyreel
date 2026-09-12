"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./home-hero-lab.css";

import Image from "next/image";
import Link from "next/link";
import { Play, RotateCcw } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { Caption } from "@/components/marketing/system/caption";
import { DemoTicket } from "@/components/marketing/system/demo-ticket";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { CinemaHero } from "@/components/marketing/sections/home/cinema-hero";
import { Button } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { SITE_SUBHEAD, SITE_THESIS } from "@/lib/constants/marketing-voice";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

import { Variant } from "./variant-frame";

/**
 * Touchpoint: THE HOME HERO (Will, 2026-09-01 and 2026-09-12: "I'd love a full
 * home hero redesign", cut as its own agent round).
 *
 * ── THE DIAGNOSIS, WHICH IS THE WHOLE BOARD ──
 *
 * Bible rule 1: "the guest's photographs are the loudest thing on every
 * surface." On the shipped hero they are the QUIETEST thing on the page. The
 * wall of 24 tiles carries FOUR stacked darkenings (a flat black/35, a
 * three-stop ramp to black/90, a radial vignette, and a fifth ramp below sm),
 * because white type had to survive over any tile the drift happened to park
 * under it. The result is measurable and visible in one screenshot: not a
 * single photograph reads as a photograph. Nobody's face lands. The album is
 * texture, and the type is the loudest thing in the frame.
 *
 * So the hero's real question is not "which media" or "which word animation".
 * It is: WHERE DOES THE TYPE LIVE, so that no photograph is ever dimmed?
 *
 * Four answers, one per variant, and they are the only thing being compared:
 *
 *   V1 The contact sheet   the type is a CELL in the album (an ink plate
 *                          seated on the sheet's own grid lines)
 *   V2 The split           the type has its own COLUMN (ink meets photograph
 *                          at a hard film-frame edge)
 *   V3 The arrival         the type sits in a BAND above, and the album below
 *                          it fills, live, as you watch
 *   V4 One frame           the type is a small TITLE CARD over a single
 *                          photograph that owns the screen
 *
 * Every one of them runs the media at 100%: no scrim, no vignette, no ramp,
 * anywhere. That is the point. The secondary consequence is FEWER, BIGGER
 * photographs (8 to 20 instead of 24 thumbnails), which is the other half of
 * rule 1: a photograph nobody can see is not media-forward, it is wallpaper.
 *
 * ── WHAT IS HELD FIXED ──
 *
 *  - The copy. SITE_THESIS and SITE_SUBHEAD are ruled (rule 21) and render
 *    verbatim; the eyebrow is the shipped hero's line. Nothing here rewrites
 *    a word: a copy change is Will's ruling, not a variant's.
 *  - The h1 is never gated (rule 13 / marketing-h1-policy): it is at opacity 1
 *    at paint in all four, and the album does the arriving.
 *  - The ladder (rule 5): each variant takes the ladder's `lg` or `xl` step
 *    verbatim from PageHero, never a ramp of its own.
 *  - Cinema (rule 16): the hero stays dark and stays UNLIT. No lamp is
 *    proposed here; this is a design problem, not a lighting one, and the wall
 *    is the ground, not a source (the 2026-09-12 ruling on this track).
 *
 * ── THE OPEN SUB-QUESTION ON THE BOARD ──
 *
 * The kinetic word. The shipped h1 splices wedding / birthday / festival /
 * send-off through the thesis. Every variant reads better with it OFF, because
 * the variety that word was carrying is now carried by the photographs
 * themselves, which is a stronger argument for the same idea. The toggle above
 * the board runs both so the claim can be judged rather than asserted.
 *
 * Lab convention, deliberate: nothing here wires use-ambient-pause on scroll
 * (the lab never pauses, side by side comparison wants everything running).
 * Loops pause on a hidden TAB only, which costs nothing and cannot misfire.
 * Production wiring is use-ambient-pause, exactly as the shipped hero has it.
 */

/* ---------------------------------------------------------------------------
 * The media. Eight to twenty frames, hand-sequenced so neighbours differ in
 * palette and subject; the manifest is the only source (rule 18).
 * ------------------------------------------------------------------------- */

/** The sheet order: the twelve manifest frames, sequenced for contrast. */
const FRAMES = [
  "wedding-golden",
  "party-dj",
  "reception-table",
  "festival-lights",
  "wedding-petals",
  "concert-confetti",
  "wedding-toast",
  "festival-crowd",
  "wedding-rings",
  "reception-hall",
  "party-balloons",
  "wedding-arch",
] as const;

function frame(i: number) {
  return marketingImage(FRAMES[i % FRAMES.length]);
}

/** One photograph at FULL luminance. There is no scrim prop and there never
 *  should be: a variant that needs one has not solved the composition. */
function Photo({
  index,
  className,
  sizes = "33vw",
  eager = false,
  style,
  develop,
  land,
}: {
  index: number;
  className?: string;
  sizes?: string;
  eager?: boolean;
  style?: CSSProperties;
  /** V1's sheet seat: the develop stagger reads in this order. */
  develop?: number;
  /** V3: this tile just landed. */
  land?: boolean;
}) {
  const img = frame(index);
  return (
    <div
      {...(develop !== undefined ? { "data-hh-develop": "" } : {})}
      {...(land ? { "data-hh-land": "" } : {})}
      className={cn("relative overflow-hidden bg-white/5", className)}
      style={
        develop !== undefined
          ? ({ ...style, "--i": develop } as CSSProperties)
          : style
      }
    >
      <Image
        src={img.src}
        alt=""
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        className="object-cover"
      />
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * The lockup. One component for all four variants ON PURPOSE: the board must
 * compare COMPOSITIONS, not four hand-rolled type stacks, and a shared lockup
 * is also what production would take (PageHero's grammar, which the home
 * cannot use because it is a bespoke hero by the 2026-09-02 ruling).
 * ------------------------------------------------------------------------- */

/** The ladder's two cinema steps, RESOLVED per canvas (rule 5).
 *
 *  ★ Why resolved and not the ramp itself: PageHero's steps are viewport ramps
 *  (`text-4xl ... lg:text-7xl`), and a Tailwind breakpoint keys off the real
 *  VIEWPORT, never the stage. Inside a board that shows a 1440 canvas and a 375
 *  canvas on one page, the ramp would give both of them whatever the reviewer's
 *  own window says, which is how a lab specimen quietly stops being the thing it
 *  claims to specify. These are the same two steps at their 1440 and 375 ends:
 *  `xl` is text-5xl..text-8xl, `lg` is text-4xl..text-7xl. Retune PageHero's
 *  HERO_SCALE and retune these, or the board stops telling the truth. */
const LADDER = {
  xl: { desktop: "text-8xl", phone: "text-5xl" },
  lg: { desktop: "text-7xl", phone: "text-4xl text-balance" },
} as const;

const HERO_EYEBROW = "One QR. No app. No account.";

/* THE SITE'S OWN LEFT GUTTER, mirrored as `pl-28` / `left-28` / `px-28` on the
   desktop canvas and `px-4` on the phone one. Container is max-w-7xl centred
   with lg:px-8, so at 1440 the page column starts at 112px and at 375 at 16px.
   Matching it is what puts the hero's h1 on the same line as every section
   below it, which the shipped hero gets for free by wrapping in <Container>
   and which a hero built out of GRID CELLS cannot: a cell is not the page.
   Production wiring takes the real Container wherever the composition allows
   and mirrors the value, like this, where it does not. */

const [THESIS_BEFORE, THESIS_AFTER] = SITE_THESIS.split("event") as [
  string,
  string,
];
const KINETIC_WORDS = ["wedding", "birthday", "festival", "send-off"] as const;

function Lockup({
  step,
  mode,
  align = "left",
  kinetic,
  ticket = true,
  className,
}: {
  step: keyof typeof LADDER;
  mode: Mode;
  align?: "left" | "center";
  kinetic: boolean;
  ticket?: boolean;
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "flex flex-col",
        centered ? "items-center text-center" : "items-start",
        className,
      )}
    >
      <Eyebrow className="text-white/70">{HERO_EYEBROW}</Eyebrow>
      {/* ★ NEVER gated (rule 13 + marketing-h1-policy): no reveal, no cut, no
          .mkt-line, no stagger seat. The album arrives; the promise does not. */}
      <h1
        className={cn(
          "mt-4 font-heading leading-[1.02] text-white",
          LADDER[step][mode],
          centered ? "max-w-3xl" : "max-w-[15ch]",
        )}
      >
        {kinetic ? (
          <>
            {THESIS_BEFORE}
            <span className="sr-only">event</span>
            <KineticSlot />
            {THESIS_AFTER}
          </>
        ) : (
          SITE_THESIS
        )}
      </h1>
      <p
        className={cn(
          "mt-5 text-[15px] leading-relaxed text-white/80",
          centered ? "max-w-xl text-balance" : "max-w-md text-pretty",
        )}
      >
        {SITE_SUBHEAD}
      </p>
      <div
        className={cn(
          "mt-7 flex flex-wrap items-center gap-3",
          centered && "justify-center",
        )}
      >
        <Button asChild size="lg" className="h-11 px-6 text-base">
          <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
        </Button>
        {/* The secondary keeps its body: over an UNDIMMED photograph a
            hairline outline reads as plain text, which is what R4/A13 already
            found on the shipped hero and is only more true at 100%. */}
        <Button
          size="lg"
          variant="outline"
          className="h-11 gap-2 border-white/40 bg-black/45 px-5 text-base text-white backdrop-blur-[2px] hover:border-white/50 hover:bg-white/15 hover:text-white"
        >
          <Play className="size-4 fill-current" />
          Watch a sample reel
        </Button>
      </div>
      {ticket && (
        <div className="mt-5">
          <DemoTicket />
        </div>
      )}
    </div>
  );
}

/** The shipped splice mechanic, ported so the toggle compares like with like:
 *  the word swaps instantly (a projector splice) and the box width glides once,
 *  so the sentence closing up around the new word is the only visible motion. */
function KineticSlot() {
  const reduced = usePrefersReducedMotion();
  const [i, setI] = useState(0);
  const [width, setWidth] = useState<number | null>(null);
  const sizerRef = useRef<HTMLSpanElement | null>(null);
  const word = reduced ? "event" : KINETIC_WORDS[i];

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(
      () => setI((n) => (n + 1) % KINETIC_WORDS.length),
      3200,
    );
    return () => clearInterval(t);
  }, [reduced]);

  useLayoutEffect(() => {
    const sizer = sizerRef.current;
    if (!sizer) return;
    const sync = () => setWidth(Math.ceil(sizer.getBoundingClientRect().width));
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(sizer);
    return () => ro.disconnect();
  }, [word]);

  return (
    <span
      aria-hidden
      className="relative inline-block overflow-hidden align-baseline"
      style={{
        width: width === null ? undefined : width,
        transition: "width 180ms var(--ease-in-out-strong)",
      }}
    >
      <span ref={sizerRef} className="invisible inline-block whitespace-nowrap">
        {word}
      </span>
      <span className="absolute inset-0 whitespace-nowrap">{word}</span>
    </span>
  );
}

/* ---------------------------------------------------------------------------
 * V1 THE CONTACT SHEET. The lockup is a CELL: an ink plate seated on the
 * sheet's own grid lines, so the type never crosses a photograph and the
 * photographs never lose a stop. Eight frames instead of twenty-four, because
 * the argument is that a photograph you can actually see beats four you
 * cannot. The sheet develops once in reading order and rests.
 * ------------------------------------------------------------------------- */

function ContactSheet({ mode, kinetic }: VariantProps) {
  const phone = mode === "phone";
  if (phone) {
    return (
      <div className="flex h-full flex-col gap-1.5 bg-background">
        {/* The ink cell takes the top, which also puts the overlay header on
            ink rather than on a photograph: the logo and the nav get a real
            ground for free, which the shipped hero pays a scrim for. */}
        <div className="flex flex-col justify-end px-4 pt-16 pb-6">
          <Lockup step="lg" mode={mode} kinetic={kinetic} ticket={false} />
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-1.5">
          {[0, 1, 2, 3, 4].map((n) => (
            <Photo
              key={n}
              index={n}
              develop={n}
              eager={n < 2}
              sizes="50vw"
              className={n === 0 ? "col-span-2" : ""}
            />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="grid h-full grid-cols-5 grid-rows-3 gap-1.5 bg-background">
      <Photo index={0} develop={0} eager className="col-span-2" sizes="40vw" />
      <Photo index={1} develop={1} eager sizes="20vw" />
      <Photo index={2} develop={2} eager sizes="20vw" />
      <Photo index={3} develop={3} eager sizes="20vw" />
      {/* THE CELL. Bottom-left, two by two: the album's own grid holds the
          promise, which is the thesis stated structurally rather than claimed. */}
      <div className="col-span-2 row-span-2 flex flex-col justify-center pr-8 pl-28">
        <Lockup step="lg" mode={mode} kinetic={kinetic} ticket={false} />
      </div>
      <Photo index={4} develop={4} className="col-span-2" sizes="40vw" />
      <Photo index={5} develop={5} sizes="20vw" />
      <Photo index={6} develop={6} sizes="20vw" />
      <Photo index={7} develop={7} className="col-span-2" sizes="40vw" />
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * V2 THE SPLIT. The type gets its own ground, so no scrim is even possible,
 * and the album runs to the edge at 100%, bleeding off the top and the bottom
 * because an album does not end at a viewport. Three columns drift, the middle
 * one against the other two: an album that keeps going, which is the quietest
 * honest way to say "everything, forever".
 * ------------------------------------------------------------------------- */

function DriftColumn({
  seed,
  down,
  durationSeconds,
  count = 5,
}: {
  seed: number;
  down?: boolean;
  durationSeconds: number;
  count?: number;
}) {
  // Two copies of the same run and a -50% travel: the seam never shows.
  const run = Array.from({ length: count }, (_, n) => seed + n * 3);
  return (
    <div className="relative min-h-0 overflow-hidden">
      <div
        data-hh-col={down ? "down" : ""}
        className="absolute inset-x-0 top-0 flex flex-col gap-1.5"
        style={{ "--hh-col-dur": `${durationSeconds}s` } as CSSProperties}
      >
        {[...run, ...run].map((n, i) => (
          <div key={i} className="relative aspect-[4/5] w-full shrink-0">
            <Photo
              index={n}
              eager={i < 2}
              sizes="25vw"
              className="absolute inset-0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function Split({ mode, kinetic }: VariantProps) {
  const phone = mode === "phone";
  if (phone) {
    return (
      <div className="flex h-full flex-col bg-background">
        <div className="flex shrink-0 flex-col justify-end px-4 pt-16 pb-8">
          <Lockup step="lg" mode={mode} kinetic={kinetic} ticket={false} />
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5">
          <DriftColumn seed={0} durationSeconds={72} />
          <DriftColumn seed={1} down durationSeconds={86} />
          <DriftColumn seed={2} durationSeconds={64} />
        </div>
      </div>
    );
  }
  return (
    <div className="grid h-full grid-cols-[minmax(0,42fr)_minmax(0,58fr)] bg-background">
      {/* No seam, no hairline, no gradient: ink meets photograph the way one
          film frame meets the next. A rule drawn here would be a fifth thing
          to look at in a frame that is already carrying eight photographs. */}
      <div className="flex flex-col justify-center py-10 pr-10 pl-28">
        <Lockup step="lg" mode={mode} kinetic={kinetic} />
      </div>
      <div className="grid min-h-0 grid-cols-3 gap-1.5">
        <DriftColumn seed={0} durationSeconds={72} />
        <DriftColumn seed={1} down durationSeconds={86} />
        <DriftColumn seed={2} durationSeconds={64} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * V3 THE ARRIVAL. The type sits in a band ABOVE; the album below it starts
 * nearly empty and FILLS, one photograph at a time, with the guest who sent
 * each one named for a beat and the count climbing. It is the only variant
 * that demonstrates the product instead of describing it: "the whole event, in
 * one album" stops being a claim and becomes something you watched happen.
 *
 * ★ THE HONEST COST, which belongs on the board and not in a footnote: this is
 * very close to what the LIVE DEMO section already does at position 7 of the
 * home arc (tiles fly into an album, toasts pop, counters tick). Ruling for V3
 * is therefore also a ruling that the live demo changes or goes, or the page
 * says the same thing twice in one chapter.
 * ------------------------------------------------------------------------- */

const ARRIVAL_SLOTS = 18;
const ARRIVAL_START = 4;
const ARRIVAL_BEAT_MS = 260;
const ARRIVAL_TARGET = 214; // the demo album's own count (DECOMPOSITION_FACTS)

/** The Maya and Jay fixture family, the same art-directed demo event the live
 *  demo and the feature pages use. Not real people, no real PII. */
const ARRIVAL_CHIPS = [
  "Maya added 3 photos",
  "Jay is in",
  "12 more from the dance floor",
  "Priya added a video",
] as const;

function Arrival({ mode, kinetic }: VariantProps) {
  const reduced = usePrefersReducedMotion();
  const phone = mode === "phone";
  const cols = phone ? 3 : 6;
  const [landed, setLanded] = useState(reduced ? ARRIVAL_SLOTS : ARRIVAL_START);
  const [chip, setChip] = useState(-1);

  useEffect(() => {
    if (reduced) return;
    let n = ARRIVAL_START;
    const t = setInterval(() => {
      n += 1;
      setLanded(n);
      if (n % 4 === 0) setChip((c) => c + 1);
      if (n >= ARRIVAL_SLOTS) clearInterval(t);
    }, ARRIVAL_BEAT_MS);
    return () => clearInterval(t);
  }, [reduced]);

  // The count rides the fill so the number is never a decoration: it is the
  // same album, told twice. ★ It is a fraction of the SLOTS, not of the ones
  // that have landed since the start, or the line opens reading "0 photos"
  // under an album with four photographs visibly in it.
  const count = reduced
    ? ARRIVAL_TARGET
    : Math.round((ARRIVAL_TARGET * landed) / ARRIVAL_SLOTS);

  return (
    <div className="flex h-full flex-col bg-background">
      <div
        className={cn(
          "flex shrink-0 flex-col justify-center",
          phone
            ? "px-5 pt-14 pb-6"
            : "items-center px-8 pt-16 pb-9 text-center",
        )}
      >
        <Lockup
          step="lg"
          mode={mode}
          align={phone ? "left" : "center"}
          kinetic={kinetic}
          ticket={false}
        />
      </div>

      {/* The seam line: the album's live state, on the cut between the band and
          the album, so the number and the thing it counts are never apart. */}
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-3 border-t border-white/10 py-2.5",
          phone ? "px-4" : "px-28",
        )}
      >
        <MonoCaption className="text-white/55 tabular-nums">
          {count} photos, 23 guests, 1 album
        </MonoCaption>
        <div className="h-5">
          {chip >= 0 && !reduced && (
            <span
              key={chip}
              data-hh-chip
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/85 backdrop-blur-sm"
            >
              <span className="size-1.5 rounded-full bg-success" />
              {ARRIVAL_CHIPS[chip % ARRIVAL_CHIPS.length]}
            </span>
          )}
        </div>
      </div>

      {/* The album, bleeding off the bottom: the page continues, and so does
          the album. Empty slots are the ground, never a placeholder skeleton. */}
      <div
        className="grid min-h-0 flex-1 gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridAutoRows: phone ? "44%" : "52%",
        }}
      >
        {Array.from({ length: ARRIVAL_SLOTS }, (_, n) =>
          n < landed ? (
            <Photo
              key={n}
              index={n}
              land={!reduced && n >= ARRIVAL_START}
              eager={n < ARRIVAL_START}
              sizes={phone ? "33vw" : "17vw"}
            />
          ) : (
            <div key={n} />
          ),
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * V4 ONE FRAME. Rule 1 at its most literal: ONE guest's photograph, undimmed,
 * owning about seventy percent of the viewport. The album is present as the
 * contact strip along the bottom, and the frame hard-cuts to the next
 * photograph on the house film-cut grammar (instant, no crossfade). The type
 * is a title card: a small opaque ink plate, so the photograph is at 100%
 * everywhere except behind one deliberate rectangle.
 * ------------------------------------------------------------------------- */

const CUT_MS = 4200;

function OneFrame({ mode, kinetic }: VariantProps) {
  const reduced = usePrefersReducedMotion();
  const phone = mode === "phone";
  const [shot, setShot] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(
      () => setShot((n) => (n + 1) % FRAMES.length),
      CUT_MS,
    );
    return () => clearInterval(t);
  }, [reduced]);

  const strip = (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1.5 border-t border-white/10 bg-background",
        phone ? "px-4 py-2" : "px-28 py-2.5",
      )}
    >
      <div className="flex min-w-0 flex-1 gap-1.5 overflow-hidden">
        {FRAMES.map((id, i) => (
          <button
            key={id}
            type="button"
            onClick={() => setShot(i)}
            data-hh-thumb
            aria-label={`Frame ${i + 1}`}
            className={cn(
              "relative h-11 w-16 shrink-0 overflow-hidden",
              i === shot
                ? "opacity-100 ring-1 ring-white/70"
                : "opacity-45 hover:opacity-80",
            )}
            style={i === shot ? { transform: "translateY(-2px)" } : undefined}
          >
            <Image
              src={marketingImage(id).src}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
      {!phone && (
        <MonoCaption className="shrink-0 pl-3 text-white/45 tabular-nums">
          {String(shot + 1).padStart(2, "0")} / {FRAMES.length}
        </MonoCaption>
      )}
    </div>
  );

  const plate = (
    <div
      className={cn(
        "bg-background",
        phone
          ? "px-4 pt-6 pb-7"
          : "w-[30rem] rounded-[var(--radius)] border border-white/12 p-8",
      )}
    >
      <Lockup step="lg" mode={mode} kinetic={kinetic} ticket={false} />
      <Caption className="mt-5 text-white/45">
        214 photos, 23 guests, one album
      </Caption>
    </div>
  );

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* The cut is a CUT: a fresh node, no transition, no crossfade. The
            house film grammar, and the only motion the frame has. */}
        <Image
          key={FRAMES[shot]}
          src={marketingImage(FRAMES[shot]).src}
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        {!phone && (
          <div className="absolute inset-y-0 left-28 flex items-center">
            {plate}
          </div>
        )}
      </div>
      {strip}
      {phone && plate}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * The board.
 * ------------------------------------------------------------------------- */

type Mode = "desktop" | "phone";
type VariantProps = { mode: Mode; kinetic: boolean };

/** The canvases the board judges on. A hero is a VIEWPORT-shaped thing, so the
 *  board renders it at a real viewport's pixels and fits that canvas to the lab
 *  column with `zoom` (which scales layout, not just paint: the composition
 *  inside genuinely lays out at 1440 or at 375). The alternative, letting the
 *  stage be whatever width the lab column happens to be, is how a lab specimen
 *  drifts: at 800px a 1440 design is not smaller, it is a different design. */
const CANVAS = {
  desktop: { w: 1440, h: 930 },
  phone: { w: 375, h: 760 },
} as const;

/** The stage: the CINEMA ROUTE GROUP's own wrapper at a real viewport's size,
 *  so a variant reads against the real tokens (marketing.css deepens
 *  --background to the ruled cinema room off data-mkt-skin) rather than a
 *  hand-picked oklch literal, which is how a lab specimen drifts from its
 *  production surface. */
function Stage({ mode, children }: { mode: Mode; children: React.ReactNode }) {
  const hidden = useTabHidden();
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const { w, h } = CANVAS[mode];

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const sync = () =>
      setScale(Math.min(1, box.getBoundingClientRect().width / w));
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(box);
    return () => ro.disconnect();
  }, [w]);

  return (
    <div ref={boxRef} className="flex justify-center">
      <div
        className="dark relative overflow-hidden rounded-lg border border-border text-foreground"
        data-mkt
        data-mkt-skin="cinema"
        data-paused={hidden ? "true" : undefined}
        style={{ zoom: scale, width: w, height: h }}
      >
        {children}
      </div>
    </div>
  );
}

/** Pause loops in a hidden tab only. No IntersectionObserver on purpose: the
 *  lab wants everything running side by side, and an IO here would also make
 *  the board unverifiable in a background tab, where observers never fire. */
function useTabHidden(): boolean {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const sync = () => setHidden(document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
  return hidden;
}

function Toggle<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5"
    >
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.id)}
            className={cn(
              "rounded-md px-3 py-1 text-[12px] font-medium transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const VARIANTS: {
  n: number;
  name: string;
  rationale: string;
  render: (p: VariantProps) => React.ReactNode;
}[] = [
  {
    n: 1,
    name: "The contact sheet",
    rationale:
      "The type is a cell in the album: an ink plate on the sheet's own grid lines, so no photograph is ever crossed and none is ever dimmed. Eight frames, not twenty-four.",
    render: (p) => <ContactSheet {...p} />,
  },
  {
    n: 2,
    name: "The split",
    rationale:
      "The type gets its own ground, so a scrim is not even possible. Ink meets photograph at a hard frame edge, and three columns drift on so the album reads as endless.",
    render: (p) => <Split {...p} />,
  },
  {
    n: 3,
    name: "The arrival",
    rationale:
      "The band holds the promise; the album below it fills as you watch, guest by guest, with the count climbing. The only variant that demonstrates the product instead of describing it.",
    render: (p) => <Arrival {...p} />,
  },
  {
    n: 4,
    name: "One frame",
    rationale:
      "Rule 1 at its most literal: one guest's photograph owning the screen at 100%, the album as the contact strip below, the type as a small title card. The frame hard-cuts on the house film grammar.",
    render: (p) => <OneFrame {...p} />,
  },
];

export function HomeHeroVariants() {
  const [mode, setMode] = useState<Mode>("desktop");
  const [kinetic, setKinetic] = useState(false);
  const [runId, setRunId] = useState(0);
  const reduced = usePrefersReducedMotion();

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="max-w-2xl space-y-3 text-xs leading-relaxed text-muted-foreground">
        <p>
          Bible rule 1 says the guest&apos;s photographs are the loudest thing
          on every surface. On the shipped hero they are the quietest: the wall
          carries four stacked darkenings so white type can survive over any
          tile the drift parks under it, and not one photograph reads as a
          photograph.
        </p>
        <p>
          So the question this board asks is not which media or which word
          animation. It is where the type lives, so that no photograph is ever
          dimmed. Four answers: a cell in the album, its own column, a band
          above, a title card over one frame. All four run the media at 100%
          with no scrim, no vignette and no ramp anywhere, and all four show
          fewer, bigger photographs.
        </p>
        <p className="border-l-2 border-foreground/25 pl-3 text-foreground">
          <span className="font-medium">The recommendation: V1.</span> It is the
          only one that solves the problem structurally rather than by
          partition, and the only one whose composition IS the thesis: the
          promise is a page in the album, seated on the album&apos;s own grid
          lines. V2 is the close second and the safer pick, with the most air
          for the type and the same guarantee that nothing can ever push a scrim
          back over the media. V4 is the most beautiful frame and the weakest
          argument, because one photograph is not an album. V3 makes the
          strongest argument of all and costs the most: it does what the live
          demo already does at position 7 of the home arc, so ruling for it is
          also ruling that the live demo changes. If V1 wins, the combination
          worth a second round is V1&apos;s sheet FILLING rather than
          developing: V3&apos;s beat on V1&apos;s composition.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
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
          ariaLabel="Kinetic word"
          options={[
            { id: "off", label: "Thesis verbatim" },
            { id: "on", label: "Kinetic word" },
          ]}
          value={kinetic ? "on" : "off"}
          onChange={(v) => setKinetic(v === "on")}
        />
        <button
          type="button"
          onClick={() => setRunId((n) => n + 1)}
          className="flex h-7 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition-transform active:scale-95"
        >
          <RotateCcw className="size-3.5" />
          Replay
        </button>
        {reduced && (
          <span className="text-[11px] text-muted-foreground">
            Reduced motion: every composition settled, the album already full.
          </span>
        )}
      </div>

      {VARIANTS.map((v) => (
        <Variant
          key={v.n}
          n={v.n}
          name={v.name}
          rationale={v.rationale}
          framed={false}
        >
          <Stage mode={mode} key={`${v.n}-${mode}-${runId}-${String(kinetic)}`}>
            {v.render({ mode, kinetic })}
          </Stage>
        </Variant>
      ))}

      {/* The reference, last on purpose: the board argues against it, so it
          should be judged after the four rather than framed by it. */}
      <Variant
        n={0}
        name="Today, for reference"
        rationale="The shipped hero, live from production code. Four stacked darkenings over twenty-four tiles; the reel card floats free of the composition."
        framed={false}
      >
        <Stage mode={mode} key={`today-${mode}-${runId}`}>
          {/* The shipped hero is 100svh and pulls itself up under the overlay
              header; the stage owns the height here, so both are neutralized
              locally rather than by touching production. */}
          <div className="h-full [--mkt-header-h:0px] [&>section]:h-full [&>section]:min-h-0">
            <CinemaHero />
          </div>
        </Stage>
      </Variant>
    </div>
  );
}
