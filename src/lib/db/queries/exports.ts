/**
 * Admin reads for the export observability surface (`/admin/exports`). The `export_log` + `ops_flags`
 * tables are deny-all, so every read goes through the service-role admin client (the operator portal is
 * already gated by requireAdmin + AAL2 upstream). Powers the recent-exports table, the 24h rejection
 * signal, and the kill-switch's current state.
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type ExportLogRow = {
  id: string;
  created_at: string;
  scope: string;
  eventId: string | null;
  eventName: string | null;
  itemCount: number;
  totalBytes: number;
  outcome: string;
};

/** Recent export ATTEMPTS, newest-first, with the event name resolved for readability. */
export async function listRecentExports(limit = 50): Promise<ExportLogRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("export_log")
    .select("id, created_at, scope, event_id, item_count, total_bytes, outcome")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const rows = data ?? [];

  const ids = [
    ...new Set(rows.map((r) => r.event_id).filter((v): v is string => !!v)),
  ];
  const names = new Map<string, string>();
  if (ids.length) {
    const { data: evs } = await admin
      .from("events")
      .select("id, name")
      .in("id", ids);
    for (const e of evs ?? []) names.set(e.id, e.name);
  }

  return rows.map((r) => ({
    id: r.id,
    created_at: r.created_at,
    scope: r.scope,
    eventId: r.event_id,
    eventName: r.event_id ? (names.get(r.event_id) ?? null) : null,
    itemCount: r.item_count,
    totalBytes: r.total_bytes,
    outcome: r.outcome,
  }));
}

/** Export attempts in the last 24h that did NOT mint (kill-switch / cap / limiter / empty) — the health signal. */
export async function countExportRejections24h(): Promise<number> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await admin
    .from("export_log")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since)
    .neq("outcome", "minted");
  return count ?? 0;
}

/** The export kill-switch state (defaults ON if the row is somehow missing). */
export async function getExportEnabled(): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ops_flags")
    .select("enabled")
    .eq("key", "export_enabled")
    .maybeSingle();
  return data?.enabled ?? true;
}
