/**
 * Event reads for the authenticated host. Uses the RLS-scoped server client and
 * re-checks `getUser()` in every function (RLS is the security boundary; the
 * proxy is not — see CLAUDE.md). `events_host_all` already scopes rows to the
 * host, so we never filter by host_id here.
 *
 * Every read filters `deleted_at IS NULL`: soft-deleted rows persist (until the
 * Phase 3 R2 purge) but must never surface, and only deletion frees an event
 * slot (anti-abuse — see tiers.ts).
 *
 * SECURITY: these feed the host UI (incl. the "use client" EventSettingsForm), so
 * the rows are mapped to `HostEvent`, which DROPS `event_password_hash`. We read the
 * hash server-side only to derive `has_password`, then discard it — it must never be
 * serialized into a Client Component payload.
 */
import "server-only";

import type { Tables } from "@/lib/db/types";
import { createClient } from "@/lib/supabase/server";

/** A host event row with the bcrypt password hash dropped + `has_password` derived. */
export type HostEvent = Omit<Tables<"events">, "event_password_hash"> & {
  has_password: boolean;
};

function toHostEvent(row: Tables<"events">): HostEvent {
  // `event_password_hash` is referenced (to derive the boolean) but excluded from
  // `rest`, so the returned object never carries the hash.
  const { event_password_hash, ...rest } = row;
  return { ...rest, has_password: event_password_hash != null };
}

export async function listEvents(): Promise<HostEvent[]> {
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
  return (data ?? []).map(toHostEvent);
}

export async function getEvent(id: string): Promise<HostEvent | null> {
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
  return data ? toHostEvent(data) : null;
}

/** Counts the host's existing (non-deleted) events — the number compared to
 * `MAX_EVENTS[tier]` for the dashboard's "X of N used" + cap gate. */
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
