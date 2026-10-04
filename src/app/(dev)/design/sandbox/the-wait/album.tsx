"use client";

import type { CSSProperties, ReactNode, Ref } from "react";
import {
  Camera,
  ListChecks,
  Play,
  QrCode,
  SlidersHorizontal,
} from "lucide-react";

import {
  AlbumCover,
  HeadStills,
} from "@/components/guest/event-experience-head";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { coverEyebrow } from "@/lib/disposable/wait-words";
import { formatMediaCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import {
  COVER_STILLS,
  DEVELOPS_AT,
  EVENT,
  MAYA,
  type Photo,
  PRIYA,
  ROLL_SIZE,
} from "./fixtures";
import type { Tile } from "./geometry";
import { at, usePlay } from "./motion";

/**
 * PRODUCTION'S PAGE, AS A GUEST MEETS IT THE MORNING AFTER (`event-experience.tsx`):
 * the guest's header standing on the cover, the cover (the real `AlbumCover`,
 * its word over the name read by the real `coverEyebrow`), and under it the
 * album's box, the window's width less its gutter, where the sheet stood all
 * night and the album now stands. Every press is inert.
 *
 * ★ THE ONLY NEW THING ON A FRAME IS WHAT THE OPTION DRAWS (the develop, the
 * darkroom, the premiere). The cover, its actions and the album's rows are
 * production's; the album's head row and its tiles are quoted from
 * `live-gallery.tsx` and `album-tile.tsx` line for line, laid where the rows
 * engine lays them (`geometry.ts`), because a quoted tile can be moved and a
 * windowed one cannot.
 */

/** Production's album box: 12px gutter at a phone, 20px from 640. */
export const BLEED = "px-3 sm:px-5";

/* ── the header on the cover, quoted ───────────────────────────────────── */

/** The guest's header standing on the cover (`guest-header.tsx`, `over`): the wordmark and her name, white, no rule. */
function GuestBar() {
  return (
    <header
      data-surface="photo"
      className="dark relative z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-transparent px-5 text-foreground"
    >
      <Logo />
      <span className="flex items-center gap-2 text-sm">
        <Avatar size="sm" seed={PRIYA.seed}>
          <AvatarFallback className="text-[10px]">
            {PRIYA.name.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        {PRIYA.name}
      </span>
    </header>
  );
}

/* ── the cover ─────────────────────────────────────────────────────────── */

/**
 * THE COVER'S PHOTOGRAPHS (production's `HeadStills`, the reel's opening). A
 * develop brings them up out of the house light they stood on all night, from
 * bright and pale to themselves (`tw-cover-develop`, the host's Look's own
 * curve), at `developAt` on the take's timeline; `null` is the regular open,
 * where they settle in as production's do.
 */
export function CoverGround({ developAt }: { developAt: number | null }) {
  const stills = COVER_STILLS.map((s, i) => ({
    id: `${s.id}-${i}`,
    tile: s.src,
  }));
  if (developAt === null)
    return (
      <div className="absolute inset-0" data-tw-cover="open">
        <HeadStills stills={stills} />
      </div>
    );
  return (
    <div
      className="tw-a tw-cover-develop absolute inset-0"
      data-tw-cover="develop"
      style={at(developAt, {
        "--tw-cover-d": `${developAt}ms`,
      } as CSSProperties)}
    >
      <HeadStills stills={stills} />
    </div>
  );
}

/** The cover's actions on an album's camera after its develop: Take photos, the reel, Invite. */
function CoverActions() {
  return (
    <>
      <Button
        type="button"
        variant="on-photo"
        size="cta"
        tabIndex={-1}
        className="min-w-0 flex-1 md:flex-none"
      >
        <Camera /> Take photos
      </Button>
      <Button
        type="button"
        variant="glass"
        size="icon-cta"
        tabIndex={-1}
        aria-label="Watch the highlight reel"
      >
        <Play className="fill-current" />
      </Button>
      <Button
        type="button"
        variant="glass"
        size="icon-cta"
        tabIndex={-1}
        aria-label="Invite"
      >
        <QrCode />
      </Button>
    </>
  );
}

/* ── the page ──────────────────────────────────────────────────────────── */

/**
 * ONE GUEST PAGE THE MORNING AFTER: the header, the cover and the album's box.
 * `nowMs` is the reader's clock, so the cover's word says "developed at 9 am"
 * the morning of and "developed Sunday" a day later, as production's does.
 */
export function GuestPage({
  nowMs,
  ground,
  above,
  children,
}: {
  nowMs: number;
  ground: ReactNode;
  /** A layer over the whole page (the darkroom, the premiere). */
  above?: ReactNode;
  children: ReactNode;
}) {
  const eyebrow = coverEyebrow(
    { capture: "camera", developsAt: DEVELOPS_AT },
    nowMs,
  );
  return (
    <div
      data-tw-page=""
      className="relative min-h-screen bg-background pb-32 text-foreground"
    >
      <GuestBar />
      <AlbumCover
        className="-mt-14"
        eyebrow={eyebrow}
        ground={ground}
        name={EVENT.name}
        host={{ name: MAYA.name, avatarUrl: null, seed: MAYA.seed }}
        date={EVENT.date}
        description={EVENT.note}
        mediaCount={ROLL_SIZE.shots}
        guestCount={ROLL_SIZE.guests}
        actions={<CoverActions />}
      />
      {/* The album's box: where the sheet stood over the rows (`AlbumWait`, `mt-5`), and the rows' own box. */}
      <div className={cn(BLEED, "mt-5")} data-tw-album-box="">
        {children}
      </div>
      {above}
    </div>
  );
}

/* ── the album, quoted ─────────────────────────────────────────────────── */

/** The album's own head row (`live-gallery.tsx`): its count, Select and the one View menu. */
export function AlbumHead({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(
        "mb-3 flex flex-wrap items-center justify-between gap-1.5",
        className,
      )}
      style={style}
      data-tw-album-head=""
    >
      <p
        className="px-0.5 text-working text-muted-foreground tabular-nums"
        data-tw-album-count=""
      >
        {formatMediaCount(ROLL_SIZE.shots)}
      </p>
      <div className="ml-auto flex items-center gap-1.5">
        <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground">
          <ListChecks className="size-4" /> Select
        </span>
        <Button type="button" variant="outline" size="sm" tabIndex={-1}>
          <SlidersHorizontal /> View
        </Button>
      </div>
    </div>
  );
}

/** One of the album's photographs (`album-tile.tsx`'s box: a 2px photograph, its picture covering it). */
export function TileBox({
  tile,
  bare = false,
  className,
  style,
  children,
  ref,
  ...data
}: {
  tile: Tile;
  /** Its picture is drawn by the caller (a tile that is still a square, developing). */
  bare?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
} & Record<`data-${string}`, string | undefined>) {
  return (
    <div
      ref={ref}
      {...data}
      data-tw-tile={tile.photo.id}
      className={cn(
        "absolute overflow-hidden rounded-tile bg-muted",
        className,
      )}
      style={{
        left: tile.x,
        top: tile.y,
        width: tile.w,
        height: tile.h,
        ...style,
      }}
    >
      {!bare && <Picture photo={tile.photo} />}
      {children}
    </div>
  );
}

/** A photograph's picture, covering its box from its own focus. */
export function Picture({
  photo,
  className,
  style,
}: {
  photo: Photo;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph, drawn as the album draws one
    <img
      src={photo.picture.src}
      alt=""
      draggable={false}
      decoding="async"
      className={cn("absolute inset-0 size-full object-cover", className)}
      style={{ objectPosition: photo.focus, ...style }}
    />
  );
}

/**
 * THE ALBUM'S REGULAR OPEN (production's, mirrored so a frame can hold it at a
 * moment): every tile fades up from a step below and a hair smaller, 240 ms on
 * the house's emphasis curve, 45 ms apart and never more than 540 ms behind the
 * first (`globals.css`, `[data-media-tile]`); none of it under reduced motion.
 */
export function OpenRows({
  tiles,
  height,
  from = 0,
}: {
  tiles: readonly Tile[];
  height: number;
  /** When the open starts on the take's timeline. */
  from?: number;
}) {
  const { reduced } = usePlay();
  return (
    <div className="relative" style={{ height }} data-tw-rows="">
      {tiles.map((t) => (
        <TileBox
          key={t.photo.id}
          tile={t}
          className={reduced ? undefined : "tw-a tw-tile-in"}
          style={reduced ? undefined : at(from + Math.min(t.i * 45, 540))}
        />
      ))}
    </div>
  );
}
