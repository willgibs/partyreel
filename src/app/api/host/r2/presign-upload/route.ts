import { NextResponse } from "next/server";

import { getHostUploadContext } from "@/lib/db/mutations/host-media";
import { createClient } from "@/lib/supabase/server";
import {
  runPresignPipeline,
  type PresignStrategy,
} from "@/lib/upload/server-pipeline";
import { hostPresignUploadSchema } from "@/lib/validation/upload";

/** The plan's month spent: one home for the context's early answer and the meter's exact one (upload-meter). */
const PLAN_MONTH_SPENT = "You've hit this plan's upload limit for the month.";

// Host twin of /api/r2/presign-upload, now a thin strategy over the shared
// pipeline engine. The auth gate stays HERE, before the engine runs (the
// legacy 401-before-body-parse ordering); get_host_upload_context re-checks
// ownership at the DB via auth.uid(). The host is EXEMPT from the per-event
// max_upload_bytes cap (it bounds guests only) — deliberately no equivalent
// of the guest strategy's size check. Response shapes are byte-for-byte the
// engine's (the shared uploadFile depends on them).
const hostPresignStrategy: PresignStrategy<typeof hostPresignUploadSchema> = {
  schema: hostPresignUploadSchema,
  async resolveEvent(parsed, kind) {
    const ctx = await getHostUploadContext(parsed.event_id, kind);
    if (!ctx.ok) {
      // not_owner: 404, matching how a foreign/missing event resolves on the
      // host page (no leaking whether the event exists).
      return {
        ok: false,
        refusal: {
          status: 404,
          code: "not_found",
          message: "This event isn't available.",
        },
      };
    }
    // Video is a paid feature. The host's picker is disabled up front on Free,
    // so reaching here with a video is a race/bypass — a tier-framed message
    // is fine since it's the owner.
    if (ctx.data.video_blocked) {
      return {
        ok: false,
        refusal: {
          status: 403,
          code: "video_not_allowed",
          // A35: both paid plans get named, never "Pro only" (the gate is
          // tier !== "free", so an Event Pass qualifies too).
          message: "Video uploads come with Pro and the Event Pass.",
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
            ? "Storage is full for your plan. Free up space or upgrade."
            : PLAN_MONTH_SPENT,
        },
      };
    }
    return { ok: true, eventId: ctx.data.event_id };
  },
  // ★ THE METER'S REFUSALS, IN THE PLAN'S WORDS (upload-meter, the engine's meter): she is the owner, so her plan may
  // be named, and the meter judges THIS file, so the room's sentence says the file will not fit. An event deleted since
  // the gates reads as the not-owner 404 above (existence never leaks); the breaker's is a retry, `Retry-After` its hour.
  meterRefusal(refusal) {
    switch (refusal.reason) {
      case "storage":
        return {
          status: 409,
          code: "cap_reached",
          message:
            "This file won't fit in your plan's storage. Free up space or upgrade.",
        };
      case "monthly":
        return { status: 409, code: "cap_reached", message: PLAN_MONTH_SPENT };
      case "hourly":
        return {
          status: 429,
          code: "rate_limited",
          message:
            "You've uploaded a lot this hour. Try again in a little while.",
        };
      case "event_gone":
        return {
          status: 404,
          code: "not_found",
          message: "This event isn't available.",
        };
    }
  },
};

export async function POST(request: Request) {
  // Auth gate: a signed-in host only (RLS/RPC re-check ownership at the DB).
  // Duplicated verbatim in the host complete route ON PURPOSE: the 401 must fire
  // BEFORE the engine parses the body, so don't extract a helper that moves it.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, code: "unauthorized", message: "Sign in to upload." },
      { status: 401 },
    );
  }
  return runPresignPipeline(request, hostPresignStrategy);
}
