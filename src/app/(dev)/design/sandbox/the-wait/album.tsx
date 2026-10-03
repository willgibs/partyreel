"use client";

import { type CSSProperties, type ReactNode, useState } from "react";
import {
  ArrowUp,
  Camera,
  Clock,
  Download,
  ImageUp,
  Play,
  QrCode,
  SlidersHorizontal,
} from "lucide-react";

import {
  AlbumCover,
  EventHead,
  HeadStills,
} from "@/components/guest/event-experience-head";
import { GuestActionDock } from "@/components/guest/guest-action-dock";
import {
  createUploadTrackerStore,
  UploadTrackerButton,
} from "@/components/guest/upload-tracker";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatMediaCount } from "@/lib/format/count";
import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { cn, formatEventDate } from "@/lib/utils";

import { EVENT, MAYA, PRIYA, type Shot, type Still } from "./fixtures";
import { ScrolledTo } from "./scene";

/**
 * PRODUCTION'S ALBUM, AS A GUEST MEETS IT, with only the wait drawn in.
 *
 * The page is production's two boxes (`event-experience.tsx`): the cover
 * (`AlbumCover`, the real component, on the house light while nothing is
 * hers to see) reaching up under the guest's header, its actions (Add photos,
 * or Take photos on an album's camera, white on the light, her uploads' round,
 * Invite in glass), then the album in `BLEED`, the window's width less its
 * gutter. Past the cover's row, the shutter (`GuestActionDock`, the real
 * component) stands at the foot, wearing the camera on a camera's album.
 *
 * ★ THE ONLY NEW THING ON A FRAME IS WHAT THE OPTION DRAWS UNDER THE COVER (or,
 * for the cover's own option, in it). Every other pixel is production's, so a
 * flip between options moves the wait and nothing else.
 */

/** Production's album box: 12px gutter at a phone, 20px from 640. */
export const BLEED = "px-3 sm:px-5";

/** The cover's height at a phone and a desk (`EventHead`'s clamp, 34rem at both of the board's screens). */
export const COVER_PX = 544;

/* ── the header on the cover, quoted ───────────────────────────────────── */

/**
 * The guest's header standing on the cover (`guest-header.tsx`, `over`): the
 * wordmark and the name she typed at the door, white, no rule.
 */
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

/* ── her uploads' round, with its real store ───────────────────────────── */

/**
 * Production's `UploadTrackerButton`, its store holding the facts it reads: whether it shows, how many of
 * hers wait, and how many of those wait for the develop (red-team 43's "Waiting to develop").
 */
function Tracker({
  waiting,
  sealed,
  look,
}: {
  waiting: number;
  sealed: boolean;
  look: "glass" | "round";
}) {
  const [store] = useState(() => {
    const s = createUploadTrackerStore();
    s.set({ show: true, waiting, sealed: sealed ? waiting : 0 });
    return s;
  });
  return <UploadTrackerButton store={store} look={look} onOpen={() => {}} />;
}

/* ── the page ──────────────────────────────────────────────────────────── */

export type CoverGround =
  | { kind: "light" }
  | { kind: "stills"; stills: readonly Still[] };

/**
 * ONE GUEST PAGE: the header, the cover and the album, and the shutter when
 * the frame is scrolled past the cover (`scrolled`, in px of the frame's own
 * document).
 *
 * ★ THE COVER IS PRODUCTION'S `AlbumCover` UNLESS AN OPTION WRITES ON IT: a
 * style's name over the event's (`eyebrow`) or the wait's own line under the
 * byline (`line`) draw the same cover quoted (`CoverQuote`, its markup line for
 * line), since the component takes no words of an option's.
 */
export function GuestPage({
  wide,
  ground = { kind: "light" },
  mediaCount,
  guestCount = 0,
  waitingHers = 0,
  sealed = false,
  camera = false,
  reel = false,
  eyebrow,
  line,
  scrolled,
  children,
}: {
  wide: boolean;
  ground?: CoverGround;
  /** What the album shows her (the cover's count at a desk). */
  mediaCount: number;
  guestCount?: number;
  /** Hers waiting: her uploads' round and its count (production shows it where she has any). */
  waitingHers?: number;
  /** Hers wait for the develop rather than the host (the round's spoken words). */
  sealed?: boolean;
  /**
   * The album's Add opens its camera (`capture = 'camera'`, production's `cameraAlbum`): the cover's Add says Take photos
   * with the camera's glyph, and the shutter at the foot says and wears the same (the dock's own `camera`). A frame
   * is never an empty album, so "Take the first photo" (an empty camera album's) is never drawn here.
   */
  camera?: boolean;
  /** The album has a reel to play (the cover's round and the shutter's twin), or its premiere waits. */
  reel?: boolean | "premiere";
  /** A word over the event's name (a style's). */
  eyebrow?: ReactNode;
  /** A line under the byline, in the note's place (the wait's, where an option puts it on the cover). */
  line?: ReactNode;
  /** Scroll the frame's own document this far: the cover gone, the shutter up. */
  scrolled?: number;
  children: ReactNode;
}) {
  const stills =
    ground.kind === "stills"
      ? ground.stills.map((s, i) => ({ id: `${s.id}-${i}`, tile: s.src }))
      : [];
  const actions = (
    <>
      <Button
        type="button"
        variant="on-photo"
        size="cta"
        tabIndex={-1}
        className="min-w-0 flex-1 md:flex-none"
      >
        {camera ? <Camera /> : <ImageUp />}{" "}
        {camera ? "Take photos" : "Add photos"}
      </Button>
      {waitingHers > 0 && (
        <Tracker waiting={waitingHers} sealed={sealed} look="glass" />
      )}
      {reel === "premiere" ? (
        <Button
          type="button"
          variant="glass"
          size="cta"
          tabIndex={-1}
          data-tw-premiere-cta=""
        >
          <Play className="fill-current" /> Premiere
        </Button>
      ) : reel ? (
        <Button
          type="button"
          variant="glass"
          size="icon-cta"
          tabIndex={-1}
          aria-label="Watch the highlight reel"
        >
          <Play className="fill-current" />
        </Button>
      ) : null}
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
  const ground_ = stills.length ? <HeadStills stills={stills} /> : undefined;
  return (
    <div
      data-tw-page=""
      className="relative min-h-screen bg-background pb-32 text-foreground"
    >
      <GuestBar />
      {eyebrow || line ? (
        <CoverQuote
          ground={ground_}
          eyebrow={eyebrow}
          line={line}
          actions={actions}
        />
      ) : (
        <AlbumCover
          className="-mt-14"
          ground={ground_}
          name={EVENT.name}
          host={{ name: MAYA.name, avatarUrl: null, seed: MAYA.seed }}
          date={EVENT.date}
          description={EVENT.note}
          mediaCount={mediaCount}
          guestCount={guestCount}
          actions={actions}
        />
      )}
      <div className={BLEED}>
        <section className="mt-3" data-tw-album="">
          {children}
        </section>
      </div>
      {scrolled !== undefined && (
        <>
          <ScrolledTo y={scrolled} />
          <GuestActionDock
            hidden={false}
            uploadingCount={0}
            onAdd={() => {}}
            camera={camera}
            more
            invite={
              <Button
                type="button"
                variant="outline"
                size="icon-cta"
                tabIndex={-1}
                aria-label="Invite"
                className="bg-background shadow-layer"
              >
                <QrCode />
              </Button>
            }
            twin={
              <Button
                type="button"
                variant="outline"
                size="icon-cta"
                tabIndex={-1}
                aria-label={
                  reel ? "Watch the highlight reel" : "Back to the top"
                }
                className="bg-background shadow-layer"
              >
                {reel ? <Play className="fill-current" /> : <ArrowUp />}
              </Button>
            }
            tracker={
              waitingHers > 0 ? (
                <Tracker waiting={waitingHers} sealed={sealed} look="round" />
              ) : undefined
            }
          />
        </>
      )}
      {/* The desk's room: the wider the frame, the more album it shows. */}
      <span hidden data-wide={wide ? "" : undefined} />
    </div>
  );
}

/**
 * THE COVER, QUOTED LINE FOR LINE FROM `AlbumCover` (its `EventHead`, the
 * real frame and light, and its words' markup), with the two places an option
 * writes: a word over the name and a line in the note's place.
 */
function CoverQuote({
  ground,
  eyebrow,
  line,
  actions,
}: {
  ground?: ReactNode;
  eyebrow?: ReactNode;
  line?: ReactNode;
  actions: ReactNode;
}) {
  return (
    <EventHead side="album" ground={ground} className="-mt-14">
      <div className="px-5 pb-6 md:flex md:items-end md:justify-between md:gap-10 md:pb-9">
        <div className="min-w-0 md:max-w-2xl">
          {eyebrow && (
            <p
              data-tw-eyebrow=""
              className="mb-2 text-label font-medium tracking-[0.14em] text-white/80 uppercase"
            >
              {eyebrow}
            </p>
          )}
          <h1 className="font-heading text-title text-balance">{EVENT.name}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <Avatar seed={MAYA.seed} size="sm">
                <AvatarFallback>{MAYA.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-white">{MAYA.name}</span>
            </span>
            <span aria-hidden className="text-white/45">
              ·
            </span>
            <span>{formatEventDate(EVENT.date)}</span>
          </p>
          {line ? (
            <div data-tw-cover-line="" className="mt-3 max-w-xl">
              {line}
            </div>
          ) : (
            <p className="mt-3 line-clamp-2 max-w-xl text-working text-pretty text-white/80 md:line-clamp-3">
              {EVENT.note}
            </p>
          )}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 md:mt-0 md:shrink-0 md:flex-row-reverse md:flex-nowrap">
          {actions}
        </div>
      </div>
    </EventHead>
  );
}

/* ── the album's own head row, quoted ──────────────────────────────────── */

/** The album's count and its quiet tools (`live-gallery.tsx`), once it has photographs. */
export function AlbumHead({ count }: { count: number }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-1.5">
      <p className="px-0.5 text-working text-muted-foreground tabular-nums">
        {formatMediaCount(count)}
      </p>
      <div className="ml-auto flex items-center gap-1.5">
        <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground">
          <Download className="size-4" /> Download all
        </span>
        <span className="flex size-8 items-center justify-center rounded-md text-muted-foreground">
          <SlidersHorizontal className="size-4" />
        </span>
      </div>
    </div>
  );
}

/* ── the album's rows, quoted ──────────────────────────────────────────── */

/** One tile in a row: a photograph of the album, or something an option stands in the album's place. */
export type RowItem =
  | { kind: "photo"; still: Still; arrived?: boolean; key: string }
  | { kind: "node"; ratio: number; node: ReactNode; key: string };

/**
 * THE ALBUM'S ROWS (the shape `GalleryRows` draws: two a row at a phone, five
 * at a desk), quoted with flex so a frame needs no engine: each tile grows by
 * its own width over height from a zero basis, so a row comes out one height
 * and fills the width, as the rows engine justifies a row.
 */
export function Rows({
  items,
  perRow,
}: {
  items: readonly RowItem[];
  perRow: number;
}) {
  const rows = Array.from(
    { length: Math.ceil(items.length / perRow) },
    (_, r) => items.slice(r * perRow, r * perRow + perRow),
  );
  return (
    <div data-tw-rows="" className="flex flex-col gap-[var(--gap-gallery)]">
      {rows.map((row, r) => (
        <div key={r} className="flex gap-[var(--gap-gallery)]">
          {row.map((item) => {
            const ratio =
              item.kind === "photo" ? item.still.w / item.still.h : item.ratio;
            return (
              <div
                key={item.key}
                className="relative min-w-0"
                style={
                  {
                    flex: `${ratio} 1 0`,
                    aspectRatio: `${ratio}`,
                  } as CSSProperties
                }
              >
                {item.kind === "photo" ? (
                  <span
                    data-tw-tile=""
                    data-arrived={item.arrived ? "" : undefined}
                    className="absolute inset-0 overflow-hidden rounded-tile bg-muted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- a marketing still, drawn as the album's tile */}
                    <img
                      src={item.still.src}
                      alt=""
                      draggable={false}
                      className="absolute inset-0 size-full object-cover"
                    />
                    {item.arrived && (
                      // Production's arrival light (`shared/arrival.css`), held at its peak: a rim and a
                      // wash drawn inside the photograph, white, a light and never a colour.
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_2px_rgb(255_255_255/0.9),inset_0_0_26px_3px_rgb(255_255_255/0.38)]"
                      />
                    )}
                  </span>
                ) : (
                  <div className="absolute inset-0">{item.node}</div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ── one of hers, waiting, where it stands ─────────────────────────────── */

/**
 * HER PHOTO, WAITING, IN THE ALBUM: her own picture (presigned for her alone,
 * `/api/guests/mine`), lit, with one quiet mark that says it waits and for
 * whom ("Only you see it until ..."); the photo she just added carries the one
 * pass of light her own landing takes.
 */
export function HerTile({
  shot,
  mark,
  landing = false,
  removing = false,
  className,
}: {
  shot: Shot;
  /** The word the mark carries, or none for a bare glyph. */
  mark?: string;
  landing?: boolean;
  removing?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "tw-hers block size-full transition-opacity",
        removing && "opacity-45",
        className,
      )}
      data-tw-hers={shot.id}
      data-landing={landing ? "" : undefined}
      data-removing={removing ? "" : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- her own photograph, a marketing still standing in */}
      <img src={shot.still.src} alt="" draggable={false} />
      <span
        className={cn(
          GLASS_MARK,
          "absolute top-1.5 left-1.5 flex h-6 items-center gap-1 rounded-full px-2 text-micro font-medium text-white",
        )}
        data-tw-mark=""
      >
        <Clock className={cn(GLASS_MARK_LIT, "size-3")} aria-hidden />
        {mark && <span className={GLASS_MARK_LIT}>{mark}</span>}
      </span>
      {shot.video && (
        <span
          className={cn(
            GLASS_MARK,
            "absolute right-1.5 bottom-1.5 flex h-6 items-center gap-1 rounded-full px-2 text-micro font-medium text-white tabular-nums",
          )}
        >
          <Play className="size-2.5 fill-current" aria-hidden />
          {`0:0${shot.video}`}
        </span>
      )}
    </span>
  );
}
