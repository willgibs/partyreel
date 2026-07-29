/**
 * The reel export route's authz gate: getUser() (never getSession) + an OWN-event read (explicit
 * host_id match, NOT the open-event policy), via the cookie-scoped RLS client. /api/reel/upload
 * resolves through this before touching the admin-client render service. (Kept as its own helper —
 * the caller-less GET poll route that also used it was pruned 2026-07-08.)
 */
import { createClient } from "@/lib/supabase/server";

/** Returns the event id + name when the signed-in user hosts it; null otherwise. */
export async function resolveOwnEvent(
  eventId: string,
): Promise<{ id: string; name: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  // DELIBERATE SWALLOW (fail CLOSED): this IS the authz gate for the reel
  // export. A failed read must resolve to "not the host" (the caller 403s),
  // never to a permissive default.
  // eslint-disable-next-line partyreel/no-swallowed-db-error
  const { data: ev } = await supabase
    .from("events")
    .select("id, name")
    .eq("id", eventId)
    .eq("host_id", user.id)
    .maybeSingle();
  return ev ?? null;
}
