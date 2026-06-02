/**
 * Saved-events reads for the signed-in visitor. "Saved events" is the FREE
 * account-from-guest growth payoff (Phase 3): anyone can save an event to come
 * back to it. Augments the anonymous capability flow (ADR-0004) — see ADR-0009.
 *
 * `get_saved_events` is a SECURITY DEFINER RPC because it reads the name/host/cover
 * of events the saver does NOT own (events RLS is host-only). It is auth.uid()-based
 * and authenticated-only, and MASKS by visibility (private → blanked; password →
 * name but no cover). We presign the cover key server-side here; raw R2 keys never
 * reach the browser.
 */
import "server-only";

import { presignDownload } from "@/lib/r2/presign";
import {
  savedEventCardProps,
  type SavedEventCardData,
  type SavedEventRow,
} from "@/lib/saved-events/card";
import { createClient } from "@/lib/supabase/server";

/** The signed-in visitor's saved events, render-ready (covers presigned). */
export async function getSavedEventCards(): Promise<SavedEventCardData[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc("get_saved_events");
  if (error) throw error;

  const rows = (data ?? []) as SavedEventRow[];
  return Promise.all(
    rows.map(async (r) => {
      // cover_key is non-null only for OPEN events (password media is gated, private
      // is blanked) — so a presign happens only where a public thumbnail is allowed.
      const coverUrl = r.cover_key
        ? await presignDownload({ key: r.cover_key })
        : null;
      return savedEventCardProps(r, coverUrl);
    }),
  );
}
