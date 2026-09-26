/**
 * THE OWNER, ONE IDEA FOR EVERY GATE ON THE GUEST PAGE: is this viewer the event's host?
 *
 * The page, the album's routes (`album-viewer.server.ts`), the upload seams (`upload-lock.ts`), the
 * guest export and the album's own reads (`album-guest.ts`) all ask this, and all the same way: the
 * user from `getUser()` (never `getSession()`, which only decodes a cookie a client can forge), then
 * `isEventOwner`'s explicit `host_id` match. The host never meets the password door, so never holds
 * the unlock cookie: a gate that let a password album through on the cookie alone refused the one
 * person every other gate lets in, and the page crashed on it (build 10's red-team).
 *
 * Its own module, beside `gallery-access.server.ts` (which re-exports `isEventOwner` for its callers),
 * so the album's reads can ask it without importing the loaders that read through them.
 */
import "server-only";

import { cache } from "react";

import { getRequestAuth } from "@/lib/supabase/request-auth";

// The exact type `createClient()` resolves to, with no top-level import (so generic arity can never
// drift from the real server client).
type ServerSupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

/**
 * Is `userId` the host of this event? The owner bypass for the gallery gate.
 *
 * Matches `host_id = userId` EXPLICITLY rather than relying on the `events` SELECT RLS policy alone
 * (which also permits reading any `open` event, so an id-only select would wrongly treat any signed-in
 * viewer as the owner). With the host_id filter the RLS-scoped read returns a row ONLY for the real
 * host. Reuses the caller's RLS-scoped client; run only when a user is present.
 */
export async function isEventOwner(
  eventId: string,
  userId: string,
  supabase: ServerSupabaseClient,
): Promise<boolean> {
  // DELIBERATE SWALLOW (fail CLOSED): this decides the OWNER BYPASS on the guest
  // album. A failed read must resolve to "not the owner" (the viewer sees the
  // guest album) rather than throw and 500 the page a guest is standing in front
  // of at a venue. Degrade, never escalate, never crash.
  // eslint-disable-next-line partyreel/no-swallowed-db-error
  const { data } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("host_id", userId)
    .maybeSingle();
  return Boolean(data);
}

/**
 * Is THIS REQUEST the event's host? `isEventOwner` for a gate with no user in hand: false with no
 * session (a local null, no network), and false on a failed auth or host read (fail closed:
 * `getUser()` answers a null user, `isEventOwner` swallows).
 *
 * ★ ONE ANSWER PER RENDER. `cache()` (with `getRequestAuth`'s one `getUser()` validation) makes the
 * page's own owner flag and every read its album seed makes the SAME answer, so the page can never
 * let the host in while its seed refuses them. A route handler is no render pass, so `cache()` calls
 * straight through there and each ask pays its own validation and select; only the host ever pays
 * it, because a password album's gate asks the unlock cookie first and every other viewer is
 * answered by the cookie or refused before any read.
 */
export const isRequestOwner = cache(async function isRequestOwner(
  eventId: string,
): Promise<boolean> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return false;
  return isEventOwner(eventId, user.id, supabase);
});
