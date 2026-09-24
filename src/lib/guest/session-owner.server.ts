/**
 * THE SERVER HALF OF "WHOSE TICKET IS THIS?" (`session-owner.ts` holds the rule and the why).
 *
 * Every guest WRITE route that takes a session token from the body asks this before it writes:
 * the two upload routes (presign, and complete, since a presign outlives a sign-out by up to 2h),
 * and the rename and attach-address doors. The capability RPCs cannot ask it themselves: they run
 * on the service-role client, where `auth.uid()` is nobody, so the caller's identity has to come
 * from the route's own `getUser()` (never `getSession()`, which only decodes a cookie).
 *
 * ★ A NAME-ONLY ROW COSTS ONE INDEXED READ AND NOTHING ELSE. `getUser()` is a network round trip to
 * the Auth server, so it runs only when the row actually carries an account: the anonymous crowd
 * behind one venue NAT (the common path) never pays it, and a signed-in guest pays it once per
 * request on their own row.
 *
 * ★ THE ROW'S ACCOUNT NEVER LEAVES THE SERVER. The answer is "may write" or the refusal code; the
 * `user_id` it was decided on is read on the service-role client and dropped here, so no response
 * can tell a browser whose ticket it was holding.
 *
 * ★ WHY THE READ LIVES HERE AND NOT IN `src/lib/db/`: it is one column the rule needs and nothing
 * else reads, and `forensics/capture.ts` resolves the same token on the same client for the same
 * reason (the RPCs that own the row return no `user_id`, by design). No SQL changed for it.
 */
import "server-only";

import {
  SESSION_OTHER_ACCOUNT,
  SESSION_OTHER_ACCOUNT_MESSAGE,
  sessionBelongsTo,
} from "@/lib/guest/session-owner";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SessionOwnerCheck =
  | { ok: true }
  | {
      ok: false;
      code: typeof SESSION_OTHER_ACCOUNT;
      message: string;
    };

/**
 * May THIS request write through the row `sessionToken` names?
 *
 * An unknown token answers `ok`, deliberately: the capability RPC behind every caller owns the
 * canonical refusal for a dead session (`invalid_session`), and a second opinion here would only
 * be a second way of saying it. A read failure THROWS, the house posture for this path
 * (`getUploadContext` throws on the same class of error): failing open would hand the exact hole
 * this closes to a database blip, and answering `SESSION_OTHER_ACCOUNT` would make a legitimate
 * guest's device put its own ticket down.
 */
export async function checkSessionOwner(
  sessionToken: string,
): Promise<SessionOwnerCheck> {
  const { data: row, error } = await createAdminClient()
    .from("guests")
    .select("user_id, verified_at")
    .eq("session_token", sessionToken)
    .maybeSingle();
  if (error) throw new Error(`session owner lookup: ${error.message}`);
  if (!row) return { ok: true };

  const owner = { userId: row.user_id, verified: Boolean(row.verified_at) };
  // Only a row with an account can be anybody's in particular, so only that row pays the Auth
  // round trip; a name-only row passes and a confirmed row with no account left fails without it.
  let viewerId: string | null = null;
  if (owner.userId !== null) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    viewerId = user?.id ?? null;
  }
  if (sessionBelongsTo(owner, viewerId)) return { ok: true };
  return {
    ok: false,
    code: SESSION_OTHER_ACCOUNT,
    message: SESSION_OTHER_ACCOUNT_MESSAGE,
  };
}
