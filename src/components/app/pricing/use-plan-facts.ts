"use client";

import { useEffect, useState } from "react";

import { parsePlanFacts, type PlanFacts } from "@/lib/billing/plan-facts";

/**
 * The sheet's one read, made each time it OPENS (the storage guard): what the host
 * stores and, for a Pro host, which price they are on. Every open refreshes it, so
 * a host who removed 40 GB and reopens the sheet sees the smaller size again.
 *
 * `null` means "not known": still loading, signed out (the Library), or a failed
 * read. The sheet then keeps the facts its door passed, and the routes re-check
 * everything anyway, so a missing read costs a mark, never a wrong purchase.
 *
 * State is set only in the fetch's callbacks, never synchronously in the effect
 * (the repo's `react-hooks/set-state-in-effect`), and a reply that lands after the
 * sheet closed or remounted is dropped by the abort.
 */
export function usePlanFacts(open: boolean): PlanFacts | null {
  const [facts, setFacts] = useState<PlanFacts | null>(null);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    fetch("/api/stripe/plan-facts", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (controller.signal.aborted) return;
        const next = parsePlanFacts(data);
        // A failed REFRESH keeps the last good answer rather than blanking it.
        if (next) setFacts(next);
      })
      .catch(() => {
        // Offline, aborted or an HTML error page: keep what we have.
      });
    return () => controller.abort();
  }, [open]);

  return facts;
}
