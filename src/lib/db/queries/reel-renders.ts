/**
 * Admin reads for the reel-render observability surface (`/admin/reels`). The `reel_render_log` +
 * `ops_flags` tables are deny-all, so every read goes through the service-role admin client (the
 * operator portal is already gated by requireAdmin + AAL2 upstream). Powers the recent-renders table,
 * the 24h failure signal, and the kill-switch's current state. Mirrors db/queries/exports.ts.
 */
import "server-only";

import { mustCount, mustQuery } from "@/lib/db/must-query";
import { createAdminClient } from "@/lib/supabase/admin";

export type ReelRenderLogRow = {
  id: string;
  created_at: string;
  eventId: string | null;
  eventName: string | null;
  outcome: string;
  durationSec: number | null;
  costUsd: number | null;
};

/** Recent render events (trigger + completion), newest-first, with the event name resolved. */
export async function listRecentReelRenders(
  limit = 50,
): Promise<ReelRenderLogRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reel_render_log")
    .select("id, created_at, event_id, outcome, duration_sec, cost_usd")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const rows = data ?? [];

  const ids = [
    ...new Set(rows.map((r) => r.event_id).filter((v): v is string => !!v)),
  ];
  const names = new Map<string, string>();
  if (ids.length) {
    const evs = await mustQuery(
      admin.from("events").select("id, name").in("id", ids),
      "admin/reels: event names",
    );
    for (const e of evs ?? []) names.set(e.id, e.name);
  }

  return rows.map((r) => ({
    id: r.id,
    created_at: r.created_at,
    eventId: r.event_id,
    eventName: r.event_id ? (names.get(r.event_id) ?? null) : null,
    outcome: r.outcome,
    durationSec: r.duration_sec,
    costUsd: r.cost_usd,
  }));
}

/** Renders that FAILED (Lambda error/timeout) in the last 24h — the operational red flag. */
export async function countReelRenderFailures24h(): Promise<number> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 86_400_000).toISOString();
  // A failed count resolves as a confident zero, i.e. "no failures" — the exact
  // reading that hides an outage on a health tile. See db/must-query.ts.
  return mustCount(
    admin
      .from("reel_render_log")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since)
      .eq("outcome", "failed"),
    "admin/reels: 24h failures",
  );
}

/** The reel-render kill-switch state (defaults ON only when the row is genuinely absent). */
export async function getReelRenderEnabled(): Promise<boolean> {
  const admin = createAdminClient();
  // Without mustQuery an unreachable ops_flags row reads as `undefined` and the
  // `?? true` silently RE-ENABLES rendering an operator switched off.
  const row = await mustQuery(
    admin
      .from("ops_flags")
      .select("enabled")
      .eq("key", "reel_render_enabled")
      .maybeSingle(),
    "admin/reels: kill switch",
  );
  return row?.enabled ?? true;
}
