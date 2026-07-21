"use client";

import {
  Check,
  ChevronRight,
  Clapperboard,
  Download,
  Heart,
  Image as ImageIcon,
  Play,
  Plus,
  RotateCcw,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { MotionTuner } from "@/components/dev/motion-tuner";
import type { TunerControl } from "@/components/dev/motion-tuner-config";
import { CanvasReelPlayer } from "@/lib/reel/engine/player";
import { resolveStyleEntry } from "@/lib/reel/engine/style-registry";
import { cn } from "@/lib/utils";

import { usePrefersReducedMotion } from "./marketing-lab-shared";
import {
  EVENT_NAME,
  FilmstripGrid,
  GuestSettledRow,
  LengthRow,
  MOMENT_COUNT,
  MomentTag,
  ReelMark,
  RXP_COVER,
  RXP_THUMBS,
  RXP_TUNE_MS,
  rvlMs,
  rxpMs,
  StatusChip,
  STYLE_GROUP_LABEL,
  STYLE_GROUPS,
  StyleThumb,
  useStyleReelProps,
} from "./reel-experience-shared";
import { type ActScript, useRevealActs } from "./reel-reveal-shared";
import { PhoneShell } from "../screens/phone-shell";
import { Variant } from "./variant-frame";

/**
 * Touchpoint: the REEL EXPERIENCE (R3 slice C). Will's verdict on the shipped
 * reel UI, verbatim: "very weak and v1". The engine underneath (WYSIWYG
 * canvas, on-device export, deterministic take) is excellent; this round
 * redesigns everything AROUND it. Three directions, each covering the same
 * four moments so they compare like-for-like:
 *
 *   A  the event-page reel section
 *   B  creation/curation, including identity for the 14 styles
 *   C  the publish moment (mandated loud, ADR-0022 d.1)
 *   D  the guest arrival on /e/
 *
 *   1  Marquee in the feed   the reel stays inline but becomes the feed's
 *                            crown jewel (poster card, labeled control rows,
 *                            thumbnail style rail)
 *   2  The Studio            a full-bleed room you go to (style wall on your
 *                            own media, filmstrip dock, publish framed by the
 *                            canvas)
 *   3  The Premiere          the reel's lifecycle as the UI (build, create
 *                            fires the RATIFIED reveal, publish is the finale)
 *
 * Style previews everywhere are the REAL engine frame-locked on the fixtures
 * (never faked screenshots); the media set carries one video item so the
 * poster path is exercised in every direction (ruling 10). The reveal beats
 * are CLOSED: V3 reuses the ratified [data-rvl-composite] grammar and its
 * --tune-rvl-* vars untouched. Only the publish beats are tunable here.
 */
export function ReelExperienceVariants() {
  return (
    <div className="py-4">
      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
        Every phone is interactive: fill or create the reel, tap styles to
        restyle the live canvas instantly, share it with guests, and tap the
        guest card to play each direction&apos;s arrival cut. The players are
        the real canvas engine on the fixture cut (one item is a video, drawn
        from its poster). The motion tuner (bottom corner) retimes the publish
        beats; the reveal beats are ratified and stay fixed.
      </p>

      <div className="mt-10 flex flex-col gap-16">
        <Variant
          n={1}
          name="Marquee in the feed"
          rationale="Feed-native evolution: the reel keeps its place in the stacked feed but gets a face (the poster card is a live paused player), labeled control rows instead of chip soup, a thumbnail style rail on your own media, and a persistent share card. Lowest risk, strongest continuity."
          framed={false}
        >
          <MarqueeDirection />
        </Variant>

        <Variant
          n={2}
          name="The Studio"
          rationale="A dedicated room: the feed holds only a poster tile and the action bar's Reel slot becomes Open studio. Inside, the canvas is the whole upper screen, reorder lives in a filmstrip dock while the reel keeps playing, and the style wall previews all 14 styles on your media. Publishing plays inside the studio and the exit lands on the Shared poster."
          framed={false}
        >
          <StudioDirection />
        </Variant>

        <Variant
          n={3}
          name="The Premiere"
          rationale="The lifecycle is the UI: a builder card while curating, CREATE REEL fires the ratified reveal (its natural trigger), the settled state asks the one question that matters (share it?), and a rare-tier finale flips the section to its Shared stage. First visit and hundredth visit finally differ."
          framed={false}
        >
          <PremiereDirection />
        </Variant>
      </div>

      {/* The publish-beat tuner: the reveal's --tune-rvl-* knobs are NOT here
          (ratified closed); these three retime only this round's new beats.
          Unmount cleanup drops every override. */}
      <MotionTuner controls={RXP_TUNER_CONTROLS} />
    </div>
  );
}

const RXP_TUNER_CONTROLS: TunerControl[] = [
  {
    kind: "range",
    cssVar: "--tune-rxp-pub-ms",
    label: "Publish flourish",
    min: 300,
    max: 1400,
    step: 50,
    unit: "ms",
    default: RXP_TUNE_MS["--tune-rxp-pub-ms"],
  },
  {
    kind: "range",
    cssVar: "--tune-rxp-celebrate-ms",
    label: "Premiere finale",
    min: 500,
    max: 1800,
    step: 50,
    unit: "ms",
    default: RXP_TUNE_MS["--tune-rxp-celebrate-ms"],
  },
  {
    kind: "range",
    cssVar: "--tune-rxp-sheet-ms",
    label: "Sheets + swaps",
    min: 160,
    max: 300,
    step: 10,
    unit: "ms",
    default: RXP_TUNE_MS["--tune-rxp-sheet-ms"],
  },
];

// ---------------------------------------------------------------------------
// Small sketch chrome (aria-hidden context, never the subject)
// ---------------------------------------------------------------------------

/** The stacked feed's pill row with Reel active (sketch: the section model is
 *  ratified, ruling 12; only the section's CONTENT is this round's subject). */
function FeedPills() {
  return (
    <div aria-hidden className="flex items-center gap-1.5">
      {["Gallery", "Reel", "Guests"].map((p) => (
        <span
          key={p}
          className={cn(
            "flex h-6 items-center rounded-full px-2.5 text-[10px] font-medium",
            p === "Reel"
              ? "bg-foreground text-background"
              : "border border-border text-muted-foreground",
          )}
        >
          {p}
        </span>
      ))}
    </div>
  );
}

/** The section eyebrow: the reel finally gets marquee weight (violet mark +
 *  the display face), answering the audit's whisper-weight finding. */
function SectionEyebrow({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-7 items-center justify-between gap-2">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.18em] text-foreground uppercase">
        <ReelMark />
        The reel
      </p>
      {children}
    </div>
  );
}

/** A guest album sketch (masonry-ish) the arrival card sits inside. */
function AlbumSketch() {
  return (
    <div aria-hidden className="grid grid-cols-3 gap-[var(--gap-gallery)]">
      {RXP_THUMBS.slice(2, 8).map(({ src }, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          className={cn(
            "w-full rounded-[var(--radius-tile)] object-cover",
            i % 3 === 1 ? "aspect-[3/4]" : "aspect-square",
          )}
        />
      ))}
    </div>
  );
}

/** The lab reset control under each phone. */
function ResetRow({
  onReset,
  label,
  note,
}: {
  onReset: () => void;
  label: string;
  note: string;
}) {
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={onReset}
        className="flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
      >
        <RotateCcw className="size-3" />
        {label}
      </button>
      <p className="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground">
        {note}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1 · Marquee in the feed
// ---------------------------------------------------------------------------

function MarqueeDirection() {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <MomentTag letter="ABC" label="Host: section, curation, publish" />
        <MarqueeHostPhone />
      </div>
      <div>
        <MomentTag letter="D" label="Guest arrival on /e/" />
        <GuestArrivalPhone
          entry="marquee"
          note="The /e/ card IS the host's poster card (one component, host and guest continuity). The first view skips the assembly flight (guests did not curate) and keeps the ratified back half: flash, expand, title, settled."
        />
      </div>
    </div>
  );
}

function MarqueeHostPhone() {
  const [filled, setFilled] = useState(false);
  const [styleId, setStyleId] = useState("classic");
  const [shared, setShared] = useState(false);
  const reelProps = useStyleReelProps(styleId);
  const style = resolveStyleEntry(styleId);

  return (
    <div>
      <PhoneShell>
        <div className="absolute inset-0 overflow-y-auto overscroll-contain bg-background">
          <div className="flex flex-col gap-3 p-4 pt-9 pb-8">
            {/* Feed context (sketch). */}
            <div aria-hidden>
              <p className="text-[9px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                {EVENT_NAME}
              </p>
              <div className="mt-2">
                <FeedPills />
              </div>
            </div>

            <SectionEyebrow>
              <StatusChip shared={shared} />
            </SectionEyebrow>

            {!filled ? (
              /* The empty state: a ghosted poster card with a VISIBLE path in
                 (no hover-hidden affordance) + signal-aware fill. */
              <div
                data-dir-card
                className="relative overflow-hidden rounded-lg"
              >
                <div
                  aria-hidden
                  className="grid grid-cols-4 gap-[2px] opacity-25 blur-[1.5px]"
                >
                  {RXP_THUMBS.map(({ src }) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={src}
                      src={src}
                      alt=""
                      className="aspect-[4/5] w-full object-cover"
                    />
                  ))}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <Clapperboard className="size-6 text-reel" />
                  <p data-dir-display className="text-base leading-tight">
                    Your reel starts here
                  </p>
                  <p className="max-w-[220px] text-[11px] leading-snug text-muted-foreground">
                    Pick moments from the gallery, or start with the crowd
                    favorites
                  </p>
                  <button
                    type="button"
                    data-dir-press
                    onClick={() => setFilled(true)}
                    className="mt-1 flex h-9 items-center gap-1.5 rounded-[var(--radius-action-sm)] bg-reel px-3.5 text-xs font-medium text-white"
                  >
                    <Heart className="size-3.5" />
                    Fill with your {MOMENT_COUNT} most liked
                  </button>
                  <span
                    aria-hidden
                    className="text-[10px] font-medium text-muted-foreground underline underline-offset-2"
                  >
                    Pick them myself
                  </span>
                </div>
              </div>
            ) : (
              <div data-rxp-swap className="flex flex-col gap-3">
                {/* The poster card: the reel's face, a LIVE player with the
                    event name in the style's type treatment. */}
                <div className="relative overflow-hidden rounded-lg">
                  <CanvasReelPlayer
                    reelProps={reelProps}
                    showControls={false}
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-24 rounded-b-lg bg-gradient-to-t from-black/65 to-transparent"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
                    <p
                      data-dir-display
                      className="text-lg leading-tight text-white"
                    >
                      {EVENT_NAME}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-[oklch(0.8_0.14_300)]">
                      0:30 · {style.label} · {MOMENT_COUNT} moments
                    </p>
                  </div>
                </div>

                {/* The publish moment: a persistent share card pinned under
                    the player (ruling 1: prominent, one tap, default OFF). */}
                <div
                  data-rxp-share
                  data-state={shared ? "on" : "off"}
                  data-dir-card
                  className="rounded-lg p-3"
                >
                  {!shared ? (
                    <div data-rxp-swap>
                      <button
                        type="button"
                        data-dir-press
                        onClick={() => setShared(true)}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-action)] bg-reel text-sm font-medium text-white"
                      >
                        <Share2 className="size-4" />
                        Share with guests
                      </button>
                      <p className="mt-2 text-center text-[10px] text-muted-foreground">
                        Only you can see it until you share
                      </p>
                    </div>
                  ) : (
                    <div data-rxp-swap className="flex items-center gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-reel text-white">
                        <Check className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium">
                          Live for your guests
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          On the album page, ready to watch
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShared(false)}
                        className="shrink-0 text-[10px] font-medium text-muted-foreground underline underline-offset-2"
                      >
                        Unshare
                      </button>
                    </div>
                  )}
                </div>

                {/* Labeled control groups instead of one chip strip. Style is
                    the thumbnail rail: every style is the real engine on YOUR
                    media, tap to restyle instantly. */}
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                      Style
                    </p>
                    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                      {STYLE_GROUPS.map(({ kind, styles }) => (
                        <div key={kind} className="flex gap-2">
                          <span className="flex w-4 shrink-0 items-center justify-center">
                            <span className="rotate-180 text-[8px] font-semibold tracking-[0.16em] text-muted-foreground/70 uppercase [writing-mode:vertical-rl]">
                              {STYLE_GROUP_LABEL[kind]}
                            </span>
                          </span>
                          {styles.map((s) => (
                            <StyleThumb
                              key={s.id}
                              style={s}
                              active={s.id === styleId}
                              onSelect={setStyleId}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div aria-hidden>
                    <p className="mb-1.5 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                      Layout
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-7 items-center rounded-[var(--radius-action-sm)] border border-foreground bg-foreground px-2.5 text-[11px] font-medium text-background">
                        Portrait
                      </span>
                      <span className="flex h-7 items-center rounded-[var(--radius-action-sm)] border border-border px-2.5 text-[11px] font-medium text-muted-foreground">
                        Landscape
                      </span>
                    </div>
                  </div>

                  <div aria-hidden>
                    <p className="mb-1.5 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                      Cover
                    </p>
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={RXP_COVER}
                        alt=""
                        className="h-10 w-8 rounded-[var(--radius-tile)] object-cover"
                      />
                      <span className="text-[11px] font-medium text-muted-foreground underline underline-offset-2">
                        Change cover
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                      Length
                    </p>
                    <LengthRow />
                  </div>
                </div>

                {/* The filmstrip: the curated set, video tile on its poster. */}
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                      Moments
                    </p>
                    <p
                      aria-hidden
                      className="text-[10px] text-muted-foreground"
                    >
                      {MOMENT_COUNT} · drag to reorder
                    </p>
                  </div>
                  <FilmstripGrid />
                </div>
              </div>
            )}

            {/* The next feed section, whisper weight (sketch). */}
            <p
              aria-hidden
              className="mt-2 border-t border-border pt-3 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase"
            >
              Guests · 12
            </p>
          </div>
        </div>
      </PhoneShell>
      <ResetRow
        onReset={() => {
          setFilled(false);
          setShared(false);
          setStyleId("classic");
        }}
        label="Reset to first run"
        note="The fill is signal-aware (most liked first), never random. Style taps restyle the live poster instantly; the rail's thumbs are the engine frame-locked on the same media. Sharing is the one violet moment in the card stack."
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2 · The Studio
// ---------------------------------------------------------------------------

type StudioView = "feed" | "pick" | "studio";
type StudioSheet = "none" | "style" | "cover" | "length" | "layout";

function StudioDirection() {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <MomentTag letter="ABC" label="Host: feed poster, studio, publish" />
        <StudioHostPhone />
      </div>
      <div>
        <MomentTag letter="D" label="Guest arrival on /e/" />
        <GuestArrivalPhone
          entry="studio"
          note="Symmetry is the pitch: the guest overlay IS the studio's canvas minus the controls (one full-bleed player serves both). The card tap expands straight into the composite's back half: expand, title, settled."
        />
      </div>
    </div>
  );
}

function StudioHostPhone() {
  const [view, setView] = useState<StudioView>("feed");
  const [created, setCreated] = useState(false);
  const [shared, setShared] = useState(false);
  const [styleId, setStyleId] = useState("classic");
  const [sheet, setSheet] = useState<StudioSheet>("none");
  const [publishing, setPublishing] = useState(false);
  const reelProps = useStyleReelProps(styleId);
  const style = resolveStyleEntry(styleId);
  const reduced = usePrefersReducedMotion();
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const openStudio = () => setView(created ? "studio" : "pick");

  const publish = () => {
    if (publishing) return;
    if (reduced) {
      // No theater under reduced motion: the state just lands.
      setShared(true);
      setView("feed");
      return;
    }
    setPublishing(true);
    // The glow plays, the card confirms, then the exit returns to the feed
    // where the poster tile wears its Shared state (the beat's resolution).
    timer.current = window.setTimeout(
      () => {
        setPublishing(false);
        setShared(true);
        setView("feed");
      },
      rxpMs("--tune-rxp-pub-ms") + 900,
    );
  };

  return (
    <div>
      <PhoneShell>
        <div className="absolute inset-0 overflow-hidden bg-background">
          {view === "feed" ? (
            <div
              data-rxp-swap
              className="absolute inset-0 flex flex-col gap-3 overflow-y-auto p-4 pt-9 pb-16"
            >
              <div aria-hidden>
                <p className="text-[9px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                  {EVENT_NAME}
                </p>
                <div className="mt-2">
                  <FeedPills />
                </div>
              </div>

              <SectionEyebrow />

              {/* The whole section: one poster tile + status + two actions.
                  The feed gets lighter; the poster carries the temptation. */}
              <div
                data-dir-card
                className="flex items-center gap-3 rounded-lg p-3"
              >
                <span className="relative w-20 shrink-0 overflow-hidden rounded-[6px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={RXP_COVER}
                    alt=""
                    className="aspect-[9/16] w-full object-cover"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-1.5 left-1/2 flex size-6 -translate-x-1/2 items-center justify-center rounded-full bg-white/90">
                    <Play className="ml-0.5 size-3 fill-zinc-900 text-zinc-900" />
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p data-dir-display className="text-base leading-tight">
                    The reel
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {created
                      ? `0:30 · ${style.label} · ${MOMENT_COUNT} moments`
                      : "Not made yet"}
                  </p>
                  <div className="mt-1.5">
                    <StatusChip shared={shared} />
                  </div>
                  <button
                    type="button"
                    data-dir-press
                    onClick={openStudio}
                    className="mt-2 flex h-8 items-center gap-1.5 rounded-[var(--radius-action-sm)] bg-reel px-3 text-xs font-medium text-white"
                  >
                    <Clapperboard className="size-3.5" />
                    Open studio
                  </button>
                </div>
              </div>

              <div aria-hidden className="opacity-60">
                <p className="mb-1.5 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Gallery
                </p>
                <AlbumSketch />
              </div>

              {/* The action bar's Reel slot is the studio door (no more
                  disabled "Soon" chip). Sketch. */}
              <div
                aria-hidden
                className="absolute inset-x-4 bottom-4 flex h-11 items-center justify-between rounded-[var(--radius-action-lg)] border border-border bg-background/90 px-2 shadow-sm backdrop-blur"
              >
                <span className="flex h-8 items-center gap-1.5 rounded-[var(--radius-action-sm)] px-2.5 text-[11px] font-medium text-muted-foreground">
                  <Plus className="size-3.5" />
                  Add photos
                </span>
                <span className="flex h-8 items-center gap-1.5 rounded-[var(--radius-action-sm)] bg-reel/10 px-2.5 text-[11px] font-medium text-reel">
                  <Clapperboard className="size-3.5" />
                  Open studio
                </span>
              </div>
            </div>
          ) : null}

          {view === "pick" ? (
            /* First run enters through a guided beat: signal-aware suggestions
               arrive pre-checked; one tap starts the studio with them. */
            <div
              data-rxp-swap
              className="absolute inset-0 flex flex-col gap-3 overflow-y-auto p-4 pt-9"
            >
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.18em] text-reel uppercase">
                  <Sparkles className="size-3" />
                  First cut
                </p>
                <p data-dir-display className="mt-1 text-lg leading-tight">
                  Pick your moments
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  The crowd favorites are already picked for you
                </p>
              </div>
              <div className="grid grid-cols-3 gap-[var(--gap-gallery)]">
                {RXP_THUMBS.map(({ src, video }, i) => (
                  <span key={src} className="relative" aria-hidden>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      className="aspect-[4/5] w-full rounded-[var(--radius-tile)] object-cover"
                    />
                    <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-reel text-white">
                      <Check className="size-2.5" />
                    </span>
                    {i < 3 ? (
                      <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[8px] font-medium text-white">
                        <Heart className="size-2 fill-white" />
                        {14 - i * 3}
                      </span>
                    ) : null}
                    {video ? (
                      <span className="absolute right-1 bottom-1 flex size-4 items-center justify-center rounded-full bg-black/55">
                        <Play className="size-2 fill-white text-white" />
                      </span>
                    ) : null}
                  </span>
                ))}
              </div>
              <div className="mt-auto pb-4">
                <button
                  type="button"
                  data-dir-press
                  onClick={() => {
                    setCreated(true);
                    setView("studio");
                  }}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-action)] bg-reel text-sm font-medium text-white"
                >
                  <Clapperboard className="size-4" />
                  Start with these {MOMENT_COUNT}
                </button>
                <p className="mt-2 text-center text-[10px] text-muted-foreground">
                  You can add or drop moments any time
                </p>
              </div>
            </div>
          ) : null}

          {view === "studio" ? (
            <div
              data-rxp-studio
              className="absolute inset-0 flex flex-col bg-[oklch(0.11_0_0)]"
            >
              {/* The studio header: exit left, ONE loud action right. */}
              <div className="flex items-center justify-between px-3 pt-9 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setSheet("none");
                    setView("feed");
                  }}
                  aria-label="Close the studio"
                  className="flex size-8 items-center justify-center rounded-full border border-white/15 text-white/80"
                >
                  <X className="size-4" />
                </button>
                <p className="text-[9px] font-medium tracking-[0.24em] text-white/50 uppercase">
                  The studio
                </p>
                {!shared ? (
                  <button
                    type="button"
                    data-dir-press
                    onClick={publish}
                    disabled={publishing}
                    className="flex h-8 items-center gap-1.5 rounded-[var(--radius-action-sm)] bg-reel px-3 text-xs font-medium text-white disabled:opacity-70"
                  >
                    <Share2 className="size-3.5" />
                    Share
                  </button>
                ) : (
                  <span className="flex h-8 items-center gap-1 rounded-[var(--radius-action-sm)] border border-reel/50 px-3 text-xs font-medium text-[oklch(0.8_0.14_300)]">
                    <Check className="size-3.5" />
                    Shared
                  </span>
                )}
              </div>

              {/* The canvas is the room: the live player fills the upper
                  screen; the publish glow breathes on ITS frame. */}
              <div className="relative min-h-0 flex-1 px-6">
                <CanvasReelPlayer reelProps={reelProps} showControls={false} />
                <div
                  aria-hidden
                  data-rxp-pubglow={publishing || undefined}
                  className={cn(
                    "pointer-events-none absolute inset-x-6 top-0 bottom-0 rounded-xl",
                    !publishing && "hidden",
                  )}
                />
                {publishing ? (
                  <div
                    data-rxp-toastcard
                    className="absolute inset-x-8 bottom-4 flex items-center gap-2 rounded-lg bg-white/95 p-2.5 shadow-lg"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-reel text-white">
                      <Check className="size-3.5" />
                    </span>
                    <div>
                      <p className="text-[11px] font-medium text-zinc-900">
                        Guests can now watch
                      </p>
                      <p className="text-[9px] text-zinc-500">
                        Live on the album page
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* The filmstrip dock: reorder happens HERE while the reel keeps
                  playing (no mode swap, no unmount). Decorative drag. */}
              <div data-dir-enter className="px-3 pt-2">
                <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                  {RXP_THUMBS.map(({ src, video }, i) => (
                    <span
                      key={src}
                      aria-hidden
                      className={cn(
                        "relative w-9 shrink-0 overflow-hidden rounded-[4px]",
                        i === 0 && "ring-2 ring-white/70",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt=""
                        className="aspect-[4/5] w-full object-cover"
                      />
                      {video ? (
                        <span className="absolute right-0.5 bottom-0.5 flex size-3 items-center justify-center rounded-full bg-black/55">
                          <Play className="size-1.5 fill-white text-white" />
                        </span>
                      ) : null}
                    </span>
                  ))}
                </div>
                <p
                  aria-hidden
                  className="mt-1 text-center text-[9px] text-white/40"
                >
                  Hold a moment to reorder, the reel keeps playing
                </p>
              </div>

              {/* The control tray: sheets slide over the canvas. */}
              <div className="flex items-center justify-center gap-1.5 px-3 pt-2 pb-4">
                {(
                  [
                    ["style", "Style"],
                    ["cover", "Cover"],
                    ["length", "Length"],
                    ["layout", "Layout"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    data-dir-press
                    onClick={() => setSheet(sheet === id ? "none" : id)}
                    className={cn(
                      "flex h-8 items-center rounded-[var(--radius-action-sm)] border px-3 text-[11px] font-medium",
                      sheet === id
                        ? "border-white bg-white text-zinc-900"
                        : "border-white/20 text-white/80",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* The style wall: all 14 styles, each the real engine on YOUR
                  media (mounted only while the sheet is open). Tap previews
                  on the main canvas instantly, WYSIWYG by construction. */}
              {sheet === "style" ? (
                <div
                  data-rxp-sheet
                  className="absolute inset-x-0 bottom-0 max-h-[46%] overflow-y-auto rounded-t-xl border-t border-white/10 bg-[oklch(0.15_0_0)] p-3 pb-5"
                >
                  {STYLE_GROUPS.map(({ kind, styles }) => (
                    <div key={kind} className="mb-2">
                      <p className="mb-1.5 text-[9px] font-semibold tracking-[0.16em] text-white/45 uppercase">
                        {STYLE_GROUP_LABEL[kind]}
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {styles.map((s) => (
                          <StyleThumb
                            key={s.id}
                            style={s}
                            active={s.id === styleId}
                            onSelect={setStyleId}
                            className="w-full"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              {sheet === "cover" ? (
                <div
                  data-rxp-sheet
                  className="absolute inset-x-0 bottom-0 rounded-t-xl border-t border-white/10 bg-[oklch(0.15_0_0)] p-3 pb-5"
                >
                  <p className="mb-1.5 text-[9px] font-semibold tracking-[0.16em] text-white/45 uppercase">
                    Cover
                  </p>
                  <div
                    aria-hidden
                    className="flex gap-1.5 overflow-x-auto pb-1"
                  >
                    {RXP_THUMBS.map(({ src }, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={src}
                        src={src}
                        alt=""
                        className={cn(
                          "aspect-[9/16] w-12 shrink-0 rounded-[4px] object-cover",
                          i === 0 && "ring-2 ring-reel",
                        )}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
              {sheet === "length" ? (
                <div
                  data-rxp-sheet
                  className="absolute inset-x-0 bottom-0 rounded-t-xl border-t border-white/10 bg-[oklch(0.15_0_0)] p-3 pb-5"
                >
                  <p className="mb-1.5 text-[9px] font-semibold tracking-[0.16em] text-white/45 uppercase">
                    Length
                  </p>
                  <div className="[&_span]:border-white/20 [&_span]:text-white/80">
                    <LengthRow compact />
                  </div>
                  <p aria-hidden className="mt-2 text-[10px] text-white/45">
                    Auto fits your moments into the cap
                  </p>
                </div>
              ) : null}
              {sheet === "layout" ? (
                <div
                  data-rxp-sheet
                  className="absolute inset-x-0 bottom-0 rounded-t-xl border-t border-white/10 bg-[oklch(0.15_0_0)] p-3 pb-5"
                >
                  <p className="mb-1.5 text-[9px] font-semibold tracking-[0.16em] text-white/45 uppercase">
                    Layout
                  </p>
                  <div aria-hidden className="flex items-center gap-1.5">
                    <span className="flex h-7 items-center rounded-[var(--radius-action-sm)] bg-white px-2.5 text-[11px] font-medium text-zinc-900">
                      Portrait
                    </span>
                    <span className="flex h-7 items-center rounded-[var(--radius-action-sm)] border border-white/20 px-2.5 text-[11px] font-medium text-white/80">
                      Landscape
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </PhoneShell>
      <ResetRow
        onReset={() => {
          setView("feed");
          setCreated(false);
          setShared(false);
          setStyleId("classic");
          setSheet("none");
          setPublishing(false);
        }}
        label="Reset demo"
        note="Open studio walks the first run through the guided pick, then the room. The style wall mounts all 14 real-engine previews only while open; taps restyle the canvas behind it instantly. Share plays the publish beat inside the studio and exits onto the Shared poster."
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3 · The Premiere
// ---------------------------------------------------------------------------

type PremiereAct =
  | "gather"
  | "condense"
  | "held"
  | "ignite"
  | "open"
  | "title"
  | "settled";

/** The RATIFIED composite's beat script, built fresh per run from the CLOSED
 *  --tune-rvl-* vars (same derivation as the reveal round: the gather hold
 *  covers the last tile's landing plus a settle breath; the open hold ends
 *  slightly early so the title enters as full bleed lands). */
function premiereScript(): ActScript<PremiereAct> {
  const fly = rvlMs("--tune-rvl-fly-ms");
  const stagger = rvlMs("--tune-rvl-stagger-ms");
  const expand = rvlMs("--tune-rvl-expand-ms");
  return [
    { act: "gather", holdMs: fly + stagger * (RXP_THUMBS.length - 1) + 60 },
    { act: "condense", holdMs: 360 },
    { act: "held", holdMs: rvlMs("--tune-rvl-hold-ms") },
    { act: "ignite", holdMs: rvlMs("--tune-rvl-flash-ms") },
    { act: "open", holdMs: Math.max(expand - 90, 120) },
    { act: "title", holdMs: rvlMs("--tune-rvl-title-ms") },
    { act: "settled", holdMs: 0 },
  ];
}

const PREMIERE_REDUCED: ActScript<PremiereAct> = [
  { act: "open", holdMs: 700 },
  { act: "title", holdMs: 1600 },
  { act: "settled", holdMs: 0 },
];

const PREMIERE_RELEASED = new Set<PremiereAct | "idle">([
  "open",
  "title",
  "settled",
]);

// The composite's ratified geometry + seeded scatter, reused verbatim.
const PREMIERE_FROM_SCALE = 0.55;
const PREMIERE_SCATTER_DEG = [-6, 4, -2, 7, -5, 2, -8, 5];

function PremiereDirection() {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <MomentTag letter="ABC" label="Host: build, create, publish" />
        <PremiereHostPhone />
      </div>
      <div>
        <MomentTag letter="D" label="Guest arrival on /e/" />
        <GuestArrivalPhone
          entry="premiere"
          note="The guest card is stage 3 made visible: the poster plus a made-from-your-moments caption. The overlay plays the title-first cut: the event name on the dark, then the reel breathes in under it."
        />
      </div>
    </div>
  );
}

function PremiereHostPhone() {
  const [phase, setPhase] = useState<"build" | "made">("build");
  const [shared, setShared] = useState(false);
  const [picked, setPicked] = useState(6);
  const [styleId, setStyleId] = useState("classic");
  const [celebrating, setCelebrating] = useState(false);
  const reelProps = useStyleReelProps(styleId);
  const style = resolveStyleEntry(styleId);
  const reduced = usePrefersReducedMotion();
  const { act, run, reset, running } = useRevealActs(
    premiereScript,
    PREMIERE_REDUCED,
  );
  const released = PREMIERE_RELEASED.has(act);
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const stageRef = useRef<HTMLDivElement | null>(null);
  const chromeTileRefs = useRef<(HTMLElement | null)[]>([]);
  const flipTileRefs = useRef<(HTMLElement | null)[]>([]);
  const screenBoxRef = useRef<HTMLDivElement | null>(null);

  /**
   * The FLIP measure, retargeted from the composite: the builder card's OWN
   * grid tiles are measured at rest, and the always-mounted flying copies are
   * parked exactly on their pixels (the chrome grid then vanishes with no
   * transition via data-rxp-ghost, so nothing is left fading behind). Each
   * copy aims at the screen box's center at the ratified from-scale.
   */
  const createReel = () => {
    const stage = stageRef.current?.getBoundingClientRect();
    const box = screenBoxRef.current?.getBoundingClientRect();
    if (stage && box) {
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      const targetW = box.width * PREMIERE_FROM_SCALE;
      chromeTileRefs.current.forEach((src, i) => {
        const dst = flipTileRefs.current[i];
        if (!src || !dst) return;
        const r = src.getBoundingClientRect();
        dst.style.left = `${r.left - stage.left}px`;
        dst.style.top = `${r.top - stage.top}px`;
        dst.style.width = `${r.width}px`;
        dst.style.height = `${r.height}px`;
        dst.style.setProperty("--dx", `${cx - (r.left + r.width / 2)}px`);
        dst.style.setProperty("--dy", `${cy - (r.top + r.height / 2)}px`);
        dst.style.setProperty("--s", `${targetW / r.width}`);
        dst.style.setProperty(
          "--r",
          `${PREMIERE_SCATTER_DEG[i % PREMIERE_SCATTER_DEG.length]}deg`,
        );
        dst.style.setProperty("--i", `${i}`);
      });
    }
    run();
  };

  /** The finale: the rare-tier celebration, then stage 3. Reduced motion
   *  skips the theater and lands the state. */
  const share = () => {
    if (celebrating) return;
    if (reduced) {
      setShared(true);
      setPhase("made");
      reset();
      return;
    }
    setCelebrating(true);
    timer.current = window.setTimeout(
      () => {
        setCelebrating(false);
        setShared(true);
        setPhase("made");
        reset();
      },
      rxpMs("--tune-rxp-celebrate-ms") + 350,
    );
  };

  const settle = () => {
    setPhase("made");
    reset();
  };

  return (
    <div>
      <PhoneShell>
        {phase === "build" ? (
          /* Stage 1 + the reveal: a ratified [data-rvl-composite] stage whose
             chrome is the builder card. CREATE REEL is the reveal's natural
             trigger, exactly as the ruling framed it. */
          <div
            ref={stageRef}
            data-rvl-stage
            data-rvl-composite
            data-act={act}
            className="absolute inset-0 overflow-hidden bg-background"
          >
            <div
              data-rvl-chrome
              className="absolute inset-0 z-0 flex flex-col gap-3 p-4 pt-9"
            >
              <div aria-hidden>
                <p className="text-[9px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                  {EVENT_NAME}
                </p>
                <div className="mt-2">
                  <FeedPills />
                </div>
              </div>

              <SectionEyebrow>
                <span
                  aria-hidden
                  className="text-[10px] font-medium text-muted-foreground"
                >
                  Not made yet
                </span>
              </SectionEyebrow>

              {/* The builder card: progress-framed curation. */}
              <div data-dir-card className="rounded-lg p-3">
                <div className="flex items-baseline justify-between">
                  <p data-dir-display className="text-base leading-tight">
                    {picked} moments picked
                  </p>
                  <p aria-hidden className="text-[10px] text-muted-foreground">
                    ready when you are
                  </p>
                </div>
                <div
                  aria-hidden
                  className="mt-2 h-1 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full bg-reel transition-[width] duration-300"
                    style={{ width: `${(picked / RXP_THUMBS.length) * 100}%` }}
                  />
                </div>
                <span data-rxp-ghost className="mt-3 block">
                  <FilmstripGrid
                    tileRef={(el, i) => {
                      chromeTileRefs.current[i] = el;
                    }}
                  />
                </span>
                {picked < RXP_THUMBS.length ? (
                  <div className="mt-2.5 flex items-center justify-between gap-2 rounded-[6px] bg-muted/70 p-2">
                    <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Heart className="size-3 text-[var(--dir-like)]" />
                      {RXP_THUMBS.length - picked} crowd favorites to add
                    </p>
                    <button
                      type="button"
                      data-dir-press
                      onClick={() => setPicked(RXP_THUMBS.length)}
                      className="flex h-6 items-center gap-1 rounded-full border border-border px-2 text-[10px] font-medium"
                    >
                      <Plus className="size-2.5" />
                      Add both
                    </button>
                  </div>
                ) : (
                  <p
                    aria-hidden
                    className="mt-2.5 flex items-center gap-1.5 text-[10px] text-muted-foreground"
                  >
                    <Check className="size-3 text-success" />
                    The crowd favorites are all in
                  </p>
                )}
              </div>

              {/* Curation is taught here: visible affordances, no hover-only
                  paths (sketch of the gallery's Add-to-Reel). */}
              <div aria-hidden className="opacity-70">
                <p className="mb-1.5 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  From the gallery
                </p>
                <div className="grid grid-cols-4 gap-[var(--gap-gallery)]">
                  {RXP_THUMBS.slice(0, 4).map(({ src }) => (
                    <span key={src} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt=""
                        className="aspect-[4/5] w-full rounded-[var(--radius-tile)] object-cover"
                      />
                      <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-black/55 text-white">
                        <Clapperboard className="size-2.5" />
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-auto pb-2">
                <button
                  type="button"
                  data-dir-press
                  onClick={createReel}
                  disabled={running}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-action-lg)] bg-reel text-sm font-semibold text-white disabled:opacity-60"
                >
                  <Clapperboard className="size-4" />
                  Create reel
                </button>
              </div>
            </div>

            <div
              data-rvl-veil
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 bg-[oklch(0.09_0_0)]"
            />

            {/* The flying copies (always mounted so their first transform is a
                transition, positioned by the FLIP measure at the trigger). */}
            <div
              data-rvl-grid
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 z-20",
                act === "idle" && "opacity-0",
              )}
            >
              {RXP_THUMBS.map(({ src }, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src}
                  ref={(el) => {
                    flipTileRefs.current[i] = el;
                  }}
                  data-rvl-tile
                  src={src}
                  alt=""
                  className="absolute rounded-[var(--radius-tile)] object-cover"
                />
              ))}
            </div>

            {/* The screen at full bleed, born under the flash at the stack's
                footprint (the ratified geometry). */}
            <div
              ref={screenBoxRef}
              className="absolute inset-x-0 top-1/2 z-30 -translate-y-1/2"
            >
              <div
                data-rvl-screen
                style={
                  {
                    "--rvl-screen-from": `scale(${PREMIERE_FROM_SCALE})`,
                  } as React.CSSProperties
                }
              >
                <CanvasReelPlayer
                  reelProps={reelProps}
                  frame={released ? undefined : 0}
                  showControls={released && reduced}
                />
              </div>
            </div>

            <div
              data-rvl-flash
              aria-hidden
              className="pointer-events-none absolute inset-0 z-40 bg-[radial-gradient(circle_at_50%_50%,oklch(0.99_0_0)_0%,oklch(0.99_0_0_/_0.5)_32%,transparent_70%)] opacity-0"
            />

            <div
              data-rvl-scrim
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-1/2 z-30 aspect-[9/16] -translate-y-1/2 rounded-xl bg-gradient-to-t from-black/60 via-transparent to-transparent"
            />
            <div
              data-rvl-title
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-[68%] z-40 px-6 text-center"
            >
              <p className="text-[9px] font-medium tracking-[0.24em] text-white/70 uppercase">
                The reel
              </p>
              <p
                data-dir-display
                className="mt-1 text-xl leading-tight text-white"
              >
                {EVENT_NAME}
              </p>
            </div>

            {/* The settled furniture IS the share prompt: the narrative's next
                line, not a toolbar (ruling 1's loud moment). */}
            <div data-rvl-end className="absolute inset-x-6 bottom-5 z-40">
              <div className="rounded-lg bg-white/95 p-3 shadow-lg">
                <p className="text-xs font-semibold text-zinc-900">
                  Your reel is ready
                </p>
                <p className="mt-0.5 text-[10px] text-zinc-500">
                  Share it with your guests?
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    data-dir-press
                    onClick={share}
                    className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-action-sm)] bg-reel text-xs font-medium text-white"
                  >
                    <Share2 className="size-3.5" />
                    Share with guests
                  </button>
                  <button
                    type="button"
                    onClick={settle}
                    className="h-9 shrink-0 rounded-[var(--radius-action-sm)] border border-zinc-200 px-3 text-xs font-medium text-zinc-600"
                  >
                    Not yet
                  </button>
                </div>
              </div>
            </div>

            {celebrating ? <PremiereCelebration /> : null}
          </div>
        ) : (
          /* Stages 2 + 3: made (fine-tune) and shared (the poster wears it).
             Same layout, the shared flag flips the framing. */
          <div
            data-rxp-swap
            className="absolute inset-0 overflow-y-auto overscroll-contain bg-background"
          >
            <div className="flex flex-col gap-3 p-4 pt-9 pb-8">
              <div aria-hidden>
                <p className="text-[9px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                  {EVENT_NAME}
                </p>
                <div className="mt-2">
                  <FeedPills />
                </div>
              </div>

              <SectionEyebrow>
                <StatusChip shared={shared} />
              </SectionEyebrow>

              <div className="relative overflow-hidden rounded-lg">
                <CanvasReelPlayer reelProps={reelProps} showControls={false} />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-24 rounded-b-lg bg-gradient-to-t from-black/65 to-transparent"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
                  <p
                    data-dir-display
                    className="text-lg leading-tight text-white"
                  >
                    {EVENT_NAME}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-[oklch(0.8_0.14_300)]">
                    0:30 · {style.label} · {RXP_THUMBS.length} moments
                  </p>
                </div>
                {celebrating ? <PremiereCelebration /> : null}
              </div>

              {/* Restyling stays ONE tap after the ceremony (never a
                  re-create): the swipeable carousel restyles the live poster
                  instantly; identity comes from the player itself. */}
              <div className="-mx-4 flex snap-x gap-1.5 overflow-x-auto px-4 pb-1">
                {STYLE_GROUPS.flatMap((g) => g.styles).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    data-dir-press
                    onClick={() => setStyleId(s.id)}
                    aria-pressed={s.id === styleId}
                    className={cn(
                      "flex h-7 shrink-0 snap-start items-center rounded-full border px-2.5 text-[11px] font-medium",
                      s.id === styleId
                        ? "border-reel bg-reel text-white"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {!shared ? (
                <div data-dir-card className="rounded-lg p-3">
                  <button
                    type="button"
                    data-dir-press
                    onClick={share}
                    disabled={celebrating}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-action)] bg-reel text-sm font-medium text-white disabled:opacity-70"
                  >
                    <Share2 className="size-4" />
                    Share with guests
                  </button>
                  <p className="mt-2 text-center text-[10px] text-muted-foreground">
                    Only you can see it until you share
                  </p>
                </div>
              ) : (
                <div
                  data-rxp-swap
                  data-dir-card
                  className="flex items-center gap-2.5 rounded-lg p-3"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-reel text-white">
                    <Check className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">Live for your guests</p>
                    <p className="text-[10px] text-muted-foreground">
                      Premiered on the album page
                    </p>
                  </div>
                  <span
                    aria-hidden
                    className="flex h-7 shrink-0 items-center gap-1 rounded-[var(--radius-action-sm)] border border-border px-2 text-[10px] font-medium text-muted-foreground"
                  >
                    View as guest
                    <ChevronRight className="size-3" />
                  </span>
                </div>
              )}

              <div aria-hidden className="flex flex-col gap-3">
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    Fine-tune
                  </p>
                  <LengthRow compact />
                </div>
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={RXP_COVER}
                    alt=""
                    className="h-10 w-8 rounded-[var(--radius-tile)] object-cover"
                  />
                  <span className="text-[11px] font-medium text-muted-foreground underline underline-offset-2">
                    Change cover
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <ImageIcon className="size-3" />
                    {RXP_THUMBS.length} moments
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </PhoneShell>
      <ResetRow
        onReset={() => {
          reset();
          setPhase("build");
          setShared(false);
          setPicked(6);
          setStyleId("classic");
          setCelebrating(false);
        }}
        label="Start over"
        note="Create reel fires the ratified reveal (assembly, flash, full bleed, title) with the builder card as its launchpad; the settled state asks the share question, and saying yes plays the rare-tier finale into the Shared stage. Restyling stays one instant tap afterward."
      />
    </div>
  );
}

/** The rare-tier finale overlay: one light sweep + the Shared badge settling.
 *  Pure CSS on the celebrate hooks; the caller times the state landing. */
function PremiereCelebration() {
  return (
    <div
      data-rxp-celebrate
      aria-hidden
      className="pointer-events-none absolute inset-0 z-50 overflow-hidden rounded-lg"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          data-rxp-badge
          className="flex items-center gap-1.5 rounded-full bg-reel px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
        >
          <Share2 className="size-3.5" />
          Shared with your guests
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// D · The guest arrival (one overlay machine, three cuts)
// ---------------------------------------------------------------------------

type GuestEntry = "marquee" | "studio" | "premiere";
type GuestAct = "flash" | "open" | "title" | "breathe" | "settled";

/** Each direction's arrival cut, built fresh per run from the CLOSED reveal
 *  vars (the guest adaptation is open space; the beats it borrows are not). */
function guestScript(entry: GuestEntry): () => ActScript<GuestAct> {
  return () => {
    switch (entry) {
      case "marquee":
        return [
          { act: "flash", holdMs: rvlMs("--tune-rvl-flash-ms") },
          {
            act: "open",
            holdMs: Math.max(rvlMs("--tune-rvl-expand-ms") - 90, 120),
          },
          { act: "title", holdMs: rvlMs("--tune-rvl-title-ms") },
          { act: "settled", holdMs: 0 },
        ];
      case "studio":
        return [
          { act: "open", holdMs: rvlMs("--tune-rvl-expand-ms") + 120 },
          { act: "title", holdMs: rvlMs("--tune-rvl-title-ms") },
          { act: "settled", holdMs: 0 },
        ];
      case "premiere":
        return [
          { act: "title", holdMs: 1500 },
          { act: "breathe", holdMs: 700 },
          { act: "settled", holdMs: 0 },
        ];
    }
  };
}

/** When the guest player starts moving, per cut. */
const GUEST_RELEASED: Record<GuestEntry, Set<GuestAct | "idle">> = {
  marquee: new Set(["open", "title", "settled"]),
  studio: new Set(["open", "title", "settled"]),
  premiere: new Set(["breathe", "settled"]),
};

/** The player's hidden pose, per cut: the marquee is born at the composite's
 *  from-scale under the flash; the studio expands from its card; the premiere
 *  breathes in nearly full-size under the title. */
const GUEST_FROM: Record<GuestEntry, string> = {
  marquee: "scale(0.55)",
  studio: "scale(0.42)",
  premiere: "scale(0.96)",
};

function GuestArrivalPhone({
  entry,
  note,
}: {
  entry: GuestEntry;
  note: string;
}) {
  const [open, setOpen] = useState(false);
  const reelProps = useStyleReelProps("classic");
  const { act, run, reset } = useRevealActs(guestScript(entry));
  const reduced = usePrefersReducedMotion();
  const released = GUEST_RELEASED[entry].has(act);

  const arrive = () => {
    setOpen(true);
    run();
  };
  const close = () => {
    reset();
    setOpen(false);
  };

  return (
    <div>
      <PhoneShell>
        <div className="absolute inset-0 overflow-hidden bg-background">
          {/* The /e/ album context (sketch) + the cinematic reel card. The
              lifecycle placement (under the action block while uploads run,
              top when they close) is ruled; the CARD is the open canvas. */}
          <div className="absolute inset-0 flex flex-col gap-3 overflow-y-auto p-4 pt-9">
            <div aria-hidden>
              <p className="text-[9px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                You are at
              </p>
              <p data-dir-display className="mt-0.5 text-lg leading-tight">
                {EVENT_NAME}
              </p>
              <div className="mt-2 flex h-9 items-center justify-center rounded-[var(--radius-action-sm)] border border-border text-xs font-medium text-muted-foreground">
                <Plus className="mr-1.5 size-3.5" />
                Add your photos
              </div>
            </div>

            {entry === "studio" ? (
              <button
                type="button"
                data-dir-press
                onClick={arrive}
                className="flex items-center gap-3 rounded-lg border border-border p-2.5 text-left"
              >
                <span className="relative w-14 shrink-0 overflow-hidden rounded-[6px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={RXP_COVER}
                    alt=""
                    className="aspect-[9/16] w-full object-cover"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-1 left-1/2 flex size-5 -translate-x-1/2 items-center justify-center rounded-full bg-white/90">
                    <Play className="ml-px size-2.5 fill-zinc-900 text-zinc-900" />
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.16em] text-reel uppercase">
                    <ReelMark className="size-3" />
                    The reel
                  </span>
                  <span
                    data-dir-display
                    className="mt-0.5 block text-sm leading-tight"
                  >
                    Watch the highlights
                  </span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">
                    0:30, from everyone&apos;s photos
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ) : (
              <button
                type="button"
                data-dir-press
                onClick={arrive}
                className="relative block overflow-hidden rounded-lg text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={RXP_COVER}
                  alt=""
                  className="aspect-[4/5] w-full object-cover"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
                <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/45 px-2 py-0.5 text-[9px] font-semibold tracking-[0.14em] text-white uppercase backdrop-blur-sm">
                  <Clapperboard className="size-2.5 text-[oklch(0.8_0.14_300)]" />
                  The reel
                </span>
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex size-11 items-center justify-center rounded-full bg-white/90 shadow-lg">
                    <Play className="ml-0.5 size-5 fill-zinc-900 text-zinc-900" />
                  </span>
                </span>
                <span className="absolute inset-x-0 bottom-0 p-3">
                  <span
                    data-dir-display
                    className="block text-base leading-tight text-white"
                  >
                    {EVENT_NAME}
                  </span>
                  <span className="mt-0.5 block text-[10px] font-medium text-[oklch(0.8_0.14_300)]">
                    {entry === "premiere"
                      ? `Made from ${MOMENT_COUNT} moments · 0:30`
                      : "The highlights · 0:30"}
                  </span>
                </span>
              </button>
            )}

            <div aria-hidden className="opacity-70">
              <AlbumSketch />
            </div>
          </div>

          {/* The full-bleed watch overlay: watch + share + download live here
              (ruling 2); the cut plays once on arrival. */}
          {open ? (
            <div
              data-rxp-gstage
              data-act={act}
              data-entry={entry}
              data-rxp-swap
              className="absolute inset-0 z-20 bg-[oklch(0.09_0_0)]"
            >
              <div className="absolute inset-x-0 top-1/2 z-30 -translate-y-1/2">
                <div
                  data-rxp-gscreen
                  style={
                    { "--rxp-g-from": GUEST_FROM[entry] } as React.CSSProperties
                  }
                >
                  <CanvasReelPlayer
                    reelProps={reelProps}
                    frame={released ? undefined : 0}
                    showControls={released && reduced}
                  />
                </div>
              </div>

              <div
                data-rxp-gflash
                aria-hidden
                className="pointer-events-none absolute inset-0 z-40 bg-[radial-gradient(circle_at_50%_50%,oklch(0.99_0_0)_0%,oklch(0.99_0_0_/_0.5)_32%,transparent_70%)] opacity-0"
              />

              <div
                data-rxp-gscrim
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-1/2 z-30 aspect-[9/16] -translate-y-1/2 rounded-xl bg-gradient-to-t from-black/60 via-transparent to-transparent"
              />
              <div
                data-rxp-gtitle
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-x-0 z-40 px-6 text-center",
                  entry === "premiere" ? "top-[42%]" : "top-[68%]",
                )}
              >
                <p className="text-[9px] font-medium tracking-[0.24em] text-white/70 uppercase">
                  {entry === "premiere" ? "A premiere" : "The reel"}
                </p>
                <p
                  data-dir-display
                  className="mt-1 text-xl leading-tight text-white"
                >
                  {EVENT_NAME}
                </p>
              </div>

              <GuestSettledRow />
              {act === "settled" ? (
                <p
                  aria-hidden
                  className="absolute inset-x-0 bottom-14 z-40 text-center text-[9px] text-white/45"
                >
                  <Download className="mr-1 inline size-2.5" />
                  Download uses the host&apos;s video when it is ready
                </p>
              ) : null}

              <button
                type="button"
                onClick={close}
                aria-label="Close the reel"
                className="absolute top-9 right-3 z-50 flex size-8 items-center justify-center rounded-full bg-white/10 text-white/85 backdrop-blur-sm"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : null}
        </div>
      </PhoneShell>
      <p className="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground">
        {note}
      </p>
    </div>
  );
}
