/**
 * Guest upload flow — wrappers over the capability-token RPCs (database-security.md). All
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
      data: {
        session_token: string;
        guest_id: string;
        event_id: string;
        /**
         * The identity reshape (2026-09-21): what the row was actually minted with, so the door
         * knows which identity it just got without a second read. NULL for a verified guest (their
         * profile name is the identity) and for a nameless mint.
         */
        display_name: string | null;
        /** True when the session proved a confirmed email at the mint (guests.verified_at stamped). */
        verified: boolean;
        /**
         * WHETHER an unproved address was stored, never WHAT (the guest identity round, 2026-09-22).
         * The mint settles it — create_guest nulls a typed address beside a confirmed account and on
         * a Require-verified-emails event — so the door renders the truth without a second read, and
         * the address itself never travels back out on a wire the host's own response rides.
         */
        emailAttached: boolean;
      };
    }
  | {
      ok: false;
      code:
        | "not_found"
        | "verification_required"
        | "name_invalid"
        | "email_invalid"
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
  /**
   * The identity reshape: the name typed at the door of a name-only event, already trimmed and
   * already through the route's profanity gate (the matcher is server-side only). Omitted on a
   * VERIFIED join, and ignored even if sent: create_guest NULLS a typed name beside a confirmed
   * account, because one row never carries two identities that can disagree.
   */
  displayName?: string | null;
  /**
   * The guest identity round (2026-09-22): the OPTIONAL address typed under the name at a names-mode
   * door, already normalised by the route's `parseGuestEmail`. Stored UNPROVED in
   * `guests.pending_email` and inert — never shown to the host or another guest, never attributed to
   * an account, NEVER MAILED, never expiring. create_guest nulls it beside a confirmed account and on
   * a Require-verified-emails event, so sending one there is harmless rather than a second identity.
   */
  pendingEmail?: string | null;
}): Promise<CreateGuestResult> {
  // Server-mediated (H3): create_guest is service-role-only now. The admin client has no auth.uid(), so the
  // /api/guests route passes the getUser()-verified user id as the trusted p_user_id (null for an anonymous
  // guest); the RPC still reads the verified EMAIL from auth.users for that id (never the client).
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("create_guest", {
    p_qr_token: input.qrToken,
    p_user_id: input.userId ?? undefined,
    p_unlock_proven: input.unlockProven,
    p_display_name: input.displayName ?? undefined,
    p_pending_email: input.pendingEmail ?? undefined,
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
      // create_guest raises check_violation for four distinct refusals; disambiguate by message
      // (the mapCheckViolation pattern below). All four are BACKSTOPS: the /api/guests route
      // pre-gates visibility, the identity gate and the name, so reaching any of these means a
      // direct-API call or a race (a host flipping the switch mid-join).
      const m = error.message.toLowerCase();
      if (m.includes("locked")) {
        return { ok: false, code: "unlock_required", message: error.message };
      }
      if (m.includes("private")) {
        return { ok: false, code: "unauthorized", message: error.message };
      }
      // "That name is too long." — the belt under guests_display_name_len. Only a caller that
      // skipped the route's parseGuestDisplayName can reach it.
      if (m.includes("name is too long")) {
        return { ok: false, code: "name_invalid", message: error.message };
      }
      // "That email address does not look right." — the belt under guests_pending_email_shape, and
      // the same story as the name's: only a caller that skipped the route's parseGuestEmail can
      // reach it. Matched on "email address" so the DB keeps the wording it wants while the guest
      // reads the one sentence the taxonomy owns.
      if (m.includes("email address")) {
        return { ok: false, code: "email_invalid", message: error.message };
      }
      // The remaining check_violation is the identity gate ("This event requires a verified email
      // to upload."), which is also the safest catch-all: a refusal we cannot name is far better
      // read as "prove an email" than as a generic failure.
      return {
        ok: false,
        code: "verification_required",
        message: error.message,
      };
    }
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't join this event. Please try again.",
    };
  }

  const minted = data as unknown as {
    session_token: string;
    guest_id: string;
    event_id: string;
    display_name?: string | null;
    verified?: boolean;
    email_attached?: boolean;
  };
  return {
    ok: true,
    data: {
      session_token: minted.session_token,
      guest_id: minted.guest_id,
      event_id: minted.event_id,
      display_name: minted.display_name ?? null,
      verified: minted.verified === true,
      // === true, never a truthy cast: an older payload without the key must read as "no address",
      // which is the safe answer in both directions (it never claims one was kept).
      emailAttached: minted.email_attached === true,
    },
  };
}

// ─── set_guest_display_name ──────────────────────────────────────────────────

export type SetGuestDisplayNameResult =
  | { ok: true; data: { guest_id: string; display_name: string } }
  | {
      ok: false;
      code:
        | "invalid_session"
        | "name_required"
        | "name_invalid"
        | "unauthorized"
        | "unknown";
      message: string;
    };

/**
 * Name (or rename) a guest row that carries no verified account — the identity reshape's second
 * door, reached through POST /api/guests/name. Service-role-only like every other guest WRITE
 * (ADR-0016), and here the route is load-bearing twice over: it owns the profanity gate (the
 * matcher must never ship to a browser) AND the rate limiter. The session token is the capability,
 * validated inside the RPC, so a caller can only ever rename the row it already holds.
 */
export async function setGuestDisplayName(input: {
  sessionToken: string;
  /** Already trimmed and profanity-checked by the route. */
  displayName: string;
}): Promise<SetGuestDisplayNameResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("set_guest_display_name", {
    p_session_token: input.sessionToken,
    p_display_name: input.displayName,
  });

  if (error) {
    if (error.code === NO_DATA_FOUND) {
      return {
        ok: false,
        code: "invalid_session",
        message: "Your guest session has expired. Refresh and rejoin.",
      };
    }
    if (error.code === CHECK_VIOLATION) {
      const m = error.message.toLowerCase();
      // "Your name comes from your account." — a VERIFIED guest's identity is their profile's, so
      // there is no second name to set. `unauthorized` (403) rather than a fourth code: this
      // session genuinely may not do this, and the RPC's own sentence carries the reason.
      if (m.includes("comes from your account")) {
        return { ok: false, code: "unauthorized", message: error.message };
      }
      if (m.includes("enter a name")) {
        return { ok: false, code: "name_required", message: error.message };
      }
      return { ok: false, code: "name_invalid", message: error.message };
    }
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't save that name. Please try again.",
    };
  }

  return {
    ok: true,
    data: data as unknown as { guest_id: string; display_name: string },
  };
}

// ─── set_guest_pending_email ─────────────────────────────────────────────────

export type SetGuestPendingEmailResult =
  | { ok: true; data: { guest_id: string; email_attached: boolean } }
  | {
      ok: false;
      code: "invalid_session" | "email_invalid" | "unauthorized" | "unknown";
      message: string;
    };

/**
 * Attach, change or DETACH the unproved address on a guest row (the guest identity round, Will
 * 2026-09-22), reached through POST /api/guests/email. The mirror of setGuestDisplayName above, and
 * service-role-only for the same ADR-0016 reason: an anon EXECUTE grant IS the attack surface, not
 * the route wrapping it. The session token is the capability, validated inside the RPC, so a caller
 * can only ever touch the row it already holds.
 *
 * ★ `email: null` IS THE DETACH, AND IT IS NOT AN ERROR. "Clear it" and "set it to nothing" are one
 * intent, so both columns go and the row falls back to a typed name alone. The RPC reads a blank the
 * same way, which is why null crosses the wire as `""`: the generated Args type declares `p_email`
 * as a required string, and the function's own `lower(nullif(btrim(coalesce(p_email,'')),''))`
 * turns an empty string into SQL NULL. Passing `undefined` would be a different thing entirely (the
 * parameter has no default, so PostgREST would refuse the call).
 *
 * ★ NOTHING IS EVER SENT to the address this writes. That is what makes accepting a stranger's
 * address safe, and it is why there is no confirmation arm here at all: proving an address happens
 * through auth, and a proved one lands in `guests.email` by a claim, never by this path.
 */
export async function setGuestPendingEmail(input: {
  sessionToken: string;
  /** Already trimmed, lowercased and shape-checked by the route; null detaches. */
  email: string | null;
}): Promise<SetGuestPendingEmailResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("set_guest_pending_email", {
    p_session_token: input.sessionToken,
    p_email: input.email ?? "",
  });

  if (error) {
    if (error.code === NO_DATA_FOUND) {
      return {
        ok: false,
        code: "invalid_session",
        message: "Your guest session has expired. Refresh and rejoin.",
      };
    }
    if (error.code === CHECK_VIOLATION) {
      // "Your email comes from your account." — a VERIFIED guest already has a proved address, so
      // there is no unproved one to set beside it. 403 rather than a fourth code, exactly as the
      // name door does: this session genuinely may not do this, and the RPC carries the reason.
      if (error.message.toLowerCase().includes("comes from your account")) {
        return { ok: false, code: "unauthorized", message: error.message };
      }
      return { ok: false, code: "email_invalid", message: error.message };
    }
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't save that email. Please try again.",
    };
  }

  const settled = data as unknown as {
    guest_id: string;
    email_attached?: boolean;
  };
  return {
    ok: true,
    data: {
      guest_id: settled.guest_id,
      email_attached: settled.email_attached === true,
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
      // The identity reshape (migration 20260921150000): the event's gate and THIS session's
      // standing, so presign/complete can refuse a request that arrives after the host flipped the
      // switch on, with a reason, instead of only failing at create_media. Both are advisory in the
      // same sense `visibility` is — create_media stays authoritative.
      require_verified_email: boolean;
      guest_verified: boolean;
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
        | "verification_required"
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
  // ★ THE IDENTITY GATE COMES FIRST, AND THE ORDER IS THE WHOLE POINT. create_media's refusal reads
  // "This event is not accepting uploads without a verified email." — worded that way ON PURPOSE by
  // wave 0's expand migration, so the build still on main (which has no branch for it) matches
  // "not accepting" and shows a sane "uploads are closed" instead of a generic failure. This branch
  // is what splits it back out now that the code exists: test the SPECIFIC substring above the
  // general one, or the identity refusal disappears into uploads_closed forever. A migration-text
  // guard (src/lib/db/migration-guards.test.ts) pins the DB half of the pair.
  if (m.includes("verified email")) {
    return {
      ok: false,
      code: "verification_required",
      message: "Confirm your email to add photos to this event.",
    };
  }
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
