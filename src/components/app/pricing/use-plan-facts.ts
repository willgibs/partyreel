"use client";

import { useEffect, useState } from "react";

import { usePricingDoors } from "@/components/app/pricing/pricing-doors";
import { parsePlanFacts, type PlanFacts } from "@/lib/billing/plan-facts";

/**
 * The sheet's one read, made each time it OPENS (the storage guard): what the host
 * stores and, for a Pro host, which price they are on. Every open refreshes it, so
 * a host who removed 40 GB and reopens the sheet sees the smaller size again.
 *
 * `facts` null means "not known": still loading, signed out (the Library), or a failed
 * read. The sheet then keeps the facts its door passed, and the routes re-check
 * everything anyway, so a missing read costs a mark, never a wrong purchase.
 *
 * ★ `settled` TELLS STILL LOADING FROM NEVER COMING (red-team 52's NIT: a Pro host's first open drew her three sizes
 * each with a Switch, her own included, for the two seconds the read took). It turns true once a read has
 * come back either way, and never turns false again: the sheet draws a quiet state while neither facts nor a
 * settled read exist, and the old fallback once a read has failed, since "it still lists the sizes" is what a
 * dropped request must keep. A read that simply never answers settles the same way after `READ_PATIENCE_MS`
 * (the quiet state is for the two seconds Stripe takes, never a dead end), and an answer that comes later still
 * lands.
 *
 * ★ `readAt` IS WHEN THE FACTS WERE READ, for the one thing in them that names a date: the month a figure was
 * measured in (`uploadsPauseNote`). A sheet stays mounted on a page for as long as the page lives, so the clock at
 * mount is the wrong month the day a long-lived page is opened after the month has turned.
 *
 * `reads` asks again while it stays open: the size list stacked over the plan
 * bumps it as it closes after a removal or an Undo, so the rows she returns to
 * are marked on what she stores now.
 *
 * ★ THE READ GOES THROUGH THE SURFACE'S DOORS (`pricing-doors.tsx`): the server's route by default, and what a specimen
 * hands in where there is no server to ask.
 *
 * State is set only in the fetch's callbacks, never synchronously in the effect
 * (the repo's `react-hooks/set-state-in-effect`), and a reply that lands after the
 * sheet closed or remounted is dropped by the abort.
 */
/** How long the sheet waits on its read before it stops being quiet and offers the list as it stands. */
export const READ_PATIENCE_MS = 6000;

export function usePlanFacts(
  open: boolean,
  reads = 0,
): { facts: PlanFacts | null; settled: boolean; readAt: Date | null } {
  const { readFacts } = usePricingDoors();
  const [facts, setFacts] = useState<PlanFacts | null>(null);
  const [settled, setSettled] = useState(false);
  const [readAt, setReadAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const patience = setTimeout(() => {
      if (!controller.signal.aborted) setSettled(true);
    }, READ_PATIENCE_MS);
    readFacts(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        const next = parsePlanFacts(data);
        // A failed REFRESH keeps the last good answer rather than blanking it.
        if (next) {
          setFacts(next);
          setReadAt(new Date());
        }
        setSettled(true);
      })
      .catch(() => {
        // Offline, aborted or an HTML error page: keep what we have. (An abort is the sheet closing or asking
        // again: not a read that came back.)
        if (!controller.signal.aborted) setSettled(true);
      });
    return () => {
      clearTimeout(patience);
      controller.abort();
    };
  }, [open, reads, readFacts]);

  return { facts, settled, readAt };
}
