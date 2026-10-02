import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";

import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { trackAttrs } from "@/lib/analytics/events";

/**
 * THE PAGE'S HEAD (host-dashboard r1, the carried `head` call): the day, then the storage ring and New
 * event in one slim row. The Dashboard title and its "X of N used" line went with the full-width storage
 * line: the page is today's, so it is headed by the day, and what the plan holds is the ring's and its
 * popover's to say. In a hand the ring joins the line under the day, so the day and New event keep the
 * first row whole at 375.
 *
 * ★ NEW EVENT IS UNCONDITIONAL, AND LIVE AT THE CAP (`limit=door`, Will 2026-09-21): the route is the
 * refusal, naming the plan's number, the event holding the slot and both ways forward, so the door has
 * to open for that to be reachable at all.
 */
export function HomeHead({
  day,
  line,
  storage,
}: {
  /** "Friday, October 2": the viewer's own day. */
  day: string;
  /** "3 events · Pro". */
  line: string;
  /** The storage ring (`StorageMeter`), its popover with it. */
  storage: ReactNode;
}) {
  return (
    <div
      data-home-head=""
      className="flex flex-wrap items-center gap-x-3 gap-y-0.5 sm:gap-x-4"
    >
      {/* `flex-auto`, never `flex-1`: a zero basis would let the line squeeze onto the day's row. */}
      <PageHeading className="order-1 min-w-0 flex-auto truncate text-subsection sm:flex-none sm:text-page">
        {day}
      </PageHeading>
      <p className="order-3 text-sm text-muted-foreground sm:order-2">{line}</p>
      <div className="order-4 -ml-2 sm:order-3 sm:ml-auto">{storage}</div>
      <Button asChild className="order-2 sm:order-4">
        <Link
          href="/dashboard/new"
          {...trackAttrs("cta_click", {
            cta: "new-event",
            location: "dashboard",
          })}
        >
          <CalendarPlus /> New event
        </Link>
      </Button>
    </div>
  );
}
