"use client";

import { ChevronDown, Search } from "lucide-react";

import { RoleMarker } from "@/components/app/event-card";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import { Face, hasCover } from "./face";
import type { DashEvent, GuestEvent, Host } from "./fixtures";
import {
  byDate,
  isEvening,
  phaseOf,
  photosIn,
  seasonsOf,
  whenOf,
} from "./model";
import { Mark, Still, type Tone, useWide } from "./ui";

/**
 * YOUR EVENTS, THREE WAYS AT FORTY: one wall of covers newest first, grouped
 * by when with the tiles shrinking as they age, and a list you can sort.
 *
 * ★ ONE TILE IN ALL THREE (a new atom this board names, `EventTile`): the
 * cover or, before a photograph exists, the date; the name and when on it;
 * one mark at most in each top corner (Live; a count waiting or a step the
 * rule put on the page). Today's card carries the QR chip, a date pill, an
 * item pill and Open/Paused on every cover; the counts move to the list view
 * and the event, the code to the event's Invite, so forty covers read as
 * forty photographs.
 */

export type TileMark = { tone: Tone; text: string };

/**
 * A tile's name by its size. ★ EACH ITS OWN STRING: the heading face carries
 * its one weight, and a weight class in the same class expression would beat
 * it (`type-ladder-policy.test.ts`), so the small size's Inter weight never
 * shares a `cn()` with the face.
 */
const NAME_LG = "font-heading text-subsection";
const NAME_MD = "font-heading text-card-title";
const NAME_SM = "text-xs font-medium";

/** The marks one event wears: Live top left, one state top right. */
export type Marks = { live: boolean; state: TileMark | null };

const evening = (host: Host) => isEvening(host.clock);

export function EventTile({
  host,
  event,
  marks,
  size,
}: {
  host: Host;
  event: DashEvent;
  marks: Marks;
  size: "lg" | "md" | "sm";
}) {
  const photo = hasCover(event);
  return (
    <div data-hd-tile={size} className="group relative">
      <div
        data-lit=""
        className={cn(
          "relative aspect-[3/2] overflow-hidden",
          size === "sm" ? "rounded-md" : "rounded-lg",
        )}
      >
        <Face
          event={event}
          size={size === "lg" ? "lg" : size === "md" ? "md" : "sm"}
        />
        {photo && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        )}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0",
            photo ? "text-white" : "text-foreground",
            size === "sm" ? "p-2" : "p-3",
          )}
        >
          <h3
            className={cn(
              "truncate",
              size === "lg" ? NAME_LG : size === "md" ? NAME_MD : NAME_SM,
            )}
          >
            {event.name}
          </h3>
          {size !== "sm" && (
            <p
              className={cn(
                "mt-0.5 text-xs",
                photo ? "text-white/70" : "text-muted-foreground",
              )}
            >
              {whenOf(event.date, host.today, evening(host))}
            </p>
          )}
        </div>
      </div>
      {marks.live && (
        <span className="absolute top-2 left-2">
          <Mark tone="live" on={photo ? "photo" : "page"}>
            Live
          </Mark>
        </span>
      )}
      {marks.state && size !== "sm" && (
        <span className="absolute top-2 right-2">
          <Mark tone={marks.state.tone} on={photo ? "photo" : "page"}>
            {marks.state.text}
          </Mark>
        </span>
      )}
      {marks.state && size === "sm" && (
        <span
          aria-label={marks.state.text}
          className={cn(
            "absolute top-1.5 right-1.5 size-2 rounded-full ring-2 ring-black/30",
            marks.state.tone === "waiting" ? "bg-warning" : "bg-white",
          )}
        />
      )}
    </div>
  );
}

function GuestTile({
  guest,
  size,
}: {
  guest: GuestEvent;
  size: "lg" | "md" | "sm";
}) {
  return (
    <div data-hd-tile="guest" className="relative">
      <div
        className={cn(
          "relative aspect-[3/2] overflow-hidden",
          size === "sm" ? "rounded-md" : "rounded-lg",
        )}
      >
        <Still photo={guest.cover} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 text-white",
            size === "sm" ? "p-2" : "p-3",
          )}
        >
          <h3 className={cn("truncate", size === "sm" ? NAME_SM : NAME_MD)}>
            {guest.name}
          </h3>
          {size !== "sm" && (
            <p className="mt-0.5 truncate text-xs text-white/70">
              {guest.byline}
            </p>
          )}
        </div>
      </div>
      <span className="pointer-events-none absolute top-2 right-2">
        <RoleMarker role="guest" />
      </span>
    </div>
  );
}

/* ── the lens ───────────────────────────────────────────────────────────── */

/**
 * The lens as one row of counts (production's Show menu, its three lenses
 * and their numbers said at once), and the search a planner needs at forty.
 */
function LensBar({
  host,
  title,
  sort,
}: {
  host: Host;
  title?: string;
  sort?: boolean;
}) {
  const wide = useWide();
  const lenses = [
    { id: "all", label: "All", n: host.events.length + host.guest.length },
    { id: "hosting", label: "Hosting", n: host.events.length },
    { id: "guest", label: "Guest", n: host.guest.length },
    { id: "deleted", label: "Deleted", n: host.deleted },
  ].filter((l) => l.id === "all" || l.n > 0);
  const many = host.events.length > 8;
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div
        className={cn(
          "min-w-0",
          wide ? "flex items-center gap-4" : "w-full space-y-3",
        )}
      >
        {title && <h2 className="font-heading text-subsection">{title}</h2>}
        <div
          data-hd-lens=""
          className={cn(
            "flex w-max max-w-full [scrollbar-width:none] items-center gap-0.5 overflow-x-auto rounded-full bg-muted p-0.5 text-xs",
          )}
        >
          {lenses.map((l, i) => (
            <span
              key={l.id}
              className={cn(
                "flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3",
                i === 0
                  ? "bg-background font-medium text-foreground shadow-lift"
                  : "text-muted-foreground",
              )}
            >
              {l.label}
              <span className="text-muted-foreground tabular-nums">
                {formatCount(l.n)}
              </span>
            </span>
          ))}
        </div>
      </div>
      {many && (
        <div className="flex items-center gap-2">
          {sort && (
            <span className="flex h-8 items-center gap-1 rounded-full px-3 text-xs text-muted-foreground">
              Newest
              <ChevronDown className="size-3.5" aria-hidden />
            </span>
          )}
          <span
            className={cn(
              "flex h-8 items-center gap-2 rounded-full border border-border px-3 text-xs text-muted-foreground",
              wide ? "w-64" : "w-full",
            )}
          >
            <Search className="size-3.5" aria-hidden />
            {`Search ${formatCount(host.events.length)} events`}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── one wall of covers ─────────────────────────────────────────────────── */

export function Covers({
  host,
  marksOf,
  title,
}: {
  host: Host;
  marksOf: (e: DashEvent) => Marks;
  title?: string;
}) {
  const wide = useWide();
  const events = byDate(host);
  return (
    <section
      data-hd-collection="covers"
      aria-label="Your events"
      className="space-y-4"
    >
      <LensBar host={host} title={title} />
      <ul
        className={cn("grid", wide ? "gap-4" : "gap-3")}
        style={{
          gridTemplateColumns: `repeat(${colsFor(events.length + host.guest.length, wide ? 5 : 2)}, minmax(0, 1fr))`,
        }}
      >
        {events.map((e) => (
          <li key={e.id}>
            <EventTile host={host} event={e} marks={marksOf(e)} size="md" />
          </li>
        ))}
        {host.guest.map((g) => (
          <li key={g.id}>
            <GuestTile guest={g} size="md" />
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── grouped by when ────────────────────────────────────────────────────── */

/**
 * A grid's columns for how many it holds: a group of one or two draws them a
 * third of the page wide rather than a fifth, so a host with one event meets
 * a cover, not a thumbnail in an empty row.
 */
const colsFor = (n: number, cols: number) => (cols > 2 && n <= 2 ? 3 : cols);

const COLS: Record<"large" | "medium" | "small", [number, number]> = {
  large: [4, 1],
  medium: [5, 2],
  small: [8, 3],
};

export function Seasons({
  host,
  marksOf,
  title,
}: {
  host: Host;
  marksOf: (e: DashEvent) => Marks;
  title?: string;
}) {
  const wide = useWide();
  const seasons = seasonsOf(host);
  return (
    <section
      data-hd-collection="seasons"
      aria-label="Your events"
      className="space-y-6"
    >
      <LensBar host={host} title={title} />
      {seasons.map((s) => {
        if (s.size === "folded") {
          const count = s.events.length;
          return (
            <div
              key={s.id}
              data-hd-season={s.id}
              className="flex items-center gap-4 border-t border-border pt-4"
            >
              <div className="w-36 shrink-0">
                <p className="font-heading text-card-title">{s.label}</p>
                <p className="text-xs text-muted-foreground">
                  {`${formatCount(count)} events · ${formatCount(photosIn(s.events))} photos`}
                </p>
              </div>
              <ul className="flex min-w-0 flex-1 gap-1.5 overflow-hidden">
                {s.events.slice(0, wide ? 16 : 4).map((e) => (
                  <li
                    key={e.id}
                    className="relative size-11 shrink-0 overflow-hidden rounded-[var(--radius-tile)]"
                  >
                    <Face event={e} size="sm" />
                  </li>
                ))}
              </ul>
              <span className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-border px-3 text-xs font-medium">
                {`Show ${formatCount(count)}`}
                <ChevronDown className="size-3.5" aria-hidden />
              </span>
            </div>
          );
        }
        const [desk, hand] = COLS[s.size];
        const size =
          s.size === "large" || s.events.length <= 2
            ? "lg"
            : s.size === "medium"
              ? "md"
              : "sm";
        return (
          <div key={s.id} data-hd-season={s.id} className="space-y-3">
            <p className="flex items-baseline gap-2">
              <span className="font-heading text-card-title">{s.label}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatCount(s.events.length)}
              </span>
            </p>
            <ul
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${colsFor(s.events.length, wide ? desk : hand)}, minmax(0, 1fr))`,
              }}
            >
              {s.events.map((e) => (
                <li key={e.id}>
                  <EventTile
                    host={host}
                    event={e}
                    marks={marksOf(e)}
                    size={wide ? size : size === "lg" ? "md" : size}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {host.guest.length > 0 && (
        <div data-hd-season="guest" className="space-y-3">
          <p className="flex items-baseline gap-2">
            <span className="font-heading text-card-title">As a guest</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatCount(host.guest.length)}
            </span>
          </p>
          <ul
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${colsFor(host.guest.length, wide ? 5 : 2)}, minmax(0, 1fr))`,
            }}
          >
            {host.guest.map((g) => (
              <li key={g.id}>
                <GuestTile guest={g} size="md" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/* ── a list you can sort ────────────────────────────────────────────────── */

function StateCell({
  host,
  e,
  marks,
}: {
  host: Host;
  e: DashEvent;
  marks: Marks;
}) {
  const phase = phaseOf(e.date, host.today);
  if (marks.live)
    return (
      <span className="flex items-center gap-2 text-sm">
        <span
          className="hd-breathe size-2 rounded-full bg-success"
          aria-hidden
        />
        Live
      </span>
    );
  if (marks.state)
    return (
      <span className="flex items-center gap-2 text-sm">
        <span
          aria-hidden
          className={cn(
            "size-2 rounded-full",
            marks.state.tone === "waiting"
              ? "bg-warning"
              : "border border-foreground/50",
          )}
        />
        <span className="truncate">{marks.state.text}</span>
      </span>
    );
  return (
    <span className="text-sm text-muted-foreground">
      {phase === "before"
        ? "Ready"
        : e.facts.acceptingUploads
          ? "Open"
          : "Paused"}
    </span>
  );
}

export function Index({
  host,
  marksOf,
  title,
}: {
  host: Host;
  marksOf: (e: DashEvent) => Marks;
  title?: string;
}) {
  const wide = useWide();
  const events = byDate(host);
  return (
    <section
      data-hd-collection="index"
      aria-label="Your events"
      className="space-y-4"
    >
      <LensBar host={host} title={title} sort />
      <div className="overflow-hidden rounded-xl border border-border">
        {wide && (
          <div className="grid grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,1.3fr)] gap-4 border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
            <span>Event</span>
            <span className="flex items-center gap-1">
              Date
              <ChevronDown className="size-3" aria-hidden />
            </span>
            <span className="text-right">Photos</span>
            <span className="text-right">Guests</span>
            <span>State</span>
          </div>
        )}
        <ul className="divide-y divide-border">
          {events.map((e) => {
            const marks = marksOf(e);
            return (
              <li
                key={e.id}
                data-hd-row=""
                className={cn(
                  "items-center gap-4 px-4",
                  wide
                    ? "grid grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,1.3fr)] py-2"
                    : "flex py-2.5",
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="relative h-8 w-12 shrink-0 overflow-hidden rounded-[var(--radius-tile)]">
                    <Face event={e} size="sm" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {e.name}
                    </span>
                    {!wide && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {hasCover(e)
                          ? `${whenOf(e.date, host.today, evening(host))} · ${formatCount(e.facts.approved)} photos`
                          : whenOf(e.date, host.today, evening(host))}
                      </span>
                    )}
                  </span>
                </span>
                {wide ? (
                  <>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {whenOf(e.date, host.today, evening(host))}
                    </span>
                    <span className="text-right text-sm tabular-nums">
                      {hasCover(e) ? formatCount(e.facts.approved) : ""}
                    </span>
                    <span className="text-right text-sm tabular-nums">
                      {hasCover(e) ? formatCount(e.facts.guests) : ""}
                    </span>
                    <StateCell host={host} e={e} marks={marks} />
                  </>
                ) : (
                  <span className="ml-auto shrink-0">
                    <StateCell host={host} e={e} marks={marks} />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
