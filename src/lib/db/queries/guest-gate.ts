/**
 * "HAS THIS VIEWER CONTRIBUTED, AND IS THE ALBUM FULL" -- the one read behind Require an upload to
 * view (the door as three steps, Will 2026-09-21).
 *
 * `get_upload_gate` is SERVICE-ROLE ONLY (wave 0's migration, 20260922003000): both callers are
 * server code on the admin client, the `remove_my_upload_by_session` posture. An anon grant would
 * turn it into a token-validity oracle for no gain, so this module is the only door to it.
 *
 * ★ IT FAILS OPEN, AND THE FAIL-OPEN IS EXPRESSED AS `albumFull`. A guest must never be held at a
 * step they cannot pass, so an unreachable database resolves to "you have not contributed, but the
 * album is full", which `resolveGalleryDecision` reads as `canContribute === false` and opens the
 * album. The warning is captured so a silent degradation is still a visible one.
 *
 * ★ TWO IDENTITIES, ONE CALL. The session token (a name-only guest's row, `user_id` null) or the
 * account id the server verified with `getUser()` (a verified guest's row, or a name-only row that
 * `claim_anonymous_uploads` has stamped). Both may be present; the RPC ORs them.
 */
import "server-only";

import { captureWarning } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";

export type UploadGate = {
  /** One upload of this viewer's ever completed, whatever its status since (the ticket is punched once). */
  contributed: boolean;
  /** The pair the presign ladder refuses `cap_reached` on: the storage cap with its grace, or the monthly ingress cap. */
  albumFull: boolean;
  /** The event is gone; the caller's own not-found path owns what that means. */
  eventGone: boolean;
};

/** The shape a failed read resolves to: uncontributed, but unable to contribute, so nothing holds. */
const FAIL_OPEN: UploadGate = {
  contributed: false,
  albumFull: true,
  eventGone: false,
};

export async function getUploadGate(input: {
  eventId: string;
  sessionToken: string | null;
  userId: string | null;
}): Promise<UploadGate> {
  /* ★ NO IDENTITY IS AN ANSWER, NOT AN ERROR. A guest who has just scanned the code holds neither
     a session nor an account, and the honest answer for them is "has not contributed" -- which is
     the whole population the switch exists for. Failing open here would have meant the gate never
     applied to a first-time visitor at all, i.e. never applied. The RPC handles it exactly right:
     its `exists` arm is false with both identities null, and `album_full` is still computed, so
     the real fail-open (an album that cannot take another byte) still fires for them too.
     The read costs one indexed round trip on the one render that needs it. */

  // The generated Args type makes both identities OPTIONAL rather than nullable (the SQL defaults
  // are null), so an absent one is OMITTED here instead of sent as null.
  const args: {
    p_event_id: string;
    p_session_token?: string;
    p_user_id?: string;
  } = { p_event_id: input.eventId };
  if (input.sessionToken) args.p_session_token = input.sessionToken;
  if (input.userId) args.p_user_id = input.userId;

  // DELIBERATE SWALLOW (fail OPEN): this decides whether a guest sees the album they were invited
  // to. A failed read must open the door, never throw and 500 the page a guest is standing in front
  // of at a venue. Degrade, never escalate, never crash.
  // eslint-disable-next-line partyreel/no-swallowed-db-error
  const { data, error } = await createAdminClient().rpc("get_upload_gate", args);

  if (error || !data || typeof data !== "object") {
    captureWarning("security", "upload_gate_unavailable_fail_open", {
      eventId: input.eventId,
      code: error?.code,
    });
    return FAIL_OPEN;
  }

  const row = data as Record<string, unknown>;
  return {
    contributed: row.contributed === true,
    albumFull: row.album_full === true,
    eventGone: row.event_gone === true,
  };
}
