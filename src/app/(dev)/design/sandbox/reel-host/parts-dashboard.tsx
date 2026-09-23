"use client";

import { useEffect, useState } from "react";
import { Clapperboard } from "lucide-react";

import { EventCard } from "@/components/app/event-card";
import { GLASS_MARK } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { GALLERY_ITEMS, LIVE_ALBUM_COUNT, SMALL_ALBUM_COUNT } from "./fixtures";

/**
 * THE DASHBOARD'S EVENT CARD, FOR THE `pulse` ASK. `EventCard` is the real,
 * pure, presentational component (`@/components/app/event-card`, no session
 * on mount) reused whole for the `live` and `threshold` options, because a
 * quoted copy of its overlay would drift from the shipped one the moment
 * either changes. `cover` cannot reuse it unmodified (a single static
 * `coverUrl` prop has no seam for a crossfade), so that option alone quotes
 * the overlay it cannot flex to show.
 */

const COVER = GALLERY_ITEMS[2]?.url;

/** `pulse=live` / `pulse=threshold`: the shipped card, plus one line under it
 *  naming the fact this ask is actually about. Never inside the card's own
 *  overlay, which has no free corner left (QR top-left, the pending chip
 *  top-right, the gradient's name-and-pills band already full). */
export function EventCardWithLine({
  items,
  showLine,
}: {
  items: number;
  showLine: boolean;
}) {
  return (
    <div className="w-64 space-y-1.5" data-rh-relevant>
      <EventCard
        href="#"
        name="Mia & Theo's Wedding"
        coverUrl={COVER}
        dateLabel="15 Aug"
        itemsLabel={`${items} items`}
        statusLabel="Open"
      />
      {showLine ? (
        <p
          data-rh-reel-line
          className="flex items-center gap-1.5 text-xs font-medium text-reel"
        >
          <Clapperboard className="size-3.5" aria-hidden />
          Reel live &middot; {items} clips
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {items} item{items === 1 ? "" : "s"} so far
        </p>
      )}
    </div>
  );
}

export function ThresholdPair() {
  return (
    <div className="flex flex-wrap gap-6 p-2">
      <EventCardWithLine items={SMALL_ALBUM_COUNT} showLine={false} />
      <EventCardWithLine items={LIVE_ALBUM_COUNT} showLine />
    </div>
  );
}

/**
 * `pulse=cover`: the card's own cover crossfades through the album instead
 * of holding one still, which IS the reel being live (no pill, no words).
 * `prefers-reduced-motion` freezes it on the first frame, exactly how the
 * live reel itself starts paused under reduced motion.
 */
export function PlayingEventCard() {
  const stills = [GALLERY_ITEMS[2], GALLERY_ITEMS[6], GALLERY_ITEMS[10]]
    .filter(Boolean)
    .map((m) => m.url);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % stills.length),
      2200,
    );
    return () => window.clearInterval(id);
  }, [stills.length]);

  const PILL = cn(
    "flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-medium text-white",
    GLASS_MARK,
  );

  return (
    <div className="w-64" data-rh-relevant>
      <div
        data-rh-playing-cover
        className="relative aspect-[16/10] overflow-hidden rounded-xl"
      >
        {stills.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- a lab still, never a real presign
          <img
            key={src}
            src={src}
            alt=""
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-700",
              i === active ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 space-y-1.5 p-3 text-white">
          <h3 className="truncate font-heading text-subsection">
            Mia &amp; Theo&apos;s Wedding
          </h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={PILL}>15 Aug</span>
            <span className={PILL}>{LIVE_ALBUM_COUNT} items</span>
            <span className={PILL}>Open</span>
          </div>
        </div>
      </div>
    </div>
  );
}
