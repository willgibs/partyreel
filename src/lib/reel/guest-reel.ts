/**
 * The GUEST reel read (R3, guest-flow.md): what a guest viewer may know about an event's reel.
 *
 * TWO ARMS behind one gate, mirroring the gallery's own split (gallery-access.server.ts):
 *
 *   open event      → the anon RPC `get_event_reel_by_qr_token` on the USER client, so the page
 *                     exercises the EXACT capability surface a direct anon caller gets (drift
 *                     between the page and the anon surface cannot hide).
 *   password event  → the self-guarded ADMIN arm: password events never flow through anon RPCs
 *                     (the RPC gates visibility='open' internally), so the read rides
 *                     `resolveReelRenderContext` with the unlock-cookie check INSIDE the
 *                     privileged path (the getApprovedMediaForUnlock pattern) — not just upstream.
 *
 * The STRUCTURAL gate comes first: at anything below gallery access `full` the reel does not exist
 * for this viewer (never a teaser bypass), before any read happens.
 *
 * FRESHNESS (rendered_hash vs the current config) is deliberately NOT here: it can go stale
 * between paint and tap, so it is computed only in the download route at request time. This
 * payload's `mp4Ready` says an artifact exists, nothing more.
 */
import "server-only";

import type { GuestEvent } from "@/lib/db/queries/guest-events";
import type { Database } from "@/lib/db/types";
import type { GalleryAccess } from "@/lib/events/gallery-access";
import { isUnlocked } from "@/lib/events/unlock-cookie";
import {
  type GuestReelPayload,
  toGuestReelPayload,
} from "@/lib/reel/guest-reel-payload";
import { resolveReelRenderContext } from "@/lib/reel/render-service";
import { presignDownload } from "@/lib/r2/presign";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import type { GuestReelRpcRow } from "@/lib/reel/guest-reel-payload";

type ReelRow = Database["public"]["Tables"]["highlight_reels"]["Row"];

/**
 * Resolve the guest reel payload for the /e/ page. Null = "no reel for this viewer", which
 * deliberately collapses unpublished / empty / locked / absent into one indistinguishable answer.
 */
export async function getGuestReelContext(
  event: GuestEvent,
  access: GalleryAccess,
): Promise<GuestReelPayload | null> {
  // The reel renders ONLY at gallery access `full` — enforced BEFORE any read so a
  // teaser/none viewer structurally cannot reach either arm.
  if (access !== "full") return null;

  const row =
    event.visibility === "password"
      ? await viaUnlockedAdmin(event)
      : await viaAnonRpc(event);
  if (!row) return null;

  const coverUrl = await presignCover(row);
  return toGuestReelPayload(row, coverUrl);
}

/** The open-event arm: the anon capability RPC, called exactly as a guest's browser could. */
async function viaAnonRpc(event: GuestEvent): Promise<GuestReelRpcRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_event_reel_by_qr_token", {
    // ALWAYS the canonical token (the route param may be a custom slug — GuestEvent's contract).
    p_qr_token: event.qr_token,
  });
  // A failed read renders the page WITHOUT the card rather than failing the album (deliberate
  // degrade, not a swallow: the error IS consumed here) — the reel is an enhancement on this
  // surface, and the RPC returning zero rows is already the common case.
  if (error || !data || data.length === 0) return null;
  return data[0] ?? null;
}

/**
 * The password-event arm. The unlock check lives INSIDE the privileged path (not just upstream in
 * the caller) so a future second caller cannot reach the admin read without proving the cookie —
 * the exact shape getApprovedMediaForUnlock documents.
 */
async function viaUnlockedAdmin(
  event: GuestEvent,
): Promise<GuestReelRpcRow | null> {
  if (!(await isUnlocked(event.id))) return null;

  const admin = createAdminClient();
  const ctx = await resolveReelRenderContext(admin, event.id);
  if (!ctx) return null;

  const row: ReelRow | null = ctx.row;
  if (row?.guest_visible !== true) return null;
  if (ctx.orderedApprovedIds.length === 0) return null;

  // Mirror the RPC's derived fields 1:1 (same clamp, same watermark derivation, same
  // artifact-exists definition) so the two arms cannot drift.
  return {
    style_id: ctx.styleId,
    orientation: ctx.orientation,
    seed: ctx.seed,
    length_seconds: ctx.lengthSeconds,
    cover_media_id: ctx.coverMediaId,
    mp4_ready: row.status === "ready" && !!row.output_key,
    watermark: ctx.watermark,
    item_ids: ctx.orderedApprovedIds,
  };
}

/**
 * One stable inline presign for the card's cover still: the effective first frame — the chosen
 * cover when it is (still) in the timeline, else the first timeline item (buildReelProps' own
 * hoist semantics). Best-effort: a failed read degrades to null (the card renders a styled frame),
 * never fails the page.
 */
async function presignCover(row: GuestReelRpcRow): Promise<string | null> {
  const coverId =
    row.cover_media_id && row.item_ids.includes(row.cover_media_id)
      ? row.cover_media_id
      : (row.item_ids[0] ?? null);
  if (!coverId) return null;

  try {
    const admin = createAdminClient();
    // eslint-disable-next-line partyreel/no-swallowed-db-error -- deliberate: the cover is cosmetic; a failed read degrades to the styled frame (see the catch below), never a 500 on the album page
    const { data } = await admin
      .from("media")
      .select("preview_key, original_key")
      .eq("id", coverId)
      .maybeSingle();
    if (!data) return null;
    return await presignDownload({
      key: data.preview_key ?? data.original_key,
      stable: true,
    });
  } catch {
    // Deliberate swallow: the cover is cosmetic — the poster card must render (and the overlay's
    // live player does not depend on it), so a presign hiccup must never 500 the album page.
    return null;
  }
}
