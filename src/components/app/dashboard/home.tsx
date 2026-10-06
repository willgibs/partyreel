import type { ReactNode } from "react";

import { HomeBody } from "@/components/app/dashboard/home-body";
import { HomeHead } from "@/components/app/dashboard/home-head";
import { HomeShell } from "@/components/app/dashboard/home-shell";
import type { Display } from "@/lib/dashboard/display";
import type { HomeContext } from "@/lib/dashboard/home-event";
import type { HomeView } from "@/lib/dashboard/home-view";
import { drawnOf, type Leading } from "@/lib/dashboard/leading";

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
 * ★ EVERYTHING ELSE IS HERS TO SHAPE (host-dashboard r3, `events=menu`): the Recent row over her events (from seven
 * events, the four she opened last, never the stage's or this week's), and her events through her own Display, kept on
 * her account and resolved before the first byte.
 *
 * ★ WHAT LEADS THE STAGE IS HERS TOO (host-dashboard r4, `chooser=words`), so everything under the head is composed on
 * the client (`home-body.tsx`) around whatever her rule leads with: a press of another rule moves the stage, the week and
 * her events in the same frame, from what this server render sends (`leading`), and the Recent row follows them. This
 * file keeps what only the server can draw, in its own slot, and the head.
 */
export function DashboardHome({
  head,
  view,
  leading = null,
  ctx,
  owner,
  display,
  storage,
  top,
  alert,
  notes,
}: {
  head: { day: string; line: string };
  view: HomeView;
  /** What moving the stage to another rule's event takes, or null where she has no choice (`leadingOf`). */
  leading?: Leading | null;
  ctx: HomeContext;
  /** Whose home this is (her profile's id), for what the browser remembers of it. */
  owner: string;
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
  return (
    // ★ WIDE, LIKE THE ALBUM (his `album-columns` note): `data-app-wide` drops the shell's 1280 cap and
    // takes the album's gutter, and every grid below grows its columns with the window. It is also where an
    // event's open is heard (`home-shell.tsx`).
    <HomeShell>
      {top}
      <HomeHead day={head.day} line={head.line} storage={storage} />
      {alert}
      <HomeBody
        drawn={drawnOf(view)}
        hasAny={view.hasAny}
        ctx={ctx}
        owner={owner}
        display={display}
        leading={leading}
        notes={notes}
      />
    </HomeShell>
  );
}
