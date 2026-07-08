/**
 * The forensic-capture seam (ADR-0020 A3-lite): ONE deny-all `upload_forensics` row per completed
 * upload, written by the shared complete pipeline right after `create_media*` succeeds. Every
 * pre-capture day was an unrecoverable gap, so the write is best-effort-but-LOUD: a failure never
 * blocks the upload (the guest experience wins), but it is never silent either — Sentry gets a
 * warning and /admin/forensics shows a 24h capture-gap signal.
 *
 * CAPTURE-ONLY: nothing here feeds product logic and nothing here renders on a host/guest surface.
 * The table is deny-all + service-role-only; the sole readers are /admin/forensics + a lawful
 * process response.
 */
import "server-only";

import { extractForensicRequestFacts } from "@/lib/forensics/request-facts";
import { captureWarning } from "@/lib/observability/sentry";
import { parseEventIdFromKey } from "@/lib/r2/keys";
import { createAdminClient } from "@/lib/supabase/admin";

import type { SupabaseClient } from "@supabase/supabase-js";

/** Who made the upload, as the complete route already knows it (no new auth surface). */
export type ForensicIdentity =
  | { kind: "guest"; sessionToken: string }
  | { kind: "host"; hostUserId: string };

// SEAM: upload_forensics is not in the generated Database types yet — the orchestrator regenerates
// src/lib/db/types.ts after applying the migration, at which point this cast (and the local row
// shape below) can tighten to the generated types.
type UntypedAdmin = SupabaseClient;

export async function captureUploadForensics(args: {
  headers: Headers;
  mediaId: string;
  /** The create_media-validated R2 key (the RPC proved it belongs to the session's event). */
  key: string;
  /** The client-declared device UUID (schema-validated as a UUID; capture-only). */
  deviceUuid: string | null;
  identity: ForensicIdentity;
}): Promise<void> {
  const { headers, mediaId, key, deviceUuid, identity } = args;
  try {
    const admin = createAdminClient() as UntypedAdmin;
    const facts = extractForensicRequestFacts(headers);
    const eventId = parseEventIdFromKey(key);
    if (!eventId) throw new Error(`unparseable event id in key ${key}`);

    // Guest linkage: resolve the session token to its guests row and DENORMALIZE the identity as
    // it stands at upload time (a later claim_anonymous_uploads must not rewrite history).
    let guest: {
      id: string;
      user_id: string | null;
      email: string | null;
    } | null = null;
    if (identity.kind === "guest") {
      const { data, error } = await admin
        .from("guests")
        .select("id, user_id, email")
        .eq("session_token", identity.sessionToken)
        .maybeSingle();
      if (error) throw new Error(`guest lookup: ${error.message}`);
      guest = data;
    }

    // Retry-idempotent: the complete route can legitimately re-run for the same media_id
    // (uploadFile retries map duplicates to success), so a duplicate capture is ignored, never an
    // error — the FIRST row is the evidence.
    const { error } = await admin.from("upload_forensics").upsert(
      {
        media_id: mediaId,
        event_id: eventId,
        uploader_kind: identity.kind,
        host_user_id: identity.kind === "host" ? identity.hostUserId : null,
        guest_id: guest?.id ?? null,
        guest_user_id: guest?.user_id ?? null,
        guest_email: guest?.email ?? null,
        device_uuid: deviceUuid,
        ip: facts.ip,
        user_agent: facts.userAgent,
        client_hints: facts.clientHints,
        geo: facts.geo,
      },
      { onConflict: "media_id", ignoreDuplicates: true },
    );
    if (error) throw new Error(`upload_forensics insert: ${error.message}`);
  } catch (e) {
    // Loud, never fatal: the upload already succeeded; a capture gap pages via Sentry and shows
    // on the /admin/forensics coverage signal.
    captureWarning("security", "forensic_capture_failed", {
      media_id: mediaId,
      key,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
