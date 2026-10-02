import type { ReactNode } from "react";

import { EventsEmptyTeaser } from "@/components/app/dashboard/events-empty-teaser";
import { EventsSection } from "@/components/app/dashboard/events-section";
import { HomeHead } from "@/components/app/dashboard/home-head";
import { Stage } from "@/components/app/dashboard/stage";
import { WeekRow } from "@/components/app/dashboard/week-row";
import type { HomeContext } from "@/lib/dashboard/home-event";
import type { HomeView } from "@/lib/dashboard/home-view";
import type { EventsView } from "@/lib/dashboard/events-view";

/**
 * THE HOST'S HOME, COMPOSED (host-dashboard r1, Will 2026-10-02): the day and its slim head, the party
 * of the moment on its stage, this week's parties, and everything else grouped by when. Every piece
 * reads one answer (`buildHomeView`), and what only the server can draw (the purchase's welcome, the
 * grace banner, the claims review and the page invite) arrives in its own slot, in the place it has
 * always had: the alert under the head, the claims and the invite just above the events.
 *
 * ★ JUST ARRIVED WENT (`arrivals=live`: "Doesn't need its own section for sure"): a party's photographs
 * land on its stage on its own day, and every other day the page is still.
 */
export function DashboardHome({
  head,
  view,
  ctx,
  initialView,
  storage,
  top,
  alert,
  notes,
}: {
  head: { day: string; line: string };
  view: HomeView;
  ctx: HomeContext;
  /** The events view the cookie asked for. */
  initialView: EventsView;
  /** The storage ring (`StorageMeter`). */
  storage: ReactNode;
  /** What draws nothing in place: the purchase's welcome, a guest's first visit marked. */
  top?: ReactNode;
  /** The grace banner, under the head. */
  alert?: ReactNode;
  /** The claims review's line and the page invite, above the events. */
  notes?: ReactNode;
}) {
  const { stage, week, events } = view;
  return (
    // ★ WIDE, LIKE THE ALBUM (his `album-columns` note): `data-app-wide` drops the shell's 1280 cap and
    // takes the album's gutter, and every grid below grows its columns with the window.
    <div data-app-wide data-home="" className="space-y-7 lg:space-y-9">
      {top}
      <HomeHead day={head.day} line={head.line} storage={storage} />
      {alert}
      {stage && (
        <Stage
          // A new party of the moment is a new stage: its live state never carries over.
          key={stage.event.id}
          event={stage.event}
          ctx={ctx}
          guests={stage.guests}
          photos={stage.photos}
          share={stage.share}
          qrToken={stage.event.qrToken}
        />
      )}
      <WeekRow cards={week} />
      {notes}
      {view.hasAny ? (
        <EventsSection
          rows={events.rows}
          seasons={events.seasons}
          initialView={initialView}
          title={events.title}
        />
      ) : (
        <EventsEmptyTeaser />
      )}
    </div>
  );
}
