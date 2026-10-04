"use client";

import { startTransition, useEffect, useRef } from "react";

import { noteEventOpenedAction } from "@/app/(app)/dashboard/actions";

/**
 * THE HUB COUNTS AS AN OPEN (crumbs-69). Recent and Last opened read `events.host_opened_at`, and only a press from her
 * dashboard stamped it (`HomeShell`'s one listener), so an event she reached by a deep link, the bell or an email never
 * moved either. Every one of those lands on the hub, so the hub stamps itself: once, on mount, through the same action
 * (`noteEventOpenedAction`: hers under RLS, and at most once a minute an event in the database's own filter).
 *
 * ★ ONE SERVER FUNCTION CALL A HUB VISIT, AND NEVER MORE: no poll, no timer, no listener for the tab coming back to the
 * front, so a hub left open all evening costs what one opened for a second does. The filter spares the write (a reload
 * inside the minute, or the press from the dashboard that stamped it a moment ago, finds no row to move), not the call,
 * which is why the call is asked once and never repeated.
 *
 * A Server Function from a client effect because the hub is a server component, and `after()` there cannot read the
 * cookies the action's `getUser()` needs (`MarkWelcomedOnMount`, the same shape). It draws nothing, and a failed stamp
 * costs one Recent order, never the page: the action says it once where failures are read (`seam: "event_opened"`), and
 * the next visit stamps it again.
 */
export function HubOpened({ eventId }: { eventId: string }) {
  // Strict Mode runs a mount's effects twice in development; one call is enough. Keyed by the event, so a hub handed
  // another event opens that one too, and a fresh mount (Back into the hub) is a new visit.
  const stamped = useRef<string | null>(null);
  useEffect(() => {
    if (stamped.current === eventId) return;
    stamped.current = eventId;
    startTransition(async () => {
      try {
        await noteEventOpenedAction(eventId);
      } catch {
        // Best effort: the next visit stamps it again.
      }
    });
  }, [eventId]);
  return null;
}
