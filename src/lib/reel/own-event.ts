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
  const { data: ev } = await supabase
    .from("events")
    .select("id, name")
    .eq("id", eventId)
    .eq("host_id", user.id)
    .maybeSingle();
  return ev ?? null;
}
