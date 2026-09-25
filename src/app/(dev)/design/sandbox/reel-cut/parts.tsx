"use client";

import { type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  GripVertical,
  Heart,
  ImagePlay,
  Lock,
  Play,
  Plus,
  RectangleVertical,
  Timer,
} from "lucide-react";

import { UNIFORM_TILE_ASPECT } from "@/lib/media/tile-aspect";
import { cn } from "@/lib/utils";

import { BY_ID, FILL_LABEL, FILLS, STYLES } from "./fixtures";
import type { AlbumItem, FillId } from "./fixtures";
import { ClipStill } from "./stills";

/**
 * THE PIECES A DIRECTION IS BUILT FROM, AND NOTHING ELSE.
 *
 * ★ QUOTED, NEVER MOUNTED. The creator's real controls (`ReelStudio`,
 * `StyleWall`, `StudioMomentsPicker`) mount `ReelProvider` and fire writes
 * against whatever event id they are handed, so each piece here is the shipped
 * piece's own classes and words over the fixtures: the dark room's chip, the
 * sheet's label, the picker's position badge, the wall's tile.
 *
 * ★ NOTHING HERE MOUNTS A RADIX PORTAL. A portal opened inside a portalled lab
 * frame renders on the LAB PAGE's document, not inside the phone being judged,
 * so a menu or a dialog is quoted markup: the real classes, none of the
 * primitives.
 *
 * ★ EVERY COUNT UNDER A FRAME IS READ OFF THE DOCUMENT BY THE BOARD, so each
 * piece marks what it is (`data-rc-look`, `data-rc-moment`) and never reports
 * a number of its own.
 */

/** The room's ground and its one raised surface, in one place. */
export const ROOM = "bg-[oklch(0.11_0_0)]";
export const PANEL = "bg-[oklch(0.14_0_0)] ring-1 ring-white/[0.07]";

/* ── the dark room's own chip and label, quoted from reel-studio.tsx ─────── */

export function RoomChip({
  active,
  children,
  className,
}: {
  active?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex h-8 shrink-0 items-center gap-1 rounded-[var(--radius-action-sm)] border px-3 text-caption font-medium whitespace-nowrap",
        active
          ? "border-white bg-white text-zinc-900"
          : "border-white/20 text-white/80",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** The sheet's own label row, with a count read by the reader, not typed. */
export function PanelLabel({
  children,
  aside,
}: {
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <p className="text-label font-semibold text-white/45 uppercase">
        {children}
      </p>
      {aside ? (
        <p className="text-micro text-white/40 tabular-nums">{aside}</p>
      ) : null}
    </div>
  );
}

/* ── the looks: fourteen frames of HER clip ──────────────────────────────── */

function LookTile({
  id,
  src,
  label,
  active,
  className,
}: {
  id: string;
  src: string | null;
  label: string;
  active: boolean;
  className?: string;
}) {
  return (
    <span
      data-rc-look={active ? "on" : "off"}
      data-rc-look-id={id}
      className={cn("flex min-w-0 shrink-0 flex-col gap-1", className)}
    >
      <span
        className={cn(
          "relative block rounded-lg",
          active
            ? "ring-2 ring-white ring-offset-2 ring-offset-[oklch(0.14_0_0)]"
            : "ring-1 ring-white/10",
        )}
      >
        <ClipStill src={src} label={label} rounded="rounded-lg" role="look" />
        {active ? (
          <span
            aria-hidden
            className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-white text-zinc-900"
          >
            <Check className="size-2.5" />
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "truncate text-micro",
          active ? "font-medium text-white" : "text-white/55",
        )}
      >
        {label}
      </span>
    </span>
  );
}

/** Fourteen at once, as a wall of `cols` columns (the shipped StyleWall's
 *  tile, ungrouped so all fourteen stand in one rectangle). */
export function LookWall({
  thumbs,
  picked,
  cols,
}: {
  thumbs: ReadonlyMap<string, string>;
  picked: string;
  cols: number;
}) {
  return (
    <div
      data-rc-looks="wall"
      className="grid gap-x-2.5 gap-y-3"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {STYLES.map((s) => (
        <LookTile
          key={s.id}
          id={s.id}
          src={thumbs.get(s.id) ?? null}
          label={s.label}
          active={s.id === picked}
        />
      ))}
    </div>
  );
}

/** One scrolling row of the fourteen, tiles `w` px wide. */
export function LookRail({
  thumbs,
  picked,
  w = 72,
}: {
  thumbs: ReadonlyMap<string, string>;
  picked: string;
  w?: number;
}) {
  return (
    <div
      data-rc-looks="rail"
      data-rc-scroll
      className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pt-1 pb-1"
    >
      {STYLES.map((s) => (
        <span key={s.id} style={{ width: w }} className="shrink-0">
          <LookTile
            id={s.id}
            src={thumbs.get(s.id) ?? null}
            label={s.label}
            active={s.id === picked}
          />
        </span>
      ))}
    </div>
  );
}

/**
 * THE DIAL: the looks' names under the clip, the one it wears centred and
 * lit, its neighbours fading with distance (the camera's own mode dial). The
 * picture is the clip itself, so the dial carries words only.
 */
export function LookDial({
  picked,
  reach = 2,
  className,
}: {
  picked: string;
  /** How many names show each side of the one it wears. */
  reach?: number;
  className?: string;
}) {
  const at = Math.max(
    0,
    STYLES.findIndex((s) => s.id === picked),
  );
  const slots = Array.from({ length: reach * 2 + 1 }, (_, k) => k - reach);
  return (
    <div
      data-rc-looks="dial"
      className={cn("flex items-center justify-center gap-1", className)}
    >
      <span
        aria-label="The look before"
        className="flex size-7 shrink-0 items-center justify-center rounded-full text-white/55"
      >
        <ChevronLeft className="size-4" aria-hidden />
      </span>
      <div className="grid min-w-0 flex-1 grid-flow-col items-center justify-center gap-3 overflow-hidden">
        {slots.map((d) => {
          const s = STYLES[at + d];
          if (!s) return <span key={d} aria-hidden className="w-12" />;
          const here = d === 0;
          return (
            <span
              key={s.id}
              data-rc-dial-name={here ? "on" : "off"}
              className={cn(
                "text-center whitespace-nowrap",
                here
                  ? "text-caption font-semibold tracking-[0.12em] text-white uppercase"
                  : Math.abs(d) === 1
                    ? "text-caption text-white/50"
                    : "text-caption text-white/25",
              )}
            >
              {s.label}
            </span>
          );
        })}
      </div>
      <span
        aria-label="The next look"
        className="flex size-7 shrink-0 items-center justify-center rounded-full text-white/55"
      >
        <ChevronRight className="size-4" aria-hidden />
      </span>
    </div>
  );
}

/** The dots under a swiped clip: where in the fourteen it is. */
export function LookDots({ picked }: { picked: string }) {
  return (
    <div aria-hidden className="flex items-center justify-center gap-1">
      {STYLES.map((s) => (
        <span
          key={s.id}
          className={cn(
            "size-1 rounded-full",
            s.id === picked ? "bg-white" : "bg-white/25",
          )}
        />
      ))}
    </div>
  );
}

/* ── the moments ─────────────────────────────────────────────────────────── */

/** The three fills, as the room's chips. */
export function Fills({
  fill,
  className,
}: {
  fill: FillId;
  className?: string;
}) {
  return (
    <div
      data-rc-fills
      className={cn("flex items-center gap-1.5 overflow-x-auto", className)}
    >
      {FILLS.map((f) => (
        <RoomChip key={f} active={f === fill}>
          {FILL_LABEL[f]}
        </RoomChip>
      ))}
    </div>
  );
}

/** The same three, folded into one chip that opens a small menu. */
export function FillMenu({ fill }: { fill: FillId }) {
  return (
    <span
      data-rc-fills="menu"
      className="flex h-7 shrink-0 items-center gap-1.5 rounded-[var(--radius-action-sm)] border border-white/20 px-2.5 text-caption whitespace-nowrap text-white/85"
    >
      <span className="text-white/45">Start from</span>
      <span className="font-medium">{FILL_LABEL[fill]}</span>
      <ChevronDown className="size-3.5 text-white/45" aria-hidden />
    </span>
  );
}

/**
 * THE HOST'S BLOCKED TILE, as she ruled it (`blocked=caption`): dimmed, the eye
 * mark, and "Hidden · Show" readable before anyone taps, with Show as its own
 * control. A guest never meets it: hidden photographs are not in her pool.
 */
function HiddenCaption({ stacked }: { stacked?: boolean }) {
  return (
    <span
      data-rc-blocked="caption"
      className={cn(
        "absolute inset-x-0 bottom-0 flex bg-black/70 text-micro text-white/85",
        stacked
          ? "flex-col items-center px-0.5 py-0.5 leading-tight"
          : "items-center justify-center gap-1 px-1 py-1",
      )}
    >
      <span>Hidden</span>
      {stacked ? null : (
        <span aria-hidden className="text-white/40">
          ·
        </span>
      )}
      <span className="font-semibold text-white underline underline-offset-2">
        Show
      </span>
    </span>
  );
}

/**
 * One moment, in whichever grid or strip holds it. ★ THE BADGE IS A POSITION,
 * NOT A TICK (the shipped picker's rule): in a clip, "where" matters more than
 * "in", and the number is the bridge between the pool and the order.
 */
function MomentTile({
  item,
  at,
  small,
}: {
  item: AlbumItem;
  /** Its place in the clip, 1-based; undefined when it is out. */
  at?: number;
  small?: boolean;
}) {
  const hidden = item.status === "hidden";
  const state = hidden ? "blocked" : at ? "in" : "out";
  return (
    <span
      data-rc-moment={state}
      className="relative block min-w-0"
      style={{ aspectRatio: UNIFORM_TILE_ASPECT }}
    >
      <span
        className={cn(
          "absolute inset-0 block overflow-hidden bg-white/5",
          small ? "rounded-[3px]" : "rounded-[var(--radius-tile)]",
          at && "ring-2 ring-white ring-inset",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a local fixture still */}
        <img
          src={item.previewUrl ?? item.url}
          alt=""
          className={cn(
            "size-full object-cover",
            hidden ? "opacity-30" : at ? "opacity-100" : "opacity-60",
          )}
        />
        {at ? (
          <span
            className={cn(
              "absolute flex items-center justify-center rounded-full bg-white font-semibold text-zinc-900 tabular-nums",
              small
                ? "top-0.5 left-0.5 size-3.5 text-[8px]"
                : "top-1 left-1 size-5 text-micro",
            )}
          >
            {at}
          </span>
        ) : !hidden ? (
          <span
            aria-hidden
            className={cn(
              "absolute rounded-full border border-white/70 bg-black/20",
              small ? "top-0.5 left-0.5 size-3" : "top-1 left-1 size-4",
            )}
          />
        ) : null}
        {item.type === "video" ? (
          <span
            aria-hidden
            className={cn(
              "absolute flex items-center justify-center rounded-full bg-black/55",
              small ? "right-0.5 bottom-0.5 size-3" : "right-1 bottom-1 size-4",
            )}
          >
            <Play
              className={cn(
                "fill-white text-white",
                small ? "size-1.5" : "size-2",
              )}
            />
          </span>
        ) : null}
        {item.likeCount && !small && !hidden ? (
          <span className="absolute bottom-1 left-1 flex items-center gap-0.5 text-micro text-white/80">
            <Heart className="size-2.5" aria-hidden />
            {item.likeCount}
          </span>
        ) : null}
        {hidden ? (
          <span
            aria-hidden
            className={cn(
              "absolute flex items-center justify-center rounded-full bg-black/60 text-white/80",
              small ? "top-0.5 right-0.5 size-3.5" : "top-1 right-1 size-5",
            )}
          >
            <EyeOff className={small ? "size-2" : "size-2.5"} />
          </span>
        ) : null}
        {hidden ? <HiddenCaption stacked={small} /> : null}
      </span>
    </span>
  );
}

const positions = (ids: readonly string[]) =>
  new Map(ids.map((id, i) => [id, i + 1]));

/** The pool as a grid: every moment she may take, the ones in numbered. */
export function MomentGrid({
  pool,
  ids,
  cols,
}: {
  pool: readonly AlbumItem[];
  ids: readonly string[];
  cols: number;
}) {
  const at = positions(ids);
  return (
    <div
      data-rc-pool="grid"
      className="grid gap-[var(--gap-gallery)]"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {pool.map((m) => (
        <MomentTile key={m.id} item={m} at={at.get(m.id)} />
      ))}
    </div>
  );
}

/**
 * THE ORDER: the clip's moments as the shipped filmstrip dock draws them (the
 * one thing a timeline would have), the opening shot ringed, a grip on one to
 * say they move, and the "+" that leads to the pool.
 */
export function OrderStrip({
  ids,
  tile = 44,
  note,
}: {
  ids: readonly string[];
  tile?: number;
  note?: string | null;
}) {
  const items = ids
    .map((id) => BY_ID.get(id))
    .filter((m): m is AlbumItem => Boolean(m));
  return (
    <div data-rc-order>
      <div
        data-rc-scroll
        className="flex items-start gap-1.5 overflow-x-auto pb-1"
      >
        {items.map((m, i) => (
          <span
            key={m.id}
            data-rc-order-tile
            style={{ width: tile, aspectRatio: UNIFORM_TILE_ASPECT }}
            className="relative shrink-0 overflow-hidden rounded-[4px] bg-white/5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a local fixture still */}
            <img
              src={m.previewUrl ?? m.url}
              alt=""
              className="size-full object-cover"
            />
            {m.type === "video" ? (
              <span
                aria-hidden
                className="absolute right-0.5 bottom-0.5 flex size-3 items-center justify-center rounded-full bg-black/55"
              >
                <Play className="size-1.5 fill-white text-white" />
              </span>
            ) : null}
            {i === 0 ? (
              <span
                aria-hidden
                className="absolute inset-0 ring-2 ring-white/70 ring-inset"
              />
            ) : null}
            {i === 2 ? (
              <span
                aria-hidden
                className="pointer-events-none absolute top-0.5 right-0.5 text-white/85"
              >
                <GripVertical className="size-3 drop-shadow" />
              </span>
            ) : null}
          </span>
        ))}
        <span
          aria-label="Add moments"
          style={{ width: tile, aspectRatio: UNIFORM_TILE_ASPECT }}
          className="flex shrink-0 items-center justify-center rounded-[4px] border border-dashed border-white/25 text-white/60"
        >
          <Plus className="size-4" aria-hidden />
        </span>
      </div>
      {note ? <p className="mt-1 text-micro text-white/40">{note}</p> : null}
    </div>
  );
}

/**
 * THE ALBUM AS THE FILMSTRIP (`strip`'s own piece): the clip's moments lit and
 * numbered first, in order; a hairline; then the rest of the album dimmed.
 * Tapping a dim one appends it, tapping a lit one takes it out, holding one
 * moves it: membership and order are one strip.
 */
export function AlbumStrip({
  pool,
  ids,
  fill,
  tile = 44,
  trailing,
}: {
  pool: readonly AlbumItem[];
  ids: readonly string[];
  fill: FillId;
  tile?: number;
  /** The head row's right end: the tray, at a laptop. */
  trailing?: ReactNode;
}) {
  const inClip = ids
    .map((id) => BY_ID.get(id))
    .filter((m): m is AlbumItem => Boolean(m));
  const members = new Set(ids);
  const rest = pool.filter((m) => !members.has(m.id));
  return (
    <div data-rc-pool="strip">
      <div className="mb-2 flex items-center gap-3">
        <FillMenu fill={fill} />
        <p className="min-w-0 flex-1 truncate text-micro text-white/45 tabular-nums">
          {`${inClip.length} in your clip · ${rest.length} more`}
        </p>
        {trailing}
      </div>
      <div
        data-rc-scroll
        className="flex items-end gap-1.5 overflow-x-auto pb-1"
      >
        {inClip.map((m, i) => (
          <span key={m.id} className="shrink-0" style={{ width: tile }}>
            <MomentTile item={m} at={i + 1} small />
          </span>
        ))}
        <span
          aria-hidden
          data-rc-strip-divider
          className="mx-1 w-px shrink-0 self-stretch bg-white/25"
        />
        {rest.map((m) => (
          <span key={m.id} className="shrink-0" style={{ width: tile }}>
            <MomentTile item={m} small />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── the tray: three settings that show their value ──────────────────────── */

function TrayChip({
  icon,
  label,
  value,
  compact,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <span
      data-rc-tray-chip
      className="flex h-8 shrink-0 items-center gap-1.5 rounded-[var(--radius-action-sm)] border border-white/15 px-2.5 text-caption whitespace-nowrap text-white/85"
    >
      <span className="text-white/50">{icon}</span>
      {compact ? null : <span className="text-white/45">{label}</span>}
      <span className="font-medium">{value}</span>
      <ChevronDown className="size-3.5 text-white/40" aria-hidden />
    </span>
  );
}

/**
 * THE TRAY, NOW THREE: the settings that style what is already there. Each
 * chip shows its value and opens a small menu, so none of them takes the
 * bench's panel from the moments and the looks.
 */
export function Tray({
  compact,
  free,
  inert,
  className,
}: {
  compact?: boolean;
  /** A free event caps a clip at 30 seconds: the menu's 60 wears a lock. */
  free?: boolean;
  /** The export's minute: nothing here moves until it is done. */
  inert?: boolean;
  className?: string;
}) {
  return (
    <div
      data-rc-tray
      data-rc-inert={inert ? "" : undefined}
      className={cn(
        "flex items-center justify-center gap-1.5",
        inert && "opacity-35",
        className,
      )}
    >
      <TrayChip
        compact={compact}
        icon={<Timer className="size-3.5" aria-hidden />}
        label="Length"
        value="0:30"
      />
      <TrayChip
        compact={compact}
        icon={<RectangleVertical className="size-3.5" aria-hidden />}
        label="Layout"
        value="Portrait"
      />
      <TrayChip
        compact={compact}
        icon={<ImagePlay className="size-3.5" aria-hidden />}
        label="Opening"
        value="Auto"
      />
      {free && !compact ? (
        <span className="flex items-center gap-1 text-micro text-white/35">
          <Lock className="size-2.5" aria-hidden />
          60s with Pro
        </span>
      ) : null}
    </div>
  );
}
