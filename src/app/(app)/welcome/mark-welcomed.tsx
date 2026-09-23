"use client";

import { startTransition, useEffect, useRef } from "react";

import { markWelcomedAction } from "@/app/(app)/actions";

/**
 * A GUEST-MADE ACCOUNT'S FIRST VISIT IS ITS WELCOME (`isGuestFirstVisit`, lib/welcome.ts). An account that hosts
 * nothing and already holds the Guest card the capture promised it ("this event came with it") lands on its
 * dashboard rather than the host tour, and the dashboard renders this to mark it welcomed: once, on mount, through
 * the same action every exit of the tour calls.
 *
 * A server action from a client effect because the dashboard is a server component, and `after()` there cannot read
 * the cookies the action's `getUser()` needs. Its own tiny module, never welcome-flow.tsx, so the dashboard does not
 * ship the tour's pictures to mark a timestamp. It renders nothing, and a failed write costs nothing: the marker stays
 * unset, so the next visit is a first visit again and writes it then.
 */
export function MarkWelcomedOnMount() {
  // Strict Mode runs a mount's effects twice in development; one write is enough.
  const marked = useRef(false);
  useEffect(() => {
    if (marked.current) return;
    marked.current = true;
    startTransition(async () => {
      try {
        await markWelcomedAction();
      } catch {
        // Unset still: the next visit decides the same way and retries.
      }
    });
  }, []);
  return null;
}
