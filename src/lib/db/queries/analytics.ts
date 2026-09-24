/**
 * Host-facing link analytics read (Phase 6 cut #3). RLS-scoped — the
 * `link_stats_host_select` policy lets a host read only their own events' rows — so this
 * uses the regular server client (the signed-in host's JWT). Sums the per-day counters
 * into lifetime totals per kind for the event page's "Share with guests" stats line.
 */
import "server-only";

import { createClient } from "@/lib/supabase/server";

export type LinkStats = { qrScans: number; albumViews: number };

export async function getLinkStats(eventId: string): Promise<LinkStats> {
  const supabase = await createClient();
  // row-cap-todo: M4 lifetime totals summed from per-day rows cut at 1,000
  const { data, error } = await supabase
    .from("link_stats")
    .select("kind, count")
    .eq("event_id", eventId);

  // Best-effort surface: a stats read should never break the event page.
  if (error || !data) return { qrScans: 0, albumViews: 0 };

  let qrScans = 0;
  let albumViews = 0;
  for (const row of data) {
    if (row.kind === "qr_scan") qrScans += row.count;
    else if (row.kind === "album_view") albumViews += row.count;
  }
  return { qrScans, albumViews };
}
