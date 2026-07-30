import { Clapperboard, Play } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * THE reel poster card: the reel's face, host side and guest side.
 *
 * ONE component on purpose (R3). The host's Marquee card and the guest's /e/
 * card are the SAME frame, gradient, name treatment and violet meta line — that
 * continuity is the point ("what the host made is what the guest meets"), and a
 * second implementation is how the two drift. Only the `media` slot differs:
 *
 *   host  → a live `CanvasReelPlayer showControls={false}` (the poster PLAYS)
 *   guest → the presigned cover still + `playBadge` (no engine on first paint)
 *
 * Presentational + deliberately NOT a client component: no state, no effects, no
 * hooks. It renders inside client islands (the Marquee) AND straight from a
 * server component (the guest card's shell), so it must stay usable from both.
 * Interactivity is the CALLER's job — wrap it in a button, or pass `media` a
 * player. That is also why there is no `onClick`: a whole-card button around a
 * live canvas is the caller's decision, not this component's.
 */

/** `0:30` from a second count (mm:ss, minutes uncapped). */
export function formatReelDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

/**
 * The violet meta line: `0:30 · Cinematic · 8 moments`. Exported (not inlined)
 * because the host card, the guest card and the Studio header all state the same
 * three facts, and Track C builds its half from a server payload — one formatter
 * keeps the separator, the pluralization and the ORDER identical everywhere.
 * Any part may be absent (an unknown style, a card with no count); absent parts
 * drop out rather than rendering an empty segment.
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
  /** The violet meta line (build it with formatReelMeta). Omitted → no line. */
  meta?: string;
  /** The face: a live player (host) or a cover still (guest). */
  media: React.ReactNode;
  /** Optional top-left eyebrow chip (the guest card's "The reel" marker). */
  chip?: React.ReactNode;
  /** Centered play affordance — for a STILL cover only (never over a live player). */
  playBadge?: boolean;
  className?: string;
  /** Size the event name per surface (inline card vs the post-event hero). */
  nameClassName?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
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
          <span className="flex size-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <Play className="ml-0.5 size-5 fill-zinc-900 text-zinc-900" />
          </span>
        </span>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
        <p
          className={cn(
            "font-heading text-lg leading-tight text-white",
            nameClassName,
          )}
        >
          {eventName}
        </p>
        {meta ? (
          // The reel's identity hue (violet, ratified), lightened for contrast
          // against the gradient — --reel itself is tuned for ICONS on the app
          // background, not for small text on a photo.
          <p className="mt-0.5 text-[11px] font-medium text-[oklch(0.8_0.14_300)]">
            {meta}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** The eyebrow chip the guest card wears (violet mark + "The reel"), so both
 *  sides name the thing the same way. */
export function PosterCardChip({ label = "The reel" }: { label?: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-black/45 px-2 py-0.5 text-[9px] font-semibold tracking-[0.14em] text-white uppercase backdrop-blur-sm">
      <Clapperboard className="size-2.5 text-[oklch(0.8_0.14_300)]" />
      {label}
    </span>
  );
}
