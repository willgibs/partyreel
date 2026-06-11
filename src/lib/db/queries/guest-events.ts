/**
 * Guest-facing reads for the `/e/[qr_token]` event page. Anonymous: the opaque
 * qr_token IS the capability (ADR-0004), so there's no `getUser()` here — the
 * SECURITY DEFINER RPCs filter `deleted_at` and return only guest-safe fields.
 */
import "server-only";

import { cache } from "react";

import type { Database } from "@/lib/db/types";
import { createClient } from "@/lib/supabase/server";

export type GuestEvent = {
  id: string;
  // The CANONICAL permanent capability (ADR-0004). This page may be reached via a custom
  // slug alias (ADR-0012), so every downstream qr_token-keyed call — the gallery poll,
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
  // typed non-null but the columns are nullable) — normalize defensively.
  return {
    ok: true,
    data: {
      id: row.id,
      qr_token: row.qr_token,
      name: row.name,
      description: row.description ?? null,
      moderation_mode: row.moderation_mode,
      visibility: row.visibility,
      has_password: row.has_password,
      accepting_uploads: row.accepting_uploads,
      allow_anonymous_uploads: row.allow_anonymous_uploads,
      event_date: row.event_date ?? null,
      qr_style: row.qr_style,
      host_display_name: row.host_display_name ?? null,
    },
  };
});

/**
 * The fields the gallery needs (keys stay server-side, ADR-0003). Dimensions +
 * duration feed the masonry tiles / video badges (Phase 4); they're WRITE-ONCE
 * at create_media (mutations only ever flip status fields), so they're stable
 * per id. Nullable: pre-measure-era rows and failed client measures are null
 * (the grid falls back to 1:1).
 */
export type GuestMediaRow = {
  id: string;
  type: Database["public"]["Enums"]["media_type"];
  original_key: string;
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
    width: m.width ?? null,
    height: m.height ?? null,
    duration_seconds: m.duration_seconds ?? null,
  }));
}
