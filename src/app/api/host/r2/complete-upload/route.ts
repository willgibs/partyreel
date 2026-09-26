import { NextResponse } from "next/server";
import { z } from "zod";

import { createMediaAsHost } from "@/lib/db/mutations/host-media";
import { createClient } from "@/lib/supabase/server";
import {
  runCompletePipeline,
  type CompleteStrategy,
} from "@/lib/upload/server-pipeline";
import { hostCompleteUploadSchema } from "@/lib/validation/upload";

/**
 * THE HOST COMPLETION'S SHAPE: the shared schema, plus the live reel's one field. `reel_eligible`
 * is false only for a clip the host adds to the album from the reel (the clip lane's client add is
 * its one caller), so the live reel never plays a reel it made; absent is the column's default
 * (true), which is every photo and video a host uploads. Extended here, as the guest route extends
 * its own, rather than in the shared validation module. Not a trust boundary: the worst a forged
 * `false` does is keep the host's own upload out of their own reel.
 */
const hostCompleteSchema = hostCompleteUploadSchema.extend({
  reel_eligible: z.boolean().optional(),
});

// Host twin of /api/r2/complete-upload, a thin strategy over the shared
// pipeline engine. The auth gate stays HERE (401-before-body-parse); the
// strategy is a factory over the verified user because create_media_as_host
// takes the trusted hostId from getUser() (the RPC re-checks ownership and
// records status always 'approved'). A duplicate media_id maps to success.
function hostCompleteStrategy(
  hostId: string,
): CompleteStrategy<typeof hostCompleteSchema> {
  return {
    schema: hostCompleteSchema,
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
        previewKey: parsed.preview_key ?? null,
        // Only a clip says anything here; every other upload leaves the column's default.
        reelEligible: parsed.reel_eligible,
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
    // Forensic capture (trust-safety-forensics.md): the getUser()-verified host id is the linkage.
    forensicIdentity() {
      return { kind: "host", hostUserId: hostId };
    },
  };
}

export async function POST(request: Request) {
  // Auth gate: a signed-in host only (the RPC re-checks event ownership).
  // Duplicated verbatim in the host presign route ON PURPOSE: the 401 must fire
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
  return runCompletePipeline(request, hostCompleteStrategy(user.id));
}
