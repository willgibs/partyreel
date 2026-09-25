import { Play } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * THE REEL'S FACE: the live Highlight reel tile above the album (`guest/reel/live-reel.tsx`), and
 * the lab boards that draw it (`guest-capture`, `voice-guest`, `reel-cut`, `reel-front`).
 *
 * One frame, gradient, name treatment and violet line wherever the reel shows its face; only the
 * `media` slot differs (the tile's crossfade of the reel's own stills, a board's fixture frame).
 * The formatters beside it state a clip's three facts the one way ("0:30 · Cinematic · 8
 * moments"), which the clip creator's head reads.
 *
 * Presentational + deliberately NOT a client component: no state, no effects, no hooks, so a
 * server component or a lab board can render it as readily as a client island. Interactivity is
 * the CALLER's job: the tile lays its own watch layer across the card and hands `meta` a control
 * of its own.
 */

/** `0:30` from a second count (mm:ss, minutes uncapped). */
export function formatReelDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

/**
 * A clip's line: `0:30 · Cinematic · 8 moments`. One formatter, so the clip creator's head and the
 * lab boards that draw it keep the separator, the pluralization and the ORDER identical. Any part
 * may be absent (an unknown style, a clip with no moments yet); absent parts drop out rather than
 * rendering an empty segment.
 */
export function formatReelMeta(parts: {
  durationLabel?: string | null;
  styleLabel?: string | null;
  momentCount?: number | null;
}): string {
  const { durationLabel, styleLabel, momentCount } = parts;
  const segments = [
    durationLabel || null,
    styleLabel || null,
    momentCount != null && momentCount > 0
      ? `${momentCount} ${momentCount === 1 ? "moment" : "moments"}`
      : null,
  ].filter((s): s is string => s !== null);
  return segments.join(" · ");
}

export function PosterCard({
  eventName,
  meta,
  media,
  chip,
  playBadge = false,
  className,
  nameClassName,
}: {
  /** The event's name, in the display face over the gradient. */
  eventName: string;
  /**
   * The violet meta line (build it with formatReelMeta), or a control of the caller's own in the
   * line's place (the live tile's "Make your own clip to share", which lifts itself above the
   * tile's watch layer and takes its own pointer events, since this block takes none). Omitted, no
   * line.
   */
  meta?: React.ReactNode;
  /** The face: a live player (host) or a cover still (guest). */
  media: React.ReactNode;
  /** Optional top-left eyebrow chip (the guest card's "The reel" marker). */
  chip?: React.ReactNode;
  /** Centered play affordance — for a STILL cover only (never over a live player). */
  playBadge?: boolean;
  className?: string;
  /**
   * Size the event name per surface (inline card vs the post-event hero). A
   * ladder STEP, never a stock size: the card's own is a tile title
   * (`subsection`), and the guest's post-event hero names the event the way
   * every event title does (`text-page`).
   */
  nameClassName?: string;
}) {
  return (
    <div
      // The bright edge (globals.css, [data-lit]) on the STILL cover only. A
      // cover still is a photograph and this box owns its corner; a live
      // player (the host's Marquee) carries the edge on its own bordered
      // screen, flush with this one, so lighting both would draw it twice on
      // the same pixels. `playBadge` is already the "this is a still" signal.
      data-lit={playBadge ? "" : undefined}
      className={cn("relative overflow-hidden rounded-lg", className)}
    >
      {media}

      {/* The bottom gradient: legibility for the name/meta over ANY media, from
          a bright daylight photo to a dark dance floor. Sized to the text block,
          not the card, so the media stays the hero. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 rounded-b-lg bg-gradient-to-t from-black/65 to-transparent"
      />

      {chip ? (
        <div className="pointer-events-none absolute top-2.5 left-2.5">
          {chip}
        </div>
      ) : null}

      {playBadge ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-white/90 shadow-lift">
            <Play className="ml-0.5 size-5 fill-zinc-900 text-zinc-900" />
          </span>
        </span>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
        <p
          className={cn(
            "font-heading text-subsection text-white",
            nameClassName,
          )}
        >
          {eventName}
        </p>
        {typeof meta === "string" && meta ? (
          // The reel's identity hue (violet, ratified), lightened for contrast
          // against the gradient — --reel itself is tuned for ICONS on the app
          // background, not for small text on a photo.
          <p className="mt-0.5 text-micro font-medium text-[oklch(0.8_0.14_300)]">
            {meta}
          </p>
        ) : meta ? (
          <div className="mt-0.5">{meta}</div>
        ) : null}
      </div>
    </div>
  );
}
