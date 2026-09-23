import { getUploadContext } from "@/lib/db/mutations/guest";
import { mayUploadPastLock } from "@/lib/events/upload-lock";
import { checkSessionOwner } from "@/lib/guest/session-owner.server";
import { captureWarning } from "@/lib/observability/sentry";
import {
  runPresignPipeline,
  type PresignStrategy,
} from "@/lib/upload/server-pipeline";
import { formatBytes } from "@/lib/utils";
import { presignUploadSchema } from "@/lib/validation/upload";

// Issues presigned URLs for a guest's browser → R2 DIRECT upload. The pipeline
// engine (lib/upload/server-pipeline.ts) owns the shared spine; this strategy
// owns the GUEST gates: the capability session, whose ticket it is (an
// account's row uploads only for that signed-in account), event state, video
// gating, caps, and the host-configurable per-event size cap (which binds
// GUESTS ONLY — the host route has no equivalent check). create_media (at
// complete) remains authoritative for everything re-checked here.
const guestPresignStrategy: PresignStrategy<typeof presignUploadSchema> = {
  schema: presignUploadSchema,
  async resolveEvent(parsed, kind) {
    const ctx = await getUploadContext(parsed.session_token, kind);
    if (!ctx.ok) {
      return {
        ok: false,
        refusal: { status: 401, code: "invalid_session", message: ctx.message },
      };
    }
    if (ctx.data.event_deleted) {
      return {
        ok: false,
        refusal: {
          status: 409,
          code: "event_gone",
          message: "This event is no longer available.",
        },
      };
    }
    // QA #18 (host-app.md ruling 2): the write path re-checks the event's LOCK per request, so a
    // session token minted while the event was open dies the moment the host locks it (the
    // leaked-link remediation). The lock outranks every other upload state — a viewer who can't
    // see the album learns nothing else about it. `private` refuses everyone (owner uploads ride
    // the host routes); `password` accepts the unlock cookie or the owner (mayUploadPastLock).
    if (ctx.data.visibility === "private") {
      return {
        ok: false,
        refusal: {
          status: 403,
          code: "unauthorized",
          message: "This event is private.",
        },
      };
    }
    if (
      ctx.data.visibility === "password" &&
      !(await mayUploadPastLock(ctx.data.event_id))
    ) {
      return {
        ok: false,
        refusal: {
          status: 403,
          code: "unlock_required",
          message: "This event is locked. Enter the event password to upload.",
        },
      };
    }
    if (!ctx.data.accepting_uploads) {
      return {
        ok: false,
        refusal: {
          status: 403,
          code: "uploads_closed",
          message: "This event isn't accepting uploads right now.",
        },
      };
    }
    // ★ WHOSE TICKET IS THIS (the upload-owner lane, 2026-09-23; lib/guest/session-owner.ts). A row
    // that carries an account writes only for that signed-in account, so a browser that kept a
    // confirmed guest's ticket can no longer credit the next person's photograph to them (another
    // account, or anyone signed out, past Require verified emails). Under the lock and the closed
    // switch, which are the truer sentences when they hold for everybody; ABOVE the identity gate,
    // because a ticket that is not yours says nothing about whether YOU have confirmed an email.
    // The client reads the code by name, puts the ticket down and joins as whoever is holding the
    // phone, so this sentence is almost never seen.
    const owner = await checkSessionOwner(parsed.session_token);
    if (!owner.ok) {
      return {
        ok: false,
        refusal: { status: 403, code: owner.code, message: owner.message },
      };
    }
    // ★ THE IDENTITY GATE, RE-CHECKED PER REQUEST (the identity reshape, 2026-09-21). A session
    // token minted while the event was name-only would otherwise upload forever after the host
    // flipped Require verified emails ON; create_media refuses it anyway, but only after the file
    // has already gone to R2, so the honest place to say so is here, before the bytes move. Read
    // from the CONTEXT (the RPC's own view of the event and this guest's standing), never from
    // anything the client sent. Sits under accepting_uploads on purpose: when uploads are closed
    // for everybody, "uploads are closed" is the truer sentence than "prove an email".
    if (ctx.data.require_verified_email && !ctx.data.guest_verified) {
      // R1.14: a flip's fallout must be VISIBLE. This is the signal that says a real party started
      // refusing real guests, and it is the difference between noticing within the hour and
      // hearing about it from the host.
      captureWarning("security", "upload_refused_unverified", {
        event_id: ctx.data.event_id,
        stage: "presign",
      });
      return {
        ok: false,
        refusal: {
          status: 403,
          code: "verification_required",
          message: "Confirm your email to add photos to this event.",
        },
      };
    }
    // A free event is photos-only. The message is EVENT-framed, never
    // tier-framed — a guest must not learn the host's plan.
    if (ctx.data.video_blocked) {
      return {
        ok: false,
        refusal: {
          status: 403,
          code: "video_not_allowed",
          message: "This event accepts photos only.",
        },
      };
    }
    if (ctx.data.at_storage_cap || ctx.data.at_monthly_cap) {
      return {
        ok: false,
        refusal: {
          status: 409,
          code: "cap_reached",
          message: ctx.data.at_storage_cap
            ? "This album is full right now. The host needs to free up space."
            : "This album has hit its upload limit for the month.",
        },
      };
    }
    // Host-configurable per-event cap (guests only). The universal 10 GB is
    // already enforced by the engine's validateUpload, so this only bites when
    // the host set a stricter cap; create_media re-checks on the R2-HEAD size.
    if (parsed.size_bytes > ctx.data.max_upload_bytes) {
      return {
        ok: false,
        refusal: {
          status: 422,
          code: "too_large",
          message: `Files for this event are capped at ${formatBytes(ctx.data.max_upload_bytes)}.`,
        },
      };
    }
    return { ok: true, eventId: ctx.data.event_id };
  },
};

export async function POST(request: Request) {
  return runPresignPipeline(request, guestPresignStrategy);
}
