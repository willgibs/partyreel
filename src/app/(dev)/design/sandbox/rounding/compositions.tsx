"use client";

import { Check, Plus, QrCode, Search, Upload } from "lucide-react";

import type { Mode } from "@/components/dev/board";
import { EventCard } from "@/components/app/event-card";
import { EventTypeCard } from "@/components/marketing/sections/home/event-type-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { StaticDialog, StaticMenu, Tile, TILES } from "./specimens";

/**
 * THE ROUNDING BOARD'S REAL COMPOSITIONS (round two, 2026-09-14).
 *
 * Round one judged the radius on a kit: a card, a row of buttons, a grid of
 * squares. A kit answers "is this corner nice" and the question on this board
 * is "does the product hold together at these values", so part B renders four
 * surfaces the product actually has, from the components that draw them.
 *
 * ★ BREAKPOINTS DO NOT WORK INSIDE A STAGE. `zoom` scales layout, never media
 * queries, so `lg:grid-cols-3` inside the 375 canvas reads the DESKTOP browser
 * and lays three columns out in a phone. Every column count here keys off the
 * `mode` prop instead. The imported components carry their own prefixes and
 * are judged as they ship (EventCard and EventTypeCard have none, which is
 * why they can be dropped straight in).
 */

const COMPOSITIONS = [
  { id: "marketing", label: "Marketing" },
  { id: "dashboard", label: "Dashboard" },
  { id: "guest", label: "Guest" },
  { id: "floating", label: "Floating" },
] as const;

export type CompositionId = (typeof COMPOSITIONS)[number]["id"];
export const COMPOSITION_OPTIONS = COMPOSITIONS.map((c) => ({
  id: c.id,
  label: c.label,
}));

const EVENT_TYPES = [
  {
    slug: "weddings",
    title: "Weddings",
    teaser: "Every angle of the day, from everyone who was there.",
    still: "wedding-golden",
  },
  {
    slug: "parties",
    title: "Parties",
    teaser: "The dance floor, the kitchen, the 2am singalong.",
    still: "party-balloons",
  },
  {
    slug: "conferences",
    title: "Conferences",
    teaser: "Talks, hallway tracks and the dinner after.",
    still: "reception-hall",
  },
];

/** A marketing chapter's card row and its CTA, on paper: the event-type row
 *  from the home page, the heading above it, and the CTA exactly as it ships
 *  (size lg forced to h-11, so it takes 0.9 x --radius-action). */
function MarketingComposition({ mode }: { mode: Mode }) {
  return (
    <div className="px-8 py-10">
      <p className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
        Events
      </p>
      <h3 className="mt-2 max-w-xl font-heading text-3xl leading-tight tracking-tight">
        Made for every kind of get-together
      </h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        If people show up with phones, Partyreel collects what they capture.
      </p>
      <div
        className={cn(
          "mt-8 grid gap-4",
          mode === "phone" ? "grid-cols-1" : "grid-cols-3",
        )}
      >
        {(mode === "phone" ? EVENT_TYPES.slice(0, 1) : EVENT_TYPES).map((t) => (
          <EventTypeCard
            key={t.slug}
            href="#rnd-b"
            src={marketingImage(t.still).src}
            title={t.title}
            teaser={t.teaser}
          />
        ))}
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center rounded-[calc(var(--radius-action)*0.9)] bg-primary px-6 text-base font-medium text-primary-foreground"
        >
          Create your event
        </button>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center rounded-[calc(var(--radius-action)*0.9)] border border-border px-6 text-base font-medium"
        >
          See a live album
        </button>
      </div>
    </div>
  );
}

/** The host's dashboard: the page header, the filter chips, and the event
 *  card grid. EventCard is rounded-xl, so this is where the ladder's 1.4x
 *  step is judged on the biggest shape in the app. */
function DashboardComposition({ mode }: { mode: Mode }) {
  const events = [
    {
      name: "Summer wedding",
      cover: "wedding-golden",
      date: "14 June",
      items: "312 items",
      status: "Open",
      pending: 6,
    },
    {
      name: "Rooftop birthday",
      cover: "party-balloons",
      date: "2 May",
      items: "88 items",
      status: "Open",
      pending: 0,
    },
    {
      name: "Team offsite",
      cover: "reception-hall",
      date: "19 March",
      items: "140 items",
      status: "Closed",
      pending: 0,
    },
  ];
  return (
    <div className="px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-2xl leading-snug tracking-tight">
            Your events
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Three hosted, one saved.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input className="w-44 pl-7" placeholder="Search events" />
          </div>
          <Button>
            <Plus data-icon="inline-start" /> New event
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="secondary">
          All
        </Button>
        <Button size="sm" variant="ghost">
          Hosted
        </Button>
        <Button size="sm" variant="ghost">
          Saved
        </Button>
        <Badge className="ml-1">
          <Check data-icon="inline-start" /> 6 to review
        </Badge>
      </div>

      <ul
        className={cn(
          "mt-5 grid gap-4",
          mode === "phone" ? "grid-cols-1" : "grid-cols-3",
        )}
      >
        {(mode === "phone" ? events.slice(0, 2) : events).map((e) => (
          <li key={e.name}>
            <EventCard
              href="#rnd-b"
              name={e.name}
              coverUrl={marketingImage(e.cover).src}
              dateLabel={e.date}
              itemsLabel={e.items}
              statusLabel={e.status}
              pendingCount={e.pending}
              qrSlot={
                <span className="flex items-center justify-center rounded-[var(--radius-tile)] bg-white p-1.5 text-black">
                  <QrCode className="size-3.5" aria-hidden />
                </span>
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The guest gallery: the one grid every guest sees, at the tile radius and the
 * gallery gap.
 *
 * ★ THE PAIR AT THE BOTTOM IS A FINDING, NOT A CANDIDATE. guest-masonry.tsx,
 * gallery-skeleton.tsx and ghost-grid.tsx set their column gap as a LITERAL
 * `gap-[3px]` while their tiles ride `var(--radius-tile)`, so the moment the
 * tile goes above 3 the corners open holes on the guest page and nowhere else.
 * The right column shows what ships today; the left shows the same grid on the
 * token. Not this track's lane to fix, so it is on the board where it can be
 * ruled on instead of in a comment nobody reads.
 */
function GuestComposition({ mode }: { mode: Mode }) {
  const cols = mode === "phone" ? "columns-2" : "columns-4";
  return (
    <div className="flex h-full flex-col bg-gallery text-gallery-foreground">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="font-heading text-lg leading-snug">Summer wedding</p>
          <p className="text-xs text-gallery-muted">312 photos, 48 guests</p>
        </div>
        <Button>
          <Upload data-icon="inline-start" /> Add photos
        </Button>
      </div>
      <div className={cn(cols, "gap-[var(--gap-gallery)] px-1")}>
        {TILES.map((id, i) => (
          <div key={id} className="mb-[var(--gap-gallery)] break-inside-avoid">
            <Tile
              id={id}
              className={i % 3 === 0 ? "aspect-[3/4]" : "aspect-square"}
              sizes="220px"
            />
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-6 px-4 pb-5">
        <div>
          <div className="grid grid-cols-3 gap-[var(--gap-gallery)]">
            {TILES.slice(0, 9).map((id) => (
              <Tile key={id} id={id} className="aspect-square" sizes="80px" />
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-gallery-muted tabular-nums">
            On the token: gap follows the tile.
          </p>
        </div>
        <div>
          <div className="grid grid-cols-3 gap-[3px]">
            {TILES.slice(0, 9).map((id) => (
              <Tile key={id} id={id} className="aspect-square" sizes="80px" />
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-gallery-muted tabular-nums">
            As the guest gallery ships: a literal 3px gap.
          </p>
        </div>
      </div>
    </div>
  );
}

/** The floating layer over real content: one radius, drawn from the
 *  primitives' own classes because a radix panel portals out of any stage. */
function FloatingComposition({ mode }: { mode: Mode }) {
  return (
    <div className="relative h-full px-6 py-8">
      <div className="pointer-events-none select-none">
        <h3 className="font-heading text-2xl leading-snug tracking-tight">
          Summer wedding
        </h3>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          The album behind the layer, so the panel has something to detach
          from.
        </p>
        <div className="mt-4 grid grid-cols-4 gap-[var(--gap-gallery)]">
          {TILES.slice(0, 8).map((id) => (
            <Tile key={id} id={id} className="aspect-square" sizes="150px" />
          ))}
        </div>
      </div>
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-6 bg-background/40 px-6",
          mode === "phone" && "flex-col",
        )}
      >
        <StaticDialog />
        <StaticMenu />
      </div>
    </div>
  );
}

export function Composition({
  id,
  mode,
}: {
  id: CompositionId;
  mode: Mode;
}) {
  if (id === "marketing") return <MarketingComposition mode={mode} />;
  if (id === "dashboard") return <DashboardComposition mode={mode} />;
  if (id === "guest") return <GuestComposition mode={mode} />;
  return <FloatingComposition mode={mode} />;
}
