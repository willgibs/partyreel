"use client";

import type { ReactNode } from "react";
import {
  Camera,
  Clapperboard,
  Download,
  QrCode,
  SlidersHorizontal,
} from "lucide-react";

import { PosterCard } from "@/components/reel/poster-card";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { EVENT, type Frame, HOST, PRIYA, type Still } from "./fixtures";
import { FilmStill, type LookId } from "./film";
import { ScrollHere } from "./scene";

/**
 * THE ALBUM AS PRIYA HOLDS IT AT A DISPOSABLE-CAMERA EVENT, QUOTED
 * (`event-experience.tsx`, `live-gallery.tsx`, `gallery-rows.tsx`): the
 * header, the words' column (the name, the byline, the stats line), the action
 * block, then the album in its own box, two photographs a row in a hand.
 *
 * ★ WHAT A DISPOSABLE CHANGES ON IT, AND NOTHING ELSE: Add photos becomes Take
 * a photo, with her shots left where her tracker's round button rides today
 * (`tracker=button`); the album's area shows the roll developing (the `waiting`
 * decision) until it develops; the stats line counts shots, since the camera
 * takes photographs only. Everything else is today's words at today's sizes.
 */

/** The words' column and the album's box, `event-experience.tsx`'s own. */
const COLUMN = "w-full max-w-2xl px-5";
const BLEED = "px-3 sm:px-5";

/**
 * THE HEADER, QUOTED (`guest-header.tsx`): the logo, and on the right her
 * account's face and name (a confirmed email, the default door).
 */
function GuestHeader() {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <span className="flex items-center gap-2.5">
        <Logo />
      </span>
      <div className="flex h-8 items-center">
        <span className="flex items-center gap-2 rounded-full">
          <Avatar size="sm" seed={PRIYA.seed}>
            <AvatarFallback className="text-[10px]">
              {PRIYA.name.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-28 truncate text-sm">{PRIYA.name}</span>
        </span>
      </div>
    </header>
  );
}

/**
 * THE CAMERA'S ROW, where Add photos stands today: the primary act over
 * Invite. Her shots left stand beside it in her tracker's place, a quiet chip
 * of the round button's own outline. `out` is the roll run dry (the price
 * decision's end), drawn disabled with its reason under it.
 */
export function CameraRow({
  left,
  out,
}: {
  left: number;
  /** The camera can take no more: the sentence a guest reads, under it. */
  out?: string;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="lg"
          className="min-w-0 flex-1"
          tabIndex={-1}
          disabled={!!out}
          data-dm-camera-row
        >
          <Camera /> {out ? "Out of film" : "Take a photo"}
        </Button>
        <span
          data-dm-left
          className={cn(
            "flex h-9 shrink-0 items-center rounded-full border border-border px-3 text-sm tabular-nums",
            out ? "text-faint" : "text-muted-foreground",
          )}
        >
          {out ? "0 left" : `${left} left`}
        </span>
      </div>
      {out && (
        <p
          data-dm-say
          className="mt-2 text-reading text-pretty text-muted-foreground"
        >
          {out}
        </p>
      )}
      <div className="mt-2 grid grid-cols-1 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-full"
          tabIndex={-1}
        >
          <QrCode /> Invite
        </Button>
      </div>
    </div>
  );
}

/**
 * THE PAGE: the header, the words' column over the album's own box. `when` is
 * the one line under the stats that says when the roll develops; `children`
 * is the album's area; `scroll` opens the frame at the album's area, the
 * place the decision is about.
 */
export function AlbumPage({
  stats,
  when,
  camera,
  scroll = false,
  overlay,
  children,
}: {
  stats: string;
  when?: ReactNode;
  camera: ReactNode;
  scroll?: boolean;
  overlay?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="min-h-full bg-background pb-8 text-foreground">
      <GuestHeader />
      <div className="w-full pt-8">
        <div className={COLUMN}>
          <header>
            <p className="font-heading text-page text-balance">{EVENT.name}</p>
            <p className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="text-faint">Hosted by</span>
                <Avatar seed={HOST.seed} size="sm">
                  <AvatarFallback>
                    {HOST.displayName.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">
                  {HOST.displayName}
                </span>
              </span>
              <span aria-hidden className="text-faint">
                ·
              </span>
              <span>{EVENT.date}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground" data-dm-stats>
              {stats}
            </p>
            {when && (
              <p
                data-dm-when
                className="mt-1 text-xs font-medium text-foreground"
              >
                {when}
              </p>
            )}
          </header>
          {camera}
        </div>
        {scroll && (
          <div className={BLEED}>
            <ScrollHere offset={16} />
          </div>
        )}
        {children}
      </div>
      {overlay}
    </div>
  );
}

/** The album's own box: the gutter alone, the album's width. */
export function Bleed({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(BLEED, "mt-7", className)}>{children}</div>;
}

/* ── the album's rows ───────────────────────────────────────────────────── */

type Cell = { key: string; ratio: number; node: ReactNode };

/**
 * THE ROWS, justified the way the real rows are (`gallery-rows.tsx`): every
 * photograph in a row shares one height and the row fills the width, two a
 * row in a hand (the default step).
 */
function Justified({
  cells,
  per = 2,
}: {
  cells: readonly Cell[];
  per?: number;
}) {
  const rows: Cell[][] = [];
  for (let i = 0; i < cells.length; i += per)
    rows.push(cells.slice(i, i + per));
  return (
    <div className="flex flex-col" style={{ gap: "var(--gap-gallery)" }}>
      {rows.map((row, i) => (
        <div key={i} className="flex" style={{ gap: "var(--gap-gallery)" }}>
          {row.map((c) => (
            <div
              key={c.key}
              className="min-w-0"
              style={{ flexGrow: c.ratio, flexBasis: 0, aspectRatio: c.ratio }}
            >
              {c.node}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Developed shots, each wearing the roll's look, in the album's rows. */
export function StillRows({
  stills,
  look,
}: {
  stills: readonly Still[];
  look: LookId;
}) {
  return (
    <div data-dm-rows>
      <Justified
        cells={stills.map((s, i) => ({
          key: `${s.id}-${i}`,
          ratio: s.width / s.height,
          node: (
            <FilmStill
              still={s}
              look={look}
              className="size-full"
              style={{ borderRadius: "var(--radius-tile)" }}
            />
          ),
        }))}
      />
    </div>
  );
}

/**
 * AN UNDEVELOPED FRAME: the shot's own shape and the minute it was taken,
 * nothing of its picture. Hers carry a hairline and "Yours", so she can see
 * each of hers went.
 */
function Undeveloped({ frame }: { frame: Frame }) {
  return (
    <div
      className="dm-undeveloped"
      data-mine={frame.mine ? "" : undefined}
      data-dm-frame
    >
      <span aria-hidden className="dm-film-grain" />
      <span className="absolute bottom-1.5 left-2 text-micro tabular-nums">
        {frame.time}
      </span>
      {frame.mine && (
        <span className="absolute top-1.5 left-2 text-micro font-medium">
          Yours
        </span>
      )}
    </div>
  );
}

export function FrameRows({ frames }: { frames: readonly Frame[] }) {
  return (
    <div data-dm-frames>
      <Justified
        cells={frames.map((f) => ({
          key: f.id,
          ratio: f.ratio,
          node: <Undeveloped frame={f} />,
        }))}
      />
    </div>
  );
}

/** The quiet line over the album's area, the album head's own size. */
export function AreaHead({
  left,
  right,
}: {
  left: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-1.5 px-0.5">
      <p className="text-working text-muted-foreground tabular-nums">{left}</p>
      {right && (
        <p className="text-working text-muted-foreground tabular-nums">
          {right}
        </p>
      )}
    </div>
  );
}

/** The album's own head once the roll has developed: its count, Download all and View. */
export function AlbumHead({ count }: { count: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-1.5">
      <p className="px-0.5 text-working text-muted-foreground tabular-nums">
        {count}
      </p>
      <div className="ml-auto flex items-center gap-1.5">
        <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground">
          <Download className="size-4" /> Download all
        </span>
        <Button type="button" variant="outline" size="sm" tabIndex={-1}>
          <SlidersHorizontal /> View
        </Button>
      </div>
    </div>
  );
}

/**
 * THE DARKROOM: the whole roll as a count under the safelight, and when it
 * develops. Nothing of any photograph, hers included.
 */
export function Darkroom({
  shots,
  when,
  hers,
}: {
  shots: number;
  when: string;
  hers?: string;
}) {
  return (
    <div className="dm-darkroom px-6 pt-10 pb-8 text-center" data-dm-darkroom>
      <p className="relative font-heading text-section tabular-nums">{shots}</p>
      <p className="relative mt-1 text-reading">shots developing</p>
      <p className="dm-darkroom-soft relative mt-5 text-working">{when}</p>
      {hers && (
        <p className="dm-darkroom-soft relative mt-1 text-working">{hers}</p>
      )}
    </div>
  );
}

/**
 * THE REEL'S TILE, QUOTED (`live-reel.tsx`, `LiveReelTile`): "Highlight reel"
 * on the shipped face (`PosterCard`), its clapperboard mark, and its line in
 * the violet meta's place, resting on one still of the roll.
 */
export function ReelTile({
  still,
  look,
  line,
}: {
  still: Still;
  look: LookId;
  line: string;
}) {
  return (
    <div className={cn(COLUMN, "mt-7 mb-4")} data-dm-reel>
      <div className="relative rounded-lg">
        <PosterCard
          eventName="Highlight reel"
          chip={
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-white",
                GLASS_MARK,
              )}
            >
              <Clapperboard
                className={cn("size-3", GLASS_MARK_LIT)}
                aria-hidden
              />
            </span>
          }
          meta={
            <span className="text-micro font-medium text-[oklch(0.8_0.14_300)]">
              {line}
            </span>
          }
          media={
            <FilmStill
              still={still}
              look={look}
              className="aspect-[2/1] w-full bg-muted"
            />
          }
        />
      </div>
    </div>
  );
}
