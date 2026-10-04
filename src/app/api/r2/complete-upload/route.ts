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

// Finalizes a guest upload. The pipeline engine owns the shared spine
// (multipart sum/abort guard + assemble, the R2-HEAD authoritative size);
// this strategy owns the create_media wrapper call (the authoritative gate
// for caps/limits/key-prefix + atomic ledger/status write) and the guest
// error-status mapping. A duplicate media_id on retry maps to success.
// ★ A BURST'S FILES (the engine's head note) share one read each of the ticket's context, the lock and the ticket's
// owner (`burst.memo`); create_media is each file's own, and so is the clip budget.
const guestCompleteStrategy: CompleteStrategy<typeof guestCompleteSchema> = {
  schema: guestCompleteSchema,
  captureLabel: "create_media",
  async createRecord(parsed, kind, realSize, phone, burst) {
    const token = parsed.session_token;
    // The write path inherits the read gate (database-security.md), so the door is re-checked at
    // COMPLETION too: a presigned URL outlives a host's change by up to 2h, and this is the write
    // that counts (the media row + ledger; the bytes an already-issued URL can land become a swept
    // orphan, never album content). Same policy as presign: the context answers the door as this
    // ticket sees it, so `private` refuses every shut ticket, and `password` (a database before the
    // doors' migration) needs the cookie or ownership. An invalid session or a deleted event falls
    // through to createMedia, which owns the canonical refusals for those states.
    const ctx = await burst.memo(`context:${kind}:${token}`, () =>
      getUploadContext(token, kind),
    );
    if (ctx.ok && !ctx.data.event_deleted) {
      const eventId = ctx.data.event_id;
      if (ctx.data.visibility === "private") {
        return {
          ok: false as const,
          code: "unauthorized",
          message: "This event is private.",
        };
      }
      if (
        ctx.data.visibility === "password" &&
        !(await burst.memo(`lock:${eventId}`, () => mayUploadPastLock(eventId)))
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
      const owner = await burst.memo(`owner:${token}`, () =>
        checkSessionOwner(token),
      );
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
          event_id: eventId,
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
      sessionToken: token,
      mediaId: parsed.media_id,
      type: kind,
      originalKey: parsed.key,
      fileSizeBytes: realSize,
      durationSeconds: parsed.duration_seconds ?? null,
      width: parsed.width ?? null,
      height: parsed.height ?? null,
      previewKey: parsed.preview_key ?? null,
      // The phone-size copy the engine verified on its HEAD (take-home r1), or none.
      phoneKey: phone?.key ?? null,
      phoneBytes: phone?.bytes ?? null,
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
          await guestSessionCookieIfChanged(ctx.data.event_id, token),
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
        : code === "cap_reached" || code === "roll_spent"
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
  /**
   * ★ THE CLIP-ADD LIMITER, A CLIP AT A TIME (the brief: "the upload whose reel_eligible is false"): the one
   * completion this route meters beyond create_media's own caps. The engine asks it once the clip's row is known not
   * to exist (★ A CLIP ALREADY RECORDED IS ITS ROW'S TO ANSWER, NEVER THE BUDGET'S, crumbs-62: its completion sent
   * again writes nothing, so it neither meets the limiter, a spent day included, nor spends it) and before a byte of
   * it lands, and spends it once the clip's completion answers ok; a burst's clips meet it one after another. Every
   * other upload never touches it.
   */
  budget: {
    async check(parsed, request) {
      if (parsed.reel_eligible !== false) return null;
      const gate = await checkClipAddRate(
        parsed.session_token,
        clientIp(request.headers),
      );
      return gate.allowed
        ? null
        : {
            refusal: {
              status: 429,
              code: "rate_limited",
              message: "You've added a lot of clips today. Try again tomorrow.",
            },
            retryAfterSec: gate.retryAfterSec ?? 86_400,
          };
    },
    async spend(parsed, request) {
      if (parsed.reel_eligible !== false) return;
      await recordClipAdd(parsed.session_token, clientIp(request.headers));
    },
  },
};

export async function POST(request: Request) {
  return runCompletePipeline(request, guestCompleteStrategy);
}
