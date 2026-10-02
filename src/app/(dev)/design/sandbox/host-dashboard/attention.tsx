"use client";

import { Bell, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import { Face, hasCover } from "./face";
import type { DashEvent, Host } from "./fixtures";
import { isEvening, type Item, itemFor, phaseOf, whenOf } from "./model";
import { Dot, Eyebrow, Mark, useWide } from "./ui";

/**
 * WHAT ASKS FOR ATTENTION, IN EACH OF ITS FORMS: the week's parties as a row
 * of cards, the three that matter most as three wide tiles, the desk's list.
 * Which items each shows is the rule's (`model.ts`), and every item names
 * its event and when, so nothing on the page is a step without a party.
 */

const when = (host: Host, e: DashEvent) =>
  whenOf(e.date, host.today, isEvening(host.clock));

const eventOf = (host: Host, i: Item) =>
  host.events.find((e) => e.id === i.eventId) ?? null;

/** An item's act as a small button: the page's one verb for it. */
function Act({ item, size = "sm" }: { item: Item; size?: "sm" | "xs" }) {
  return (
    <Button
      size={size}
      variant={item.tone === "waiting" ? "default" : "outline"}
      tabIndex={-1}
      data-hd-act={item.kind}
    >
      {item.act}
    </Button>
  );
}

/** What a party in the week says when nothing is asked of it. */
function quietLine(host: Host, e: DashEvent): string {
  const phase = phaseOf(e.date, host.today);
  if (phase === "before") return "Ready for guests";
  return `${formatCount(e.facts.approved)} photos`;
}

/* ── the week ───────────────────────────────────────────────────────────── */

/**
 * THIS WEEK: every party inside seven days of today, either way, nearest
 * first, each with its one step or, when it has none, its quiet state. The
 * stage's own event is left out (it is on the stage), and a party with
 * nothing asked still stands here, because "ready" is the answer a planner
 * looks for on a Friday.
 */
export function WeekRow({
  host,
  events,
  items,
}: {
  host: Host;
  events: readonly DashEvent[];
  /** The items the rule put on the page. */
  items: readonly Item[];
}) {
  const wide = useWide();
  if (events.length === 0) return null;
  const itemOf = (e: DashEvent) =>
    items.find((i) => i.eventId === e.id) ?? null;
  const needing = events.filter((e) => itemOf(e)).length;
  return (
    <section
      data-hd-week={events.length}
      aria-label="This week"
      className="space-y-3"
    >
      <div className="flex items-baseline justify-between gap-4">
        <Eyebrow>This week</Eyebrow>
        <p className="text-xs text-muted-foreground">
          {needing === 0
            ? "Nothing needs you"
            : `${formatCount(needing)} of ${formatCount(events.length)} need you`}
        </p>
      </div>
      {wide ? (
        <ul className="grid grid-cols-5 gap-4">
          {events.slice(0, 5).map((e) => {
            const item = itemOf(e);
            return (
              <li key={e.id} data-hd-week-card={item?.kind ?? "quiet"}>
                <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
                  <Face event={e} size="md" />
                  {phaseOf(e.date, host.today) === "live" && (
                    <span className="absolute top-2 left-2">
                      <Mark tone="live" on={hasCover(e) ? "photo" : "page"}>
                        Live
                      </Mark>
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {when(host, e)}
                </p>
                <h3 className="mt-0.5 truncate font-heading text-card-title">
                  {e.name}
                </h3>
                <div className="mt-2.5 flex min-h-8 items-center justify-between gap-2">
                  {item ? (
                    <>
                      <span className="flex min-w-0 items-center gap-2 text-sm">
                        <Dot
                          tone={item.tone === "waiting" ? "waiting" : "setup"}
                          className={
                            item.tone === "waiting"
                              ? ""
                              : "text-muted-foreground"
                          }
                        />
                        <span className="truncate">{item.line}</span>
                      </span>
                      <Act item={item} size="xs" />
                    </>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Check className="size-3.5 text-success" aria-hidden />
                      {quietLine(host, e)}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {events.map((e) => {
            const item = itemOf(e);
            return (
              <li
                key={e.id}
                data-hd-week-card={item?.kind ?? "quiet"}
                className="flex items-center gap-3 p-3"
              >
                <div className="relative size-12 shrink-0 overflow-hidden rounded-md">
                  <Face event={e} size="sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.name}</p>
                  <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    {when(host, e)}
                    {" · "}
                    {item ? item.line : quietLine(host, e)}
                  </p>
                </div>
                {item ? (
                  <Act item={item} size="xs" />
                ) : (
                  <Check className="size-4 text-success" aria-hidden />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ── the three ──────────────────────────────────────────────────────────── */

/** One wide tile: the event's face, the step large, its party and when, its act. */
function ItemTile({ host, item }: { host: Host; item: Item }) {
  const e = eventOf(host, item);
  return (
    <li
      data-hd-three={item.kind}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-3 pr-4"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
        {e ? (
          <Face event={e} size="sm" />
        ) : (
          <div className="absolute inset-0 bg-muted" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-heading text-card-title">
          <span className="truncate">{item.line}</span>
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {e ? `${e.name} · ${when(host, e)}` : host.plan.name}
        </p>
      </div>
      <Act item={item} />
    </li>
  );
}

/**
 * THE THREE THAT MATTER MOST, by `itemsOf`'s one order. The stage's own item,
 * when it is among them, stays on the stage, so the tiles hold the rest; the
 * bell lists everything in the same order, so its first three are these.
 */
export function ThreeRow({
  host,
  items,
  onStage,
  more,
}: {
  host: Host;
  items: readonly Item[];
  /** The stage's event, whose item the stage already asks. */
  onStage: string | null;
  /** Items past the three, in the bell. */
  more: number;
}) {
  const wide = useWide();
  const shown = items.filter((i) => i.eventId !== onStage);
  if (shown.length === 0 && more === 0) return null;
  return (
    <section
      data-hd-three-row={shown.length}
      aria-label="Needs you"
      className="space-y-3"
    >
      <div className="flex items-baseline justify-between gap-4">
        <Eyebrow>Needs you</Eyebrow>
        {more > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Bell className="size-3.5" aria-hidden />
            {`${formatCount(more)} more in the bell`}
          </p>
        )}
      </div>
      <ul
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${wide ? Math.max(shown.length, 2) : 1}, minmax(0, 1fr))`,
        }}
      >
        {shown.map((i) => (
          <ItemTile key={i.key} host={host} item={i} />
        ))}
      </ul>
    </section>
  );
}

/** The desk row's step, by screen: the face at a desk, Inter's weight in a hand (never one class expression). */
const STEP_WIDE = "font-heading text-subsection";
const STEP_HAND = "text-sm font-medium";

/* ── the desk ───────────────────────────────────────────────────────────── */

/**
 * An item's place on the desk's agenda: people at a door are Now, a queue is
 * Waiting, and a party's setup sits on its own day, so the list reads down
 * the evening and the week rather than as a pile.
 */
function agendaOf(host: Host, i: Item, e: DashEvent | null): string {
  if (i.kind === "door" || i.kind === "storage") return "Now";
  if (i.kind === "review") return "Waiting";
  return e ? when(host, e) : "Soon";
}

/**
 * THE DESK'S LIST, AS AN AGENDA: what needs doing, most important first, each
 * row its place in the evening or the week, the party's face, the step set
 * large over its party, and the act in place. Empty, it says so in one line.
 */
export function DeskList({
  host,
  items,
  more,
}: {
  host: Host;
  items: readonly Item[];
  /** Items past the list, in the bell. */
  more: number;
}) {
  const wide = useWide();
  return (
    <section
      data-hd-desk={items.length}
      aria-label="What needs you"
      className="space-y-3"
    >
      {items.length === 0 ? (
        <p className="flex items-center gap-2 rounded-xl border border-border px-5 py-6 text-sm text-muted-foreground">
          <Check className="size-4 text-success" aria-hidden />
          Nothing needs you. Your events are open and your guests can add to
          them.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {items.map((i) => {
            const e = eventOf(host, i);
            const agenda = agendaOf(host, i, e);
            return (
              <li
                key={i.key}
                data-hd-desk-row={i.kind}
                className={cn(
                  "flex items-center",
                  wide ? "gap-5 px-5 py-3.5" : "gap-3 p-3",
                )}
              >
                {wide && (
                  <span
                    className={cn(
                      "w-24 shrink-0 text-sm",
                      agenda === "Now"
                        ? "font-medium text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {agenda}
                  </span>
                )}
                <div
                  className={cn(
                    "relative shrink-0 overflow-hidden rounded-lg",
                    wide ? "h-14 w-20" : "size-12",
                  )}
                >
                  {e ? (
                    <Face event={e} size="sm" />
                  ) : (
                    <div className="absolute inset-0 bg-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {!wide && (
                    <p className="text-[11px] text-muted-foreground">
                      {agenda}
                    </p>
                  )}
                  <p
                    className={cn(
                      "flex items-center gap-2.5",
                      wide ? STEP_WIDE : STEP_HAND,
                    )}
                  >
                    <Dot
                      tone={i.tone === "waiting" ? "waiting" : "setup"}
                      className={
                        i.tone === "waiting" ? "" : "text-muted-foreground"
                      }
                    />
                    <span className="truncate">{i.line}</span>
                  </p>
                  <p
                    className={cn(
                      "truncate text-muted-foreground",
                      wide ? "mt-0.5 pl-[18px] text-sm" : "pl-[18px] text-xs",
                    )}
                  >
                    {e ? e.name : host.plan.name}
                  </p>
                </div>
                <Act item={i} size={wide ? "sm" : "xs"} />
              </li>
            );
          })}
        </ul>
      )}
      {more > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Bell className="size-3.5" aria-hidden />
          {`${formatCount(more)} more in the bell`}
        </p>
      )}
    </section>
  );
}

/** The head's line for the shelf: what the rule asks of the page, in a phrase. */
export function NeedsLine({
  items,
  rule,
}: {
  items: readonly Item[];
  rule: "bell" | "week" | "three";
}) {
  if (rule === "bell" || items.length === 0) return null;
  const waiting = items.filter((i) => i.tone === "waiting").length;
  const setup = items.length - waiting;
  const span = rule === "week" ? " this week" : "";
  const parts = [
    waiting > 0 ? `${formatCount(waiting)} waiting now` : null,
    setup > 0 ? `${formatCount(setup)} to set up${span}` : null,
  ].filter(Boolean);
  return (
    <p
      data-hd-needs-line={items.length}
      className="flex items-center gap-2 text-sm text-muted-foreground"
    >
      <Dot tone={waiting > 0 ? "waiting" : "setup"} />
      {parts.join(" · ")}
    </p>
  );
}

/** Whether an item belongs to an event, for the tiles' step marks. */
export const itemOfEvent = (host: Host, e: DashEvent) => itemFor(e, host);
