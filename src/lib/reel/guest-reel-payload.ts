/**
 * The GUEST reel payload: the pure contract surface of the guest reel read (R3, guest-flow.md ruling 5).
 *
 * Kept free of server imports so the contract test can pin it directly. The shape mirrors
 * get_event_reel_by_qr_token's RETURNS TABLE (supabase/migrations/20260730120000): that table IS the
 * anon allow-list, and this module is its TypeScript mirror. If either side changes, the contract
 * test + the migration comment must move together.
 */
import type { Orientation } from "@/lib/reel/engine/constants";

/**
 * One row of get_event_reel_by_qr_token, exactly as PostgREST serializes it. The contract test
 * pins this mirror key-for-key against the GENERATED Returns type (the mirror stays because the
 * generator cannot express cover_media_id's runtime nullability).
 */
export type GuestReelRpcRow = {
  style_id: string;
  orientation: string;
  seed: number;
  /** The EFFECTIVE length (already tier-clamped inside the RPC). Never null. */
  length_seconds: number;
  cover_media_id: string | null;
  /** An artifact EXISTS (status ready + output_key). Freshness is the download route's job. */
  mp4_ready: boolean;
  watermark: boolean;
  item_ids: string[];
};

/**
 * The allow-list, pinned. Every key the anon surface may carry — and, by the contract test,
 * nothing else. Order-insensitive; the test compares sorted.
 */
export const GUEST_REEL_ALLOWED_KEYS = [
  "style_id",
  "orientation",
  "seed",
  "length_seconds",
  "cover_media_id",
  "mp4_ready",
  "watermark",
  "item_ids",
] as const satisfies readonly (keyof GuestReelRpcRow)[];

/**
 * Names that must NEVER appear on the anon surface (guest-flow.md ruling 5's "never returned" list).
 * The contract test asserts zero intersection with the allow-list, so a future column added to the
 * RPC by name lands on this tripwire in review.
 */
export const GUEST_REEL_FORBIDDEN_KEYS = [
  "output_key",
  "render_id",
  "rendered_hash",
  "render_error",
  "render_cost_usd",
  "render_started_at",
  "rendered_at",
  "created_at",
  "updated_at",
  "tier",
  "status",
] as const;

/** What the /e/ RSC hands the client: the RPC row, narrowed + camelCased, plus ONE presigned cover. */
export type GuestReelPayload = {
  styleId: string;
  orientation: Orientation;
  seed: number;
  /** EFFECTIVE (tier-clamped) seconds — feeds the meta line + buildReelProps' capToLength. */
  lengthSeconds: number;
  coverMediaId: string | null;
  watermark: boolean;
  /** Approved-only, re-filtered at read time, in reel order (the TIMELINE set). */
  orderedIds: string[];
  mp4Ready: boolean;
  /** A stable inline presign of the cover's preview (poster-card `media` slot). Null degrades to a styled frame. */
  coverUrl: string | null;
};

/** Narrow the RPC's text orientation to the engine union (the RPC already CASEs it, belt here). */
function narrowOrientation(value: string): Orientation {
  return value === "landscape" ? "landscape" : "portrait";
}

/** Map one RPC row (either arm) onto the client payload. Pure — pinned by the contract test. */
export function toGuestReelPayload(
  row: GuestReelRpcRow,
  coverUrl: string | null,
): GuestReelPayload {
  return {
    styleId: row.style_id,
    orientation: narrowOrientation(row.orientation),
    seed: row.seed,
    lengthSeconds: row.length_seconds,
    coverMediaId: row.cover_media_id,
    watermark: row.watermark,
    orderedIds: row.item_ids,
    mp4Ready: row.mp4_ready,
    coverUrl,
  };
}
