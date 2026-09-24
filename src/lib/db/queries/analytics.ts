/**
 * Host-facing link analytics read (Phase 6 cut #3): an event's lifetime QR scans and album views for
 * the event page's "Share with guests" stats line. RLS-scoped, so it uses the regular server client
 * (the signed-in host's JWT).
 *
 * ★ ONE AGGREGATE (the 1,000-row round, 2026-09-23): `event_link_totals(uuid)` sums the per-day
 * `link_stats` counters in SQL and answers one jsonb, `{ "qr_scans": n, "album_views": n }`
 * (`20260924020000_row_cap_host.sql`). The old read summed the day rows in TypeScript, and past about
 * 500 days of traffic (two rows a day) PostgREST's 1,000-row cap stopped the totals growing. The
 * function is SECURITY INVOKER over `link_stats_host_select`, so anyone but the event's host reads
 * zeros, exactly as the direct read behaved.
 */
import "server-only";

import { createClient } from "@/lib/supabase/server";

export type LinkStats = { qrScans: number; albumViews: number };

/** A jsonb counter as a number: a missing or non-numeric one reads 0. */
function counter(totals: unknown, key: string): number {
  if (typeof totals !== "object" || totals === null) return 0;
  const value = Number((totals as Record<string, unknown>)[key]);
  return Number.isFinite(value) ? value : 0;
}

export async function getLinkStats(eventId: string): Promise<LinkStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("event_link_totals", {
    p_event_id: eventId,
  });

  // Best-effort surface: a stats read should never break the event page.
  if (error || !data) return { qrScans: 0, albumViews: 0 };

  return {
    qrScans: counter(data, "qr_scans"),
    albumViews: counter(data, "album_views"),
  };
}
