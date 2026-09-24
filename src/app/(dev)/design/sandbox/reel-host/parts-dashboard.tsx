"use client";

import {
  Calendar,
  CalendarPlus,
  Clapperboard,
  Images,
  ListFilter,
} from "lucide-react";

import { EventCard } from "@/components/app/event-card";
import { NextStepBand } from "@/components/app/dashboard/next-step-band";
import { Button } from "@/components/ui/button";
import type { NextStep } from "@/lib/dashboard/next-step";
import { GLASS_MARK } from "@/lib/glass";
import { cn } from "@/lib/utils";

import {
  EVENT,
  GALLERY_ITEMS,
  LIVE_ALBUM_COUNT,
  LIVING_STILLS,
  MINIMUM,
  stillOf,
  WAITING,
} from "./fixtures";
import { Living, Pips } from "./parts-living";
import type { Device } from "./parts-view";
import { DashboardBar } from "./scene";

/**
 * THE DASHBOARD, FOR THE `pulse` ASK: its header, its What needs you band, and
 * the event cards drawn as a PAIR every time, the wedding with its reel live
 * and a second event one photograph short of the minimum, so each option shows
 * its rule on both sides of the line rather than asserting it on one.
 *
 * ★ THE BAND IS THE REAL `NextStepBand`, FED THE STEPS THE RULE WOULD RESOLVE.
 * The band already carries a reel step (`next-step.ts`, "has no reel yet",
 * which offers the stored reel), so every option has to say what becomes of
 * it: `band` rewrites it to the truth, every other option retires it. The
 * wedding's own review step rides every option unchanged, because it is what
 * the band says today and it is not what this question is about.
 *
 * ★ `EventCard` IS THE REAL, PURE COMPONENT (no session on mount), reused
 * whole wherever the card itself does not move, because a quoted copy of its
 * overlay would drift from the shipped one the moment either changes. `cover`
 * cannot reuse it (a single `coverUrl` has no seam for a crossfade), so that
 * option alone quotes the overlay it cannot flex to show.
 */

export type PulseOption = "counts" | "threshold" | "cover" | "band" | "quiet";

const SHORT = {
  name: "Ruby's 30th",
  cover: stillOf(GALLERY_ITEMS[9]),
  date: "2 Oct",
  items: 1,
};

/** The wedding's review step: the band's words today, in every option. */
const REVIEW_STEP: NextStep = {
  kind: "review",
  eventId: "wedding",
  label: `${WAITING} waiting on ${EVENT.name}`,
  short: `${WAITING} to review`,
  href: "#",
  tone: "waiting",
};

/** `pulse=band`: the reel step, told the truth for the live reel. */
const REEL_STEP: NextStep = {
  kind: "reel",
  eventId: "ruby",
  label: `1 more photo starts the reel on ${SHORT.name}`,
  short: "1 more photo",
  href: "#",
  tone: "quiet",
};

/**
 * ★ A STILL CARD WEARS THE EVENT'S COVER; A LIVING ONE WEARS THE REEL. The
 * dashboard's static cover is the album's own photograph, and `cover` swaps it
 * for the reel's take dissolving through its stills, so even a held frame of
 * that option shows a different picture from the options that only add a line:
 * the swap IS the option.
 */
const EVENT_COVER = stillOf(GALLERY_ITEMS[0]);

const PILL = cn(
  "flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-medium text-white",
  GLASS_MARK,
);

/** `pulse=cover`: the card's own cover, crossfading at the tile's calm pace. */
function CrossfadeCard({
  name,
  date,
  items,
}: {
  name: string;
  date: string;
  items: number;
}) {
  return (
    <div
      data-rh-playing-cover=""
      className="relative aspect-[16/10] overflow-hidden rounded-xl"
    >
      <Living stills={LIVING_STILLS} />
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent" />
      {/* `EventCard`'s own review chip, quoted with its inline colours. */}
      <span
        className="absolute top-2.5 right-2.5 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{
          background: "var(--warning)",
          color: "var(--warning-foreground)",
        }}
      >
        {WAITING} to review
      </span>
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
          <CrossfadeCard
            name={EVENT.name}
            date="15 Aug"
            items={LIVE_ALBUM_COUNT}
          />
        ) : (
          <EventCard
            href="#"
            name={EVENT.name}
            coverUrl={EVENT_COVER}
            dateLabel="15 Aug"
            itemsLabel={`${LIVE_ALBUM_COUNT} items`}
            statusLabel="Open"
            pendingCount={WAITING}
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

/**
 * The whole dashboard as `dashboard/page.tsx` lays it out for a host with two
 * events: the title and the plan's count, New event, the band, the storage
 * line, then Your events. Wrapped `pointer-events-none` where it holds real
 * links, so a reviewer's click never leaves the board.
 */
export function Dashboard({
  option,
  device,
}: {
  option: PulseOption;
  device: Device;
}) {
  const phone = device === "phone";
  const steps = option === "band" ? [REVIEW_STEP, REEL_STEP] : [REVIEW_STEP];
  return (
    <div className="min-h-full bg-background text-foreground">
      <DashboardBar />
      <div
        className={cn(
          phone
            ? "space-y-4 px-4 py-5"
            : "mx-auto max-w-[1120px] space-y-5 px-8 py-7",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="font-heading text-page">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              2 of Unlimited events used
            </p>
          </div>
          <Button size="sm" tabIndex={-1}>
            <CalendarPlus /> New event
          </Button>
        </div>
        <div data-rh-band="" className="pointer-events-none">
          <NextStepBand steps={steps} />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Storage</span>
          <span className="h-px flex-1 bg-border" />
          <span className="tabular-nums">2.4 GB / 500 GB</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="font-heading text-subsection">Your events</p>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ListFilter className="size-4" aria-hidden />
            All events
          </span>
        </div>
        <div className="pointer-events-none">
          <PulsePair option={option} device={device} />
        </div>
      </div>
    </div>
  );
}
