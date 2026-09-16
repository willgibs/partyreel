/**
 * Request validation for the guest upload route handlers — the SHARED contract
 * between the browser upload client and the `/api/guests` + `/api/r2/*` routes.
 *
 * SECURITY: the client NEVER supplies the R2 key, the media_id (at presign), or a
 * filename. The presign route derives all of those server-side from the validated
 * content-type + the capability token (path-traversal / cross-event-write defense
 * — uploads-and-r2.md). The token names are distinct on purpose: `qr_token` (join),
 * `session_token` (upload capability) — a mix-up here is a security bug.
 */
import { z } from "zod";

import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";

/**
 * Upper bound on a CLIENT-DECLARED pixel dimension. These are measured in the
 * browser and never verified server-side, and they are rendered straight into a
 * CSS aspect-ratio, so an unbounded value let one upload declare
 * `1 x 100000000` and render a tile kilometres tall for everyone viewing the
 * album. Generous on purpose (a 100-megapixel medium-format frame and any real
 * panorama fit comfortably); the point is only to exclude the absurd.
 * The RATIO is separately bounded at the render seam, see lib/media/tile-aspect.
 */
export const MAX_DECLARED_DIMENSION = 100_000;

// ─── POST /api/guests (join) ─────────────────────────────────────────────────
// The join carries ONLY the capability `qr_token`. Identity (for account-required events) is a signed-in
// Supabase session: the route derives the verified user id via getUser() and passes it as the trusted
// p_user_id to the service-role-only create_guest (database-security.md), which reads the email from auth.users for that
// id and raises if an account-required event has no verified session. No email is ever sent in this request.
export const joinSchema = z.object({
  qr_token: z.string().trim().min(1),
});

// ─── POST /api/r2/presign-upload ─────────────────────────────────────────────
// No key / filename / media_id — the server builds the key.
export const presignUploadSchema = z.object({
  session_token: z.string().trim().min(1),
  content_type: z.string().trim().min(1),
  size_bytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  duration_seconds: z.number().positive().optional(),
  // The client-generated WebP preview's size (so the preview PUT can bind content-length, like the
  // original). Optional + un-capped here; the engine skips the preview presign when it exceeds
  // MAX_PREVIEW_BYTES (the original still uploads), so an over-size never rejects the whole request.
  preview_size_bytes: z.number().int().positive().optional(),
});

// ─── POST /api/r2/complete-upload ────────────────────────────────────────────
// Echoes back the media_id + key the presign route issued. create_media
// re-validates the key prefix authoritatively, so a forged key is rejected there.
const partSchema = z.object({
  partNumber: z.number().int().positive(),
  eTag: z.string().min(1),
});

export const completeUploadSchema = z.object({
  session_token: z.string().trim().min(1),
  media_id: z.uuid(),
  key: z.string().trim().min(1),
  content_type: z.string().trim().min(1),
  size_bytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  duration_seconds: z.number().positive().optional(),
  width: z.number().int().positive().max(MAX_DECLARED_DIMENSION).optional(),
  height: z.number().int().positive().max(MAX_DECLARED_DIMENSION).optional(),
  // The preview R2 key the presign route issued, set ONLY when the client uploaded a preview. The
  // server records it as media.preview_key; tiles then serve it.
  preview_key: z.string().trim().min(1).optional(),
  // null for single-PUT uploads; the R2 uploadId for multipart.
  upload_id: z.string().min(1).nullable(),
  parts: z.array(partSchema).default([]),
  // The localStorage device UUID, CAPTURE-ONLY (trust-safety-forensics.md): recorded into the deny-all
  // upload_forensics row at the complete seam; never product logic, never rendered.
  device_uuid: z.uuid().optional(),
});

// ─── Host upload variants (authenticated) ────────────────────────────────────
// The host upload twin of the two presign/complete schemas above. The auth model
// differs: these carry `event_id` instead of a capability `session_token`, and the
// route authorizes the caller via getUser() + event ownership (the RPC re-checks).
// The R2 key is still server-derived (the client never supplies key/media_id at
// presign), so the same path-traversal / cross-event-write defense holds.
export const hostPresignUploadSchema = z.object({
  event_id: z.uuid(),
  content_type: z.string().trim().min(1),
  size_bytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  duration_seconds: z.number().positive().optional(),
  preview_size_bytes: z.number().int().positive().optional(),
});

export const hostCompleteUploadSchema = z.object({
  event_id: z.uuid(),
  media_id: z.uuid(),
  key: z.string().trim().min(1),
  content_type: z.string().trim().min(1),
  size_bytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  duration_seconds: z.number().positive().optional(),
  width: z.number().int().positive().max(MAX_DECLARED_DIMENSION).optional(),
  height: z.number().int().positive().max(MAX_DECLARED_DIMENSION).optional(),
  preview_key: z.string().trim().min(1).optional(),
  upload_id: z.string().min(1).nullable(),
  parts: z.array(partSchema).default([]),
  // Capture-only device UUID (see completeUploadSchema).
  device_uuid: z.uuid().optional(),
});

export type JoinInput = z.input<typeof joinSchema>;
export type PresignUploadInput = z.input<typeof presignUploadSchema>;
export type CompleteUploadInput = z.input<typeof completeUploadSchema>;
export type HostPresignUploadInput = z.input<typeof hostPresignUploadSchema>;
export type HostCompleteUploadInput = z.input<typeof hostCompleteUploadSchema>;
