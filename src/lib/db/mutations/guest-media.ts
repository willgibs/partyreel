/**
 * A GUEST'S OWN PHOTOGRAPHS, on the guest page: the reads that decide which
 * tiles are theirs, and the write that removes one.
 *
 * Will, `yours`, 2026-09-20, verbatim: "A guest can delete any photo they've
 * personally uploaded, ever." His answer at approval made it final for the host
 * too — a person's withdrawal is theirs, so the host's bin never sees it and
 * `restore_media` refuses it (`removed_by_uploader`, the marker
 * `remove_my_upload` has carried since the Uploads tab shipped).
 *
 * TWO IDENTITIES, BECAUSE A GUEST PAGE HAS TWO:
 *  - signed in, the account is the identity and `remove_my_upload` (auth.uid())
 *    already covers it, from any device, for ever. This module does NOT re-type
 *    that RPC call: `mutations/my-uploads.ts` is its one home (the DRY rule) and
 *    the guest page's Server Function calls straight into it.
 *  - anonymous, the ONLY identity is the device-bound session token on the
 *    guest row, so `remove_my_upload_by_session` is the path, service-role-only,
 *    validating the token INSIDE the function against the media's own guest row
 *    (database-security.md). It is reached through `POST /api/guests/remove`.
 *
 * ★ "MINE" IS COMPUTED ON THE SERVER, ALWAYS, AND NEVER SHIPPED IN THE GALLERY.
 * A client-asserted "this one is mine" is a delete of someone else's photograph
 * waiting to happen, and the RPCs refuse it — but the UI must not OFFER a
 * control that will refuse, so the list of ids is a server read either way. It
 * deliberately does not ride the gallery payload or its ETag: that fingerprint
 * is per ACCESS, not per viewer, and two viewers of one album share it. Reading
 * it here also means uploads made BEFORE this shipped are covered, which a
 * client-side ledger could never be.
 *
 * ★ A ROW WITH NO GUEST IS NEVER REACHABLE HERE. Both reads start from a guest
 * row, so a host's own upload (guest_id null) never lands in a "mine" list on
 * this page; the host removes their own through the event's moderation surface.
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/** Below this, a token is not a token — refuse before touching the database. */
const MIN_SESSION_TOKEN = 16;

export type SessionRemoveOutcome =
  /** Removed, or already removed (the RPC is idempotent — the end state is the same). */
  | "removed"
  /** No such media for this token in this event (missing, another guest's, or claimed). */
  | "not_found"
  /** The token is malformed or absent. */
  | "unauthorized"
  /** The database refused for a reason that is ours, not the caller's. */
  | "error";

/**
 * Remove ONE photograph an anonymous guest uploaded, on the strength of their
 * session token alone. The token is never trusted as a claim: the RPC requires
 * it to be the token on the media's OWN guest row, that row to be unclaimed
 * (a claimed row belongs to the account path, so a shared phone's stale token
 * can never delete a signed-in person's photograph) and the event to be live.
 *
 * Idempotent: a repeat is "removed", never an error and never a second
 * `removed_at` (which would extend how long the bytes linger). No R2 call — the
 * purge cron reclaims the bytes on the same 30-day path as every other removal.
 */
export async function removeMyUploadBySession(input: {
  sessionToken: string;
  mediaId: string;
}): Promise<SessionRemoveOutcome> {
  const token = input.sessionToken.trim();
  if (token.length < MIN_SESSION_TOKEN) return "unauthorized";

  const { data, error } = await createAdminClient().rpc(
    "remove_my_upload_by_session",
    { p_session_token: token, p_media_id: input.mediaId },
  );
  if (error || !data) return "error";

  const result = data as unknown as { ok: boolean; reason?: string };
  if (result.ok) return "removed";
  return result.reason === "unauthorized" ? "unauthorized" : "not_found";
}

/**
 * The ids an ANONYMOUS guest may remove in this event: the media on the guest
 * rows this session token owns, and only while those rows are still unclaimed —
 * the same predicate the RPC enforces, so the UI offers exactly what the write
 * will accept. Signing in claims the rows and the account read below takes over.
 *
 * An unknown or malformed token reads as an empty list, never as an error: this
 * answer reaches a browser, and "no ids" and "no such session" must look the
 * same from there.
 */
export async function listSessionMediaIds(input: {
  eventId: string;
  sessionToken: string;
}): Promise<string[]> {
  const token = input.sessionToken.trim();
  if (token.length < MIN_SESSION_TOKEN) return [];
  return mediaIdsForGuests(
    input.eventId,
    createAdminClient()
      .from("guests")
      .select("id")
      .eq("event_id", input.eventId)
      .eq("session_token", token)
      .is("user_id", null),
  );
}

/**
 * The ids a SIGNED-IN viewer may remove in this event: the media on the guest
 * rows their account owns (including anonymous uploads claimed at sign-in).
 * Read in the page RSC, so it costs one indexed select on a path that already
 * ran `getUser()`.
 */
export async function listAccountMediaIds(input: {
  eventId: string;
  userId: string;
}): Promise<string[]> {
  return mediaIdsForGuests(
    input.eventId,
    createAdminClient()
      .from("guests")
      .select("id")
      .eq("event_id", input.eventId)
      .eq("user_id", input.userId),
  );
}

/**
 * The shared second half: guest rows in, media ids out. Scoped to the event a
 * second time on purpose — the guest rows are already event-scoped, and a media
 * row cannot belong to a guest of another event, so this is belt and braces on
 * the one query whose answer decides whether a delete control appears.
 * Already-removed rows drop: a tile that is gone needs no Remove.
 *
 * A read failure is an empty list, deliberately. The worst case is a guest who
 * cannot remove their photograph for one render; the alternative — failing the
 * page, or failing OPEN — is worse in both directions.
 */
async function mediaIdsForGuests(
  eventId: string,
  guestQuery: PromiseLike<{ data: { id: string }[] | null; error: unknown }>,
): Promise<string[]> {
  const { data: guests, error } = await guestQuery;
  if (error || !guests || guests.length === 0) return [];

  const { data: media, error: mediaError } = await createAdminClient()
    .from("media")
    .select("id")
    .eq("event_id", eventId)
    .in(
      "guest_id",
      guests.map((g) => g.id),
    )
    .neq("status", "removed");
  if (mediaError || !media) return [];
  return media.map((m) => m.id);
}
