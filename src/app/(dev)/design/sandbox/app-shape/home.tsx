"use client";

import { type ReactNode } from "react";
import {
  ArrowRight,
  CalendarPlus,
  Clapperboard,
  Eye,
  Images,
  ListChecks,
  Users,
} from "lucide-react";

import { FilterChips } from "@/components/app/dashboard/filter-chips";
import { StorageMeter } from "@/components/app/dashboard/storage-meter";
import { EventCard } from "@/components/app/event-card";
import { MediaTile } from "@/components/app/media-grid";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  ARRIVALS,
  EVENTS,
  type HostEvent,
  MY_LIKES,
  MY_UPLOADS,
  SAVED,
  STORAGE,
} from "./fixtures";

/**
 * THE HOST'S HOME, IN THREE SHAPES, EACH DRAWING AN EVENT THREE WAYS.
 *
 * Two decisions meet on this page and they are asked separately because they
 * are separable: what the home IS (the inbox of everything, her events alone,
 * or a front page that leads with what needs her) and what one event LOOKS
 * like on it (today's cover card, a row, or a wall of its photographs). Every
 * combination draws, because the step hands each preview the board's live
 * state: pick the row and go back to the home question and the home redraws in
 * rows.
 *
 * Mobbin, read for the row: Posh's event list puts the cover photograph behind
 * the row rather than beside it, with the counts in their own columns at the
 * right (https://mobbin.com/screens/3fad44f7-7615-425b-accb-68cd6e60007b).
 * Partiful's home is today's shape done well, and the thing it does NOT do is
 * mix your own uploads and likes into the same chips
 * (https://mobbin.com/screens/ec636758-83f4-4b52-9c1d-be60acce7f64).
 */

export type Home = "inbox" | "events" | "pulse";
export type Density = "cover" | "row" | "wall";

export const homeOf = (v: string | undefined): Home =>
  v === "inbox" || v === "events" ? v : "pulse";
export const densityOf = (v: string | undefined): Density =>
  v === "cover" || v === "wall" ? v : "row";

/* ── The three ways to draw one event ────────────────────────────────────── */

/** TODAY: the shipped `EventCard`, a 16:10 cover with the chrome over it. */
function CoverGrid({ phone }: { phone: boolean }) {
  return (
    <div
      className={cn(
        "grid gap-4",
        phone ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3",
      )}
    >
      {EVENTS.map((e) => (
        <EventCard
          key={e.id}
          href={`/dashboard/${e.id}`}
          name={e.name}
          coverUrl={e.cover}
          dateLabel={e.dateLabel}
          itemsLabel={`${e.items} items`}
          statusLabel={e.accepting ? "Open" : "Closed"}
          pendingCount={e.pending}
        />
      ))}
    </div>
  );
}

const STAT = "flex items-center gap-1.5 tabular-nums";

/**
 * A ROW: the cover photograph is the row's own ground rather than a card of its
 * own, the four newest sit beside the name so the row still shows the party,
 * and the counts line up in columns you can read down. Eight events fit where
 * three cards do.
 */
function EventRow({ e, phone }: { e: HostEvent; phone: boolean }) {
  return (
    <div
      data-lit=""
      className="relative overflow-hidden rounded-xl border border-border bg-card"
    >
      {/* The cover, as the row's ground: 12 percent, so the row reads as this
          party's row and the type on top keeps its contrast. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixture still, never optimizable in a frame */}
      <img
        src={e.cover}
        alt=""
        className="absolute inset-0 size-full object-cover opacity-[0.12]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-card via-card/85 to-card/40" />
      <div
        className={cn(
          "relative flex gap-4 p-3",
          phone ? "flex-col" : "items-center",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate font-heading text-card-title">
            {e.name}
          </span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{e.dateLabel}</span>
            <span className={STAT}>
              <Images className="size-3" aria-hidden />
              {e.items}
            </span>
            <span className={STAT}>
              <Users className="size-3" aria-hidden />
              {e.guests}
            </span>
            <span className={STAT}>
              <Eye className="size-3" aria-hidden />
              {e.views}
            </span>
            <span className={STAT}>
              <Clapperboard className="size-3" aria-hidden />
              {e.reelClips ?? "None"}
            </span>
          </span>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {e.newest.slice(0, phone ? 5 : 4).map((m) => (
            <span
              key={m.id}
              data-media-tile
              data-static
              className="relative size-11 overflow-hidden rounded-[var(--radius-tile)]"
            >
              <MediaTile item={m} playBadge="none" />
            </span>
          ))}
        </div>
        <div className="flex w-44 shrink-0 justify-end">
          {e.pending > 0 ? (
            <span className="flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">
              <ListChecks className="size-3.5" aria-hidden />
              {e.pending} to review
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {e.needs ?? "Nothing waiting"}
              <ArrowRight className="size-3.5" aria-hidden />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function RowList({ phone }: { phone: boolean }) {
  return (
    <div className="space-y-2">
      {EVENTS.map((e) => (
        <EventRow key={e.id} e={e} phone={phone} />
      ))}
    </div>
  );
}

/**
 * A WALL: the event IS its photographs. The name and the counts are a line
 * above a strip of the newest six, so the home reads like the album it is
 * rather than like a filing cabinet.
 */
function WallList({ phone }: { phone: boolean }) {
  return (
    <div className="space-y-6">
      {EVENTS.map((e) => (
        <section key={e.id} className="space-y-2">
          <div className="flex items-baseline gap-3">
            <h3 className="truncate font-heading text-card-title">{e.name}</h3>
            <span className="truncate text-xs text-muted-foreground">
              {e.dateLabel} · {e.items} items · {e.guests} guests
            </span>
            {e.pending > 0 && (
              <span className="ml-auto shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning">
                {e.pending} to review
              </span>
            )}
          </div>
          <div className={cn("grid gap-1.5", phone ? "grid-cols-3" : "grid-cols-6")}>
            {e.newest.slice(0, phone ? 6 : 6).map((m) => (
              <span
                key={m.id}
                data-media-tile
                data-static
                data-lit=""
                className="relative aspect-square overflow-hidden rounded-[var(--radius-tile)]"
              >
                <MediaTile item={m} playBadge="none" />
              </span>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Events({
  density,
  phone,
}: {
  density: Density;
  phone: boolean;
}) {
  if (density === "cover") return <CoverGrid phone={phone} />;
  if (density === "wall") return <WallList phone={phone} />;
  return <RowList phone={phone} />;
}

/* ── The personal feeds the inbox mixes in ───────────────────────────────── */

function MiniGallery({ title, items }: { title: string; items: typeof MY_LIKES }) {
  return (
    <section className="space-y-2.5">
      <h2 className="font-heading text-subsection">{title}</h2>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 lg:grid-cols-9">
        {items.map((m) => (
          <span
            key={m.id}
            data-media-tile
            data-static
            data-lit=""
            className="relative aspect-square overflow-hidden rounded-[var(--radius-tile)]"
          >
            <MediaTile item={m} playBadge="none" />
          </span>
        ))}
      </div>
    </section>
  );
}

function Meter() {
  return (
    <StorageMeter
      storageUsed={STORAGE.used}
      storageCap={STORAGE.cap}
      storagePct={STORAGE.pct}
      standbyBytes={STORAGE.standby}
      overBudget={false}
      passExpiry={null}
      planName="Pro"
      hasBilling
      isEventPass={false}
    />
  );
}

function NewEvent() {
  return (
    <Button>
      <CalendarPlus /> New event
    </Button>
  );
}

/* ── What needs her, which only the front page draws ─────────────────────── */

function NeedsYou() {
  const waiting = EVENTS.filter((e) => e.pending > 0);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {waiting.map((e) => (
        <span
          key={e.id}
          className="flex items-center gap-2 rounded-full bg-warning/15 px-3 py-1.5 text-sm font-medium text-warning"
        >
          <ListChecks className="size-4" aria-hidden />
          {e.pending} waiting on {e.name}
        </span>
      ))}
      <span className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground">
        <Clapperboard className="size-4" aria-hidden />
        Rooftop Summer Party has no reel yet
      </span>
      <span className="flex items-center gap-2 rounded-full border border-warning/40 px-3 py-1.5 text-sm text-warning">
        {STORAGE.pct}% of your storage used
      </span>
    </div>
  );
}

function JustArrived({ phone }: { phone: boolean }) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-baseline gap-2">
        <h2 className="font-heading text-subsection">Just arrived</h2>
        <span className="text-xs text-muted-foreground">
          12 in the last hour, across your events
        </span>
      </div>
      <div
        className={cn(
          "grid gap-1.5",
          phone ? "grid-cols-4" : "grid-cols-8 xl:grid-cols-12",
        )}
      >
        {ARRIVALS.slice(0, phone ? 8 : 12).map((m) => (
          <span
            key={m.id}
            data-media-tile
            data-static
            data-lit=""
            className="relative aspect-square overflow-hidden rounded-[var(--radius-tile)]"
          >
            <MediaTile item={m} playBadge="none" />
          </span>
        ))}
      </div>
    </section>
  );
}

/* ── The three homes ─────────────────────────────────────────────────────── */

function Head({
  title,
  sub,
  action,
}: {
  title: string;
  sub: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <PageHeading>{title}</PageHeading>
        <p className="text-sm text-muted-foreground">{sub}</p>
      </div>
      {action}
    </div>
  );
}

export function HostHome({
  home,
  density,
  size,
}: {
  home: Home;
  density: Density;
  size: "laptop" | "phone";
}) {
  const phone = size === "phone";

  // TODAY: one continuous feed switched by six chips, mixing her three events
  // with a friend's saved event, her own uploads, her likes, the hosts she
  // follows and a bin, under a page called Dashboard.
  if (home === "inbox") {
    return (
      <div className="space-y-6">
        <Head
          title="Dashboard"
          sub="3 of unlimited events used"
          action={<NewEvent />}
        />
        <Meter />
        <FilterChips active="all" onChange={() => {}} trashCount={1} />
        <div className="space-y-8">
          <section className="space-y-2.5">
            <h2 className="font-heading text-subsection">Your events</h2>
            <Events density={density} phone={phone} />
            <p className="pt-1 text-xs text-muted-foreground">
              Saved: {SAVED.name}, hosted by {SAVED.host}
            </p>
          </section>
          <MiniGallery title="Your uploads" items={MY_UPLOADS} />
          <MiniGallery title="Your likes" items={MY_LIKES} />
        </div>
      </div>
    );
  }

  // HER EVENTS, AND NOTHING ELSE. Uploads, likes, the hosts she follows, the
  // events she saved and the bin all move under You, where the rest of her own
  // account already lives.
  if (home === "events") {
    return (
      <div className="space-y-6">
        <Head
          title="Events"
          sub="Three you host, one you saved"
          action={<NewEvent />}
        />
        <Events density={density} phone={phone} />
        <p className="text-xs text-muted-foreground">
          Your uploads, your likes, the hosts you follow and anything deleted
          live under You.
        </p>
      </div>
    );
  }

  // A FRONT PAGE: what needs her, then what just arrived, then her events. The
  // same three events underneath, in whichever density was picked.
  return (
    <div className="space-y-6">
      <Head
        title="Saturday evening"
        sub="Two events live right now"
        action={<NewEvent />}
      />
      <NeedsYou />
      <JustArrived phone={phone} />
      <section className="space-y-2.5">
        <h2 className="font-heading text-subsection">Your events</h2>
        <Events density={density} phone={phone} />
      </section>
    </div>
  );
}
