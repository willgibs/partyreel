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
  name: string;
  description: string | null;
  moderation_mode: Database["public"]["Enums"]["moderation_mode"];
  is_public: boolean;
  accepting_uploads: boolean;
  require_email: boolean;
  require_display_name: boolean;
  event_date: string | null;
  // Cosmetic QR preset (for the in-page share QR). Plain text; resolveQrPreset()
  // falls back to 'classic' for null/legacy values.
  qr_style: string;
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
      name: row.name,
      description: row.description ?? null,
      moderation_mode: row.moderation_mode,
      is_public: row.is_public,
      accepting_uploads: row.accepting_uploads,
      require_email: row.require_email,
      require_display_name: row.require_display_name,
      event_date: row.event_date ?? null,
      qr_style: row.qr_style,
    },
  };
});

/** Just the fields the gallery presign needs (keys stay server-side, ADR-0003). */
export type GuestMediaRow = {
  id: string;
  type: Database["public"]["Enums"]["media_type"];
  original_key: string;
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
  return (data ?? []).map((m) => ({
    id: m.id,
    type: m.type,
    original_key: m.original_key,
  }));
}
