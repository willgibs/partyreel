/**
 * THE HOST'S VIEW OF A CONFIRMED GUEST'S ADDRESS, for the Guests room (Will, 2026-09-23: "Guests should not see
 * other confirmed guests' emails, making them more comfortable knowing only the host sees it. Exposing emails
 * publicly would go from a safety feature to privacy concern - the host assumes responsibility of ensuring that
 * safety."). Why the host sees one at all: a verified badge with no address "implies far
 * more safety than it should", because anyone can verify an address they made up.
 *
 * ★ THIS IS THE ONE MODULE THAT READS A GUEST'S ADDRESS FOR A LIST, and it lives apart from `social.ts` on purpose:
 * that module feeds the guest album and public profiles, and its header promises no address ever leaves it. Only the
 * Guests room imports this one (guest-addresses.test.ts walks the tree to hold that), and the album page never
 * passes the result to `GuestList`.
 *
 * What counts as an address here is exactly what the host's viewer shows under an uploader's name
 * (`resolveUploaderIdentity` case 2): `guests.email` on a row whose `verified_at` is set. That column only ever holds a
 * CONFIRMED address of the row's own account, but it can land on a row minted before the account confirmed, so the
 * proof is `verified_at` and never the column alone. `guests.pending_email` (an address a guest typed and nobody
 * proved) is never read, and the host never sees their own row.
 */
import "server-only";

import { readAllPages } from "@/lib/db/read-all";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestAuth } from "@/lib/supabase/request-auth";

/**
 * Confirmed addresses of the listed people at one event, keyed by user id (a `GuestList` profile card's `id`).
 *
 * ★ IT PROVES THE HOST ITSELF. The page has already proved ownership with `getEvent` (RLS), and this read turns an
 * event id into email addresses on the service-role client, so it checks again rather than trusting its caller: the
 * signed-in user must BE the event's host, or the answer is empty and `guests` is never read. A caller that forgot
 * its own gate (or a guest page that imported this by mistake) gets nothing.
 *
 * ★ KEYED ON THE EVENT, NEVER AN `.in()` OF USER IDS: an id list rides the URL and grows with the party, so the rows
 * are read by `event_id` in keyset pages on `id` (`readAllPages`: an ordinary party is one round trip, and a page
 * short of 1,000 is the last) and narrowed to `userIds` in memory. Only the listed people leave this function, so the
 * page's payload holds no address it does not show.
 *
 * One address per person: a guest who confirmed on two devices has two rows, and the newest proof wins (an address
 * changed between the two mints shows as it stands now).
 */
export async function getConfirmedGuestAddresses(
  eventId: string,
  userIds: readonly string[],
): Promise<Map<string, string>> {
  const wanted = new Set(userIds);
  if (wanted.size === 0) return new Map();

  const { user } = await getRequestAuth();
  if (!user) return new Map();

  const admin = createAdminClient();
  const { data: event, error: eventError } = await admin
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .is("deleted_at", null)
    .maybeSingle();
  if (eventError) throw eventError;
  if (!event || event.host_id !== user.id) return new Map();
  const hostId = event.host_id;

  // The SELECT names its four columns and no other address (guest-addresses.test.ts pins it); the filters ask the
  // database for proved rows only, and the loop below checks each one again, because an address on a row the filter
  // should have dropped is the one mistake this module exists to never make.
  const { rows } = await readAllPages(
    "guests room: confirmed addresses",
    (after: string | null, limit) => {
      let q = admin
        .from("guests")
        .select("id, user_id, email, verified_at")
        .eq("event_id", eventId)
        .not("verified_at", "is", null)
        .not("email", "is", null)
        .not("user_id", "is", null)
        .neq("user_id", hostId)
        .order("id", { ascending: true })
        .limit(limit);
      if (after) q = q.gt("id", after);
      return q;
    },
    (row) => row.id,
  );

  const newest = new Map<string, { email: string; verifiedAt: number }>();
  for (const row of rows) {
    if (!row.user_id || row.user_id === hostId || !wanted.has(row.user_id))
      continue;
    if (!row.verified_at || !row.email?.trim()) continue;
    const verifiedAt = Date.parse(row.verified_at);
    const held = newest.get(row.user_id);
    if (!held || verifiedAt > held.verifiedAt) {
      newest.set(row.user_id, { email: row.email.trim(), verifiedAt });
    }
  }

  return new Map([...newest].map(([userId, { email }]) => [userId, email]));
}
