/**
 * WHETHER SHE FOLLOWS NO ONE YET: the one fact "a first follow says it once" needs (`account-moments` r2, `follow=once`,
 * Will 2026-10-07: her first follow ever shows the private line, every follow after is the button alone).
 *
 * ★ "ONCE" IS READ FROM HER LIST BEING EMPTY BEFORE THE PRESS (the carried `once-memory`: no new column, every device
 * alike), so the Server Function asks this before it writes (`u/[slug]/actions.ts`). It is one `limit 1` read of her own
 * follows under owner RLS, not a count: an empty list is the whole question, and a person who follows a thousand pays
 * for one row. The edge is her own (`follower_id = her`, from the request's one `getUser()`), so the read can say
 * nothing about anyone else's follows.
 *
 * ★ A COURTESY, NEVER A GATE. This throws on a failed read like every query here and the caller decides: the Server
 * Function takes a failure as "not her first" (the line is a nicety, the follow is the act), and records it.
 */
import "server-only";

import { getRequestAuth } from "@/lib/supabase/request-auth";

/** True when the signed-in caller follows nobody; false when she follows someone, or nobody is signed in. */
export async function followsNoOne(): Promise<boolean> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return false;

  const { data, error } = await supabase
    .from("user_follows")
    .select("followee_id")
    .eq("follower_id", user.id)
    .limit(1);
  if (error) throw error;
  return (data ?? []).length === 0;
}
