"use client";

import { Calendar, Clapperboard, Images } from "lucide-react";

import { EventCard } from "@/components/app/event-card";
import { GLASS_MARK } from "@/lib/glass";
import { cn } from "@/lib/utils";

import {
  EVENT,
  GALLERY_ITEMS,
  LIVE_ALBUM_COUNT,
  LIVING_STILLS,
  MINIMUM,
  stillOf,
} from "./fixtures";
import { Living, Pips } from "./parts-living";
import type { Device } from "./parts-view";

/**
 * THE DASHBOARD'S EVENT CARDS, FOR THE `pulse` ASK, drawn as a PAIR every time:
 * the wedding with its reel live, and a second event one photograph short of
 * the minimum, so each option shows its rule on both sides of the line rather
 * than asserting it on one.
 *
 * `EventCard` is the real, pure component (no session on mount), reused whole
 * wherever the card itself does not move, because a quoted copy of its overlay
 * would drift from the shipped one the moment either changes. `cover` cannot
 * reuse it (a single `coverUrl` has no seam for a crossfade), so that option
 * alone quotes the overlay it cannot flex to show.
 */

export type PulseOption = "counts" | "threshold" | "cover";

const SHORT = {
  name: "Ruby's 30th",
  cover: stillOf(GALLERY_ITEMS[9]),
  date: "2 Oct",
  items: 1,
};

/**
 * ★ A STILL CARD WEARS THE EVENT'S COVER; A LIVING ONE WEARS THE REEL. The
 * dashboard's static cover is the album's own photograph, and `cover` swaps it
 * for the reel's take dissolving through its stills, so even a held frame of
 * that option shows a different picture from the two that only add a line:
 * the swap IS the option.
 */
const EVENT_COVER = stillOf(GALLERY_ITEMS[0]);

const PILL = cn(
  "flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-medium text-white",
  GLASS_MARK,
);

/** `pulse=cover`: the card's own cover, crossfading at his tile's calm pace. */
function CrossfadeCard({ name, date, items }: { name: string; date: string; items: number }) {
  return (
    <div data-rh-playing-cover="" className="relative aspect-[16/10] overflow-hidden rounded-xl">
      <Living stills={LIVING_STILLS} />
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 space-y-1.5 p-3 text-white">
        <h3 className="truncate font-heading text-subsection">{name}</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={PILL}>
            <Calendar className="size-2.5" aria-hidden />
            {date}
          </span>
          <span className={PILL}>
            <Images className="size-2.5" aria-hidden />
            {items} items
          </span>
          <span className={PILL}>Open</span>
        </div>
      </div>
    </div>
  );
}

function Line({ live }: { live: boolean }) {
  return (
    <p
      data-rh-reel-line={live ? "live" : "short"}
      className={cn(
        "flex items-center gap-1.5 text-xs",
        live ? "font-medium text-foreground" : "text-muted-foreground",
      )}
    >
      <Clapperboard className="size-3.5" aria-hidden />
      {live ? "Highlight reel live" : "1 more photo starts the highlight reel"}
      {/* The same two pips the Reel card counts with, so a count toward the
          reel reads as one motif wherever a host meets it. */}
      {live ? null : <Pips have={MINIMUM - 1} of={MINIMUM} tone="ink" />}
    </p>
  );
}

export function PulsePair({
  option,
  device,
}: {
  option: PulseOption;
  device: Device;
}) {
  const liveLine = option === "counts" || option === "threshold";
  const shortLine = option === "counts";
  return (
    <div
      className={cn(
        "grid gap-4",
        device === "phone" ? "grid-cols-1" : "grid-cols-3",
      )}
    >
      <div className="space-y-1.5" data-rh-relevant="">
        {option === "cover" ? (
          <CrossfadeCard name={EVENT.name} date="15 Aug" items={LIVE_ALBUM_COUNT} />
        ) : (
          <EventCard
            href="#"
            name={EVENT.name}
            coverUrl={EVENT_COVER}
            dateLabel="15 Aug"
            itemsLabel={`${LIVE_ALBUM_COUNT} items`}
            statusLabel="Open"
          />
        )}
        {liveLine ? <Line live /> : null}
      </div>
      <div className="space-y-1.5" data-rh-relevant="">
        <EventCard
          href="#"
          name={SHORT.name}
          coverUrl={SHORT.cover}
          dateLabel={SHORT.date}
          itemsLabel={`${SHORT.items} item`}
          statusLabel="Open"
        />
        {shortLine ? <Line live={false} /> : null}
      </div>
    </div>
  );
}
