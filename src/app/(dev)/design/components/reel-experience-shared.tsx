"use client";

import { Check, Clapperboard, Lock, Play, Share2 } from "lucide-react";
import { useMemo } from "react";

import { CanvasReelPlayer } from "@/lib/reel/engine/player";
import type { ReelProps } from "@/lib/reel/engine/reel-types";
import {
  STYLE_CATALOG,
  type StyleEntry,
  styleThemeId,
} from "@/lib/reel/engine/style-registry";
import { resolveTheme } from "@/lib/reel/engine/themes";
import { readCssMs } from "@/lib/shared/read-css-ms";
import { cn } from "@/lib/utils";

/**
 * Shared plumbing for the REEL EXPERIENCE round (R3 slice C, lab-local,
 * 2026-07-21). Three directions over the same four moments: the event-page
 * reel section, creation/curation with 14-style identity, the publish moment,
 * and the guest arrival. The substrate is the real canvas engine on the
 * /design fixtures (the reveal round's pattern), which keeps every style
 * preview HONEST: a style thumb is the actual drawReelFrame output on the
 * host's own media, never a faked screenshot (a binding build note).
 *
 * Fixture rule (ruling 10, RENDER_VERSION 3): the media set carries one
 * type:"video" item whose url is a still standing in for the client-generated
 * poster WebP, so every direction visibly exercises the poster path (a video
 * slot draws its poster, never a black clip).
 */

// LOCAL fixtures on purpose (the parity-harness lesson): a cross-origin host
// without CORS taints the canvas. Mixed aspects so cover-vs-fit framing shows;
// p12 is portrait and covers the 9:16 frame (it doubles as the cover).
const FIXTURES: { src: string; w: number; h: number; video?: boolean }[] = [
  { src: "/design/p12.jpg", w: 700, h: 1050 },
  { src: "/design/p01.jpg", w: 900, h: 600 },
  { src: "/design/p02.jpg", w: 900, h: 601, video: true }, // video item: url = its poster still
  { src: "/design/p03.jpg", w: 900, h: 600 },
  { src: "/design/p04.jpg", w: 800, h: 534 },
  { src: "/design/p05.jpg", w: 900, h: 600 },
  { src: "/design/p06.jpg", w: 900, h: 601 },
  { src: "/design/p07.jpg", w: 900, h: 600 },
];

/** The filmstrip thumbnails every direction's curated set shows. */
export const RXP_THUMBS = FIXTURES.map((f) => ({
  src: f.src,
  video: f.video === true,
}));

/** The cover fixture (the portrait one, like the composer's default cover). */
export const RXP_COVER = FIXTURES[0].src;

export const EVENT_NAME = "The Johnson Wedding";
export const MOMENT_COUNT = FIXTURES.length; // "8 moments"

/**
 * ReelProps for any of the 14 styles on the shared fixture cut. Memoized per
 * styleId so a style tap swaps ONE props object (the player invalidates and
 * redecodes only then). Deterministic seed, the settled product rule.
 */
export function useStyleReelProps(styleId: string): ReelProps {
  return useMemo(
    () => ({
      clips: FIXTURES.map(({ src, w, h, video }) => ({
        url: src,
        type: video ? ("video" as const) : ("photo" as const),
        width: w,
        height: h,
      })),
      theme: resolveTheme(styleThemeId(styleId)),
      seed: 73,
      styleId,
      orientation: "portrait" as const,
      watermark: false,
    }),
    [styleId],
  );
}

// ---------------------------------------------------------------------------
// The 14-style catalog, in host language
// ---------------------------------------------------------------------------

/** Host-language group labels for the catalog's two kinds (the audit's ask:
 *  "Media-first/Stylized" is engine taxonomy, not host language). */
export const STYLE_GROUP_LABEL: Record<StyleEntry["kind"], string> = {
  mood: "Looks",
  treatment: "Layouts",
};

export const STYLE_GROUPS: {
  kind: StyleEntry["kind"];
  styles: StyleEntry[];
}[] = [
  { kind: "mood", styles: STYLE_CATALOG.filter((s) => s.kind === "mood") },
  {
    kind: "treatment",
    styles: STYLE_CATALOG.filter((s) => s.kind === "treatment"),
  },
];

/** The frame every style thumb is locked on: ~1.9s in, past the opening
 *  transition, so each thumb shows the style's grade + composition character
 *  (frame 45 at 24fps). One draw per thumb, no clock. */
const THUMB_FRAME = 45;

/**
 * One style thumbnail: the REAL engine frame-locked on the fixtures (the
 * controlled-frame prop draws exactly one frame, no rAF), so 14 of these cost
 * 14 draws total. WHY full engine res per thumb: the player has no low-res
 * path and engine changes are out of this round's scope; a production rail
 * wants a thumbnail-resolution draw path (flagged in the round report).
 */
export function StyleThumb({
  style,
  active,
  onSelect,
  className,
}: {
  style: StyleEntry;
  active: boolean;
  onSelect: (id: string) => void;
  className?: string;
}) {
  const props = useStyleReelProps(style.id);
  return (
    <button
      type="button"
      data-dir-press
      onClick={() => onSelect(style.id)}
      aria-pressed={active}
      className={cn("group flex w-16 shrink-0 flex-col gap-1", className)}
    >
      <span
        data-rxp-thumb
        data-active={active || undefined}
        className="pointer-events-none block overflow-hidden rounded-[6px]"
      >
        <CanvasReelPlayer
          reelProps={props}
          frame={THUMB_FRAME}
          showControls={false}
        />
      </span>
      <span
        className={cn(
          "truncate text-center text-[9px] leading-tight font-medium",
          active ? "text-reel" : "text-muted-foreground",
        )}
      >
        {style.label}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// The publish-beat tuner knobs (the ONE JS source of truth)
// ---------------------------------------------------------------------------

/**
 * The publish moment is mandated loud (ADR-0022 d.1) but its FORM is this
 * round's open space, so its beats ride the --tune-* pattern (Will may retime
 * on-device): these fallbacks are mirrored by the design.css var() defaults
 * (the motion-tuner contract: the panel is a no-op until a slider moves).
 * The REVEAL beats are NOT here: those are ratified closed and stay on the
 * reveal round's --tune-rvl-* vars (see RVL_MS below).
 */
export const RXP_TUNE_MS = {
  "--tune-rxp-pub-ms": 700, // the occasional-tier publish flourish (V1/V2's ring bloom)
  "--tune-rxp-celebrate-ms": 950, // V3's rare-tier finale beat (the light sweep + badge settle)
  "--tune-rxp-sheet-ms": 260, // studio sheets + section cards (under the 300ms occasional ceiling)
} as const;

export const rxpMs = (v: keyof typeof RXP_TUNE_MS) =>
  readCssMs(v, RXP_TUNE_MS[v]);

/**
 * The RATIFIED reveal beats, read-only mirrors of the reveal round's TUNE_MS
 * (reel-reveal-variants.tsx). The reveal grammar is CLOSED (T2 ratified
 * as-built, no retime), so this round only READS the same --tune-rvl-* vars
 * with the same fallbacks; it adds no knobs for them.
 */
export const RVL_MS = {
  "--tune-rvl-fly-ms": 640,
  "--tune-rvl-stagger-ms": 42,
  "--tune-rvl-hold-ms": 700,
  "--tune-rvl-flash-ms": 360,
  "--tune-rvl-expand-ms": 720,
  "--tune-rvl-title-ms": 1700,
} as const;

export const rvlMs = (v: keyof typeof RVL_MS) => readCssMs(v, RVL_MS[v]);

// ---------------------------------------------------------------------------
// Small shared furniture
// ---------------------------------------------------------------------------

/** The moment tag over each phone: keeps the three directions comparable
 *  like-for-like (every direction covers the same four lettered moments). */
export function MomentTag({
  letter,
  label,
}: {
  letter: string;
  label: string;
}) {
  return (
    <p className="mb-2 flex items-center gap-1.5 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
      <span className="flex size-4 items-center justify-center rounded-[4px] bg-foreground/90 font-mono text-[9px] tracking-normal text-background">
        {letter}
      </span>
      {label}
    </p>
  );
}

/** The reel's identity mark: violet + Clapperboard (ratified). */
export function ReelMark({ className }: { className?: string }) {
  return <Clapperboard className={cn("size-3.5 text-reel", className)} />;
}

/** The Draft / Shared status chip (guest_visible defaults OFF, ruling 1). */
export function StatusChip({ shared }: { shared: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-medium",
        shared
          ? "bg-reel text-white"
          : "border border-border text-muted-foreground",
      )}
    >
      {shared ? <Check className="size-2.5" /> : null}
      {shared ? "Shared with guests" : "Draft, only you"}
    </span>
  );
}

/** The uniform 4-col curated grid (the production reel grid's tiles), with the
 *  video tile wearing its play badge (poster path, never a black clip). */
export function FilmstripGrid({
  className,
  tileRef,
}: {
  className?: string;
  tileRef?: (el: HTMLElement | null, i: number) => void;
}) {
  return (
    <div
      aria-hidden
      className={cn("grid grid-cols-4 gap-[var(--gap-gallery)]", className)}
    >
      {RXP_THUMBS.map(({ src, video }, i) => (
        <span key={src} className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={tileRef ? (el) => tileRef(el, i) : undefined}
            data-rxp-tile
            src={src}
            alt=""
            className="aspect-[4/5] w-full rounded-[var(--radius-tile)] object-cover"
          />
          {video ? (
            <span className="absolute right-1 bottom-1 flex size-4 items-center justify-center rounded-full bg-black/55">
              <Play className="size-2 fill-white text-white" />
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}

/** The length row's tier gate (ruling 7): 15s/30s for everyone, 60s paid.
 *  Decorative in the lab; the presentation (upsell framing) is the open item. */
export function LengthRow({ compact }: { compact?: boolean }) {
  return (
    <div aria-hidden className="flex items-center gap-1.5">
      {["15s", "30s"].map((l, i) => (
        <span
          key={l}
          className={cn(
            "flex h-7 items-center rounded-[var(--radius-action-sm)] border px-2.5 text-[11px] font-medium",
            i === 1
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground",
          )}
        >
          {l}
        </span>
      ))}
      <span className="flex h-7 items-center gap-1 rounded-[var(--radius-action-sm)] border border-dashed border-border px-2.5 text-[11px] font-medium text-muted-foreground">
        <Lock className="size-2.5" />
        60s
        <span className="text-[9px] font-semibold text-reel">Pro</span>
      </span>
      {!compact ? (
        <span className="ml-1 text-[10px] text-muted-foreground">
          Auto fits your moments
        </span>
      ) : null}
    </div>
  );
}

/** Where download sits once the reel is settled for a guest (slice D wires the
 *  flow; ruling 4's source order is static messaging here). Decorative. */
export function GuestSettledRow() {
  return (
    <div
      data-rxp-gend
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-4 z-40 flex items-center justify-center gap-2"
    >
      <span className="flex h-8 items-center gap-1.5 rounded-[var(--radius-action-sm)] bg-white/92 px-3 text-xs font-medium text-zinc-900">
        <Play className="size-3.5" />
        Watch again
      </span>
      <span className="flex h-8 items-center gap-1.5 rounded-[var(--radius-action-sm)] border border-white/25 px-3 text-xs font-medium text-white/85">
        <Share2 className="size-3.5" />
        Share
      </span>
    </div>
  );
}
