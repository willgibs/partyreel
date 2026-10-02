"use client";

import { cn } from "@/lib/utils";

import type { DashEvent } from "./fixtures";
import { Still } from "./ui";

/**
 * AN EVENT'S FACE: its cover when it has one, and when it has none, its date.
 *
 * ★ A PARTY THAT HAS NOT HAPPENED HAS NO PHOTOGRAPH, so it never wears a
 * stand-in one: production's cover is the album's newest approved photograph.
 * Production draws the dark gallery ground there; a row of parties still to
 * come then reads as a row of black blanks, heaviest exactly where the page
 * has nothing to show. So the face is the page's own quiet card instead,
 * carrying the one fact an upcoming party has, its day, set like the date on
 * an invitation: the photographs stay the only colour, and a week of parties
 * to come reads as a calendar.
 */

const DAY = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  timeZone: "UTC",
});
const MON = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});
const WKD = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: "UTC",
});

const at = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1));
};

/** Whether the event has a cover to show (its album holds a photograph). */
export const hasCover = (e: DashEvent) => e.facts.approved > 0;

export function Face({
  event,
  size = "md",
  className,
}: {
  event: DashEvent;
  /**
   * How large the date is set when there is no cover: `lg` and `md` a tile's,
   * `sm` a thumbnail's (the day alone, the month over it).
   */
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (hasCover(event))
    return (
      <div
        className={cn("absolute inset-0 overflow-hidden bg-gallery", className)}
      >
        <Still photo={event.cover} />
      </div>
    );
  const date = event.date ? at(event.date) : null;
  return (
    <div
      data-hd-face="date"
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center bg-muted text-foreground",
        size === "sm" ? "" : "pb-6",
        className,
      )}
    >
      {date ? (
        size === "sm" ? (
          <>
            <span className="text-[9px] leading-none font-medium tracking-[0.08em] text-muted-foreground uppercase">
              {MON.format(date)}
            </span>
            <span className="mt-0.5 font-heading text-card-title leading-none tabular-nums">
              {DAY.format(date)}
            </span>
          </>
        ) : (
          <>
            <span className="text-label text-muted-foreground uppercase">
              {`${WKD.format(date)} · ${MON.format(date)}`}
            </span>
            <span
              className={cn(
                "font-heading leading-none tabular-nums",
                size === "lg" ? "mt-2 text-section" : "mt-1 text-section",
              )}
            >
              {DAY.format(date)}
            </span>
          </>
        )
      ) : (
        <span className="text-label text-muted-foreground uppercase">
          No date
        </span>
      )}
    </div>
  );
}
