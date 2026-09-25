"use client";

import { type ReactNode } from "react";
import { ArrowLeft, Clapperboard } from "lucide-react";

import {
  formatReelDuration,
  formatReelMeta,
} from "@/components/reel/poster-card";
import { resolveStyleEntry } from "@/lib/reel/engine/style-registry";
import { cn } from "@/lib/utils";

import { CLIP, EVENT } from "./fixtures";
import type { Maker } from "./fixtures";
import { PANEL, ROOM } from "./parts";

/**
 * THE BENCH'S FRAME, WHICH IS GROUND: Will picked it in round one ("a
 * workbench, the sheet beside the cut") and this round never asks it again.
 * The clip at full height, a panel beside it, the filmstrip and the tray
 * below; in a hand the same parts stack. What each direction puts INSIDE the
 * frame is the whole question, so the frame is drawn once, here, and every
 * direction wears it unchanged.
 *
 * ★ ITS OWN ROOM, AS `entry=room` RULED: the reel hands off, the clip arrives
 * in its own frame, and the one control on the left goes Back to the reel.
 *
 * ★ HEIGHT-BOUND, ALWAYS. The clip is 9:16 and a laptop is wider than it is
 * tall, so the clip's box takes the room's HEIGHT and derives its width.
 * Letting it take the width drew a 1440 by 2560 px clip on the board this
 * reshapes, and the caption caught it.
 *
 * ★ THE ROOM PAINTS ITS OWN GROUND AND NOTHING ELSE, as the Studio does: its
 * near-black and its white type are literal, while a menu, a confirm or the
 * reel violet read the theme the frame inherits, exactly as they would over
 * the Studio in production.
 */

/** The header's line, through the shipped formatter: "0:30 · Cinematic · 8 moments". */
export function clipMeta(styleId: string, moments: number): string {
  return formatReelMeta({
    durationLabel: formatReelDuration(CLIP.seconds),
    styleLabel: resolveStyleEntry(styleId).label,
    momentCount: moments,
  });
}

/** The room's one loud action. The encode starts here and nothing else does. */
export function MakeButton({
  making,
  compact,
}: {
  making?: boolean;
  compact?: boolean;
}) {
  return (
    <span
      data-rc-make={making ? "making" : "ready"}
      aria-disabled={making || undefined}
      className={cn(
        "flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--radius-action-sm)] px-3.5 text-caption font-medium text-white",
        making ? "bg-reel/40 text-white/70" : "bg-reel",
        compact && "px-3",
      )}
    >
      <Clapperboard className="size-3.5" aria-hidden />
      {making ? "Making" : "Make it"}
    </span>
  );
}

/**
 * The head: Back to the reel, whose night it is and what the clip is, and the
 * one loud action. The event's name leads (a guest surface belongs to the
 * host's event), then the object, then the shipped meta line.
 */
export function Head({
  meta,
  right,
  back = "Back to the reel",
}: {
  meta: string;
  right: ReactNode;
  back?: string;
}) {
  return (
    <header
      data-rc-head
      className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-4 pt-3 pb-2"
    >
      <span
        aria-label={back}
        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/80"
      >
        <ArrowLeft className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 text-center">
        <span className="block truncate text-label font-medium text-white/45 uppercase">
          {EVENT.name}
        </span>
        <span className="block truncate text-working font-medium text-white/90">
          Your clip
        </span>
        <span className="block truncate text-micro text-white/40">{meta}</span>
      </span>
      {right}
    </header>
  );
}

/**
 * THE FREE MARK'S LINE, QUIETER AND STILL FINDABLE (`mark=line` as he amended
 * it). The engine already draws the mark in the clip's corner exactly where
 * the file carries it; this one line sits right under that corner, at the
 * room's quietest step, and says the two things his note asks for: it is the
 * free event's mark, not every clip's, and there is a clear way past it. A
 * guest cannot upgrade someone else's event, so hers names Pro events; the
 * host's offers the upgrade itself.
 */
export function MarkLine({
  maker,
  align = "end",
}: {
  maker: Maker;
  align?: "end" | "center";
}) {
  return (
    <p
      data-rc-mark="line"
      className={cn(
        "mt-1.5 w-full text-micro text-white/35",
        align === "end" ? "text-right" : "text-center",
      )}
    >
      {maker === "host"
        ? "Your free event marks its clips. "
        : "Free events mark their clips. "}
      <span className="text-white/60 underline decoration-white/30 underline-offset-2">
        {maker === "host" ? "Remove it with Pro" : "Pro events don't"}
      </span>
    </p>
  );
}

/**
 * THE LAPTOP: the clip at full height on the left of a centred pair, the
 * panel beside it, the filmstrip and the tray under both. `inert` dims and
 * disables everything but the clip (the export's minute).
 */
export function LaptopBench({
  head,
  clip,
  underClip,
  column,
  foot,
  overlay,
  inert,
}: {
  head: ReactNode;
  clip: ReactNode;
  /** Under the clip, inside its column: the dial, the mark's line. */
  underClip?: ReactNode;
  column: ReactNode;
  foot?: ReactNode;
  overlay?: ReactNode;
  inert?: boolean;
}) {
  return (
    <div
      data-rc-bench="laptop"
      className={cn(
        "relative flex h-dvh flex-col overflow-hidden text-white",
        ROOM,
      )}
    >
      {head}
      <div className="mx-auto flex min-h-0 w-full max-w-[1160px] flex-1 gap-10 px-6 pt-1">
        <div className="flex min-h-0 w-[400px] shrink-0 flex-col items-center">
          <div className="flex min-h-0 w-full flex-1 items-center justify-center">
            {/* Capped at the column's width in height terms (400 px wide is
                711 tall), so a state with no foot (the finish) keeps the
                same clip rather than one that spills past its column. */}
            <div
              data-rc-frame
              className="relative aspect-[9/16] h-full max-h-[711px]"
            >
              {clip}
            </div>
          </div>
          {underClip}
        </div>
        <aside
          data-rc-column
          data-rc-scroll
          data-rc-inert={inert ? "" : undefined}
          aria-label="The bench"
          className={cn(
            "min-h-0 min-w-0 flex-1 overflow-y-auto rounded-2xl p-4",
            PANEL,
            inert && "opacity-35",
          )}
        >
          {column}
        </aside>
      </div>
      {foot ? (
        <div
          data-rc-foot
          data-rc-inert={inert ? "" : undefined}
          className={cn(
            "mx-auto w-full max-w-[1160px] shrink-0 px-6 pt-3 pb-4",
            inert && "opacity-35",
          )}
        >
          {foot}
        </div>
      ) : (
        <div className="h-6 shrink-0" />
      )}
      {overlay}
    </div>
  );
}

/**
 * THE HAND: the head, then whatever the direction stacks, in one 375 column.
 * The stacking IS the direction in a hand, so this is only the room.
 */
export function HandRoom({
  head,
  children,
  overlay,
}: {
  head: ReactNode;
  children: ReactNode;
  overlay?: ReactNode;
}) {
  return (
    <div
      data-rc-bench="hand"
      className={cn(
        "relative flex h-dvh flex-col overflow-hidden text-white",
        ROOM,
      )}
    >
      {head}
      {children}
      {overlay}
    </div>
  );
}
