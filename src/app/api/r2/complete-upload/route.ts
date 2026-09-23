import { createMedia, getUploadContext } from "@/lib/db/mutations/guest";
import { mayUploadPastLock } from "@/lib/events/upload-lock";
import { guestSessionCookieIfChanged } from "@/lib/guest/session-cookie";
import { captureWarning } from "@/lib/observability/sentry";
import {
  runCompletePipeline,
  type CompleteStrategy,
} from "@/lib/upload/server-pipeline";
import { completeUploadSchema } from "@/lib/validation/upload";

// Finalizes a guest upload. The pipeline engine owns the shared spine
// (multipart sum/abort guard + assemble, the R2-HEAD authoritative size);
// this strategy owns the create_media wrapper call (the authoritative gate
// for caps/limits/key-prefix + atomic ledger/status write) and the guest
// error-status mapping. A duplicate media_id on retry maps to success.
const guestCompleteStrategy: CompleteStrategy<typeof completeUploadSchema> = {
  schema: completeUploadSchema,
  captureLabel: "create_media",
  async createRecord(parsed, kind, realSize) {
    // QA #18 (host-app.md ruling 2): re-check the event's lock at COMPLETION too — a presigned URL
    // outlives a host's lock by up to 2h, and this is the write that counts (the media row +
    // ledger; the bytes an already-issued URL can land become a swept orphan, never album
    // content). Same policy as presign: `private` refuses everyone, `password` needs the cookie
    // or ownership. An invalid session or a deleted event falls through to createMedia, which
    // owns the canonical refusals for those states.
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
      // The identity gate, re-checked at COMPLETION too (the identity reshape, 2026-09-21): a
      // presigned URL outlives a switch flip by up to 2h, and this is the write that counts. The
      // bytes an already-issued URL landed become a swept orphan, never album content. create_media
      // refuses this as well (mapCheckViolation splits its wording back into the same code), so
      // this arm is the one that can name the event in the warning.
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
    });
    /* ★ THE FLIP IS A COOKIE AND THEN A REFRESH (the door as three steps, 2026-09-21). On an
       event requiring an upload to view, THIS is the write that opens the album, and the client
       calls `router.refresh()` the moment it lands: the RSC that comes back has to resolve this
       guest as a contributor, which it can only do from a cookie. Writing it here, on the
       response that carries the completion, closes that race for the one session that had no
       cookie yet (a row minted before this round, or a browser that cleared them). Only on a
       created row, only when the request did not already carry this exact token, and only with a
       token `create_media` just accepted. */
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

export async function POST(request: Request) {
  return runCompletePipeline(request, guestCompleteStrategy);
}
