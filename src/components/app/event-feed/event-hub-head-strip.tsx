"use client";

import "./event-hub-head-strip.css";

import {
  type CSSProperties,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";

import { formatCount, formatMediaCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import {
  arrivalsOf,
  flatMarks,
  isLandingNow,
  landedWith,
  msUntilQuiet,
  newestOf,
  slotsFor,
  STRIP_TIERS,
  stripMarks,
  type StripMark,
  type StripTier,
} from "./event-hub-head-strip-marks";
import { useHostAlbum, useHubCounts, useHubEntries } from "./host-album";

/**
 * THE FACTS STRIP, ALONG THE FOOT OF THE HUB'S COVER (`event-header` r3, Will's `facts=strip`; the maths and the reading
 * of it are `event-hub-head-strip-marks.ts`'s). One white mark a photograph, the newest end lit while photographs are landing,
 * ending in a dot and the album's number. It reads the page's album store (`useHubEntries`), so a photograph that lands
 * while she looks is a new mark at the newest end with nothing refreshed, and the line's number is the head's count, the
 * one the hub counts (`HostAlbumCounts`, never a list's length).
 *
 * ★ THE WIDTH IS THE STRIP'S OWN, DECIDED IN CSS. Each tier of marks (`STRIP_TIERS`: a hand, a tablet, a desk) is in the
 * DOM and shown by a container query on the strip's own box, so the server's paint is right at every width from the first
 * byte (a count picked by a measured width would paint the desk's 160 marks into a phone and correct itself after
 * hydration). The marks are decoration (`aria-hidden`); the strip's words are the sentence under them, read once.
 *
 * ★ LIT IS A QUARTER-HOUR ON THE READER'S CLOCK, TURNED AT ITS END (`useLandingNow`): one timer, set for the moment the
 * newest photograph stops being "now", and none while the album is quiet. The server and the hydrating render say not
 * lit (they have no clock of hers), and it lights once she has one. It holds its light and never pulses, since the hub
 * stays open all night: what moves is the album itself.
 *
 * ★ WITH NO ARRIVALS TO READ (a head with a count and no album store, the Library's specimen, unless it hands them in) it
 * draws a flat quiet line rather than a shape it does not know; the hub always has its manifest.
 */
export function HubFactsStrip({
  served,
  arrivals,
}: {
  /** The page's album count, the number drawn until the store has its own. */
  served: number;
  /** The album's arrivals for a head outside the hub's store (`arrivalsOf`'s shape: minutes, oldest first). */
  arrivals?: readonly number[];
}) {
  const album = useHostAlbum();
  const entries = useHubEntries(album);
  const photos = useHubCounts(album)?.album ?? served;
  const times = useMemo(
    () => (entries ? arrivalsOf(entries) : (arrivals ?? null)),
    [entries, arrivals],
  );
  const newest = times ? newestOf(times) : null;
  const lit = useLandingNow(newest);
  const tiers = useMemo(() => {
    const heights = times ? landedWith(times) : null;
    return STRIP_TIERS.map((tier) => {
      const known = times ? times.length : photos;
      const slots = slotsFor(known, tier);
      const marks: StripMark[] = times
        ? stripMarks(times, slots, heights ?? undefined)
        : photos === 0
          ? stripMarks([], slots)
          : flatMarks(slots);
      return { tier, marks };
    });
  }, [times, photos]);
  const words =
    photos === 0
      ? "No photos yet"
      : `${formatMediaCount(photos)}${lit ? ", landing now" : ""}`;

  return (
    <div
      data-hub-strip=""
      data-photos={photos}
      data-landing={lit ? "" : undefined}
      className="@container flex min-w-0 items-end gap-3 text-white"
    >
      {tiers.map(({ tier, marks }) => (
        <span
          key={tier.id}
          aria-hidden
          data-hub-strip-tier={tier.id}
          className={cn(
            "relative min-w-0 flex-1 items-end justify-between",
            TIER_SHOWN[tier.id],
          )}
          style={{ height: tier.height }}
        >
          {marks.map((m, i) => (
            <span
              key={i}
              className="hub-strip-mark"
              data-waiting={m.waiting ? "" : undefined}
              data-new={lit && m.fresh ? "" : undefined}
              style={m.waiting ? undefined : markStyle(tier, m)}
            />
          ))}
        </span>
      ))}
      <EndCount photos={photos} lit={lit} words={words} />
      <span className="sr-only">{words}</span>
    </div>
  );
}

/** Which tier shows at which width of the strip's own box (Tailwind's container sizes: 36rem and 56rem). */
const TIER_SHOWN: Record<StripTier["id"], string> = {
  hand: "flex @xl:hidden",
  mid: "hidden @xl:flex @4xl:hidden",
  desk: "hidden @4xl:flex",
};

/**
 * A filled mark stands from 3px (a point) up to the line's height, the taller the brighter. Rounded to a tenth of a
 * pixel and a hundredth of an opacity: a hundred and sixty marks times three widths of full-precision floats is HTML a
 * browser reads no difference in.
 */
function markStyle(tier: StripTier, m: StripMark): CSSProperties {
  return {
    height: `${Math.round((3 + (tier.height - 3) * m.h) * 10) / 10}px`,
    opacity: Math.round((0.55 + 0.45 * m.h) * 100) / 100,
  };
}

/** The line's end: the album's number behind a dot that is lit while photographs land, a quiet ring once they stop. */
function EndCount({
  photos,
  lit,
  words,
}: {
  photos: number;
  lit: boolean;
  words: string;
}) {
  // Said once to a reader, by the sentence beside the line (`sr-only`), so what is drawn here is hidden from them.
  if (photos === 0) {
    return (
      <span aria-hidden className="shrink-0 pb-px text-xs text-white/70">
        No photos yet
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center gap-1.5 pb-px"
      title={words}
    >
      <span
        className="hub-strip-end"
        data-landing={lit ? "" : undefined}
        aria-hidden
      />
      <span
        data-hub-strip-count=""
        className="font-heading text-base leading-none tabular-nums"
      >
        {formatCount(photos)}
      </span>
    </span>
  );
}

/** setTimeout holds a delay of 2^31 - 1 ms at most. */
const MAX_TIMER_MS = 2 ** 31 - 1;

/**
 * WHETHER THE NEWEST PHOTOGRAPH IS LANDING NOW, on this device's clock (`event-hub-head-strip-marks.ts`'s quarter hour).
 *
 * ★ ONE TIMER FOR THE MOMENT IT TURNS, NEVER A POLL. The subscription sets a single timeout for the instant the newest
 * photograph stops being "now" (and none for an album that is already quiet), so a hub left open all night runs no clock
 * between arrivals, and a new arrival (a new `newest`) re-arms it. The server's snapshot is false: the hydrating render
 * matches the HTML, and a hub with a fresh photograph lights a beat after it mounts.
 */
function useLandingNow(newest: number | null): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (newest === null) return () => {};
      const left = msUntilQuiet(newest, Date.now());
      if (left <= 0) return () => {};
      // A hair past the moment, so the snapshot read when it fires is already quiet. A browser holds a delay of 2^31 - 1 ms at
      // most (a clock set far behind the album's would ask for more, and fire at once).
      const timer = window.setTimeout(
        onChange,
        Math.min(left + 50, MAX_TIMER_MS),
      );
      return () => window.clearTimeout(timer);
    },
    [newest],
  );
  return useSyncExternalStore(
    subscribe,
    () => isLandingNow(newest, Date.now()),
    () => false,
  );
}
