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
 * ★ AND THE ALBUM'S OWNER IS NEVER HER OWN GUEST. Her Add on her guest page
 * rides the host's pair, so her uploads here have no guest row, and the guest
 * reads above never list them; `listOwnerMediaIds` does, for the same page, and
 * `remove_my_upload`'s host arm takes each to her Deleted, restorable.
 */
import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import { mustCount, mustQuery } from "@/lib/db/must-query";
import { inChunks, readAllPages } from "@/lib/db/read-all";
import { letInNews } from "@/lib/guest/let-in-news";
import { captureError } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestAuth } from "@/lib/supabase/request-auth";

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
  // row-cap: a session token names one guest row (guests.session_token is unique)
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
  // row-cap: one account's guest rows in one event: one per session it claimed, a handful
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
 * The ids THE ALBUM'S OWNER may remove on her own guest page (crumbs-32): her own
 * uploads here, the rows with no guest (her guest page's Add, the hub's and the
 * reel's all ride the host's pair), which `remove_my_upload`'s host arm takes to
 * her Deleted. Never a guest row's: she is never her own guest, and that RPC's
 * guest arm refuses the event's own host, so offering one would offer a refusal.
 *
 * ★ READ THROUGH HER OWN CLIENT, SO RLS IS THE BOUNDARY: `media_host_all` scopes
 * the rows to her own events, and a viewer who is not this album's host reads
 * nothing, whatever the page decided. Read whole (a host past 1,000 of her own)
 * and, like every read here, FAIL CLOSED, LOUDLY.
 */
export async function listOwnerMediaIds(eventId: string): Promise<string[]> {
  try {
    const { supabase, user } = await getRequestAuth();
    if (!user) return [];
    const { rows } = await readAllPages(
      "owner media: ids",
      (after: string | null, limit) => {
        let q = supabase
          .from("media")
          .select("id")
          .eq("event_id", eventId)
          .is("guest_id", null)
          .neq("status", "removed")
          .order("id", { ascending: true })
          .limit(limit);
        if (after) q = q.gt("id", after);
        return q;
      },
      (m) => m.id,
    );
    return rows.map((m) => m.id);
  } catch (error) {
    captureError("media", error, {
      seam: "owner_media_ids_fail_closed",
      eventId,
    });
    return [];
  }
}

/**
 * THE LIVE UPLOADS ON THIS DEVICE'S TICKET HERE, ONCE THE TICKET IS THE ACCOUNT'S (build 33's red-team): whether a
 * confirmation carried this phone's photos into her account, which the album asks when her own claim moved nothing
 * because a read on the page claimed the ticket first (`claim-uploads.ts`).
 *
 * The TICKET, never the account: her rows from another device say nothing about what this phone kept, and a ticket
 * the claim left (another guest's name on a shared phone, an address that is not hers) is not her row, so it counts
 * 0 however many photos her account holds here. "Live" as the claim counts it: not removed. A head count, so no row
 * cap. Like every read here, FAIL CLOSED, LOUDLY: 0 and a captured error, never a thrown request.
 */
export async function countKeptTicketUploads(input: {
  eventId: string;
  sessionToken: string;
  userId: string;
}): Promise<number> {
  const token = input.sessionToken.trim();
  if (token.length < MIN_SESSION_TOKEN) return 0;
  const admin = createAdminClient();
  try {
    // One row at most: a session token names one guest row (guests.session_token is unique).
    const row = await mustQuery(
      admin
        .from("guests")
        .select("id")
        .eq("event_id", input.eventId)
        .eq("session_token", token)
        .eq("user_id", input.userId)
        .maybeSingle(),
      "kept ticket: row",
    );
    if (!row) return 0;
    return await mustCount(
      admin
        .from("media")
        .select("id", { count: "exact", head: true })
        .eq("guest_id", row.id)
        .neq("status", "removed"),
      "kept ticket: uploads",
    );
  } catch (error) {
    captureError("media", error, {
      seam: "kept_ticket_fail_closed",
      eventId: input.eventId,
    });
    return 0;
  }
}

/**
 * Where one of her uploads stands, as her own tracker says it: waiting for the
 * host, in the album, or refused (hidden or removed by the host, an operator or
 * the system). Never an identity and never a link: the tracker's thumbnails come
 * from what the page already holds, because a pending or hidden item is never
 * presigned for a guest (`r2/grid-items.ts`).
 */
export type OwnUploadStatus = "pending" | "approved" | "refused";

export type OwnUpload = { id: string; status: OwnUploadStatus };

/**
 * HER UPLOADS HERE, WITH WHERE EACH STANDS (`guest-capture` r1, Will's
 * `tracker=button`: "track their batch's progress or approval status, so they
 * aren't left wondering"). The source of truth for a held photograph's fate is
 * its own row, never the approved album: the album's sync moves only on
 * transitions into or out of `approved` (`album_max`, so a guest never learns
 * how busy moderation is), which carries an approval to her and never a refusal.
 *
 * The rows are the ones this viewer may speak for, exactly the "mine" reads
 * above: the session token's own unclaimed row, and, signed in, the account's
 * rows at this event. A photograph she withdrew herself is not listed (it is
 * hers to forget, and the host never sees it either); one the host, an operator
 * or the system removed is `refused`, like one the host hid.
 *
 * Newest first, read whole (the 1,000-row rule) and, like every read here, FAIL
 * CLOSED, LOUDLY: an empty list and a captured error, never a thrown page.
 */
export async function listOwnUploadStatuses(input: {
  eventId: string;
  sessionToken?: string | null;
  userId?: string | null;
}): Promise<OwnUpload[]> {
  return (await readOwnUploads({ ...input, tell: false })).items;
}

/** Her uploads with where each stands, and (asked with `tell`) her news. */
export type OwnUploadsRead = { items: OwnUpload[]; news: string[] };

/** A column the database does not have yet: the migration not applied (`42703` in SQL, `PGRST204` in a write). */
const MISSING_COLUMN = new Set(["42703", "PGRST204"]);

function missingColumn(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return typeof code === "string" && MISSING_COLUMN.has(code);
}

type OwnRow = {
  id: string;
  status: string;
  created_at: string;
  guest_id?: string | null;
  let_in_at?: string | null;
};

/**
 * HER UPLOADS, AND WHAT SHE IS TOLD ON HER RETURN (crumbs-38: the approval toast's server half). With `tell`, the same
 * read also answers her NEWS, the uploads of hers a decision let into the album since she was last told
 * (`let-in-news.ts` holds the rule), and marks each of her rows told up to the newest it answered, so the moment the
 * album says "One of yours is in the album" is had once: on a reload, a return, or her account's other device.
 *
 * ★ TOLD BY THE READ THAT ANSWERS IT. The mark is written as the news is read (her tracker asks at mount, at each
 * opening and at each arrival, so an approval she watched arrive is told by that visit's own read), and the page
 * spends the moment by the toast's own rules (a reel showing, the view not already open; spent either way). A mark
 * that fails to write is captured and the news still answered: told twice beats never told.
 *
 * ★ A DATABASE WITHOUT THE MIGRATION reads as no news (captured, `let_in_schema_missing`) and the statuses as ever:
 * this build may run before the columns stand, and her tracker must never lose its rows to them.
 */
export async function readOwnUploads(input: {
  eventId: string;
  sessionToken?: string | null;
  userId?: string | null;
  /** Answer her news, and mark it told. */
  tell?: boolean;
}): Promise<OwnUploadsRead> {
  const tell = input.tell === true;
  const token = input.sessionToken?.trim() ?? "";
  const admin = createAdminClient();
  const guestColumns = tell ? "id, let_in_told_at" : "id";
  const mediaColumns = tell
    ? "id, status, created_at, guest_id, let_in_at"
    : "id, status, created_at";
  try {
    const told = new Map<string, string | null>();
    const take = (rows: unknown) => {
      for (const row of (rows ?? []) as {
        id: string;
        let_in_told_at?: string | null;
      }[]) {
        told.set(row.id, row.let_in_told_at ?? null);
      }
    };
    if (token.length >= MIN_SESSION_TOKEN) {
      // row-cap: a session token names one guest row (guests.session_token is unique)
      take(
        await mustQuery(
          admin
            .from("guests")
            .select(guestColumns)
            .eq("event_id", input.eventId)
            .eq("session_token", token)
            .is("user_id", null),
          "own uploads: session row",
        ),
      );
    }
    if (input.userId) {
      // row-cap: one account's guest rows in one event: one per session it claimed, a handful
      take(
        await mustQuery(
          admin
            .from("guests")
            .select(guestColumns)
            .eq("event_id", input.eventId)
            .eq("user_id", input.userId),
          "own uploads: account rows",
        ),
      );
    }
    if (told.size === 0) return { items: [], news: [] };

    const media = await inChunks(
      "own uploads: media",
      [...told.keys()],
      async (chunk) => {
        const { rows } = await readAllPages(
          "own uploads: media",
          (after: string | null, limit) => {
            let q = admin
              .from("media")
              .select(mediaColumns)
              .eq("event_id", input.eventId)
              .in("guest_id", chunk)
              .eq("removed_by_uploader", false)
              .order("id", { ascending: true })
              .limit(limit);
            if (after) q = q.gt("id", after);
            return q.overrideTypes<OwnRow[], { merge: false }>();
          },
          (m) => m.id,
        );
        return rows;
      },
    );
    const items: OwnUpload[] = [...media]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((m) => ({
        id: m.id,
        status:
          m.status === "approved"
            ? "approved"
            : m.status === "pending"
              ? "pending"
              : "refused",
      }));
    if (!tell) return { items, news: [] };

    const news = letInNews(
      media.flatMap((m) =>
        m.guest_id
          ? [
              {
                id: m.id,
                guestId: m.guest_id,
                status: m.status,
                letInAt: m.let_in_at ?? null,
              },
            ]
          : [],
      ),
      told,
    );
    await markTold(input.eventId, news.marks);
    return { items, news: news.ids };
  } catch (error) {
    if (tell && missingColumn(error)) {
      captureError("media", error, {
        seam: "let_in_schema_missing",
        eventId: input.eventId,
      });
      return readOwnUploads({ ...input, tell: false });
    }
    captureError("media", error, {
      seam: "own_upload_statuses_fail_closed",
      eventId: input.eventId,
    });
    return { items: [], news: [] };
  }
}

/**
 * Each row's mark, moved forward to the newest it told and never back: a read in flight beside this one may have told
 * newer news already, so the write takes only a row whose mark is older (or none). A failure is captured, never thrown:
 * the news is answered either way.
 */
async function markTold(
  eventId: string,
  marks: ReadonlyMap<string, string>,
): Promise<void> {
  if (marks.size === 0) return;
  const admin = createAdminClient();
  const results = await Promise.allSettled(
    [...marks].map(([guestId, mark]) =>
      mustQuery(
        admin
          .from("guests")
          .update({ let_in_told_at: mark })
          .eq("id", guestId)
          .eq("event_id", eventId)
          .or(`let_in_told_at.is.null,let_in_told_at.lt.${mark}`),
        "own uploads: told mark",
      ),
    ),
  );
  for (const result of results) {
    if (result.status === "rejected") {
      captureError("media", result.reason, {
        seam: "let_in_told_mark_failed",
        eventId,
      });
    }
  }
}

/**
 * The shared second half: guest rows in, media ids out. Scoped to the event a
 * second time on purpose — the guest rows are already event-scoped, and a media
 * row cannot belong to a guest of another event, so this is belt and braces on
 * the one query whose answer decides whether a delete control appears.
 * Already-removed rows drop: a tile that is gone needs no Remove.
 *
 * READ WHOLE (the 1,000-row round): a guest can upload far past 1,000 items to
 * one event (a photographer on the guest link), so the ids page on `id` through
 * `readAllPages`, inside `inChunks` over the guest rows (one for a session, a
 * handful for an account, never a URL's worth): one read would end at 1,000 and
 * leave the rest of their photographs without a Remove.
 *
 * ★ FAIL CLOSED, LOUDLY. A read failure is an empty list, deliberately: the
 * worst case is a guest who cannot remove their photograph for one render, and
 * the alternatives (failing the page a guest is standing in front of, or
 * failing OPEN) are worse in both directions. The failure is captured, never
 * swallowed, the way `guest-gate.ts` fails open loudly, so a read that keeps
 * failing is an alert and not a feature that silently went away.
 */
async function mediaIdsForGuests(
  eventId: string,
  guestQuery: PromiseLike<{
    data: { id: string }[] | null;
    error: PostgrestError | null;
  }>,
): Promise<string[]> {
  try {
    const guests = await mustQuery(guestQuery, "guest media: guest rows");
    const guestIds = (guests ?? []).map((g) => g.id);
    if (guestIds.length === 0) return [];

    const admin = createAdminClient();
    const media = await inChunks(
      "guest media: ids",
      guestIds,
      async (chunk) => {
        const { rows } = await readAllPages(
          "guest media: ids",
          (after: string | null, limit) => {
            let q = admin
              .from("media")
              .select("id")
              .eq("event_id", eventId)
              .in("guest_id", chunk)
              .neq("status", "removed")
              .order("id", { ascending: true })
              .limit(limit);
            if (after) q = q.gt("id", after);
            return q;
          },
          (m) => m.id,
        );
        return rows;
      },
    );
    return media.map((m) => m.id);
  } catch (error) {
    captureError("media", error, {
      seam: "guest_media_ids_fail_closed",
      eventId,
    });
    return [];
  }
}
