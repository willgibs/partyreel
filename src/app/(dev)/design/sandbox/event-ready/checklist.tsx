"use client";

import { Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { Readiness, ReadyItem } from "./readiness";

/**
 * THE CHECKLIST, DRAWN: the lane's proposal for what a host reads, in the
 * product's own materials (the settings card's surface and hairline, its
 * caption step, the storage goal strip's bar and its success tick), so every
 * home the board asks about hangs the same object.
 *
 * ★ TWO GROUPS, ONE BAR. What a guest needs (the door, uploads, the code) is
 * what the bar measures, so a full bar IS ready (the carried `ready` call);
 * what is worth doing (the first photos, the welcome) sits under its own
 * small label and never holds the bar back.
 *
 * ★ A DONE ROW STAYS, TICKED AND QUIET. "So they know everything is ready" is
 * the note: a host reads the whole event and sees it ticked, rather than a
 * to-do list that empties into nothing. A row not done carries the one or two
 * doors that finish it, and nothing else does.
 *
 * ★ IT READS ITS OWN WIDTH, NOT THE SCREEN'S: a container query lays the rows
 * side by side where the list has the room (the hub at a desk) and stacks them
 * where it has not (a phone, and Settings' panel at a desk, whose window is
 * wide but whose panel is 28rem).
 */

export function headOf(r: Readiness): { title: string; line: string } {
  const worth = r.left.filter((i) => !i.essential).length;
  if (r.ready && worth === 0)
    return { title: "Ready for guests", line: "Everything is set." };
  if (r.ready)
    return {
      title: "Ready for guests",
      line: `${worth === 1 ? "One thing" : `${worth} things`} still worth doing.`,
    };
  const more = r.needed.of - r.needed.done;
  return {
    title: "Before guests arrive",
    line: `${more === 1 ? "One more thing" : `${more} more things`} before a guest can get in and add.`,
  };
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

function Bar({ r }: { r: Readiness }) {
  const pct = Math.round((r.needed.done / r.needed.of) * 100);
  return (
    <span
      aria-hidden
      className="block h-1.5 overflow-hidden rounded-full bg-muted"
    >
      <span
        className={cn(
          "block h-full rounded-full transition-[width,background-color] duration-300 ease-emphasis motion-reduce:transition-none",
          r.ready ? "bg-success" : "bg-foreground/70",
        )}
        style={{ width: `${Math.max(pct, 4)}%` }}
      />
    </span>
  );
}

function Row({ item }: { item: ReadyItem }) {
  return (
    <li
      data-er-item={item.id}
      data-done={item.done ? "" : undefined}
      className="flex items-start gap-3 px-4 py-3 @3xl:flex-col @3xl:gap-2 @3xl:px-4 @3xl:py-3.5"
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
            {item.line}
          </span>
        </span>
      </span>
      {item.actions.length > 0 ? (
        <span className="flex shrink-0 flex-wrap justify-end gap-1.5 @3xl:justify-start @3xl:pl-8">
          {item.actions.map((a, i) => (
            <Button
              key={a.to}
              size="sm"
              variant={item.essential && i === 0 ? "default" : "outline"}
              tabIndex={-1}
            >
              {a.label}
            </Button>
          ))}
        </span>
      ) : null}
    </li>
  );
}

/** The whole list, head, bar and its two groups. `home` is where it stands, for the caption. */
export function ReadyList({
  r,
  home,
  className,
}: {
  r: Readiness;
  home: string;
  className?: string;
}) {
  const head = headOf(r);
  const needed = r.items.filter((i) => i.essential);
  const worth = r.items.filter((i) => !i.essential);
  return (
    <section
      data-er-list=""
      data-er-home={home}
      aria-label={head.title}
      className={cn(
        "@container overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10",
        className,
      )}
    >
      <div className="space-y-2.5 px-4 pt-3.5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div data-er-list-head className="min-w-0 space-y-0.5">
            <h2 className="flex items-center gap-1.5 font-heading text-card-title">
              {r.ready ? (
                <Check
                  className="size-4 shrink-0 text-success"
                  strokeWidth={3}
                  aria-hidden
                />
              ) : null}
              {head.title}
            </h2>
            <p className="text-caption text-pretty text-muted-foreground">
              {head.line}
            </p>
          </div>
          <span className="shrink-0 pt-1 text-xs text-muted-foreground tabular-nums">
            {`${r.needed.done} of ${r.needed.of}`}
          </span>
        </div>
        <Bar r={r} />
      </div>
      <div className="border-t border-border @3xl:grid @3xl:grid-cols-[3fr_2fr]">
        <div>
          {/* Side by side, both groups are named, so their rows start level. */}
          <p className="hidden px-4 pt-3 text-label font-semibold text-muted-foreground uppercase @3xl:block">
            What a guest needs
          </p>
          <ol className="divide-y divide-border @3xl:grid @3xl:grid-cols-3 @3xl:divide-x @3xl:divide-y-0">
            {needed.map((item) => (
              <Row key={item.id} item={item} />
            ))}
          </ol>
        </div>
        {worth.length > 0 ? (
          <div className="border-t border-border @3xl:border-t-0 @3xl:border-l">
            <p className="px-4 pt-2.5 text-label font-semibold text-muted-foreground uppercase @3xl:pt-3">
              Worth doing
            </p>
            <ol className="divide-y divide-border @3xl:grid @3xl:grid-cols-2 @3xl:divide-x @3xl:divide-y-0">
              {worth.map((item) => (
                <Row key={item.id} item={item} />
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/**
 * THE LIST FOLDED TO ONE LINE (the `head` home, once the album has photos):
 * the album takes the page back, and what is left stays one tap away above it.
 */
export function ReadyLine({ r, home }: { r: Readiness; home: string }) {
  const head = headOf(r);
  const needed = r.left
    .filter((i) => i.essential)
    .map((i) => i.title.toLowerCase());
  const worth = r.left.filter((i) => !i.essential).length;
  return (
    <div
      data-er-list=""
      data-er-home={home}
      data-er-folded=""
      className="flex items-center gap-3 rounded-xl bg-card px-4 py-2.5 text-card-foreground ring-1 ring-foreground/10"
    >
      <Ring r={r} />
      <span className="min-w-0 flex-1">
        <span data-er-list-head className="block truncate text-sm font-medium">
          {head.title}
          <span className="font-normal text-muted-foreground">
            {r.ready ? `, ${worth} worth doing` : `: ${needed.join(", ")}`}
          </span>
        </span>
      </span>
      <Button size="sm" variant="ghost" tabIndex={-1} className="shrink-0">
        Show
        <ChevronDown />
      </Button>
    </div>
  );
}

/** A small progress ring: the folded line's one glance at how far she is. */
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
        className={r.ready ? "stroke-success" : "stroke-foreground/70"}
      />
    </svg>
  );
}
