"use client";

import { type ReactNode } from "react";
import {
  Check,
  Clapperboard,
  GripVertical,
  Play,
  Share2,
  X,
} from "lucide-react";

import {
  formatReelDuration,
  formatReelMeta,
} from "@/components/reel/poster-card";
import { StudioPublishLight } from "@/components/reel/publish-light";
import { UNIFORM_TILE_ASPECT } from "@/lib/media/tile-aspect";
import { resolveStyleEntry } from "@/lib/reel/engine/style-registry";
import { cn } from "@/lib/utils";

import { EVENT, MEMBERSHIP, REEL, TIMELINE } from "./fixtures";
import { ReelStill } from "./stills";

/**
 * THE STUDIO, AS A LOCAL REPLICA, BECAUSE THE REAL ONE CANNOT BE MOUNTED.
 *
 * `ReelStudio` takes an event id and mounts `ReelProvider` and `useReelConfig`,
 * which fire `upsert_reel_config`, `add_to_reel` and `reorder_reel` against
 * whatever id they are handed, and its Download runs a real WebCodecs encode
 * and a real R2 PUT. A board may not do any of that, so the room is rebuilt
 * here out of the same tokens, the same chip language and the same geometry,
 * and the two things that are genuinely shipped components are imported rather
 * than re-typed:
 *
 *   `StudioPublishLight`  the lamp itself, mounted exactly as reel-studio.tsx
 *                         mounts it (a `relative isolate` wrapper, the lamp
 *                         first, the frame after it, nothing clipping). Its own
 *                         file says why: a specimen that re-types the recipe is
 *                         how a board ends up showing a light production never
 *                         had.
 *   `formatReelMeta`      the one formatter behind "0:30 · Cinematic · 7
 *                         moments", so the header's line is the shipped line.
 *
 * ★ THE ROOM'S THREE SHAPES. `capped` is today: stacked bands, the reel capped
 * at the player's own 360 px (`FRAME_CAP` in reel-studio.tsx), every sheet over
 * it. `float` gives the reel the whole room and floats the chrome over the
 * black it was already sitting on. `bench` splits a laptop in two, the reel on
 * the left and whatever is open in a column beside it, and is today's room in a
 * hand. What each one costs is MEASURED on the stage, never asserted here.
 */

export const SCREENS = {
  "1440": { w: 1440, h: 900, name: "a laptop" },
  "375": { w: 375, h: 812, name: "a phone" },
} as const;
export type ScreenId = keyof typeof SCREENS;

export const screenOf = (v: string | undefined): ScreenId =>
  v === "375" ? "375" : "1440";

/** The room's shape: the `room` decision's own option ids. */
export type RoomShape = "capped" | "float" | "bench";
export const roomOf = (v: string | undefined): RoomShape =>
  v === "float" || v === "bench" ? v : "capped";

/** Today's room, worn by every decision that is not staged behind `room`. */
export const TODAY_ROOM: RoomShape = "capped";

export const sharedOf = (v: string | undefined): boolean => v !== "draft";
export const lookOf = (v: string | undefined): string =>
  v === "mono" || v === "polaroid" ? v : "classic";

/** The header's one line, through the shipped formatter. */
export function roomMeta(styleId: string): string {
  return formatReelMeta({
    durationLabel: formatReelDuration(REEL.seconds),
    styleLabel: resolveStyleEntry(styleId).label,
    momentCount: TIMELINE.length,
  });
}

/* ── the dark room's own chip, quoted from reel-studio.tsx ───────────────── */

export function RoomChip({
  active,
  disabled,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      data-rs-chip
      className={cn(
        "flex h-8 shrink-0 items-center gap-1 rounded-[var(--radius-action-sm)] border px-3 text-[11px] font-medium",
        active
          ? "border-white bg-white text-zinc-900"
          : "border-white/20 text-white/80",
        disabled && "border-dashed opacity-50",
      )}
    >
      {children}
    </span>
  );
}

/* ── the head ────────────────────────────────────────────────────────────── */

/** The Share control in both of its states, quoted with its classes. */
export function ShareControl({ shared }: { shared: boolean }) {
  return shared ? (
    <span
      data-rs-share
      className="flex h-9 items-center gap-1 rounded-[var(--radius-action-sm)] border border-reel/50 px-3 text-xs font-medium text-[oklch(0.8_0.14_300)]"
    >
      <Check className="size-3.5" aria-hidden />
      Shared
    </span>
  ) : (
    <span
      data-rs-share
      className="flex h-9 items-center gap-1.5 rounded-[var(--radius-action-sm)] bg-reel px-3 text-xs font-medium text-white"
    >
      <Share2 className="size-3.5" aria-hidden />
      Share
    </span>
  );
}

function Head({
  meta,
  right,
  floating,
}: {
  meta: string;
  right: ReactNode;
  floating?: boolean;
}) {
  return (
    <div
      data-rs-head
      className={cn(
        "z-10 flex items-center justify-between gap-2 px-3 pt-3 pb-2",
        floating
          ? "absolute inset-x-0 top-0 bg-gradient-to-b from-[oklch(0.11_0_0)] via-[oklch(0.11_0_0)]/80 to-transparent pb-8"
          : "relative",
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-full border border-white/15 text-white/80">
        <X className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 text-center">
        <span className="block text-[9px] font-medium tracking-[0.24em] text-white/50 uppercase">
          The studio
        </span>
        <span className="block truncate text-[11px] text-white/40">{meta}</span>
        <span className="block truncate text-[10px] text-white/25">
          {EVENT.name}
        </span>
      </span>
      {right}
    </div>
  );
}

/* ── the dock ────────────────────────────────────────────────────────────── */

/** The filmstrip dock's tile width, quoted from studio-filmstrip.tsx. */
const TILE_W = "2.75rem";

export function Dock({
  coverFirst = true,
  note = "Hold a moment to reorder, the reel keeps playing",
}: {
  coverFirst?: boolean;
  note?: string | null;
}) {
  return (
    <div data-rs-dock>
      <div className="flex items-start gap-1.5">
        <div
          className="grid min-w-0 gap-1.5 overflow-x-auto pb-1"
          style={{
            gridTemplateColumns: `repeat(${MEMBERSHIP.length}, ${TILE_W})`,
          }}
        >
          {MEMBERSHIP.map((m, i) => (
            <div
              key={m.id}
              style={{ aspectRatio: UNIFORM_TILE_ASPECT, borderRadius: "4px" }}
              className="group relative w-full overflow-hidden bg-white/5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a local fixture still */}
              <img
                src={m.previewUrl ?? m.url}
                alt=""
                className={cn(
                  "size-full object-cover",
                  m.status === "hidden" && "opacity-30",
                )}
              />
              {m.type === "video" ? (
                <span
                  aria-hidden
                  className="absolute right-0.5 bottom-0.5 flex size-3 items-center justify-center rounded-full bg-black/55"
                >
                  <Play className="size-1.5 fill-white text-white" />
                </span>
              ) : null}
              {coverFirst && i === 0 ? (
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
            </div>
          ))}
        </div>
        <span
          aria-label="Choose moments"
          style={{ width: TILE_W, aspectRatio: UNIFORM_TILE_ASPECT }}
          className="flex shrink-0 items-center justify-center rounded-tile border border-dashed border-white/25 text-white/60"
        >
          <span className="text-base leading-none">+</span>
        </span>
      </div>
      {note ? (
        <p className="mt-1 text-center text-[10px] text-white/40">{note}</p>
      ) : null}
    </div>
  );
}

/* ── the control tray ────────────────────────────────────────────────────── */

export const TRAY = ["Moments", "Style", "Cover", "Length", "Layout"] as const;
export type TrayId = (typeof TRAY)[number];

export function Tray({ open }: { open?: TrayId | null }) {
  return (
    <div
      data-rs-tray
      className="mx-auto flex w-fit max-w-full items-center gap-1.5 overflow-x-auto"
    >
      {TRAY.map((label) => (
        <RoomChip key={label} active={label === open}>
          {label}
        </RoomChip>
      ))}
    </div>
  );
}

/* ── the sheet ───────────────────────────────────────────────────────────── */

/**
 * A sheet over the canvas, quoted from reel-studio.tsx: the near-black panel,
 * the top corners, the label row and the close. `tall` is the Moments sheet's
 * own 70dvh; everything else takes the Style sheet's 52 percent.
 */
export function Sheet({
  label,
  tall,
  children,
}: {
  label: string;
  tall?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      data-rs-sheet
      role="dialog"
      aria-label={label}
      className={cn(
        "absolute inset-x-0 bottom-0 z-10 overflow-y-auto rounded-t-xl border-t border-white/10 bg-[oklch(0.15_0_0)] p-3 pb-5",
        tall ? "max-h-[70%]" : "max-h-[52%]",
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-semibold tracking-[0.16em] text-white/45 uppercase">
          {label}
        </p>
        <span className="flex size-7 items-center justify-center rounded-full border border-white/15 text-white/70">
          <X className="size-3.5" aria-hidden />
        </span>
      </div>
      {children}
    </div>
  );
}

/** The bench's column: the same panel, standing beside the reel instead of over it. */
export function SidePanel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <aside
      data-rs-side
      aria-label={label}
      className="flex w-[360px] shrink-0 flex-col overflow-y-auto rounded-xl border border-white/10 bg-[oklch(0.15_0_0)] p-3"
    >
      <p className="mb-2 text-[10px] font-semibold tracking-[0.16em] text-white/45 uppercase">
        {label}
      </p>
      {children}
    </aside>
  );
}

/* ── the room ────────────────────────────────────────────────────────────── */

/**
 * ★ THE LIT FRAME IS THE SHIPPED CALL SITE, LINE FOR LINE. `relative isolate`,
 * the lamp FIRST and the reel after it and positioned, so the light stays
 * behind by DOM order with no z-index, and never `overflow-hidden`, which would
 * cut the falloff to a straight edge (glow-placement.test.ts).
 */
function LitReel({
  still,
  shared,
  cap,
  foot,
}: {
  still: string | null;
  shared: boolean;
  /** The frame's width cap in px, or null to let it take the room's height. */
  cap: number | null;
  foot?: ReactNode;
}) {
  return (
    <div
      data-rs-frame
      // ★ `isolate` IS A STACKING CONTEXT, so anything drawn ON the reel is
      // scoped inside it and the room's own z-10 chrome paints over it. A
      // progress bar at the reel's foot vanished under the floating dock that
      // way; the frame takes a z of its own when it is carrying one.
      className={cn("relative isolate mx-auto w-full", foot && "z-20")}
      style={cap ? { maxWidth: cap } : undefined}
    >
      <StudioPublishLight shared={shared} sharedHere={false} />
      <div className="relative">
        <ReelStill src={still} label="The reel, one frame" />
        {foot}
      </div>
    </div>
  );
}

export function Room({
  screen,
  shape,
  still,
  shared,
  meta,
  sheet,
  side,
  foot,
  dock = true,
  tray = null,
  frameFoot,
  overlay,
  underTray,
}: {
  screen: ScreenId;
  shape: RoomShape;
  still: string | null;
  shared: boolean;
  meta: string;
  /** A panel over the canvas (a sheet); ignored on the bench at a laptop. */
  sheet?: { label: string; tall?: boolean; body: ReactNode } | null;
  /** The bench's right column. */
  side?: { label: string; body: ReactNode } | null;
  /** A band UNDER the canvas, never over it: the pool, when it has no column. */
  foot?: ReactNode;
  dock?: boolean;
  tray?: TrayId | null;
  /** Anything drawn on the reel itself (a progress bar). */
  frameFoot?: ReactNode;
  /** Anything over the whole room (a modal, a toast). */
  overlay?: ReactNode;
  /** A line under the tray (the quiet export's notice). */
  underTray?: ReactNode;
}) {
  const phone = screen === "375";
  // A bench is a laptop shape; in a hand it is today's room, which is the
  // honest answer and the one the caption reports.
  const laid: RoomShape = shape === "bench" && phone ? "capped" : shape;
  const floating = laid === "float";
  const bench = laid === "bench";

  const canvas = (
    <div
      className={cn(
        "relative min-h-0 flex-1",
        floating ? "px-0" : "px-6",
        bench && "flex gap-4",
      )}
    >
      <div
        className={cn(
          "relative mx-auto flex h-full min-w-0 items-center justify-center",
          bench && "flex-1",
        )}
      >
        {/* ★ HEIGHT-BOUND, ALWAYS. The reel is 9:16 and every room is wider
            than it is tall, so the box takes the room's HEIGHT and derives its
            width. Letting it take the width instead drew a 1440 by 2560 px reel
            at the first capture, which the caption caught before anyone saw the
            board. `capped` then puts the player's own 360 px cap back on. */}
        <div className="flex aspect-[9/16] h-full max-w-full items-center">
          <LitReel
            still={still}
            shared={shared}
            cap={laid === "capped" ? 360 : null}
            foot={frameFoot}
          />
        </div>
      </div>
      {bench && side ? (
        <SidePanel label={side.label}>{side.body}</SidePanel>
      ) : null}
    </div>
  );

  return (
    <div
      data-rs-room
      className="relative flex h-dvh flex-col overflow-x-clip bg-[oklch(0.11_0_0)]"
    >
      <Head
        meta={meta}
        floating={floating}
        right={<ShareControl shared={shared} />}
      />

      {canvas}

      {/* The band under the canvas: it takes its height from the room rather
          than from the reel, so the reel gives way and nothing is covered. */}
      {foot ? (
        <div
          data-rs-foot
          className="relative z-10 min-h-0 shrink-0 grow-0 basis-[46%] overflow-y-auto px-3 pt-2"
        >
          {foot}
        </div>
      ) : null}

      {/* The dock and the tray: a band of their own, or floating over the
          black the reel is already standing on. */}
      <div
        className={cn(
          "z-10",
          floating
            ? "absolute inset-x-0 bottom-0 bg-gradient-to-t from-[oklch(0.11_0_0)] via-[oklch(0.11_0_0)]/85 to-transparent pt-8"
            : "relative",
        )}
      >
        {dock ? <div className="px-3 pt-2">{<Dock />}</div> : null}
        <div className="px-3 pt-2 pb-4">
          <Tray open={tray} />
          {underTray}
        </div>
      </div>

      {/* ★ THE SHEET IS THE ROOM'S, AND IT COMES LAST. reel-studio.tsx: "the
          sheet below shares the z-index and comes later, so it still covers
          both". Rendered inside the canvas it sat UNDER the dock and the tray,
          which cut a rail of fourteen looks in half at 375; the capture caught
          it, nobody's eye did. Its 52 percent is therefore 52 percent of the
          ROOM, exactly as it ships. */}
      {sheet && !(bench && side) ? (
        <Sheet label={sheet.label} tall={sheet.tall}>
          {sheet.body}
        </Sheet>
      ) : null}

      {overlay}
    </div>
  );
}

/** The violet clapperboard the room signs its work with. */
export function ReelMark({ className }: { className?: string }) {
  return (
    <Clapperboard className={cn("size-3.5 text-reel", className)} aria-hidden />
  );
}
