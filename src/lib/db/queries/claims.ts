/**
 * The claim ticket's data (the guest identity round, 2026-09-22; rulings.md
 * "guest identity: name only, unconfirmed email, verified account"). A guest
 * who typed an email at a names-mode door left it unconfirmed and inert
 * (guests.pending_email); once the CALLER confirms that same address on their
 * own account, this is what tells the dashboard which of their past rows are
 * waiting to be claimed.
 */
import "server-only";

import { getRequestAuth } from "@/lib/supabase/request-auth";

/** One event's claimable rows, already grouped (see below). */
export type ClaimableEventRow = {
  eventId: string;
  eventName: string;
  /** Null for a password-gated event (the RPC withholds it, QA #40's rule). */
  eventDate: string | null;
  /** Every distinct typed name found under this address at this event
   *  (a row minted before the door required a name can contribute none). */
  names: string[];
  uploadCount: number;
  /** ISO timestamp, or null when nothing was ever uploaded under the row. */
  lastUploadAt: string | null;
};

/**
 * Events with rows waiting for the CONFIRMED caller's own address, for the
 * dashboard's claim card. The RPC (`list_guest_rows_by_email`) is the one
 * caller: an unconfirmed session, or an account whose own email is not yet
 * proved, gets [] straight from it (defence in depth — auth.uid() plus
 * email_confirmed_at inside the function), so this never needs its own gate
 * beyond "is anyone signed in at all".
 *
 * GROUPED BY EVENT, deliberately. The same address can carry more than one
 * guest row at one event (a second device, a second visit before signing
 * in), and both `claim_guest_rows_by_email` and `disown_guest_rows_by_email`
 * act on every matching row for an event id in one call — so the ticket
 * offers one decision per EVENT, never one per row. Upload counts sum across
 * the group, the most recent upload timestamp wins, and every distinct typed
 * name is kept (a blank/null name, from a row minted before the door made a
 * name mandatory, contributes nothing to the list). The group's rank is its
 * best (lowest) member index, so the result keeps the RPC's own order —
 * most recently active first.
 */
export async function getMyClaimableGuestRows(): Promise<ClaimableEventRow[]> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return [];

  const { data, error } = await supabase.rpc("list_guest_rows_by_email");
  if (error) throw error;

  type Group = {
    eventId: string;
    eventName: string;
    eventDate: string | null;
    names: Set<string>;
    uploadCount: number;
    lastUploadAt: string | null;
    rank: number;
  };
  const byEvent = new Map<string, Group>();

  (data ?? []).forEach((row, index) => {
    const name = row.display_name?.trim();
    const existing = byEvent.get(row.event_id);
    if (!existing) {
      byEvent.set(row.event_id, {
        eventId: row.event_id,
        eventName: row.event_name,
        eventDate: row.event_date,
        names: new Set(name ? [name] : []),
        uploadCount: row.upload_count,
        lastUploadAt: row.last_upload_at,
        rank: index,
      });
      return;
    }
    if (name) existing.names.add(name);
    existing.uploadCount += row.upload_count;
    if (
      row.last_upload_at &&
      (!existing.lastUploadAt || row.last_upload_at > existing.lastUploadAt)
    ) {
      existing.lastUploadAt = row.last_upload_at;
    }
    existing.rank = Math.min(existing.rank, index);
  });

  return [...byEvent.values()]
    .sort((a, b) => a.rank - b.rank)
    .map((g) => ({
      eventId: g.eventId,
      eventName: g.eventName,
      eventDate: g.eventDate,
      names: [...g.names],
      uploadCount: g.uploadCount,
      lastUploadAt: g.lastUploadAt,
    }));
}
