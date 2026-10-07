"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";
import { Check, ChevronDown, ChevronUp, ImageUp, Images } from "lucide-react";

import { EventChecklist } from "@/components/app/event-feed/checklist";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { InviteButton } from "@/components/app/share/invite-button";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { type ViewMenuGroup, ViewMenu } from "@/components/shared/view-menu";
import {
  type Readiness,
  type ReadyFacts,
  type ReadyItem,
  readiness,
} from "@/lib/events/readiness";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import { EVENT_ID } from "./fixtures";

/**
 * HOW HER EVENT FIRST GREETS HER (round five's `arrival`): the checklist at the hub's head, the moment she lands from
 * Create, in three answers, each read off production's own readiness of the new event (`readiness.ts`):
 *
 *  - `list`: production's `EventChecklist`, untouched: Before guests arrive, 2 of 3 with its bar, all five rows.
 *  - `share`: ready unchanged (the code's first open is still what a guest needs), but a new event whose one need is
 *    the code meets her as one line, the code said as the next thing to do in the beat's own words, Invite and Print
 *    beside it; no bar, no count, no ticked rows. Once she has sent it from Create the line says it is on its way.
 *  - `done`: a fix at the source. Ready answers one question, could a guest who scanned now get in and add, so a door
 *    she can pass and uploads open are what a guest needs, and the code's share leads what is worth doing, still ticking
 *    at its first open (`readyAtCreate`). The checklist meets her folded to one line, Ready for guests with the tick its
 *    head wears, said as the reward ("Your code is all they need"), Invite its one door; Show opens the rest.
 *
 * Under all three the album's empty place speaks in the house's empty voice (the carried `album`: "The album starts
 * with you", Will's pick for an empty album), so the checklist is the one thing that differs.
 *
 * ★ EVERY WORD IS THE CHECKLIST'S OWN where it has one (the items' titles, lines and doors); the board writes only what
 * an option says that production has no line for, and says so beside it.
 */

export type ArrivalWay = "list" | "share" | "done";

/** The checklist's card, as production draws it: the card's ground, its hairline ring. */
const CARD =
  "@container overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10";

/**
 * `done`'S READINESS: production's items, the code moved from what a guest needs to what is worth doing, first among
 * them. Every other fact, line and door is production's.
 */
export function readyAtCreate(f: ReadyFacts): Readiness {
  const base = readiness(f);
  const items: ReadyItem[] = base.items.map((i) =>
    i.id === "code" ? { ...i, essential: false } : i,
  );
  const code = items.find((i) => i.id === "code")!;
  const needed = items.filter((i) => i.essential);
  const worth = [code, ...items.filter((i) => !i.essential && i !== code)];
  const ordered = [...needed, ...worth];
  const left = ordered.filter((i) => !i.done);
  return {
    items: ordered,
    ready: needed.every((i) => i.done),
    done: ordered.length - left.length,
    total: ordered.length,
    needed: {
      done: needed.filter((i) => i.done).length,
      of: needed.length,
    },
    left,
  };
}

/** The code's line under `done`, said as what it is for rather than what it lacks (the board's words). */
const CODE_WORTH = "Guests join with it. Send it or print it, then scan it once yourself.";

export function Arrival({
  way,
  facts,
  shared = false,
}: {
  way: ArrivalWay;
  facts: ReadyFacts;
  /** She pressed Print, Share or Copy link in Create. */
  shared?: boolean;
}) {
  if (way === "list")
    return (
      <div data-cw-arrival="list">
        <EventChecklist
          eventId={EVENT_ID}
          facts={facts}
          over={false}
          plan={{ tier: "free", hasBilling: false }}
        />
      </div>
    );
  if (way === "share") return <ShareLine shared={shared} />;
  return <ReadyFold facts={facts} />;
}

/** Print, as the checklist's code row draws it: the table cards in a tab of their own. */
function PrintDoor({ primary = false }: { primary?: boolean }) {
  return (
    <Button size="sm" variant={primary ? "default" : "outline"} asChild>
      <Link
        href={`/dashboard/${EVENT_ID}/print`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Print
      </Link>
    </Button>
  );
}

/**
 * `share`: ONE LINE, THE CODE AS THE NEXT THING TO DO, in the beat's own words (its sub), never the test-scan chore
 * round one kept off the payoff. No title, bar, count or ticked rows: nothing to audit. Its doors are production's
 * Invite and Print. At a phone the doors stand under the sentence; where the card has the room, beside it.
 */
function ShareLine({ shared }: { shared: boolean }) {
  return (
    <section
      data-checklist=""
      data-cw-arrival="share"
      aria-label="Before guests arrive"
      className={CARD}
    >
      <div className="cw-share">
        <p className="min-w-0 flex-1 text-sm text-pretty">
          <span className="font-medium">
            {shared ? "Your code is on its way" : "Share your code"}
          </span>
          <span className="text-muted-foreground">
            , and guests can start adding photos.
          </span>
        </p>
        <span className="flex shrink-0 flex-wrap gap-1.5">
          <InviteButton location="hub-checklist" />
          <PrintDoor />
        </span>
      </div>
    </section>
  );
}

/** Production's folded line's ring: how far she is, here whole (a guest can get in and add). */
function Ring({ r }: { r: Readiness }) {
  const R = 8;
  const C = 2 * Math.PI * R;
  const pct = r.needed.done / r.needed.of;
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="size-5 shrink-0 -rotate-90">
      <circle
        cx="10"
        cy="10"
        r={R}
        fill="none"
        strokeWidth="2.5"
        className="stroke-muted"
      />
      <circle
        cx="10"
        cy="10"
        r={R}
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={`${C * pct} ${C}`}
        className={cn(
          "cw-ring",
          r.ready ? "stroke-success" : "stroke-foreground/70",
        )}
      />
    </svg>
  );
}

/**
 * What the fold says after Ready for guests: the next thing worth doing, said as the reward rather than a request (the
 * board's words; the code's: "Your code is all they need", true before and after she has sent it).
 */
function nextWords(r: Readiness): { words: string; door: ReactNode } | null {
  const next = r.left.find((i) => !i.essential);
  if (!next) return null;
  if (next.id === "code")
    return {
      words: "Your code is all they need.",
      door: <InviteButton location="hub-checklist" />,
    };
  if (next.id === "photos")
    return {
      words: "A few photos of yours invite theirs.",
      door: (
        <Button size="sm" variant="outline">
          Add photos
        </Button>
      ),
    };
  return {
    words: "Add the date and a note guests read first.",
    door: (
      <Button size="sm" variant="outline">
        Add them
      </Button>
    ),
  };
}

/**
 * `done`: READY FOR GUESTS, FOLDED TO ONE LINE, the next thing worth doing on it with its one door, Show opening the
 * rest (what is worth doing first, then what a guest needs, both ticked). The fold is production's folded line's shape
 * (`ChecklistLine`: its mark, the head and its words, Show), its mark the tick the list's own head wears once ready (a
 * full ring read as an empty radio); its toggle is the band behind the line, the door raised over it.
 */
function ReadyFold({ facts }: { facts: ReadyFacts }) {
  const r = readyAtCreate(facts);
  const [open, setOpen] = useState(false);
  const next = nextWords(r);
  const worth = r.left.filter((i) => !i.essential).length;
  if (open)
    return <ReadyList r={r} onHide={() => setOpen(false)} />;
  return (
    <section
      data-checklist=""
      data-checklist-folded=""
      data-ready={r.ready ? "" : undefined}
      data-cw-arrival="done"
      aria-label="Ready for guests"
      className={cn(CARD, "relative")}
    >
      <button
        type="button"
        aria-expanded={false}
        aria-label={`Ready for guests. ${formatCount(worth)} worth doing. Show`}
        onClick={() => setOpen(true)}
        className="absolute inset-0 rounded-xl outline-none focus-halo transition-colors duration-150 hover:bg-muted/40"
      />
      <span className="pointer-events-none relative flex items-center gap-3 px-4 py-2.5">
        {r.ready ? (
          <Check
            className="size-4 shrink-0 text-success"
            strokeWidth={3}
            aria-hidden
          />
        ) : (
          <Ring r={r} />
        )}
        <span className="cw-fold-words min-w-0 flex-1 text-sm">
          <span className="block font-medium">Ready for guests</span>
          {next ? (
            <span className="block text-muted-foreground">{next.words}</span>
          ) : null}
        </span>
        {next ? (
          <span className="pointer-events-auto relative">{next.door}</span>
        ) : null}
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
          <span className="max-sm:sr-only">Show</span>
          <ChevronDown className="size-4" aria-hidden />
        </span>
      </span>
    </section>
  );
}

function Tick({ done }: { done: boolean }) {
  return done ? (
    <span
      aria-hidden
      className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground"
    >
      <Check className="size-3.5" strokeWidth={3} />
    </span>
  ) : (
    <span
      aria-hidden
      className="mt-px size-5 shrink-0 rounded-full ring-[1.5px] ring-foreground/25 ring-inset"
    />
  );
}

/** A row as production's checklist draws it: its tick, its title and line, its doors. */
function Row({ item }: { item: ReadyItem }) {
  const under = item.actions.length > 1;
  const line = item.id === "code" && !item.done ? CODE_WORTH : item.line;
  return (
    <li
      data-checklist-item={item.id}
      data-done={item.done ? "" : undefined}
      className={cn(
        "flex gap-3 px-4 py-3 @3xl:flex-col @3xl:gap-2 @3xl:py-3.5",
        under ? "flex-col gap-2" : "items-start",
      )}
    >
      <span className="flex min-w-0 flex-1 items-start gap-3 @3xl:w-full">
        <Tick done={item.done} />
        <span className="min-w-0 flex-1 space-y-0.5">
          <span
            className={cn(
              "block text-sm font-medium",
              item.done && "text-muted-foreground",
            )}
          >
            {item.title}
          </span>
          <span className="block text-caption text-pretty text-muted-foreground">
            {line}
          </span>
        </span>
      </span>
      {item.actions.length > 0 ? (
        <span
          className={cn(
            "flex shrink-0 flex-wrap gap-1.5 @3xl:justify-start @3xl:pl-8",
            under ? "pl-8" : "justify-end",
          )}
        >
          {item.actions.map((a, i) =>
            a.to === "invite" ? (
              <InviteButton key={a.to} location="hub-checklist" />
            ) : a.to === "print" ? (
              <PrintDoor key={a.to} />
            ) : (
              <Button
                key={a.to}
                size="sm"
                variant={i === 0 && item.essential ? "default" : "outline"}
              >
                {a.label}
              </Button>
            ),
          )}
        </span>
      ) : null}
    </li>
  );
}

/** `done`, unfolded: Ready for guests, what is worth doing first (the code leading it), then what a guest needs, ticked. */
function ReadyList({ r, onHide }: { r: Readiness; onHide: () => void }) {
  const worth = r.items.filter((i) => !i.essential);
  const needed = r.items.filter((i) => i.essential);
  const left = worth.filter((i) => !i.done).length;
  return (
    <section
      data-checklist=""
      data-ready=""
      data-cw-arrival="done"
      aria-label="Ready for guests"
      className={CARD}
    >
      <div className="space-y-2.5 px-4 pt-3.5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div data-checklist-head="" className="min-w-0 space-y-0.5">
            <h2 className="flex items-center gap-1.5 font-heading text-card-title">
              <Check
                className="size-4 shrink-0 text-success"
                strokeWidth={3}
                aria-hidden
              />
              Ready for guests
            </h2>
            <p className="text-caption text-pretty text-muted-foreground">
              {`${left === 1 ? "One thing" : `${formatCount(left)} things`} worth doing.`}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1">
            <span className="pt-1 text-xs text-muted-foreground tabular-nums">
              {`${formatCount(r.needed.done)} of ${formatCount(r.needed.of)}`}
            </span>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-expanded
              aria-label="Fold the checklist"
              onClick={onHide}
              className="text-muted-foreground aria-expanded:bg-transparent aria-expanded:text-muted-foreground"
            >
              <ChevronUp />
            </Button>
          </span>
        </div>
        <span
          aria-hidden
          className="block h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <span className="block h-full w-full rounded-full bg-success" />
        </span>
      </div>
      <div className="border-t border-border @3xl:grid @3xl:grid-cols-[3fr_2fr]">
        <div>
          <p className="px-4 pt-2.5 text-label font-semibold text-muted-foreground uppercase @3xl:pt-3">
            Worth doing
          </p>
          <ol
            aria-label="Worth doing"
            className="divide-y divide-border @3xl:grid @3xl:grid-cols-3 @3xl:divide-x @3xl:divide-y-0"
          >
            {worth.map((item) => (
              <Row key={item.id} item={item} />
            ))}
          </ol>
        </div>
        <div className="border-t border-border @3xl:border-t-0 @3xl:border-l">
          <p className="px-4 pt-2.5 text-label font-semibold text-muted-foreground uppercase @3xl:pt-3">
            What a guest needs
          </p>
          <ol
            aria-label="What a guest needs"
            className="divide-y divide-border @3xl:grid @3xl:grid-cols-2 @3xl:divide-x @3xl:divide-y-0"
          >
            {needed.map((item) => (
              <Row key={item.id} item={item} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/** The album's View menu, as its head carries it: one quiet group, nothing behind it here. */
const VIEW: readonly ViewMenuGroup[] = [
  {
    id: "filter",
    label: "Filter",
    value: "all",
    onChange: () => {},
    options: [
      { value: "all", label: "All" },
      { value: "deleted", label: "Deleted" },
    ],
  },
];

/**
 * THE ALBUM UNDER IT ALL: production's head (Album, its count, Add photos and View), then her photos, or its empty
 * place in the house's empty voice under every answer (the carried `album`: "The album starts with you", Will's pick
 * for an empty album, the first photos its one door), so the checklist is the only thing an answer changes.
 */
export function HubAlbum({
  photos,
}: {
  photos: readonly { id: string; tile: string }[];
}) {
  return (
    <section aria-label="Album" data-cw-album="" className="space-y-2.5">
      <FeedSectionHeader
        label="Album"
        count={photos.length || undefined}
        action={
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Button variant="outline" size="sm">
              <ImageUp /> Add photos
            </Button>
            <ViewMenu groups={VIEW} />
          </div>
        }
      />
      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 sm:grid-cols-5">
          {photos.map((p) => (
            <span
              key={p.id}
              data-cw-tile=""
              className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-tile)] bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a marketing still standing in for her photo */}
              <img
                src={p.tile}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
            </span>
          ))}
        </div>
      ) : (
        <div data-album-empty="">
          <Empty
            data-arrive
            icon={<Images />}
            title="The album starts with you"
            titleAs="p"
            action={
              <Button variant="outline" size="sm">
                <ImageUp /> Add the first photos
              </Button>
            }
          />
        </div>
      )}
    </section>
  );
}
