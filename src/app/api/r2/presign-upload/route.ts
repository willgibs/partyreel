import { getUploadContext } from "@/lib/db/mutations/guest";
import {
  runPresignPipeline,
  type PresignStrategy,
} from "@/lib/upload/server-pipeline";
import { formatBytes } from "@/lib/utils";
import { presignUploadSchema } from "@/lib/validation/upload";

// Issues presigned URLs for a guest's browser → R2 DIRECT upload. The pipeline
// engine (lib/upload/server-pipeline.ts) owns the shared spine; this strategy
// owns the GUEST gates: the capability session, event state, video gating,
// caps, and the host-configurable per-event size cap (which binds GUESTS ONLY
// — the host route has no equivalent check). create_media (at complete)
// remains authoritative for everything re-checked here.
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
