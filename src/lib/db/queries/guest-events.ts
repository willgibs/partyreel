/**
 * Guest-facing event read for the join/upload screen. Anonymous: calls the
 * `get_event_by_qr_token` SECURITY DEFINER RPC (the opaque qr_token IS the
 * capability — ADR-0004), so there's no `getUser()` here. The RPC already
 * filters `deleted_at IS NULL` and returns only guest-safe fields.
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
    },
  };
});
