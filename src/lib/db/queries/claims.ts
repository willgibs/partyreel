/**
 * The claim ticket's data (the guest identity round, 2026-09-22; "guest
 * identity: name only, unconfirmed email, verified account"). A guest
 * who typed an email at a names-mode door left it unconfirmed and inert
 * (guests.pending_email); once the CALLER confirms that same address on their
 * own account, this is what tells the dashboard which of their past rows are
 * waiting to be claimed.
 */
import "server-only";

import { readAllPages } from "@/lib/db/read-all";
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
  /** Live uploads across the group: always at least one (an event with none is not offered). */
  uploadCount: number;
  /** ISO timestamp of the newest live upload (typed nullable, as the RPC's row is). */
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
 *
 * ★ AND ONLY AN EVENT WITH SOMETHING TO CLAIM (guest by upload, Will 2026-09-22:
 * a person is a guest of an event only through an upload of theirs). A row with
 * no live upload makes nobody a guest, so claiming it would carry nothing and
 * releasing it would remove nothing. The RPC skips such rows since migration
 * 20260923120000; this drop is the belt, so the card is right even against a
 * database that has not taken that file yet.
 *
 * ★ READ WHOLE (the 1,000-row round, 2026-09-23): the RPC pages on its own order,
 * (last upload desc, guest id desc), and the cursor is the last row's own
 * `last_upload_at` and `guest_id` (a listed row always carries a live upload, so
 * its last upload is never null and IS the order's key). Past 1,000 rows the
 * card used to end silently; the grouping below needs every row of an event to
 * sum its uploads.
 */
export async function getMyClaimableGuestRows(): Promise<ClaimableEventRow[]> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return [];

  const { rows } = await readAllPages(
    "dashboard: claimable guest rows",
    (after: { at: string; id: string } | null, limit) =>
      supabase.rpc("list_guest_rows_by_email", {
        p_after_at: after?.at,
        p_after_id: after?.id,
        p_limit: limit,
      }),
    (row) => ({ at: lastUploadAt(row), id: row.guest_id }),
  );

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

  rows.forEach((row, index) => {
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
    .filter((g) => g.uploadCount > 0)
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

/** A full page's last row is the next page's cursor, and the cursor's time is its last upload. */
function lastUploadAt(row: {
  guest_id: string;
  last_upload_at: string | null;
}): string {
  // The RPC lists only rows with a live upload, so this is never null; a null here would restart
  // the read from the top, so it fails loudly instead.
  if (!row.last_upload_at) {
    throw new Error(
      `dashboard: claimable guest rows: guest row ${row.guest_id} has no last upload to page on`,
    );
  }
  return row.last_upload_at;
}
