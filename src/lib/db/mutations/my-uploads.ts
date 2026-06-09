/**
 * The signed-in user's OWN-upload mutations (the dashboard "Uploads" tab). Unlike mutations/media.ts
 * (host moderation, scoped by media_host_all RLS to the host's own events), this spans events: a user
 * may delete a guest upload they made to SOMEONE ELSE's event, where they hold no RLS write. So it goes
 * through the SECURITY DEFINER `remove_my_upload` RPC, which re-checks ownership via the same host-arm /
 * guest-arm predicates as get_my_uploads (auth.uid()-based) and soft-removes.
 *
 * The RPC RETURNS jsonb {ok, reason?} for expected refusals (it does not raise), so we branch on
 * data.reason -- mirrors restoreMedia in mutations/media.ts. Sentry capture stays at the action layer.
 */
import "server-only";

import { type MutationResult } from "@/lib/db/mutations/events";
import { createClient } from "@/lib/supabase/server";

const UNAUTHORIZED = {
  ok: false as const,
  code: "unauthorized" as const,
  message: "Please sign in and try again.",
};

type RemoveResult = { ok: true } | { ok: false; reason: string };

/**
 * Soft-delete one of the caller's own uploads (host upload in their event, or a guest upload they made
 * to another host's event). The RPC is idempotent (a repeat remove is a no-op success) and makes a
 * guest's self-deletion private to the host. No R2 call here -- the purge cron reclaims bytes after the
 * 30-day window, exactly like host removeMedia.
 */
export async function removeMyUpload(
  mediaId: string,
): Promise<MutationResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  const { data, error } = await supabase.rpc("remove_my_upload", {
    p_media_id: mediaId,
  });
  if (error || !data) {
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't remove that upload. Please try again.",
    };
  }

  const result = data as unknown as RemoveResult;
  if (!result.ok) {
    if (result.reason === "unauthorized") return UNAUTHORIZED;
    // not_found = missing, not the caller's, or in a Trashed event. Don't reveal which.
    return {
      ok: false,
      code: "unknown",
      message: "That upload is no longer available.",
    };
  }
  return { ok: true, data: { id: mediaId } };
}
