"use client";

import { type ReactNode } from "react";
import { Check, Clapperboard, Eye, EyeOff, Heart, Play } from "lucide-react";

import { UNIFORM_TILE_ASPECT } from "@/lib/media/tile-aspect";
import type { StyleEntry } from "@/lib/reel/engine/style-registry";
import { cn } from "@/lib/utils";

import { POOL, REEL_IDS, STYLES } from "./fixtures";

/**
 * THE TWO PICKERS: fourteen looks, and thirty photographs.
 *
 * Both are rebuilt here rather than imported, and for the same reason twice.
 * `StyleWall` mounts fourteen `CanvasReelPlayer`s and `StudioMomentsPicker`
 * reads `useReel()` and writes through `addMany` on every tap, so mounting
 * either on a board is either fourteen live canvases per option or a real RPC
 * against a real event. What IS carried over unchanged is everything a decision
 * is judged on: the wall's `grid-cols-4` with full-width thumbs, the picker's
 * `grid-cols-4 sm:grid-cols-5` over `UNIFORM_TILE_ASPECT` tiles, the violet
 * position disc, the check, the suggested hint, the read-only like count, the
 * dimmed hidden tile and its disabled state.
 *
 * ★ TODAY'S GRIDS ARE QUOTED WITH THEIR VIEWPORT BREAKPOINTS, which is what
 * makes the laptop number honest: `sm:grid-cols-5` reads the WINDOW, so in a
 * sheet spanning a 1440 room it really is five tiles of 275 px, and a wall of
 * four full-width thumbs really is four frames of 348 px by 619. A new surface
 * on this board (the pool) spells its own rule instead, because it is not
 * quoting anything.
 */

/* ── one look ────────────────────────────────────────────────────────────── */

function Thumb({
  style,
  src,
  active,
  className,
}: {
  style: StyleEntry;
  src: string | null;
  active: boolean;
  className?: string;
}) {
  return (
    <span
      data-rs-thumb
      data-active={active || undefined}
      className={cn("flex shrink-0 flex-col gap-1", className)}
    >
      <span
        className={cn(
          "block aspect-[9/16] w-full overflow-hidden rounded-[6px] bg-[oklch(0.2_0_0)]",
          active && "ring-2 ring-reel",
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- a data url the engine drew
          <img src={src} alt="" className="size-full object-cover" />
        ) : null}
      </span>
      <span
        className={cn(
          "truncate text-center text-[10px] leading-tight font-medium",
          active ? "text-reel" : "text-white/55",
        )}
      >
        {style.label}
      </span>
    </span>
  );
}

const FAMILY: Record<StyleEntry["kind"], string> = {
  mood: "Looks",
  treatment: "Layouts",
};

/** The fourteen, in two families, exactly as the catalog orders them. */
const GROUPS: { kind: StyleEntry["kind"]; styles: StyleEntry[] }[] = [
  { kind: "mood", styles: STYLES.filter((s) => s.kind === "mood") },
  { kind: "treatment", styles: STYLES.filter((s) => s.kind === "treatment") },
];

function FamilyLabel({ kind }: { kind: StyleEntry["kind"] }) {
  return (
    <p className="mb-1.5 text-[10px] font-semibold tracking-[0.16em] text-white/45 uppercase">
      {FAMILY[kind]}
    </p>
  );
}

/** TODAY: four columns of full-width frames, in whatever box the sheet gives it. */
export function StyleWall({
  stills,
  active,
}: {
  stills: ReadonlyMap<string, string>;
  active: string;
}) {
  return (
    <div data-rs-styles="wall">
      {GROUPS.map(({ kind, styles }) => (
        <div key={kind} className="mb-2 last:mb-0">
          <FamilyLabel kind={kind} />
          <div className="grid grid-cols-4 gap-2">
            {styles.map((s) => (
              <Thumb
                key={s.id}
                style={s}
                src={stills.get(s.id) ?? null}
                active={s.id === active}
                className="w-full"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** THE RAIL, resurrected: one row, bigger frames, the family names in the row. */
export function StyleRail({
  stills,
  active,
}: {
  stills: ReadonlyMap<string, string>;
  active: string;
}) {
  return (
    <div data-rs-styles="rail" className="flex gap-2 overflow-x-auto pb-1">
      {GROUPS.map(({ kind, styles }) => (
        <div key={kind} className="flex shrink-0 gap-2">
          <span className="flex w-4 shrink-0 items-center justify-center">
            <span className="rotate-180 text-[8px] font-semibold tracking-[0.16em] text-white/40 uppercase [writing-mode:vertical-rl]">
              {FAMILY[kind]}
            </span>
          </span>
          {styles.map((s) => (
            <Thumb
              key={s.id}
              style={s}
              src={stills.get(s.id) ?? null}
              active={s.id === active}
              className="w-28"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** THREE TO START: one per family plus the house default, the rest behind More. */
export function StyleThree({
  stills,
  active,
}: {
  stills: ReadonlyMap<string, string>;
  active: string;
}) {
  const first = [
    STYLES.find((s) => s.id === active) ?? STYLES[0],
    STYLES.find((s) => s.kind === "mood" && s.id !== active) ?? STYLES[1],
    STYLES.find((s) => s.kind === "treatment") ?? STYLES[8],
  ];
  return (
    <div data-rs-styles="three">
      <div className="grid grid-cols-3 justify-items-center gap-2">
        {first.map((s) => (
          <Thumb
            key={s.id}
            style={s}
            src={stills.get(s.id) ?? null}
            active={s.id === active}
            className="w-full max-w-[180px]"
          />
        ))}
      </div>
      <span className="mt-2.5 flex h-8 w-full items-center justify-center gap-1.5 rounded-[var(--radius-action-sm)] border border-white/20 text-[11px] font-medium text-white/80">
        <Clapperboard className="size-3" aria-hidden />
        More looks ({STYLES.length - 3})
      </span>
    </div>
  );
}

/* ── the pool of photographs ─────────────────────────────────────────────── */

/** How a tile the reel cannot take explains itself: the `blocked` option ids. */
export type BlockedShape = "title" | "toast" | "caption";
export const blockedOf = (v: string | undefined): BlockedShape =>
  v === "toast" || v === "caption" ? v : "title";

const IN_REEL = new Map(REEL_IDS.map((id, i) => [id, i + 1]));
/** quick-add's blend, standing in: the tiles the picker would hint at. */
const SUGGESTED = new Set(["rs-12", "rs-20", "rs-25"]);

/**
 * ONE TILE of the pool. Today's grammar, quoted: the violet position disc and
 * the check when it is in, the dim when it is hidden, the soft suggestion, the
 * read-only like count, the play badge. What varies is one thing only, and it
 * is the `blocked` decision: how a hidden tile says it cannot be taken.
 */
function PoolTile({
  media,
  blocked,
}: {
  media: (typeof POOL)[number];
  blocked: BlockedShape;
}) {
  const position = IN_REEL.get(media.id);
  const inReel = position != null;
  const hidden = media.status === "hidden";
  const hint = !inReel && SUGGESTED.has(media.id);
  const says = hidden && blocked === "caption";
  return (
    <span
      data-rs-tile
      data-blocked={hidden ? "" : undefined}
      // The native tooltip IS today's answer, so the option that keeps it keeps
      // the real attribute: a mouse finds it here and a finger never will.
      title={
        hidden && blocked === "title"
          ? "Hidden moments can't be added. Show it first."
          : undefined
      }
      style={{ aspectRatio: UNIFORM_TILE_ASPECT }}
      className={cn(
        "relative block overflow-hidden rounded-[var(--radius-tile)] bg-white/5",
        inReel && "ring-2 ring-reel ring-inset",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a local fixture still */}
      <img
        src={media.previewUrl ?? media.url}
        alt=""
        className={cn(
          "size-full object-cover",
          hidden ? "opacity-30" : inReel ? "opacity-100" : "opacity-70",
        )}
      />
      {inReel ? (
        <>
          <span
            aria-hidden
            className="absolute top-1 left-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-reel px-1 text-[9px] font-semibold text-white tabular-nums"
          >
            {position}
          </span>
          <span
            aria-hidden
            className="absolute right-1 bottom-1 flex size-4 items-center justify-center rounded-full bg-reel text-white"
          >
            <Check className="size-2.5" />
          </span>
        </>
      ) : null}
      {hint ? (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1 pt-2 pb-0.5 text-[8px] font-medium tracking-wide text-white/85 uppercase"
        >
          Suggested
        </span>
      ) : null}
      {hidden ? (
        <span aria-hidden className="absolute top-1 right-1 text-warning">
          <EyeOff className="size-3" />
        </span>
      ) : null}
      {says ? (
        <span
          data-rs-said
          className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/70 px-1 py-0.5 text-[10px] leading-tight font-medium text-white/90"
        >
          Hidden
          <span className="flex items-center gap-0.5 text-white">
            <Eye className="size-2.5" aria-hidden />
            Show
          </span>
        </span>
      ) : null}
      {!inReel && (media.likeCount ?? 0) > 0 && !says ? (
        <span
          aria-hidden
          className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded-full bg-black/55 px-1 text-[9px] font-medium text-white tabular-nums"
        >
          <Heart className="size-2 fill-current" />
          {media.likeCount}
        </span>
      ) : null}
      {media.type === "video" ? (
        <span
          aria-hidden
          className="absolute top-1/2 left-1/2 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50"
        >
          <Play className="size-2.5 fill-white text-white" />
        </span>
      ) : null}
    </span>
  );
}

export function PoolHead({ count }: { count: number }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <p className="text-[11px] text-white/55 tabular-nums">
        {count === 1 ? "1 moment" : `${count} moments`}
      </p>
      <span className="flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-reel/50 px-2.5 text-[11px] font-medium text-[oklch(0.8_0.14_300)]">
        <Clapperboard className="size-3" aria-hidden />
        Add suggested (3)
      </span>
    </div>
  );
}

/**
 * The pool, in one of two grid rules: `today` is the shipped picker's
 * viewport-breakpoint grid, and `fluid` is the pool surface's own, which fills
 * whatever width it is given at a readable tile size.
 */
export function MomentGrid({
  grid,
  blocked,
  limit,
  min = 84,
}: {
  grid: "today" | "fluid";
  blocked: BlockedShape;
  limit?: number;
  /** The fluid grid's smallest tile. The album's own surface asks for bigger. */
  min?: number;
}) {
  const items = limit ? POOL.slice(0, limit) : POOL;
  return (
    <div
      data-rs-pool
      className={cn(
        "gap-[var(--gap-gallery)]",
        grid === "today" ? "grid grid-cols-4 sm:grid-cols-5" : "grid",
      )}
      style={
        grid === "fluid"
          ? { gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))` }
          : undefined
      }
    >
      {items.map((m) => (
        <PoolTile key={m.id} media={m} blocked={blocked} />
      ))}
    </div>
  );
}

/** The line that answers the tap on a blocked tile, when that is the answer. */
export function RoomToast({ children }: { children: ReactNode }) {
  return (
    <div
      data-rs-toast
      role="status"
      className="absolute inset-x-4 bottom-4 z-30 mx-auto flex max-w-sm items-center justify-between gap-2 rounded-lg bg-white/95 px-3 py-2 text-[12px] font-medium text-zinc-900 shadow-layer"
    >
      {children}
    </div>
  );
}

export const PICKER_NOTE =
  "New moments join the end. Drag the strip to reorder.";
