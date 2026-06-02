/**
 * Host upload flow — wrappers over the AUTHENTICATED host upload RPCs
 * (create_media_as_host / get_host_upload_context). The host twin of the guest
 * wrappers in mutations/guest.ts: same discriminated-result shape (so the
 * /api/host/r2/* routes map failures to HTTP statuses), but the authorization is a
 * verified host JWT — the RPCs resolve auth.uid() + event ownership internally.
 *
 * No getUser() here (mirrors guest.ts, which has none): the route handler does the
 * getUser() gate, and the RPC re-checks ownership at the DB boundary. The
 * RLS-scoped server client carries the host's JWT, so auth.uid() resolves inside
 * the SECURITY DEFINER RPC.
 *
 * Error mapping matches the guest wrappers' Postgres SQLSTATEs:
 *   P0002 no_data_found  → not owner / event gone
 *   23514 check_violation → bad key / over a per-file limit / over a cap
 *   23505 unique_violation → duplicate media_id on retry (idempotent success)
 */
import "server-only";

import type { Database } from "@/lib/db/types";
import { createClient } from "@/lib/supabase/server";

type MediaType = Database["public"]["Enums"]["media_type"];
type MediaStatus = Database["public"]["Enums"]["media_status"];

const NO_DATA_FOUND = "P0002";
const CHECK_VIOLATION = "23514";
const UNIQUE_VIOLATION = "23505";

// ─── get_host_upload_context ─────────────────────────────────────────────────

export type HostUploadContext = {
  event_id: string;
  // Account-level (storage-cap model), same meaning as the guest UploadContext:
  // at_storage_cap = host's total bytes are at/over cap; at_monthly_cap = host hit
  // the monthly ingress meter. Coarse pre-checks — create_media_as_host is
  // authoritative.
  at_storage_cap: boolean;
  at_monthly_cap: boolean;
  // Phase 2: true when this is a video request on a FREE host (video is paid-only).
  // Advisory — create_media_as_host is the authoritative gate. False for photos.
  video_blocked: boolean;
};

export type HostUploadContextResult =
  | { ok: true; data: HostUploadContext }
  | { ok: false; code: "not_owner"; message: string };

export async function getHostUploadContext(
  eventId: string,
  type: MediaType,
): Promise<HostUploadContextResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_host_upload_context", {
    p_event_id: eventId,
    p_type: type,
  });
  if (error) throw error;

  // null = the caller doesn't own a live event with this id (not found / foreign /
  // deleted). The route 404s — no leaking whether the event exists.
  if (!data) {
    return {
      ok: false,
      code: "not_owner",
      message: "This event isn't available.",
    };
  }
  return { ok: true, data: data as unknown as HostUploadContext };
}

// ─── create_media_as_host ────────────────────────────────────────────────────

export type CreateHostMediaResult =
  | {
      ok: true;
      data: { media_id: string; status: MediaStatus } | { idempotent: true };
    }
  | {
      ok: false;
      code:
        | "not_owner"
        | "cap_reached"
        | "too_large"
        | "too_long"
        | "video_not_allowed"
        | "bad_key"
        | "unknown";
      message: string;
    };

export async function createMediaAsHost(input: {
  eventId: string;
  mediaId: string;
  type: MediaType;
  originalKey: string;
  fileSizeBytes: number;
  previewKey?: string | null;
  durationSeconds?: number | null;
  width?: number | null;
  height?: number | null;
}): Promise<CreateHostMediaResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_media_as_host", {
    p_event_id: input.eventId,
    p_media_id: input.mediaId,
    p_type: input.type,
    p_original_key: input.originalKey,
    p_file_size_bytes: input.fileSizeBytes,
    p_preview_key: input.previewKey ?? undefined,
    p_duration_seconds: input.durationSeconds ?? undefined,
    p_width: input.width ?? undefined,
    p_height: input.height ?? undefined,
  });

  if (error) {
    // Retry idempotency: a duplicate media_id means create_media_as_host already ran
    // for this file. It's one transaction (insert → ledger → storage), so the
    // duplicate rolled back with NO double-count — treat as success.
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: true, data: { idempotent: true } };
    }
    if (error.code === NO_DATA_FOUND) {
      return {
        ok: false,
        code: "not_owner",
        message: "This event isn't available.",
      };
    }
    if (error.code === CHECK_VIOLATION) {
      return mapHostCheckViolation(error.message);
    }
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't save the upload. Please try again.",
    };
  }

  return {
    ok: true,
    data: data as unknown as { media_id: string; status: MediaStatus },
  };
}

// create_media_as_host raises a single check_violation for several distinct failures
// (it copies create_media's messages verbatim); disambiguate by substring. These are
// backstops — the presign route pre-checks size/caps, so reaching here is usually a
// race. Mirrors mapCheckViolation in mutations/guest.ts, minus the guest-only
// "uploads_closed" case (the host RPC has no accepting_uploads check).
function mapHostCheckViolation(message: string): CreateHostMediaResult {
  const m = message.toLowerCase();
  if (m.includes("does not belong")) {
    return {
      ok: false,
      code: "bad_key",
      message: "That upload couldn't be verified. Please try again.",
    };
  }
  if (m.includes("exceeds")) {
    return { ok: false, code: "too_large", message };
  }
  if (m.includes("longer than")) {
    return { ok: false, code: "too_long", message };
  }
  // Phase 2 video Pro-gate ("...available on paid plans."). Checked after the size
  // limits, so "paid plan" uniquely identifies the video gate. A backstop — the host
  // presign route's video_blocked flag + the disabled video picker are the front line.
  if (m.includes("paid plan")) {
    return {
      ok: false,
      code: "video_not_allowed",
      message: "Video uploads are available on the Pro plan.",
    };
  }
  if (m.includes("limit") || m.includes("capacity")) {
    return {
      ok: false,
      code: "cap_reached",
      message: "Storage is full for your plan. Free up space or upgrade.",
    };
  }
  return {
    ok: false,
    code: "unknown",
    message: "Couldn't save the upload. Please try again.",
  };
}
