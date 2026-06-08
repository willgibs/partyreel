/**
 * Request validation for the guest upload route handlers — the SHARED contract
 * between the browser upload client and the `/api/guests` + `/api/r2/*` routes.
 *
 * SECURITY: the client NEVER supplies the R2 key, the media_id (at presign), or a
 * filename. The presign route derives all of those server-side from the validated
 * content-type + the capability token (path-traversal / cross-event-write defense
 * — ADR-0003). The token names are distinct on purpose: `qr_token` (join),
 * `session_token` (upload capability) — a mix-up here is a security bug.
 */
import { z } from "zod";

import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";

// ─── POST /api/guests (join) ─────────────────────────────────────────────────
// The join carries ONLY the capability `qr_token`. Identity (for require_email events)
// is now a VERIFIED Supabase session (Phase 2c): create_guest derives the email from
// auth.uid() and raises if a require_email event has no verified session. No email is
// ever sent in this request.
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
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  // null for single-PUT uploads; the R2 uploadId for multipart.
  upload_id: z.string().min(1).nullable(),
  parts: z.array(partSchema).default([]),
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
});

export const hostCompleteUploadSchema = z.object({
  event_id: z.uuid(),
  media_id: z.uuid(),
  key: z.string().trim().min(1),
  content_type: z.string().trim().min(1),
  size_bytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  duration_seconds: z.number().positive().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  upload_id: z.string().min(1).nullable(),
  parts: z.array(partSchema).default([]),
});

export type JoinInput = z.input<typeof joinSchema>;
export type PresignUploadInput = z.input<typeof presignUploadSchema>;
export type CompleteUploadInput = z.input<typeof completeUploadSchema>;
export type HostPresignUploadInput = z.input<typeof hostPresignUploadSchema>;
export type HostCompleteUploadInput = z.input<typeof hostCompleteUploadSchema>;
