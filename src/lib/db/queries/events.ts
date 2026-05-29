/**
 * Event reads for the authenticated host. Uses the RLS-scoped server client and
 * re-checks `getUser()` in every function (RLS is the security boundary; the
 * proxy is not — see CLAUDE.md). `events_host_all` already scopes rows to the
 * host, so we never filter by host_id here.
 *
 * Every read filters `deleted_at IS NULL`: soft-deleted rows persist (until the
 * Phase 3 R2 purge) but must never surface, and only deletion frees an event
 * slot (anti-abuse — see tiers.ts).
 */
import "server-only";

import type { Tables } from "@/lib/db/types";
import { createClient } from "@/lib/supabase/server";

export type EventRow = Tables<"events">;

export async function listEvents(): Promise<EventRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getEvent(id: string): Promise<EventRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Counts the host's existing (non-deleted) events — the number compared to
 * `TIER_LIMITS[tier].maxEvents` for the dashboard's "X of N used" + cap gate. */
export async function countActiveEvents(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null);
  if (error) throw error;
  return count ?? 0;
}
