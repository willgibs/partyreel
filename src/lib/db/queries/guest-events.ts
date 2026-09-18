/**
 * Guest-facing reads for the `/e/[qr_token]` event page. Anonymous: the opaque
 * qr_token IS the capability (database-security.md), so there's no `getUser()` here — the
 * SECURITY DEFINER RPCs filter `deleted_at` and return only guest-safe fields.
 */
import "server-only";

import { cache } from "react";

import type { Database } from "@/lib/db/types";
import { isUnlocked } from "@/lib/events/unlock-cookie";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type GuestEvent = {
  id: string;
  // The CANONICAL permanent capability (database-security.md). This page may be reached via a custom
  // slug alias (host-app.md), so every downstream qr_token-keyed call — the gallery poll,
  // create_guest, save_event, create_report, verify_event_password — MUST use this, NOT
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
  // ON by default. When false the host requires an account (a verified session) to upload; the
  // /e/ page shows the "Enter event" account-or-login flow instead of the anonymous upload panel.
  allow_anonymous_uploads: boolean;
  event_date: string | null;
  // Cosmetic QR preset (for the in-page share QR). Plain text; resolveQrPreset()
  // falls back to 'classic' for null/legacy values.
  qr_style: string;
  // Joined from profiles — null if the host hasn't set a display name.
  host_display_name: string | null;
};

export type GuestEventResult =
  | { ok: true; data: GuestEvent }
  | { ok: false; code: "not_found" };

/**
 * The unlock-aware other half of the QA #40 redaction (migration 20260729180000).
 *
 * The RPC is anon-executable, so it now withholds `description` / `event_date` /
 * `host_display_name` from any NON-OWNER of a password or private event: a direct PostgREST call
 * with nothing but a link (or a guessed custom slug) used to return all three, which is strictly
 * more than the locked page ever renders. The RPC cannot see the unlock COOKIE, so it has to
 * assume "locked"; this restores the withheld fields once the password is actually proven.
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
  // for a second reason (QA #40): the RPC returns NULL for a PRIVATE event's name to a
  // non-owner, matching the page, which reveals nothing for private. Every consumer already
  // branches on `visibility === "private"` before reading the name (the page's lock return,
  // generateMetadata, the OG image, both gated API routes), so "" is never rendered.
  const event: GuestEvent = {
    id: row.id,
    qr_token: row.qr_token,
    name: row.name ?? "",
    description: row.description ?? null,
    moderation_mode: row.moderation_mode,
    visibility: row.visibility,
    has_password: row.has_password,
    accepting_uploads: row.accepting_uploads,
    allow_anonymous_uploads: row.allow_anonymous_uploads,
    event_date: row.event_date ?? null,
    qr_style: row.qr_style,
    host_display_name: row.host_display_name ?? null,
  };

  return { ok: true, data: await rehydrateUnlockedDetails(event) };
});

/**
 * The fields the gallery needs (keys stay server-side, uploads-and-r2.md). Dimensions +
 * duration feed the masonry tiles / video badges (Phase 4); they're WRITE-ONCE
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
};

// Approved media for the qr_token's event, NEWEST-FIRST, returned ONLY when the
// event is public (the RPC enforces `is_public`). Powers both the SSR gallery
// batch and the poll route (/api/guests/gallery) — NOT cached, since the poll
// wants fresh rows each call (and within one request there's a single caller).
export async function getEventMediaByQrToken(
  qrToken: string,
): Promise<GuestMediaRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_event_media_by_qr_token", {
    p_qr_token: qrToken,
  });
  if (error) throw error;
  // The generated RPC types overstate non-nullness (the columns are nullable);
  // normalize like `description` above so callers see honest nulls.
  return (data ?? []).map((m) => ({
    id: m.id,
    type: m.type,
    original_key: m.original_key,
    preview_key: m.preview_key ?? null,
    width: m.width ?? null,
    height: m.height ?? null,
    duration_seconds: m.duration_seconds ?? null,
  }));
}
