"use client";

import { Images } from "lucide-react";

import { cn } from "@/lib/utils";

import { FlightTile } from "./page-parts";
import type { Picked } from "./fixtures";

/**
 * THE FILE IN THE AIR, AND THE DOZEN BEHIND IT.
 *
 * What ships today: the file lands in the album as a tile at the head of the
 * masonry the instant it is picked, and a thin white bar in a black scrim at
 * the tile's foot fills as the bytes go. There are no words anywhere. The queue
 * runs ONE FILE AT A TIME (`use-upload-queue.ts`, deliberate: it is robust on
 * venue Wi-Fi), so on a batch of twelve, eleven of those bars sit at zero while
 * the first one fills.
 *
 * ★ THE BANKED SHIMMER IS THE PRECEDENT THIS BOARD ANSWERS TO. Will, 2026-09-17:
 * "for new photos to populate the gallery, I think it would become too visually
 * overwhelming versus more subtle motion animations that add them in... A couple
 * dozen photos being uploaded in a single batch would cover the top of a gallery
 * in shimmer." Nothing replaced it for the guest's OWN tiles, so what covers the
 * top of the gallery today is twelve progress bars instead.
 */

/* ── one file ────────────────────────────────────────────────────────────── */

export type SendingShape = "strip" | "word" | "late";

export const sendingOf = (v: string | undefined): SendingShape =>
  v === "word" ? "word" : v === "late" ? "late" : "strip";

/**
 * The shipped progress strip, quoted from `guest-masonry.tsx`: a thin white bar
 * in a soft black scrim across the tile's bottom edge.
 */
export function ProgressStrip({
  progress,
  word,
}: {
  progress: number;
  /** One word beside the bar, which the shipped strip does not carry. */
  word?: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-black/35 p-1.5">
      {word && (
        <span className="pl-0.5 text-[11px] font-medium text-white/90">
          {word}
        </span>
      )}
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
        <div
          data-pending-progress
          className="h-full rounded-full bg-white transition-[width] duration-200 ease-emphasis"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

/**
 * ONE FILE, MID-FLIGHT, UNDER EACH ANSWER.
 *
 * `slow` is the file that has been in the air long enough to be worth saying
 * something about: the 212 MB clip of the first dance on venue Wi-Fi, which is
 * the only case `late` ever draws chrome for.
 */
export function OneInFlight({
  file,
  shape,
  progress,
  slow,
}: {
  file: Picked;
  shape: SendingShape;
  progress: number;
  slow: boolean;
}) {
  const silent = shape === "late" && !slow;
  return (
    <FlightTile
      file={file}
      foot={
        silent ? undefined : (
          <ProgressStrip
            progress={progress}
            word={
              shape === "word"
                ? "Sending"
                : shape === "late"
                  ? "Still sending"
                  : undefined
            }
          />
        )
      }
    />
  );
}

/* ── a dozen ─────────────────────────────────────────────────────────────── */

export type BatchShape = "each" | "one" | "line";

export const batchOf = (v: string | undefined): BatchShape =>
  v === "one" ? "one" : v === "line" ? "line" : "each";

/**
 * THE STACK: one tile for one act. The first photograph of the batch carries
 * the whole pick, the stack's own edge shows there are more behind it, and each
 * file leaves the stack for the album as it lands, so the count falls to zero
 * and the tile goes with it.
 *
 * The edge is two offset boxes behind the tile rather than a shadow: bible 10
 * gives the lift to one object really sitting on another, and this IS eleven
 * photographs sitting under one.
 */
export function StackTile({
  files,
  done,
  sending,
}: {
  files: Picked[];
  done: number;
  /** How the one file actually in the air reads, so the stack wears the answer. */
  sending: SendingShape;
}) {
  const [top] = files;
  const left = files.length - done;
  return (
    <div className="relative mb-[var(--gap-gallery)] w-full pt-1.5 pr-1.5">
      <div
        aria-hidden
        className="absolute top-0 right-0 h-full w-[calc(100%-6px)] bg-muted-foreground/25"
        style={{ borderRadius: "var(--radius-tile)" }}
      />
      <div
        aria-hidden
        className="absolute top-[3px] right-[3px] h-full w-[calc(100%-6px)] bg-muted-foreground/40"
        style={{ borderRadius: "var(--radius-tile)" }}
      />
      <FlightTile
        file={top}
        over={
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/45 text-white">
            <Images className="size-5" aria-hidden />
            <span className="text-[15px] font-medium">{left} sending</span>
            <span className="text-[13px] text-white/75">
              {done} added so far
            </span>
          </div>
        }
        foot={
          sending === "late" ? undefined : (
            <ProgressStrip progress={Math.round((done / files.length) * 100)} />
          )
        }
      />
    </div>
  );
}

/**
 * THE COUNT LINE: the photographs land at rest, as ordinary tiles, and one line
 * above the album carries the state until it is over.
 *
 * ★ ITS COST IS THAT IT IS NOT TRUE YET. Every one of those tiles is in the
 * album before its bytes are, so a file that is later refused has to be taken
 * BACK out of a place the guest already saw it. Today only an approved
 * completion prepends an optimistic tile (`live-gallery.tsx`), and this option
 * moves that line earlier.
 */
export function CountLine({
  total,
  done,
  size,
}: {
  total: number;
  done: number;
  /** 12px as today's upload sentences are, or the guest's reading size. */
  size: "xs" | "read";
}) {
  return (
    <div
      data-gu-countline
      className="mb-3 flex items-center gap-2.5 rounded-md bg-muted px-3 py-2"
    >
      <span
        data-gu-said
        className={cn(
          "text-muted-foreground",
          size === "xs" ? "text-xs" : "text-[15px]",
        )}
      >
        Sending {total} photos, {done} in the album
      </span>
      <span className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/15">
        <span
          className="block h-full rounded-full bg-foreground/60"
          style={{ width: `${Math.round((done / total) * 100)}%` }}
        />
      </span>
    </div>
  );
}

/* ── the moment it lands ─────────────────────────────────────────────────── */

export type LandingShape = "check" | "sweep" | "none";

export const landingOf = (v: string | undefined): LandingShape =>
  v === "sweep" ? "sweep" : v === "none" ? "none" : "check";
