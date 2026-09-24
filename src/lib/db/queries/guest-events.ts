/**
 * Guest-facing reads for the `/e/[qr_token]` event page. Anonymous: the opaque
 * qr_token IS the capability (database-security.md), so there's no `getUser()` here — the
 * SECURITY DEFINER RPCs filter `deleted_at` and return only guest-safe fields.
 */
import "server-only";

import { cache } from "react";

import { readAllPages } from "@/lib/db/read-all";
import type { Database } from "@/lib/db/types";
import { isUnlocked } from "@/lib/events/unlock-cookie";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type GuestEvent = {
  id: string;
  // The CANONICAL permanent capability (database-security.md). This page may be reached via a custom
  // slug alias (host-app.md), so every downstream qr_token-keyed call — the gallery poll,
  // create_guest, create_report, verify_event_password — MUST use this, NOT
  // the route param (those RPCs match qr_token only; a slug would resolve to nothing).
  qr_token: string;
  name: string;
  description: string | null;
  moderation_mode: Database["public"]["Enums"]["moderation_mode"];
  // 3-state access (open|password|private). `has_password` says whether a password
  // is set WITHOUT ever exposing the hash (the RPC returns only the boolean).
  visibility: Database["public"]["Enums"]["event_visibility"];
  has_password: boolean;
  accepting_uploads: boolean;
  // ★ THE HOST'S SWITCH. ON by default: a guest confirms an email before the full album and any
  // upload. OFF: a guest types a display name at the door and uploads under it with an unverified
  // mark. This is the flag every new read keys on.
  require_verified_email: boolean;
  /** Require an upload to view: ON, a guest sees the full album only once one upload of theirs completed; the gate fails open while uploads are closed or the album is full. */
  require_upload_to_view: boolean;
  event_date: string | null;
  // Cosmetic QR preset (for the in-page share QR). Plain text; resolveQrPreset()
  // falls back to 'classic' for null/legacy values.
  qr_style: string;
  // Joined from profiles — null if the host hasn't set a display name.
  host_display_name: string | null;
  /**
   * The event's custom slug (a mutable, human-readable alias of the permanent `qr_token`), or null.
   * Only ever SAID, never linked: the live reel's code plate prints it as the address a person can
   * read off a screen, while every link and every code still carries the canonical token.
   */
  custom_slug: string | null;
  /** The host's switch for the live reel on the album, default ON (the live reel's expand). */
  show_reel: boolean;
  /** The host's default mood for the live reel; null is the default mood. A viewer's own pick
   *  overrides it on their device and is never written back. */
  reel_style_id: string | null;
};

export type GuestEventResult =
  | { ok: true; data: GuestEvent }
  | { ok: false; code: "not_found" };

/**
 * The unlock-aware other half of get_event_by_qr_token's redaction (migration 20260729180000).
 *
 * The RPC is anon-executable, so it withholds `description` / `event_date` /
 * `host_display_name` from any NON-OWNER of a password or private event: a direct PostgREST call
 * with nothing but a link (or a guessed custom slug) would otherwise return all three, which is
 * strictly more than the locked page ever renders. The RPC cannot see the unlock COOKIE, so it has
 * to assume "locked"; this restores the withheld fields once the password is actually proven.
 *
 * SELF-GUARDED on isUnlocked(), exactly like getApprovedMediaForUnlock — the privileged read
 * carries its own gate rather than trusting the caller. `private` is never re-hydrated (that page
 * reveals nothing at all), and the all-three-null precondition means an OWNER (whom the RPC never
 * redacts) short-circuits without a query. Cost: two indexed single-row admin reads, only for an
 * unlocked password event, and only once per request (getEventByQrToken is cache()d).
 */
async function rehydrateUnlockedDetails(
  event: GuestEvent,
): Promise<GuestEvent> {
  if (event.visibility !== "password") return event;
  // The redaction blanks all three together, so any survivor means nothing was redacted.
  if (
    event.description !== null ||
    event.event_date !== null ||
    event.host_display_name !== null
  ) {
    return event;
  }
  if (!(await isUnlocked(event.id))) return event;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("events")
    .select("description, event_date, host_id")
    .eq("id", event.id)
    .maybeSingle();
  if (error || !data) return event; // never fail the page over a cosmetic re-read

  let hostDisplayName: string | null = null;
  if (data.host_id) {
    // Deliberate swallow, same policy as the read above: this whole function is a COSMETIC
    // re-hydration of three display fields for a viewer who has already proven the password.
    // A failed byline lookup must degrade to "no byline", never fail an unlocked album — the
    // guest still sees their photos, which is the thing that matters.
    // eslint-disable-next-line partyreel/no-swallowed-db-error
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", data.host_id)
      .maybeSingle();
    hostDisplayName = profile?.display_name ?? null;
  }

  return {
    ...event,
    description: data.description ?? null,
    event_date: data.event_date ?? null,
    host_display_name: hostDisplayName,
  };
}

// cache() dedupes within a request so generateMetadata + the page render share
// ONE get_event_by_qr_token RPC call per qr token.
export const getEventByQrToken = cache(async function getEventByQrToken(
  qrToken: string,
): Promise<GuestEventResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_event_by_qr_token", {
    p_qr_token: qrToken,
  });
  if (error) throw error;

  // The RPC returns a 0/1-row set; empty = missing/deleted (don't leak existence).
  const row = data?.[0];
  if (!row) return { ok: false, code: "not_found" };

  // The generated types understate nullability (`description`/`event_date` are
  // typed non-null but the columns are nullable) — normalize defensively. `name` joins them
  // for a second reason (the private-name redaction): the RPC returns NULL for a PRIVATE
  // event's name to a non-owner, matching the page, which reveals nothing for private. Every
  // consumer already branches on `visibility === "private"` before reading the name (the page's
  // lock return, generateMetadata, the OG image, both gated API routes), so "" is never rendered.
  const event: GuestEvent = {
    id: row.id,
    qr_token: row.qr_token,
    name: row.name ?? "",
    description: row.description ?? null,
    moderation_mode: row.moderation_mode,
    visibility: row.visibility,
    has_password: row.has_password,
    accepting_uploads: row.accepting_uploads,
    require_verified_email: row.require_verified_email,
    require_upload_to_view: row.require_upload_to_view,
    event_date: row.event_date ?? null,
    qr_style: row.qr_style,
    host_display_name: row.host_display_name ?? null,
    custom_slug: row.custom_slug ?? null,
    // The live reel's two event facts. `?? true` / `?? null`: an RPC from before the expand never
    // returned them, and a missing switch must read as the default (on), never as off.
    show_reel: row.show_reel ?? true,
    reel_style_id: row.reel_style_id ?? null,
  };

  return { ok: true, data: await rehydrateUnlockedDetails(event) };
});

/**
 * The fields the gallery needs (keys stay server-side, uploads-and-r2.md). Dimensions +
 * duration feed the masonry tiles / video badges; they're WRITE-ONCE
 * at create_media (mutations only ever flip status fields), so they're stable
 * per id. Nullable: pre-measure-era rows and failed client measures are null
 * (the grid falls back to 1:1).
 */
export type GuestMediaRow = {
  id: string;
  type: Database["public"]["Enums"]["media_type"];
  original_key: string;
  /** The small WebP preview variant (client-generated at upload); null on pre-feature rows. Flows
   *  through toGridItems → previewUrl so guest tiles serve the small preview. */
  preview_key: string | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  /**
   * `media.reel_eligible`, "plays in the live reel": false only for a cut someone added to the album,
   * so the live reel never plays a reel. WRITE-ONCE at create_media, so like the dimensions it rides
   * outside the gallery ETag (gallery-fingerprint.ts).
   */
  reel_eligible: boolean;
  /**
   * The album's order key, and its keyset cursor: the RAW timestamp string Postgres returned
   * (`2026-09-23T23:31:24.644108+00:00`), never a `Date`, because microseconds decide ties and a
   * `Date` keeps milliseconds (read-all.ts, rule 1). Server-side only: toGridItems never copies it
   * onto a GridMedia, and the ETag does not hash it (write-once per id, like the dimensions).
   */
  created_at: string;
};

/** Where the next page of a newest-first album resumes: the last row's own `(created_at, id)`. */
export type AlbumCursor = { at: string; id: string };

/** The cursor a page's last row hands the next page. */
export function albumCursorOf(row: {
  created_at: string;
  id: string;
}): AlbumCursor {
  return { at: row.created_at, id: row.id };
}

/**
 * The rows strictly AFTER a cursor in newest-first order, as a PostgREST logic tree for `.or()`:
 * older than its timestamp, or the same timestamp with a smaller id. The table-read twin of the
 * RPC's `(created_at, id) < (p_before_created_at, p_before_id)`, so an open album (the RPC) and an
 * unlocked password album (the table) page through one order. The timestamp rides unquoted, the
 * shape read-all.ts prescribes; measured on a 1,145-item album, it walks every approved row in two
 * pages, in the RPC's exact order.
 */
export function olderThan(after: AlbumCursor): string {
  return `created_at.lt.${after.at},and(created_at.eq.${after.at},id.lt.${after.id})`;
}

/**
 * The OPEN album: every approved item of the qr_token's event, NEWEST FIRST (`created_at desc,
 * id desc`), returned ONLY while the event is open (the RPC's own `visibility = 'open'` gate). It
 * serves the SSR gallery, the poll route and the guest export, all through
 * `loadGalleryRowsForAccess`. NOT cached: the poll wants fresh rows on every call, and within one
 * request there is a single caller.
 *
 * ★ READ WHOLE. PostgREST cuts a set-returning RPC at 1,000 rows with no error, so a single call
 * would hand a 1,145-item album its newest 1,000 and the oldest would never show. It pages through
 * `readAllPages` on the album's own display order, the last row's `(created_at, id)` as the cursor
 * and `p_limit` on every page, and the pages concatenate in that order. The ORDER is load-bearing:
 * `mergeGalleryItems`, `reconcileGalleryItems` and toGridItems keep server order, and the gallery
 * ETag hashes the ids in order.
 */
export async function getEventMediaByQrToken(
  qrToken: string,
): Promise<GuestMediaRow[]> {
  const supabase = await createClient();
  const { rows } = await readAllPages(
    "guest album: get_event_media_by_qr_token",
    (after: AlbumCursor | null, limit) =>
      supabase.rpc("get_event_media_by_qr_token", {
        p_qr_token: qrToken,
        // Undefined on the first page: the keys drop out of the POST body and the SQL defaults
        // (null, null) read from the newest item.
        p_before_created_at: after?.at,
        p_before_id: after?.id,
        p_limit: limit,
      }),
    albumCursorOf,
  );
  // The generated RPC types overstate non-nullness (the columns are nullable);
  // normalize like `description` above so callers see honest nulls.
  return rows.map((m) => ({
    id: m.id,
    type: m.type,
    original_key: m.original_key,
    preview_key: m.preview_key ?? null,
    width: m.width ?? null,
    height: m.height ?? null,
    duration_seconds: m.duration_seconds ?? null,
    // Absent (an RPC from before the expand) reads as eligible: a stale shape must not empty the reel.
    reel_eligible: m.reel_eligible ?? true,
    created_at: m.created_at,
  }));
}
