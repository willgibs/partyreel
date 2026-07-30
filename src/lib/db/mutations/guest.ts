/**
 * Guest upload flow — wrappers over the capability-token RPCs (ADR-0004). All
 * anonymous: the opaque session_token IS the auth, validated inside each RPC, so
 * there's no `getUser()` here. Called from the `/api/guests` + `/api/r2/*` route
 * handlers; each returns a discriminated result the route maps to an HTTP status.
 *
 * Error mapping matches Postgres SQLSTATEs (stable) where possible:
 *   P0002 no_data_found  → unknown event / invalid session
 *   23514 check_violation → required field / uploads closed / bad key / over a limit
 *   23505 unique_violation → duplicate media_id on retry (see createMedia)
 */
import "server-only";

import type { Database } from "@/lib/db/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type MediaType = Database["public"]["Enums"]["media_type"];
type MediaStatus = Database["public"]["Enums"]["media_status"];

const NO_DATA_FOUND = "P0002";
const CHECK_VIOLATION = "23514";
const UNIQUE_VIOLATION = "23505";

// ─── create_guest ───────────────────────────────────────────────────────────

export type CreateGuestResult =
  | {
      ok: true;
      data: { session_token: string; guest_id: string; event_id: string };
    }
  | {
      ok: false;
      code:
        | "not_found"
        | "email_required"
        | "unlock_required"
        | "unauthorized"
        | "unknown";
      message: string;
    };

export async function createGuest(input: {
  qrToken: string;
  userId: string | null;
  /**
   * QA #18: the route-derived proof that this request may pass a password event's lock (the
   * unlock cookie, or event ownership — see mayUploadPastLock). The RPC refuses a `password`
   * event without it; `open` ignores it; `private` refuses regardless.
   */
  unlockProven: boolean;
}): Promise<CreateGuestResult> {
  // Server-mediated (H3): create_guest is service-role-only now. The admin client has no auth.uid(), so the
  // /api/guests route passes the getUser()-verified user id as the trusted p_user_id (null for an anonymous
  // guest); the RPC still reads the verified EMAIL from auth.users for that id (never the client).
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("create_guest", {
    p_qr_token: input.qrToken,
    p_user_id: input.userId ?? undefined,
    p_unlock_proven: input.unlockProven,
  });

  if (error) {
    if (error.code === NO_DATA_FOUND) {
      return {
        ok: false,
        code: "not_found",
        message: "This event link is no longer valid.",
      };
    }
    if (error.code === CHECK_VIOLATION) {
      // create_guest raises check_violation for three distinct refusals; disambiguate by message
      // (the mapCheckViolation pattern below). All three are BACKSTOPS: the /api/guests route
      // pre-gates visibility and the /e/ page gates accounts up front, so reaching any of these
      // means a direct-API call or a race.
      const m = error.message.toLowerCase();
      if (m.includes("locked")) {
        return { ok: false, code: "unlock_required", message: error.message };
      }
      if (m.includes("private")) {
        return { ok: false, code: "unauthorized", message: error.message };
      }
      return {
        ok: false,
        code: "email_required",
        message: error.message,
      };
    }
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't join this event. Please try again.",
    };
  }

  return {
    ok: true,
    data: data as unknown as {
      session_token: string;
      guest_id: string;
      event_id: string;
    },
  };
}

// ─── get_upload_context ──────────────────────────────────────────────────────

export type UploadContext =
  | { event_id: string; accepting_uploads: false; event_deleted: true }
  | {
      event_id: string;
      accepting_uploads: boolean;
      event_deleted: false;
      // QA #18: the event's access level, so presign/complete re-check the password/private lock
      // on EVERY request (a grandfathered session token dies the moment the host locks the event).
      // Absent (undefined) only until migration 20260729190000 is applied — house ordering applies
      // it before this code deploys; the gates then no-op to the pre-gate behavior, never crash.
      visibility: Database["public"]["Enums"]["event_visibility"];
      // Account-level (storage-cap model): at_storage_cap = host's total bytes are
      // at/over cap; at_monthly_cap = host hit the monthly ingress meter. Both coarse
      // pre-checks — create_media is authoritative (see get_upload_context).
      at_storage_cap: boolean;
      at_monthly_cap: boolean;
      // Phase 2: true when this is a video request on a FREE host (video is paid-only).
      // Advisory — create_media is the authoritative gate. False for photo requests.
      video_blocked: boolean;
      // The guest-effective per-upload ceiling in bytes: least(10 GB, host's per-event cap).
      // The host CEILING only (never remaining storage — at_storage_cap signals "full"), so
      // a guest can't learn the host's usage. Advisory — create_media re-checks the host cap.
      max_upload_bytes: number;
    };

export type UploadContextResult =
  | { ok: true; data: UploadContext }
  | { ok: false; code: "invalid_session"; message: string };

export async function getUploadContext(
  sessionToken: string,
  type: MediaType,
): Promise<UploadContextResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_upload_context", {
    p_session_token: sessionToken,
    p_type: type,
  });
  if (error) throw error;

  // null = unknown session.
  if (!data) {
    return {
      ok: false,
      code: "invalid_session",
      message: "Your upload session has expired. Refresh and rejoin.",
    };
  }
  return { ok: true, data: data as unknown as UploadContext };
}

// ─── create_media ────────────────────────────────────────────────────────────

export type CreateMediaResult =
  | {
      ok: true;
      data: { media_id: string; status: MediaStatus } | { idempotent: true };
    }
  | {
      ok: false;
      code:
        | "invalid_session"
        | "uploads_closed"
        | "cap_reached"
        | "too_large"
        | "too_long"
        | "video_not_allowed"
        | "bad_key"
        | "unknown";
      message: string;
    };

export async function createMedia(input: {
  sessionToken: string;
  mediaId: string;
  type: MediaType;
  originalKey: string;
  fileSizeBytes: number;
  previewKey?: string | null;
  durationSeconds?: number | null;
  width?: number | null;
  height?: number | null;
}): Promise<CreateMediaResult> {
  // Server-mediated (H1): create_media is service-role-only (revoked from anon/authenticated), so it can't
  // be called directly via PostgREST with a spoofed size — the complete-upload route HEADs R2 for the real
  // size and calls here via the admin client. The session_token in the body remains the guest capability.
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("create_media", {
    p_session_token: input.sessionToken,
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
    // Retry idempotency: a duplicate media_id means create_media already ran for
    // this file. It's one transaction (insert → ledger → storage), so a duplicate
    // rolled back with NO double-count — treat as success.
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: true, data: { idempotent: true } };
    }
    if (error.code === NO_DATA_FOUND) {
      return {
        ok: false,
        code: "invalid_session",
        message: "Your upload session has expired.",
      };
    }
    if (error.code === CHECK_VIOLATION) {
      return mapCheckViolation(error.message);
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

// create_media raises a single check_violation for several distinct failures;
// disambiguate by message. These are backstops — the presign route pre-checks
// size/duration/caps/accepting-uploads, so reaching here is usually a race.
function mapCheckViolation(message: string): CreateMediaResult {
  const m = message.toLowerCase();
  if (m.includes("not accepting") || m.includes("no longer exists")) {
    return {
      ok: false,
      code: "uploads_closed",
      message: "This event isn't accepting uploads right now.",
    };
  }
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
  // Phase 2 video Pro-gate ("...available on paid plans."). Distinct from the size
  // limits above (checked first), so "paid plan" uniquely identifies the video gate.
  // A backstop: the presign route's video_blocked flag is the friendly pre-check.
  if (m.includes("paid plan")) {
    return {
      ok: false,
      code: "video_not_allowed",
      message: "This event doesn't accept videos.",
    };
  }
  if (m.includes("limit") || m.includes("capacity")) {
    return { ok: false, code: "cap_reached", message };
  }
  return {
    ok: false,
    code: "unknown",
    message: "Couldn't save the upload. Please try again.",
  };
}
