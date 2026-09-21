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
import { displayNameSchema } from "@/lib/validation/profile";

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
// The join carries the capability `qr_token` and, on a name-only event, the name the guest typed at
// the door. Identity is still SERVER-derived: the route reads the session with getUser() and passes
// the trusted user id to the service-role-only create_guest (database-security.md), which reads the
// email and its confirmation from auth.users for that id. No email is ever sent in this request.
//
// ★ `display_name` is loose HERE on purpose (a plain optional string, shape only). Its real rules are
// `parseGuestDisplayName` below, applied by the ROUTE, so a blank or a reserved name answers 422
// `name_required` / `name_invalid` with a sentence the door can render, instead of collapsing into one
// flat 400 for "the body was malformed". A lone `qr_token` still parses: a VERIFIED joiner sends no
// name at all (their profile name is the identity), and so does the pre-reshape client.
export const joinSchema = z.object({
  qr_token: z.string().trim().min(1),
  display_name: z.string().optional(),
});

// ─── POST /api/guests/name (name / rename) ───────────────────────────────────
// The second half of the name-only door: naming a row that arrived without one, or changing the name.
// The `session_token` is the capability (set_guest_display_name validates it inside and can only ever
// touch THAT row), the `qr_token` scopes the rate limiter and the visibility gate. Both tokens travel
// in the BODY, never a URL (a capability in a query string ends up in a log and a referrer).
// `display_name` is loose for the same reason as the join's, and parsed by the route.
export const renameGuestSchema = z.object({
  qr_token: z.string().trim().min(1),
  session_token: z.string().trim().min(1),
  display_name: z.string().optional(),
});

/**
 * THE TYPED NAME'S GATE, MINUS PROFANITY. The identity reshape (2026-09-21) gave a name-only guest
 * the same name rules an account has, so the schema is `displayNameSchema` itself (profile.ts) and
 * never a second copy of "1 to 60 characters, not a reserved word" that can drift from it.
 *
 * ★ PROFANITY IS NOT HERE, and cannot be: the obscenity matcher must never ship to a browser
 * (validation/profanity.ts), and this module is imported by the browser upload client. So the ROUTE
 * runs `containsProfanity` on the name this returns, exactly as `updateDisplayNameAction` does for a
 * profile name. The DB's own `guests_display_name_len` CHECK is the hard backstop under both.
 *
 * Returns the trimmed name, or the refusal the route answers 422 with: `name_required` when nothing
 * was typed (the two cases read differently to a guest, so they get different codes).
 */
export type GuestNameRefusalCode = "name_required" | "name_invalid";

export function parseGuestDisplayName(
  raw: unknown,
):
  | { ok: true; name: string }
  | { ok: false; code: GuestNameRefusalCode; message: string } {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (trimmed.length === 0) {
    return { ok: false, code: "name_required", message: "Enter a name." };
  }
  const parsed = displayNameSchema.safeParse(trimmed);
  if (!parsed.success) {
    return {
      ok: false,
      code: "name_invalid",
      // zod v4: `error.issues`. The first issue is the one the field failed on, and every message in
      // displayNameSchema is already written for a person to read.
      message: parsed.error.issues[0]?.message ?? "That name isn't available.",
    };
  }
  return { ok: true, name: parsed.data };
}

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
export type RenameGuestInput = z.input<typeof renameGuestSchema>;
export type PresignUploadInput = z.input<typeof presignUploadSchema>;
export type CompleteUploadInput = z.input<typeof completeUploadSchema>;
export type HostPresignUploadInput = z.input<typeof hostPresignUploadSchema>;
export type HostCompleteUploadInput = z.input<typeof hostCompleteUploadSchema>;
