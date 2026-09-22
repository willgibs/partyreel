"use client";

import { type ReactNode } from "react";
import { Clapperboard, GripVertical, Play, X } from "lucide-react";

import {
  formatReelDuration,
  formatReelMeta,
} from "@/components/reel/poster-card";
import { UNIFORM_TILE_ASPECT } from "@/lib/media/tile-aspect";
import { resolveStyleEntry } from "@/lib/reel/engine/style-registry";
import { cn } from "@/lib/utils";

import { BY_ID, CUT, EVENT } from "./fixtures";
import type { AlbumItem } from "./fixtures";

/**
 * THE CREATOR, AS A LOCAL REPLICA, BECAUSE THE REAL ROOM CANNOT BE MOUNTED.
 *
 * `ReelStudio` takes an event id and mounts `ReelProvider` and `useReelConfig`,
 * which fire `upsert_reel_config`, `add_to_reel` and `reorder_reel` against
 * whatever id they are handed, and its export runs a real WebCodecs encode and
 * a real R2 PUT. A board may do none of that, so the room is rebuilt here from
 * the same tokens, the same chip language and the same geometry, and the one
 * genuinely shipped piece is imported rather than re-typed: `formatReelMeta`,
 * the formatter behind "0:30 · Cinematic · 8 moments", so the header's line is
 * the shipped line.
 *
 * ★ WHAT THE STUDIO HAD THAT THE CREATOR DOES NOT. The publish lamp
 * (`StudioPublishLight`) is deliberately absent: a cut is never shared from a
 * room, it is a file, and the lamp dies with the stored reel. So does Share as
 * the room's loud action. What is left is one act, "Make it", and everything
 * before it is picking.
 *
 * ★ THE ROOM'S THREE SHAPES, WHICH IS WHAT `room` ASKS. `capped` is the Studio
 * as it ships: stacked bands, the cut capped at the player's own 360 px, every
 * sheet over it. `float` gives the cut the whole room and floats the chrome on
 * the ruled glass it is already standing on. `bench` splits a laptop in two,
 * the cut on the left and whatever is open a column beside it, and is today's
 * room in a hand. What each costs is MEASURED on the stage, never asserted.
 */

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;
export type ScreenId = keyof typeof SCREENS;

export const screenOf = (v: string | undefined): ScreenId =>
  v === "1440" ? "1440" : "375";

/** The room's shape: the `room` decision's own option ids. */
export type RoomShape = "capped" | "float" | "bench";
export const roomOf = (v: string | undefined): RoomShape =>
  v === "float" || v === "bench" ? v : "capped";

/** Today's room, worn by every decision not staged behind `room`. */
export const TODAY_ROOM: RoomShape = "capped";

export const lookOf = (v: string | undefined): string =>
  v === "mono" || v === "polaroid" ? v : "classic";

/** The header's one line, through the shipped formatter. */
export function cutMeta(styleId: string, moments: number): string {
  return formatReelMeta({
    durationLabel: formatReelDuration(CUT.seconds),
    styleLabel: resolveStyleEntry(styleId).label,
    momentCount: moments,
  });
}

/* ── the dark room's own chip, quoted from reel-studio.tsx ───────────────── */

export function RoomChip({
  active,
  dashed,
  children,
}: {
  active?: boolean;
  dashed?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      data-rc-chip
      className={cn(
        "flex h-8 shrink-0 items-center gap-1 rounded-[var(--radius-action-sm)] border px-3 text-caption font-medium",
        active
          ? "border-white bg-white text-zinc-900"
          : "border-white/20 text-white/80",
        dashed && "border-dashed opacity-50",
      )}
    >
      {children}
    </span>
  );
}

/** The room's one loud action: the encode starts here and nothing else does. */
export function MakeControl({ label = "Make it" }: { label?: string }) {
  return (
    <span
      data-rc-make
      className="flex h-9 items-center gap-1.5 rounded-[var(--radius-action-sm)] bg-reel px-3.5 text-caption font-medium text-white"
    >
      <Clapperboard className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

/* ── the head ────────────────────────────────────────────────────────────── */

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
      data-rc-head
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
        <span className="block text-micro font-medium tracking-[0.24em] text-white/50 uppercase">
          Your cut
        </span>
        <span className="block truncate text-caption text-white/40">
          {meta}
        </span>
        <span className="block truncate text-micro text-white/25">
          {EVENT.name}
        </span>
      </span>
      {right}
    </div>
  );
}

/* ── the dock: the order, which is the one thing a timeline would have ───── */

/** The filmstrip dock's tile width, quoted from studio-filmstrip.tsx. */
const TILE_W = "2.75rem";

export function Dock({
  ids,
  coverFirst = true,
  note = "Hold a moment to reorder, the cut keeps playing",
}: {
  ids: readonly string[];
  coverFirst?: boolean;
  note?: string | null;
}) {
  const items = ids
    .map((id) => BY_ID.get(id))
    .filter((m): m is AlbumItem => Boolean(m));
  return (
    <div data-rc-dock>
      <div className="flex items-start gap-1.5">
        <div
          className="grid min-w-0 gap-1.5 overflow-x-auto pb-1"
          style={{
            gridTemplateColumns: `repeat(${items.length}, ${TILE_W})`,
          }}
        >
          {items.map((m, i) => (
            <div
              key={m.id}
              style={{ aspectRatio: UNIFORM_TILE_ASPECT, borderRadius: "4px" }}
              className="relative w-full overflow-hidden bg-white/5"
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
        <p className="mt-1 text-center text-micro text-white/40">{note}</p>
      ) : null}
    </div>
  );
}

/* ── the control tray ────────────────────────────────────────────────────── */

/**
 * The five controls, in the shipped tray's own order and words. A cut keeps
 * exactly these (style, cover, length, layout and the dock's order): "curated
 * randomness, never a timeline" is ruled, so nothing here edits a clip.
 */
export const TRAY = ["Moments", "Style", "Cover", "Length", "Layout"] as const;
export type TrayId = (typeof TRAY)[number];

export function Tray({ open }: { open?: TrayId | null }) {
  return (
    <div
      data-rc-tray
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

/* ── the sheet, and the bench's column ───────────────────────────────────── */

/**
 * ★ A FULL-WIDTH PANEL CAPS ITS CONTENT, and this was a capture's finding.
 * The shipped sheet only ever stood over a 360 px room, so nothing in it ever
 * had to survive a wider one. Given the whole of 1440 it drew a four column
 * wall of looks at 350 px a tile and three of the fourteen fitted the sheet,
 * which would have made `float` look worse than it is for a reason that has
 * nothing to do with the question. So a sheet and a foot band hold one column
 * of reading width whatever room they are in.
 */
function Contained({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[560px]">{children}</div>;
}

/**
 * A sheet over the canvas, quoted from reel-studio.tsx: the near-black panel,
 * the top corners, the label row and the close. `tall` is the Moments sheet's
 * own 70 percent; everything else takes the Style sheet's 52.
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
      data-rc-sheet
      role="dialog"
      aria-label={label}
      className={cn(
        "absolute inset-x-0 bottom-0 z-10 overflow-y-auto rounded-t-xl border-t border-white/10 bg-[oklch(0.15_0_0)] p-3 pb-5",
        tall ? "max-h-[70%]" : "max-h-[52%]",
      )}
    >
      <Contained>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-micro font-semibold tracking-[0.16em] text-white/45 uppercase">
            {label}
          </p>
          <span className="flex size-7 items-center justify-center rounded-full border border-white/15 text-white/70">
            <X className="size-3.5" aria-hidden />
          </span>
        </div>
        {children}
      </Contained>
    </div>
  );
}

/** The bench's column: the same panel, standing beside the cut rather than over it. */
export function SidePanel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <aside
      data-rc-side
      aria-label={label}
      className="flex w-[360px] shrink-0 flex-col overflow-y-auto rounded-xl border border-white/10 bg-[oklch(0.15_0_0)] p-3"
    >
      <p className="mb-2 text-micro font-semibold tracking-[0.16em] text-white/45 uppercase">
        {label}
      </p>
      {children}
    </aside>
  );
}

/* ── the room ────────────────────────────────────────────────────────────── */

/**
 * ★ THE CUT'S FRAME TAKES A STACKING CONTEXT OF ITS OWN when it is carrying
 * anything (a progress bar, the free mark's line), because the room's chrome
 * is z-10 and a bar at the foot vanished under the floating dock exactly that
 * way on the board this one reshapes.
 */
function CutFrame({
  cap,
  foot,
  children,
}: {
  /** The frame's width cap in px, or null to let it take the room's height. */
  cap: number | null;
  foot?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      data-rc-frame
      className={cn("relative isolate mx-auto w-full", foot && "z-20")}
      style={cap ? { maxWidth: cap } : undefined}
    >
      <div className="relative">
        {children}
        {foot}
      </div>
    </div>
  );
}

export function Room({
  screen,
  shape,
  cut,
  meta,
  sheet,
  side,
  foot,
  dock,
  tray = null,
  frameFoot,
  overlay,
  underTray,
  right,
}: {
  screen: ScreenId;
  shape: RoomShape;
  /** The cut's own frame: a still the engine drew, at whatever box it gets. */
  cut: ReactNode;
  meta: string;
  /** A panel over the canvas (a sheet); ignored on the bench at a laptop. */
  sheet?: { label: string; tall?: boolean; body: ReactNode } | null;
  /** The bench's right column. */
  side?: { label: string; body: ReactNode } | null;
  /** A band UNDER the canvas, never over it: the pool, when it has no column. */
  foot?: ReactNode;
  /** The filmstrip's ids, or null for a room that is not showing one. */
  dock?: readonly string[] | null;
  tray?: TrayId | null;
  /** Anything drawn on the cut itself (a progress bar, a mark's line). */
  frameFoot?: ReactNode;
  /** Anything over the whole room (a modal, a line). */
  overlay?: ReactNode;
  /** A line under the tray. */
  underTray?: ReactNode;
  /** The head's right slot; the loud action by default. */
  right?: ReactNode;
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
        {/* ★ HEIGHT-BOUND, ALWAYS. The cut is 9:16 and every room is wider
            than it is tall, so the box takes the room's HEIGHT and derives its
            width. Letting it take the width drew a 1440 by 2560 px cut at the
            first capture on the board this reshapes, and the caption caught it
            before anyone saw the board. `capped` then puts the player's own
            360 px cap back on. */}
        <div className="flex aspect-[9/16] h-full max-w-full items-center">
          <CutFrame cap={laid === "capped" ? 360 : null} foot={frameFoot}>
            {cut}
          </CutFrame>
        </div>
      </div>
      {bench && side ? (
        <SidePanel label={side.label}>{side.body}</SidePanel>
      ) : null}
    </div>
  );

  return (
    <div
      data-rc-room
      className="relative flex h-dvh flex-col overflow-x-clip bg-[oklch(0.11_0_0)]"
    >
      <Head meta={meta} floating={floating} right={right ?? <MakeControl />} />

      {canvas}

      {/* The band under the canvas: it takes its height from the room rather
          than from the cut, so the cut gives way and nothing is covered. */}
      {foot ? (
        <div
          data-rc-foot
          className="relative z-10 min-h-0 shrink-0 grow-0 basis-[46%] overflow-y-auto px-3 pt-2"
        >
          <Contained>{foot}</Contained>
        </div>
      ) : null}

      <div
        className={cn(
          "z-10",
          floating
            ? "absolute inset-x-0 bottom-0 bg-gradient-to-t from-[oklch(0.11_0_0)] via-[oklch(0.11_0_0)]/85 to-transparent pt-8"
            : "relative",
        )}
      >
        {dock ? (
          <div className="px-3 pt-2">
            <Dock ids={dock} />
          </div>
        ) : null}
        <div className="px-3 pt-2 pb-4">
          <Tray open={tray} />
          {underTray}
        </div>
      </div>

      {/* ★ THE SHEET IS THE ROOM'S, AND IT COMES LAST. Rendered inside the
          canvas it sits UNDER the dock and the tray, which cut a wall of
          fourteen looks in half at 375 on the board this reshapes. Its 52
          percent is therefore 52 percent of the ROOM, exactly as it ships. */}
      {sheet && !(bench && side) ? (
        <Sheet label={sheet.label} tall={sheet.tall}>
          {sheet.body}
        </Sheet>
      ) : null}

      {overlay}
    </div>
  );
}

/** The violet clapperboard the reel signs its work with. */
export function ReelMark({ className }: { className?: string }) {
  return (
    <Clapperboard className={cn("size-3.5 text-reel", className)} aria-hidden />
  );
}
