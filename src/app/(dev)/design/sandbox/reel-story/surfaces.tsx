"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { GroundBox } from "@/components/lab";
import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import {
  CARD_COPY_SCRIM,
} from "@/components/marketing/sections/features/shared/feature-door";
import { InlineReelPlayer } from "@/components/marketing/sections/shared/inline-reel-player";
import { CategoryEmblem } from "@/components/marketing/help/help-emblems";
import { Caption } from "@/components/marketing/system/caption";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { River } from "@/components/shared/river/river";
import {
  QR_DOOR_FRAMES,
  QR_DOOR_SIZES,
} from "@/components/shared/river/qr-door-frames";
import { EVENT_TYPES } from "@/lib/constants/events";
import { MARKETING_REELS } from "@/lib/constants/marketing-media";
import { MAX_REEL_SECONDS } from "@/lib/constants/tiers";
import { CanvasReelPlayer } from "@/lib/reel/engine/player";
import { cn } from "@/lib/utils";

import {
  DEMO_REEL_LANDSCAPE,
  DEMO_REEL_PORTRAIT,
  TEASER_STILLS,
  type ScreenId,
} from "./fixtures";

/**
 * THE BOARD'S OWN PIECES: real components and real single-sources wherever one
 * reaches, a small local replica only where the shipped piece has no prop for
 * the word this board is asking about (CtaBand and SectionShell take a
 * heading/subhead directly; a feature door and the events' reel column read
 * their copy from an internal lookup, so those two are redrawn locally on the
 * SAME classes, imports and fixture ids the shipped components use).
 *
 * ★ A REAL <Link> IN A BOARD IS A TRAP THE BOARD MUST DISARM ITSELF
 * (the loose-ends / privacy-hero precedent). Nothing here is portalled into an
 * isolated frame, so `stopLinks` rides every specimen's own root and a click
 * that would navigate is swallowed instead.
 */

function stopLinks(e: React.MouseEvent) {
  if ((e.target as HTMLElement).closest?.("a[href]")) e.preventDefault();
}

function formatDuration(seconds: number): string {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/* ── the device the board draws on ──────────────────────────────────────── */

const DEVICE: Record<ScreenId, { w: number; name: string }> = {
  "1440": { w: 1440, name: "a laptop" },
  "375": { w: 375, name: "a phone" },
};

export function Screen({
  id,
  screen,
  h,
  caption,
  ground = "cinema",
  children,
}: {
  id: string;
  screen: ScreenId;
  h: number;
  caption: string;
  ground?: "cinema" | "paper";
  children: ReactNode;
}) {
  const { w, name } = DEVICE[screen];
  return (
    <figure
      data-reel-story-frame={id}
      className="m-0 flex min-w-0 flex-col gap-2"
      onClickCapture={stopLinks}
    >
      <figcaption className="flex flex-col gap-0.5" style={{ width: w }}>
        <span className="text-sm font-medium">{`${w} wide, ${name}`}</span>
        <span className="min-h-[2.75rem] text-[11px] leading-snug text-muted-foreground">
          {caption}
        </span>
      </figcaption>
      <GroundBox
        ground={ground}
        className="overflow-x-hidden overflow-y-auto rounded-lg border border-border"
        style={{ width: w, height: h }}
      >
        {children}
      </GroundBox>
    </figure>
  );
}

/* ── 1. the thesis line ──────────────────────────────────────────────────── */

/**
 * The home's own close, verbatim (`cinema-close.tsx`): the real `SectionLight`
 * over the real `CtaBand`, the candidate line dropped into the exact slot
 * `GOLDEN_LINES.reelThesis` fills today. No `secondary` action ships here, so
 * the button row's own `sm:flex-row` never has a second child to arrange,
 * which is why this stands safely in a plain box rather than a real viewport.
 */
export function ThesisClose({ line }: { line: string }) {
  return (
    <div className="dark bg-background text-foreground">
      <div
        style={{
          backgroundImage:
            "radial-gradient(120% 70% at 50% 100%, oklch(0.32 0.05 250 / 0.35), transparent 60%)",
        }}
      >
        <div className="border-t border-white/10 px-6 py-16 text-center sm:py-20">
          <h2 className="mx-auto max-w-2xl font-heading text-subhead text-balance">
            Roll credits on the group chat.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
            {line} Free to host, and guests join with one scan.
          </p>
          <span className="mt-8 inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-medium text-black">
            Start free
          </span>
          <p className="mt-4 text-xs text-muted-foreground">
            Try the live demo, no signup.
          </p>
          <Caption className="mt-16">
            A Partyreel production &middot; partyreel.com
          </Caption>
        </div>
      </div>
    </div>
  );
}

/** The reel poster the shipped feature door shows: the landscape render, same fixture id (`feature-door.tsx`). */
const DOOR_REEL_ID = "hero-candidate-02";

/**
 * The feature hub's reel door, redrawn: `CARD_COPY_SCRIM` and the poster are
 * the real exported pieces `feature-door.tsx` composes with; only the title's
 * line is a prop here; `doorFor("reel")` has none.
 */
export function ThesisDoor({ line, phone }: { line: string; phone: boolean }) {
  const reel = MARKETING_REELS.find((r) => r.id === DOOR_REEL_ID)!;
  return (
    <div className="p-6">
      <div
        className={cn(
          "mkt-learn group relative mx-auto block overflow-hidden rounded-xl bg-muted",
          phone ? "aspect-[16/9] w-full" : "aspect-[21/9] w-full max-w-xl",
        )}
      >
        <Image src={reel.poster} alt="" fill sizes="640px" className="object-cover" />
        <span
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10"
        />
        <span aria-hidden className="absolute inset-0" style={CARD_COPY_SCRIM} />
        <span aria-hidden className="absolute top-3 left-3">
          <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-black/55 px-2 text-micro font-medium text-white backdrop-blur-sm">
            <Play className="size-3 fill-white" />
            {formatDuration(reel.durationSeconds)}
          </span>
        </span>
        <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-5">
          <span className="flex items-center gap-1.5 font-heading text-subhead text-white">
            The highlight reel
            <LearnChevron />
          </span>
          <span className="max-w-lg text-sm leading-relaxed text-balance text-white/70">
            {line}
          </span>
        </span>
      </div>
    </div>
  );
}

export function ThesisPreview({ line, phone }: { line: string; phone: boolean }) {
  return (
    <div>
      <Caption className="px-6 pt-4">The home&rsquo;s close</Caption>
      <ThesisClose line={line} />
      <Caption className="px-6 pt-6">The feature hub&rsquo;s reel door</Caption>
      <ThesisDoor line={line} phone={phone} />
    </div>
  );
}

/* ── 2. the /reel page's arc ─────────────────────────────────────────────── */

export type ArcKey = "live" | "screen" | "cut";

const ARC_CHAPTER: Record<ArcKey, { eyebrow: string; heading: string; body: string }> = {
  live: {
    eyebrow: "Alive now",
    heading: "The reel",
    body: "A looping montage of everything the album shows right now, alive from the second photo. No file, no download, spliced within seconds of a new upload.",
  },
  screen: {
    eyebrow: "The flagship moment",
    heading: "The screen",
    body: "Play on a screen opens the reel full-bleed with the event's name in a corner: scan, add, on the wall a minute later.",
  },
  cut: {
    eyebrow: "Yours to make",
    heading: "A cut",
    body: "Anyone taps Make your own: pick moments, a look, a length. It renders on the device and shares as a file, unlimited, never stored.",
  },
};

function ArcMedia({ chapter, phone }: { chapter: ArcKey; phone: boolean }) {
  if (chapter === "live") {
    return (
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-xl border bg-black">
        <CanvasReelPlayer
          reelProps={phone ? DEMO_REEL_PORTRAIT : DEMO_REEL_LANDSCAPE}
          showControls={false}
          maxDim={420}
        />
      </div>
    );
  }
  if (chapter === "screen") {
    return (
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-md border-4 border-neutral-800 bg-black shadow-lift">
        <CanvasReelPlayer reelProps={DEMO_REEL_LANDSCAPE} showControls={false} maxDim={420} />
      </div>
    );
  }
  return (
    <div className="mx-auto w-[132px] overflow-hidden rounded-xl bg-black shadow-lift">
      <InlineReelPlayer reelId="hero-candidate-01" sizes="132px" />
    </div>
  );
}

export function ArcPreview({
  order,
  phone,
}: {
  order: readonly [ArcKey, ArcKey, ArcKey];
  phone: boolean;
}) {
  return (
    <div className="dark bg-background text-foreground">
      <div className={cn("flex flex-col items-center gap-3 border-b border-white/10 px-6 py-10 text-center", phone && "px-4 py-8")}>
        <Eyebrow>The highlight reel</Eyebrow>
        <h1 className={cn("font-heading text-balance", phone ? "text-3xl" : "text-5xl")}>
          Every event has a reel.
        </h1>
        <p className="max-w-md text-sm text-pretty text-muted-foreground">
          The style switcher stays here: pick a mood, watch the same take redraw.
        </p>
      </div>
      <div className={cn("mx-auto flex max-w-2xl flex-col gap-10 px-6 py-10", phone && "gap-8 px-4 py-8")}>
        {order.map((key) => (
          <div key={key} className="flex flex-col items-center gap-3 border-t border-white/10 pt-10 text-center first:border-t-0 first:pt-0">
            <Caption>{ARC_CHAPTER[key].eyebrow}</Caption>
            <h2 className="font-heading text-subsection">{ARC_CHAPTER[key].heading}</h2>
            <p className="max-w-md text-sm text-pretty text-muted-foreground">
              {ARC_CHAPTER[key].body}
            </p>
            <div className="mt-2 w-full">
              <ArcMedia chapter={key} phone={phone} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 3. the home's teaser ────────────────────────────────────────────────── */

export type TeaserVariant = "engine" | "film" | "poster" | "crossfade";

/** The `crossfade` option's own cycle: the album's stills, never the album's
 *  newest (that undid the very differentiation the album's own tile exists to
 *  make), one shared keyframe (reel-story.css), phase-shifted by a negative
 *  per-image delay so each gets its own sixth of the cycle. */
function TeaserCrossfade({ images }: { images: readonly string[] }) {
  const n = images.length || 1;
  const total = 3.2 * n;
  return (
    <div className="absolute inset-0 overflow-hidden">
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- a local fixture still
        <img
          key={src + i}
          src={src}
          alt=""
          data-rs-hero={i === 0 ? "" : undefined}
          className="rs-crossfade-img"
          style={
            {
              "--rs-hold": 3.2,
              "--rs-delay": i * 3.2 - total,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

const TEASER_SUBHEAD =
  "Alive from the second photo, styled by the host, yours to switch. Every guest can make their own cut.";

export function TeaserPreview({
  variant,
  phone,
}: {
  variant: TeaserVariant;
  phone: boolean;
}) {
  const filmReel = MARKETING_REELS.find((r) => r.id === "hero-candidate-02")!;
  return (
    <div className="dark bg-background text-foreground">
      <SectionShell
        eyebrow="The reel"
        heading="Every event has a reel."
        subhead={TEASER_SUBHEAD}
        scale="lg"
        reveal="none"
        className="pt-14 pb-10"
      >
        <div className="mx-auto mt-10 max-w-2xl">
          {variant === "engine" && (
            <div className="overflow-hidden rounded-2xl border bg-black ring-1 ring-foreground/5">
              <CanvasReelPlayer
                reelProps={phone ? DEMO_REEL_PORTRAIT : DEMO_REEL_LANDSCAPE}
                showControls={false}
                maxDim={560}
              />
            </div>
          )}
          {variant === "film" && (
            <InlineReelPlayer
              reelId="hero-candidate-02"
              sizes="640px"
              className="rounded-2xl border bg-black ring-1 ring-foreground/5"
            />
          )}
          {variant === "poster" && (
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-black ring-1 ring-foreground/5">
              <Image src={filmReel.poster} alt="" fill sizes="640px" className="object-cover" />
              <span aria-hidden className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
                  <Play className="size-6 translate-x-0.5 fill-current" />
                </span>
              </span>
            </div>
          )}
          {variant === "crossfade" && (
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-black ring-1 ring-foreground/5">
              <TeaserCrossfade images={TEASER_STILLS} />
            </div>
          )}
          <Caption className="mt-4 text-center tabular-nums">
            {variant === "engine" && "Playing live · the demo album's own reel"}
            {variant === "film" && `A real render · ${formatDuration(filmReel.durationSeconds)}`}
            {variant === "poster" && "A still frame, until you tap it"}
            {variant === "crossfade" && "The album tile's own crossfade · no engine"}
          </Caption>
        </div>
      </SectionShell>
    </div>
  );
}

/* ── 4. the pricing rows ─────────────────────────────────────────────────── */

export type PricingVariant = "renamed" | "clip-renamed" | "one-row" | "footnote";

function PriceRow({ label, values }: { label: string; values: [string, string, string] }) {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_1fr] items-baseline gap-3 border-t border-dashed border-border py-3 text-sm">
      <span className="text-foreground">{label}</span>
      {values.map((v, i) => (
        <span key={i} className="text-center text-muted-foreground">
          {v}
        </span>
      ))}
    </div>
  );
}

export function PricingPreview({ variant }: { variant: PricingVariant }) {
  const free = MAX_REEL_SECONDS.free;
  const pass = MAX_REEL_SECONDS.event_pass;
  const pro = MAX_REEL_SECONDS.pro;
  return (
    <div className="dark bg-background p-6 text-foreground sm:p-8">
      <div className="mx-auto max-w-xl rounded-xl border bg-background p-6">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-3 border-b border-border pb-2 text-label font-medium text-muted-foreground uppercase">
          <span />
          <span className="text-center">Free</span>
          <span className="text-center">Event Pass</span>
          <span className="text-center">Pro</span>
        </div>
        {variant === "renamed" && (
          <>
            <PriceRow label="Cut length" values={[`${free}s`, `${pass}s`, `${pro}s`]} />
            <PriceRow label="Cut watermark" values={["Small mark", "None", "None"]} />
          </>
        )}
        {variant === "clip-renamed" && (
          <>
            <PriceRow label="Clip length" values={[`${free}s`, `${pass}s`, `${pro}s`]} />
            <PriceRow label="Clip watermark" values={["Small mark", "None", "None"]} />
          </>
        )}
        {variant === "one-row" && (
          <PriceRow
            label="Your reel"
            values={[`${free}s, small mark`, `${pass}s, no mark`, `${pro}s, no mark`]}
          />
        )}
        {variant === "footnote" && (
          <p className="pt-3 text-xs text-pretty text-muted-foreground">
            The reel and the cut carry no row here: the live reel and the
            screen are unmarked and uncapped on every plan.
          </p>
        )}
      </div>
      {variant === "footnote" && (
        <p className="mx-auto mt-4 max-w-xl text-pretty text-xs text-muted-foreground">
          {`* A free event's own cut carries a small mark and runs ${free} seconds; the Event Pass and Pro carry neither.`}
        </p>
      )}
    </div>
  );
}

/* ── 5. the how-it-works steps ───────────────────────────────────────────── */

export type StepsVariant = "grow-cut" | "grow-clip" | "screen-step" | "folded";

type StepCopy = { title: string; body: string };

const CUT_STEP: StepCopy = {
  title: "Make your cut",
  body: "Tap Make your own on the reel: pick a look and a length, and it renders free, right on your phone.",
};

/** The same step, his own guest-facing word: a clip, never a second body of
 *  copy to keep in sync (`steps` draws clip beside cut, never past it). */
const CLIP_STEP: StepCopy = { title: "Make your clip", body: CUT_STEP.body };

const GROW_HOST: StepCopy = {
  title: "Watch the reel grow",
  body: "The reel is already playing by the second photo, restyled anytime from the hub. Nothing to publish, nothing to manage.",
};

const STEPS_COPY: Record<
  StepsVariant,
  { host: StepCopy | null; guest: StepCopy; foldedNote?: string }
> = {
  "grow-cut": {
    host: GROW_HOST,
    guest: CUT_STEP,
  },
  "grow-clip": {
    host: GROW_HOST,
    guest: CLIP_STEP,
  },
  "screen-step": {
    host: {
      title: "Put it on a screen",
      body: "Open Play on a screen from the hub and the reel fills the wall, updating as photos land all night.",
    },
    guest: CUT_STEP,
  },
  folded: {
    host: null,
    guest: {
      title: "Take it all home",
      body: "Save a favourite, download the whole album, or make your own cut of the reel that has been playing all night.",
    },
    foldedNote: "Neither side numbers the reel on its own; it rides inside the last step instead.",
  },
};

function stepCount(variant: StepsVariant): number {
  return variant === "folded" ? 5 : 6;
}

function StepRail({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: count }, (_, i) => {
        const active = i === count - 1;
        return (
          <span
            key={i}
            className={cn(
              "flex size-8 items-center justify-center rounded-full border text-xs font-medium tabular-nums",
              active
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground",
            )}
          >
            {i + 1}
          </span>
        );
      })}
    </div>
  );
}

function StepCard({ side, step }: { side: "Host" | "Guest"; step: StepCopy }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border p-5">
      <Caption>{side}, the last step</Caption>
      <h3 className="font-heading text-subsection">{step.title}</h3>
      <p className="text-sm text-pretty text-muted-foreground">{step.body}</p>
    </div>
  );
}

export function StepsPreview({ variant, phone }: { variant: StepsVariant; phone: boolean }) {
  const copy = STEPS_COPY[variant];
  return (
    <div className="dark flex flex-col gap-8 bg-background p-6 text-foreground sm:p-10">
      <StepRail count={stepCount(variant)} />
      <div className={cn("mx-auto grid w-full max-w-2xl gap-4", phone ? "grid-cols-1" : "grid-cols-2")}>
        {copy.host && <StepCard side="Host" step={copy.host} />}
        <StepCard side="Guest" step={copy.guest} />
      </div>
      {copy.foldedNote && (
        <p className="text-center text-xs text-muted-foreground">{copy.foldedNote}</p>
      )}
    </div>
  );
}

/* ── 6. the events pages' reel column ────────────────────────────────────── */

export type EventsVariant = "wall" | "cut" | "gone";

const DOOR_REEL_ID_EVENTS = "hero-candidate-01";
const DOOR_RATIO = 0.78;

const PROMISE =
  "A real Partyreel album, curated by the host who ran it, open with no sign-up.";

function DemoDoorColumn({ phone }: { phone: boolean }) {
  return (
    <div className={cn(!phone && "lg:col-span-7")}>
      <div
        className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-[oklch(0.13_0_0)] ring-1 ring-white/10"
        style={{ aspectRatio: `1 / ${DOOR_RATIO}` }}
      >
        <River
          className="rvr-ink"
          frames={QR_DOOR_FRAMES}
          ratio={DOOR_RATIO}
          origin={-0.1 * DOOR_RATIO}
          sizes={QR_DOOR_SIZES}
        />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 bg-linear-to-t from-black from-30% via-black/80 to-transparent p-6 pt-24">
          <p className="max-w-md font-heading text-page text-balance text-white">
            {PROMISE}
          </p>
          <span className="mt-1 inline-flex h-10 items-center rounded-full bg-white px-5 text-sm font-medium text-black">
            Explore the demo
          </span>
        </div>
      </div>
    </div>
  );
}

const EVENT_ANGLE: Record<Exclude<EventsVariant, "gone">, string> = {
  wall: "The live reel plays on the wall all night, restyled by the host, growing with every photo your guests take.",
  cut: "Tap Make your own on the reel and take home a highlight clip built from your own night, shareable in a tap.",
};

function ReelColumn({ variant, phone }: { variant: Exclude<EventsVariant, "gone">; phone: boolean }) {
  return (
    <div className={cn("flex flex-col gap-5", !phone && "lg:col-span-5")}>
      <div className="flex flex-col gap-2.5">
        <p className="font-heading text-subsection">And it ends with a reel.</p>
        <p className="text-sm text-pretty text-muted-foreground">{EVENT_ANGLE[variant]}</p>
      </div>
      <div className="flex items-end gap-5">
        <div className="w-[150px] shrink-0 overflow-hidden rounded-[var(--radius-tile)] shadow-lift ring-1 ring-white/10">
          {variant === "wall" ? (
            <CanvasReelPlayer reelProps={DEMO_REEL_PORTRAIT} showControls={false} maxDim={300} />
          ) : (
            <InlineReelPlayer reelId={DOOR_REEL_ID_EVENTS} sizes="150px" />
          )}
        </div>
        <div className="flex flex-col gap-3 pb-1">
          <Caption className="tabular-nums">
            {variant === "wall" ? "Playing live · the demo album" : "A real render · 13s"}
          </Caption>
          <LearnMoreLink href="/reel">See how reels work</LearnMoreLink>
        </div>
      </div>
    </div>
  );
}

export function EventsPreview({ variant, phone }: { variant: EventsVariant; phone: boolean }) {
  const weddings = EVENT_TYPES.find((t) => t.slug === "weddings")!;
  return (
    <div className="dark bg-background p-6 text-foreground sm:p-10">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-2 pb-10 text-center">
        <Eyebrow>See one that is real</Eyebrow>
        <h2 className="font-heading text-subsection">{`Open a ${weddings.singularLabel} that already happened.`}</h2>
      </div>
      <div
        className={cn(
          "mx-auto grid gap-8",
          variant === "gone" ? "max-w-md" : phone ? "max-w-md grid-cols-1" : "max-w-4xl lg:grid-cols-12 lg:items-center",
        )}
      >
        <DemoDoorColumn phone={phone || variant === "gone"} />
        {variant !== "gone" && <ReelColumn variant={variant} phone={phone} />}
      </div>
    </div>
  );
}

/* ── 7. the help category's name ─────────────────────────────────────────── */

export type HelpVariant =
  | "highlight-reel"
  | "the-reel"
  | "reels-cuts"
  | "live-reel";

const HELP_LABEL: Record<HelpVariant, string> = {
  "highlight-reel": "Highlight reel",
  "the-reel": "The reel",
  "reels-cuts": "Reels and cuts",
  "live-reel": "The live reel",
};

function NavRow({ label }: { label: string }) {
  return (
    <div className="mkt-learn flex max-w-2xs flex-col gap-0.5 rounded-lg border border-white/15 px-3 py-2">
      <span className="flex items-center gap-1 text-sm font-medium text-white">
        {label}
        <LearnChevron />
      </span>
      <span className="text-xs leading-snug text-white/60">
        The whole event, cut into a minute.
      </span>
    </div>
  );
}

function StripCell({ label }: { label: string }) {
  return (
    <div className="flex min-w-[92px] flex-col items-center gap-1 border-l border-border px-2 py-3 first:border-l-0">
      <CategoryEmblem slug="highlight-reel" className="scale-90" />
      <span className="text-micro leading-tight whitespace-nowrap text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function CategoryPane({ label }: { label: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card p-6">
      <div className="flex items-center gap-4">
        <CategoryEmblem slug="highlight-reel" size="lg" />
        <div className="min-w-0">
          <p className="text-label font-medium text-muted-foreground uppercase">
            6 guides
          </p>
          <h3 className="mt-0.5 font-heading text-subhead">{label}</h3>
        </div>
      </div>
      <p className="mt-3 text-sm text-pretty text-muted-foreground">
        Your event&rsquo;s best moments, live on the wall and yours to cut.
      </p>
    </div>
  );
}

export function HelpNamingPreview({ variant }: { variant: HelpVariant }) {
  const label = HELP_LABEL[variant];
  return (
    <div className="bg-background p-6 text-foreground">
      <Caption>The header panel, and the footer&rsquo;s Product column</Caption>
      <div className="dark mt-2 flex justify-center rounded-xl bg-[oklch(0.13_0_0)] p-6">
        <NavRow label={label} />
      </div>
      <Caption className="mt-6">The help hub&rsquo;s category strip</Caption>
      <div className="mt-2 flex overflow-hidden rounded-xl border">
        <StripCell label={label} />
      </div>
      <Caption className="mt-6">The category pane</Caption>
      <div className="mt-2">
        <CategoryPane label={label} />
      </div>
    </div>
  );
}
