import type { ReactNode } from "react";

import { EventsEmptyTeaser } from "@/components/app/dashboard/events-empty-teaser";
import { EventsSection } from "@/components/app/dashboard/events-section";
import { HomeHead } from "@/components/app/dashboard/home-head";
import { HomeShell } from "@/components/app/dashboard/home-shell";
import { Stage } from "@/components/app/dashboard/stage";
import { WeekRow } from "@/components/app/dashboard/week-row";
import {
  type Display,
  RECENT_FROM,
  recentRowsOf,
} from "@/lib/dashboard/display";
import type { HomeContext } from "@/lib/dashboard/home-event";
import type { HomeView } from "@/lib/dashboard/home-view";

/**
 * THE HOST'S HOME, COMPOSED (host-dashboard r1, Will 2026-10-02): the day and its slim head, the party
 * of the moment on its stage, this week's parties, and everything else as she shapes it. Every piece
 * reads one answer (`buildHomeView`), and what only the server can draw (the purchase's welcome, the
 * grace banner, the claims review and the page invite) arrives in its own slot, in the place it has
 * always had: the alert under the head, the claims and the invite just above the events.
 *
 * ★ JUST ARRIVED WENT (`arrivals=live`: "Doesn't need its own section for sure"): a party's photographs
 * land on its stage on its own day, and every other day the page is still.
 *
 * ★ EVERYTHING ELSE IS HERS TO SHAPE (host-dashboard r3, `events=menu`): the Recent row over her events,
 * decided here on the server (from seven events, the four she opened last, never the stage's or this week's),
 * and her events through her own Display, kept on her account and resolved before the first byte.
 */
export function DashboardHome({
  head,
  view,
  ctx,
  display,
  storage,
  top,
  alert,
  notes,
}: {
  head: { day: string; line: string };
  view: HomeView;
  ctx: HomeContext;
  /** Her kept choices for her events (`resolveDisplay` of her profile), so the first paint is already hers. */
  display: Display;
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
  // From seven events (hers hosted and added to, the stage's included) the Recent row is worth its place.
  const total =
    events.rows.filter((r) => r.kind !== "deleted").length + (stage ? 1 : 0);
  const recent =
    total >= RECENT_FROM
      ? recentRowsOf(events.rows, new Set(week.map((c) => c.id)))
      : [];
  return (
    // ★ WIDE, LIKE THE ALBUM (his `album-columns` note): `data-app-wide` drops the shell's 1280 cap and
    // takes the album's gutter, and every grid below grows its columns with the window. It is also where an
    // event's open is heard (`home-shell.tsx`).
    <HomeShell>
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
          today={ctx.today}
          initial={display}
          recent={recent}
        />
      ) : (
        <EventsEmptyTeaser />
      )}
    </HomeShell>
  );
}
