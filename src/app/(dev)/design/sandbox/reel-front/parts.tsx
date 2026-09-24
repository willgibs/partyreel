"use client";

import type { ReactNode } from "react";
import { Clapperboard, Sparkles } from "lucide-react";

import type { GridMedia } from "@/components/app/media-grid";
import { MediaTile } from "@/components/app/media-grid";
import { PosterCard } from "@/components/reel/poster-card";
import { GALLERY_COLUMNS } from "@/components/shared/masonry";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { EVENT } from "./fixtures";

/**
 * THE LEAF PIECES, EVERY ONE QUOTED OR REAL. `PosterCard` is the shipped reel
 * face (`src/components/reel/poster-card.tsx`, this lane's own read): imported
 * directly, never re-typed, because it carries no hooks and no portal.
 *
 * ★ ROUND TWO'S OWN GROUND (carried from round one, answered): the tile is
 * headed "Highlight reel" and described "Make your own clip to share", no
 * style name, no moment count; its corner keeps round one's own "Make your
 * own" icon (`verbs=watch-make`) always. `signature` varies only the MEDIA;
 * `badge` varies only the SECOND corner, the identity mark `TileCard` used
 * to draw unconditionally as "The reel" (round one's own `TileBadge`, gone
 * with it: a text chip repeating a heading now on the card is a fact this
 * round re-litigates, not a default to keep drawing underneath it).
 */

/* ── the crossfade: plain stills, CSS-only ────────────────────────────────── */

/**
 * Six images, one shared keyframe (`reel-front.css`), phase-shifted by a
 * negative delay so each gets its own sixth of the cycle. This is the whole
 * of round one's winning `tile` treatment; round two never re-opens crossfade
 * against a live engine, only what dresses it.
 *
 * ★ `restIndex` IS NOT THE "HERO" FRAME: it is whichever image reduced motion
 * freezes on (bible 5: every animation lives inside that block). Every
 * caller here passes 0, the take's own first moment.
 */
export function Crossfade({
  images,
  holdSec,
  restIndex = 0,
  className,
  instant,
}: {
  images: readonly string[];
  holdSec: number;
  restIndex?: number;
  className?: string;
  /** `signature=hardcut`'s own switch: the same keyframe, stepped rather than
   *  eased, so each image jumps straight in rather than dissolving. */
  instant?: boolean;
}) {
  const n = images.length || 1;
  const total = holdSec * n;
  return (
    <div
      data-rf-crossfade
      data-rf-count={n}
      className={cn("absolute inset-0 overflow-hidden", className)}
    >
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- a local fixture still
        <img
          key={src.slice(-24) + i}
          src={src}
          alt=""
          data-rf-hero={i === restIndex ? "" : undefined}
          className={cn("rf-crossfade-img", instant && "rf-cut-img")}
          style={
            {
              "--rf-hold": holdSec,
              "--rf-delay": i * holdSec - total,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* ── signature: how the tile reads as the reel, over its own take ────────── */

/**
 * THE REEL'S OWN TAKE, CROSSFADING: every `signature` option's shared ground.
 * Never the album's newest (round one's own crossfade drew exactly that, and
 * reading identical to the grid beneath it undid the very differentiation he
 * asked for: "The different images differentiate the reel vs album media
 * stills"). The take's own eight moments are the same ones the real montage
 * runs; this board plays them as plain stills, never a re-typed engine.
 */
function SignatureCrossfade({
  images,
  className,
}: {
  images: readonly string[];
  className?: string;
}) {
  return (
    <Crossfade images={images} holdSec={3.2} restIndex={0} className={className} />
  );
}

/** `plain`: round one's winner, corrected onto the take's own stills. */
export function SignaturePlain({ images }: { images: readonly string[] }) {
  return (
    <div data-rf-signature="plain" className="absolute inset-0">
      <SignatureCrossfade images={images} />
    </div>
  );
}

/** `graded`: a held-back wash and a thin cinema window, so a guest reads
 *  "footage cut from the reel" rather than "another album photo": the grade
 *  and the letterbox are the whole difference, never a new asset. */
export function SignatureGraded({ images }: { images: readonly string[] }) {
  return (
    <div
      data-rf-signature="graded"
      className="absolute inset-0 overflow-hidden bg-black"
    >
      <SignatureCrossfade
        images={images}
        className="opacity-90 saturate-[0.82] contrast-110"
      />
      <span aria-hidden className="absolute inset-x-0 top-0 h-[11%] bg-black" />
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[11%] bg-black"
      />
    </div>
  );
}

/**
 * `stacked`: two held-back edges BEHIND a smaller, unrotated front frame, so
 * the tile reads as a small stack of moments rather than one flat photograph.
 *
 * ★ THE BACK LAYERS MUST BE THE SAME SIZE AS THE FRONT, ROTATED, NEVER
 * SMALLER (a capture caught the smaller-inset version drawing nothing: an
 * `inset-2` span behind a later, larger `inset-0` front is fully covered by
 * it, so `plain` and `stacked` painted identically). Rotating a same-size
 * rectangle grows its own bounding box, which is what lets a corner peek
 * past an UNROTATED front of the same size; the front sits in a margin
 * (`inset-[7%]`) so the peek has room before the tile's own edge clips it.
 */
export function SignatureStacked({ images }: { images: readonly string[] }) {
  return (
    <div data-rf-signature="stacked" className="absolute inset-[7%]">
      <span
        aria-hidden
        className="absolute inset-0 -rotate-6 rounded-lg bg-white/25"
      />
      <span
        aria-hidden
        className="absolute inset-0 rotate-3 rounded-lg bg-white/35"
      />
      <div className="absolute inset-0 overflow-hidden rounded-lg shadow-lift">
        <SignatureCrossfade images={images} />
      </div>
    </div>
  );
}

/** `frame`: a thin inset ring around the whole tile, a viewfinder rather than
 *  a photo's own border, plus a quiet recording mark: the universal cues for
 *  footage rather than a photograph, over more of the tile than a corner alone. */
export function SignatureFrame({ images }: { images: readonly string[] }) {
  return (
    <div
      data-rf-signature="frame"
      className="absolute inset-0 overflow-hidden"
    >
      <SignatureCrossfade images={images} />
      <span
        aria-hidden
        className="absolute inset-2 rounded-md ring-1 ring-white/70"
      />
      <span
        data-rf-rec-mark
        className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm"
      >
        <span
          aria-hidden
          className="rf-rec-dot size-1.5 rounded-full bg-[oklch(0.72_0.19_25)]"
        />
        Live
      </span>
    </div>
  );
}

/**
 * `hardcut`: no dissolve at all, the take's own moments held full then cut
 * straight to the next. The one option here that varies the CROSSFADE ITSELF
 * rather than dressing it: a jump between held frames is something an album
 * of photographs never does on its own, so the motion alone is the footage
 * cue, wearing no wash, no letterbox and no mark. Same six-image cycle, same
 * zero-canvas cost; only `Crossfade`'s `instant` swaps the timing function.
 */
export function SignatureHardcut({ images }: { images: readonly string[] }) {
  return (
    <div data-rf-signature="hardcut" className="absolute inset-0 bg-black">
      <Crossfade images={images} holdSec={3.2} restIndex={0} instant />
    </div>
  );
}

/* ── badge: what replaces "The reel" chip, if anything ────────────────────── */

/** `badge` ask's "live" option: the hub's own dot and word (bible 7: reuse
 *  before inventing), so a mark that returns says something a static label
 *  never could: this updates on its own. */
export function LiveBadge() {
  return (
    <span
      data-rf-badge="live"
      className="flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-label font-semibold text-white uppercase backdrop-blur-sm"
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full bg-[oklch(0.72_0.19_25)]"
      />
      Live
    </span>
  );
}

/** `badge` ask's "glyph" option: one small icon, no words at all. */
export function GlyphBadge() {
  return (
    <span
      data-rf-badge="glyph"
      className="flex size-6 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
    >
      <Clapperboard className="size-3" aria-hidden />
    </span>
  );
}

/** `badge` ask's "duration" option: a short length mark, the convention a
 *  phone's camera roll already uses on a video thumbnail, so the corner
 *  promises a length rather than a status. */
export function DurationBadge() {
  return (
    <span
      data-rf-badge="duration"
      className="flex items-center rounded-full bg-black/55 px-2 py-1 text-[11px] font-semibold text-white tabular-nums backdrop-blur-sm"
    >
      0:08
    </span>
  );
}

/* ── the living tile itself ───────────────────────────────────────────────── */

/** Round one's own corner control (`verbs=watch-make`): every round-two
 *  preview wears it, since neither `signature` nor `badge` asks it again. */
export function MakeYoursMark() {
  return (
    <span
      data-rf-verb2
      className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-zinc-900 shadow-lift"
    >
      <Sparkles className="size-3" aria-hidden />
      Make your own
    </span>
  );
}

/**
 * THE LIVING TILE: `PosterCard` reshaped horizontal (the shipped card is a 4:5
 * keepsake portrait; this slot is full-bleed above the album, the same box
 * `aboveAlbum` already owns). Headed "Highlight reel", described "Make your
 * own clip to share" (round one's own words): neither is a prop here because
 * neither is a question any more, only `media` (`signature`) and `badge`
 * (`badge`) still are.
 */
export function TileCard({
  media,
  badge = null,
}: {
  media: ReactNode;
  /** The top-left mark `badge` ask varies; `null` draws nothing (`none`). */
  badge?: ReactNode;
}) {
  return (
    <div data-rf-tile className="relative">
      <PosterCard
        eventName="Highlight reel"
        meta="Make your own clip to share"
        chip={badge}
        media={
          <div className="relative aspect-[2/1] w-full sm:aspect-[21/9]">
            {media}
          </div>
        }
      />
      <MakeYoursMark />
    </div>
  );
}

/* ── the album's ground: header, then the tile's slot, then the grid ────────── */

export function GuestHeader() {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <Logo />
      <span className="flex items-center gap-2">
        <Avatar size="sm" seed="rf-guest">
          <AvatarFallback className="text-[10px]">T</AvatarFallback>
        </Avatar>
        <span className="text-sm">Theo</span>
      </span>
    </header>
  );
}

export function AlbumStrip({ items }: { items: GridMedia[] }) {
  return (
    <div data-rf-strip className={cn(GALLERY_COLUMNS, "px-4 pb-6")}>
      {items.map((item) => (
        <div
          key={item.id}
          data-media-tile
          style={{
            aspectRatio: `${item.width} / ${item.height}`,
            borderRadius: "var(--radius-tile)",
          }}
          className="relative mb-[var(--gap-gallery)] w-full break-inside-avoid overflow-hidden bg-black/10"
        >
          <MediaTile item={item} playBadge="none" />
        </div>
      ))}
    </div>
  );
}

/** The guest page's ground, `event-experience.tsx`'s own two boxes: a COLUMN
 *  for the header (reading measure, pinned left) and a BLEED for the tile's
 *  slot and the album (the gutter alone, full width in the frame). */
export function Ground({
  slot,
  items,
}: {
  /** The reel's own slot: its OWN box directly above the album (round one). */
  slot: ReactNode;
  items: GridMedia[];
}) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <GuestHeader />
      <div className="mx-auto max-w-[900px] px-4 pt-4 pb-1">
        <h1 className="font-heading text-subsection text-balance">
          {EVENT.name}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Hosted by {EVENT.host} &middot; {EVENT.date}
        </p>
      </div>
      <div data-bleed-slot="tile" className="mx-auto max-w-[900px] px-4 pt-3 pb-1">
        {slot}
      </div>
      <div className="mx-auto max-w-[900px]">
        <AlbumStrip items={items} />
      </div>
    </div>
  );
}
