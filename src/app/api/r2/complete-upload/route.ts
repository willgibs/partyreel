import { createMedia } from "@/lib/db/mutations/guest";
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
  createRecord(parsed, kind, realSize) {
    return createMedia({
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
  },
  errorStatus(code) {
    return code === "invalid_session"
      ? 401
      : code === "uploads_closed"
        ? 403
        : code === "cap_reached"
          ? 409
          : code === "bad_key"
            ? 400
            : 422;
  },
  // Forensic capture (ADR-0020): the guest's linkage IS the capability token; the
  // seam resolves it to the guests row server-side.
  forensicIdentity(parsed) {
    return { kind: "guest", sessionToken: parsed.session_token };
  },
};

export async function POST(request: Request) {
  return runCompletePipeline(request, guestCompleteStrategy);
}
