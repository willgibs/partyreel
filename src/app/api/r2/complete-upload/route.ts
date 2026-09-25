import { NextResponse } from "next/server";
import { z } from "zod";

import { createMedia, getUploadContext } from "@/lib/db/mutations/guest";
import { mayUploadPastLock } from "@/lib/events/upload-lock";
import { guestSessionCookieIfChanged } from "@/lib/guest/session-cookie";
import { SESSION_OTHER_ACCOUNT } from "@/lib/guest/session-owner";
import { checkSessionOwner } from "@/lib/guest/session-owner.server";
import { captureWarning } from "@/lib/observability/sentry";
import {
  abuseHashes,
  checkAbuseRate,
  recordAbuseEvent,
} from "@/lib/security/abuse-rate-limit-store";
import { clientIp } from "@/lib/security/unlock-rate-limit";
import {
  runCompletePipeline,
  type CompleteStrategy,
} from "@/lib/upload/server-pipeline";
import { completeUploadSchema } from "@/lib/validation/upload";

/**
 * THE GUEST COMPLETION'S SHAPE: the shared schema, plus the live reel's one field. `reel_eligible`
 * is false only for a clip the on-device creator adds to the album (`addClipToAlbum`), so the live
 * reel never plays a reel; absent is the column's default (true). Extended here rather than in the
 * shared validation module, so the host's completion shape is untouched until its own route passes
 * the field.
 */
const guestCompleteSchema = completeUploadSchema.extend({
  reel_eligible: z.boolean().optional(),
});

// Finalizes a guest upload. The pipeline engine owns the shared spine
// (multipart sum/abort guard + assemble, the R2-HEAD authoritative size);
// this strategy owns the create_media wrapper call (the authoritative gate
// for caps/limits/key-prefix + atomic ledger/status write) and the guest
// error-status mapping. A duplicate media_id on retry maps to success.
const guestCompleteStrategy: CompleteStrategy<typeof guestCompleteSchema> = {
  schema: guestCompleteSchema,
  captureLabel: "create_media",
  async createRecord(parsed, kind, realSize) {
    // The write path inherits the read gate (database-security.md), so the event's lock is
    // re-checked at COMPLETION too — a presigned URL outlives a host's lock by up to 2h, and this
    // is the write that counts (the media row + ledger; the bytes an already-issued URL can land
    // become a swept orphan, never album content). Same policy as presign: `private` refuses
    // everyone, `password` needs the cookie or ownership. An invalid session or a deleted event
    // falls through to createMedia, which owns the canonical refusals for those states.
    const ctx = await getUploadContext(parsed.session_token, kind);
    if (ctx.ok && !ctx.data.event_deleted) {
      if (ctx.data.visibility === "private") {
        return {
          ok: false as const,
          code: "unauthorized",
          message: "This event is private.",
        };
      }
      if (
        ctx.data.visibility === "password" &&
        !(await mayUploadPastLock(ctx.data.event_id))
      ) {
        return {
          ok: false as const,
          code: "unlock_required",
          message: "This event is locked. Enter the event password to upload.",
        };
      }
      // ★ WHOSE TICKET IS THIS, re-asked at COMPLETION
      // (lib/guest/session-owner.ts): a presign outlives a sign-out by up to 2h, and this is the
      // write that credits the photograph to a row. Same place in the ladder as presign's: under the
      // lock, above the identity gate. The bytes the earlier presign let through become a swept
      // orphan, never album content, and the client uploads the file again as whoever is holding
      // the phone now.
      const owner = await checkSessionOwner(parsed.session_token);
      if (!owner.ok) {
        return { ok: false as const, code: owner.code, message: owner.message };
      }
      // The identity gate, re-checked at COMPLETION too: a presigned URL outlives a switch flip
      // by up to 2h, and this is the write that counts. The bytes an already-issued URL landed
      // become a swept orphan, never album content. create_media refuses this as well
      // (mapCheckViolation splits its wording back into the same code), so this arm is the one
      // that can name the event in the warning.
      if (ctx.data.require_verified_email && !ctx.data.guest_verified) {
        captureWarning("security", "upload_refused_unverified", {
          event_id: ctx.data.event_id,
          stage: "complete",
        });
        return {
          ok: false as const,
          code: "verification_required",
          message: "Confirm your email to add photos to this event.",
        };
      }
    }
    const created = await createMedia({
      sessionToken: parsed.session_token,
      mediaId: parsed.media_id,
      type: kind,
      originalKey: parsed.key,
      fileSizeBytes: realSize,
      durationSeconds: parsed.duration_seconds ?? null,
      width: parsed.width ?? null,
      height: parsed.height ?? null,
      previewKey: parsed.preview_key ?? null,
      // Only a clip says anything here; every other upload leaves the column's default.
      reelEligible: parsed.reel_eligible,
    });
    /* ★ THE FLIP IS A COOKIE AND THEN A REFRESH. On an event requiring an upload to view, THIS is
       the write that opens the album, and the client calls `router.refresh()` the moment it lands:
       the RSC that comes back has to resolve this guest as a contributor, which it can only do
       from a cookie. Writing it here, on the response that carries the completion, closes that race
       for the one session that had no cookie yet (a row minted before the cookie existed, or a
       browser that cleared them). Only on a created row, only when the request did not already
       carry this exact token, and only with a token `create_media` just accepted. */
    if (created.ok && ctx.ok && ctx.data.event_id) {
      return {
        ...created,
        setCookies: [
          await guestSessionCookieIfChanged(
            ctx.data.event_id,
            parsed.session_token,
          ),
        ],
      };
    }
    return created;
  },
  errorStatus(code) {
    return code === "invalid_session"
      ? 401
      : code === "uploads_closed" ||
          code === "unlock_required" ||
          code === "unauthorized" ||
          code === SESSION_OTHER_ACCOUNT ||
          code === "verification_required"
        ? 403
        : code === "cap_reached"
          ? 409
          : code === "bad_key"
            ? 400
            : 422;
  },
  // Forensic capture (trust-safety-forensics.md): the guest's linkage IS the capability token; the
  // seam resolves it to the guests row server-side.
  forensicIdentity(parsed) {
    return { kind: "guest", sessionToken: parsed.session_token };
  },
};

/**
 * THE CLIP-ADD LIMITER (`reel_clip_add`, reel-teardown): a daily budget per guest session for
 * adding a clip to the album, checked BEFORE the pipeline spends a write and recorded only AFTER
 * it actually lands one — a refused or unrelated (non-clip) completion never touches the counter.
 * Scoped by the guest's OWN session token (abuse-rate-limit.ts's WHY-comment), never by event, so
 * one enthusiastic uploader can never drain a shared venue envelope for every other guest at the
 * same party. Fails OPEN on a limiter error, like every other kind here: the real gate is the
 * capability token + create_media's own caps, this is defense-in-depth.
 */
async function checkClipAddRate(
  sessionToken: string,
  ip: string,
): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  try {
    const { ipHash, scopeHash } = abuseHashes(
      ip,
      "reel_clip_add",
      sessionToken,
    );
    return await checkAbuseRate("reel_clip_add", ipHash, scopeHash);
  } catch {
    captureWarning("security", "abuse_limiter_unavailable_fail_open", {
      kind: "reel_clip_add",
    });
    return { allowed: true };
  }
}

async function recordClipAdd(sessionToken: string, ip: string): Promise<void> {
  try {
    const { ipHash, scopeHash } = abuseHashes(
      ip,
      "reel_clip_add",
      sessionToken,
    );
    await recordAbuseEvent("reel_clip_add", ipHash, scopeHash);
  } catch {
    // Best-effort; a swallowed write here only ever UNDER-counts (fails open), never blocks one.
  }
}

export async function POST(request: Request) {
  // A clip add is the one completion this route meters beyond create_media's own caps (the brief:
  // "the upload whose reel_eligible is false"). Peeking at a CLONE leaves the original stream
  // untouched for the pipeline's own parse; a body that fails to parse here just skips the gate and
  // lets the pipeline produce its normal bad_request refusal.
  let peek: { reel_eligible?: unknown; session_token?: unknown } = {};
  try {
    peek = (await request.clone().json()) as typeof peek;
  } catch {
    // Malformed JSON: fall through to the pipeline's own parse + refusal.
  }

  if (peek.reel_eligible === false && typeof peek.session_token === "string") {
    const ip = clientIp(request.headers);
    const gate = await checkClipAddRate(peek.session_token, ip);
    if (!gate.allowed) {
      return NextResponse.json(
        {
          ok: false,
          code: "rate_limited",
          message: "You've added a lot of clips today. Try again tomorrow.",
        },
        {
          status: 429,
          headers: { "Retry-After": String(gate.retryAfterSec ?? 86_400) },
        },
      );
    }
    const response = await runCompletePipeline(request, guestCompleteStrategy);
    if (response.ok) await recordClipAdd(peek.session_token, ip);
    return response;
  }

  return runCompletePipeline(request, guestCompleteStrategy);
}
