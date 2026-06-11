import { NextResponse } from "next/server";

import { createMediaAsHost } from "@/lib/db/mutations/host-media";
import { createClient } from "@/lib/supabase/server";
import {
  runCompletePipeline,
  type CompleteStrategy,
} from "@/lib/upload/server-pipeline";
import { hostCompleteUploadSchema } from "@/lib/validation/upload";

// Host twin of /api/r2/complete-upload, a thin strategy over the shared
// pipeline engine. The auth gate stays HERE (401-before-body-parse); the
// strategy is a factory over the verified user because create_media_as_host
// takes the trusted hostId from getUser() (the RPC re-checks ownership and
// records status always 'approved'). A duplicate media_id maps to success.
function hostCompleteStrategy(
  hostId: string,
): CompleteStrategy<typeof hostCompleteUploadSchema> {
  return {
    schema: hostCompleteUploadSchema,
    captureLabel: "create_media_as_host",
    createRecord(parsed, kind, realSize) {
      return createMediaAsHost({
        hostId,
        eventId: parsed.event_id,
        mediaId: parsed.media_id,
        type: kind,
        originalKey: parsed.key,
        fileSizeBytes: realSize,
        durationSeconds: parsed.duration_seconds ?? null,
        width: parsed.width ?? null,
        height: parsed.height ?? null,
      });
    },
    errorStatus(code) {
      return code === "not_owner"
        ? 404
        : code === "cap_reached"
          ? 409
          : code === "bad_key"
            ? 400
            : 422;
    },
  };
}

export async function POST(request: Request) {
  // Auth gate: a signed-in host only (the RPC re-checks event ownership).
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
  return runCompletePipeline(request, hostCompleteStrategy(user.id));
}
