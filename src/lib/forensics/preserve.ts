/**
 * Evidence preservation + legal hold (ADR-0020 decision 2). Preserve = set the hold, copy the
 * ORIGINAL object into the segregated preservation prefix (server-side; no key/URL touches a
 * browser), and snapshot the DB evidence (media + forensic + event rows) as JSON beside it.
 * The 1-year CyberTipline preservation clock runs on these objects; releasing a hold does NOT
 * delete them (a deliberate, separate act — see the runbook in
 * docs/systems/trust-safety-forensics.md).
 *
 * EVERY action here writes a forensic_audit_log row, success or failure — the P8 zero-silent-
 * failures contract for an evidence surface.
 */
import "server-only";

import {
  parseExtFromKey,
  preservedForensicsKey,
  preservedOriginalKey,
} from "@/lib/r2/keys";
import { copyObject, putJsonObject } from "@/lib/r2/objects";
import { createAdminClient } from "@/lib/supabase/admin";

import type { Json } from "@/lib/db/types";

export type PreserveOutcome =
  | { ok: true; preservedOriginalKey: string; alreadyHeld: boolean }
  | {
      ok: false;
      code: "not_found" | "copy_failed" | "unknown";
      message: string;
    };

export type ReleaseOutcome =
  | { ok: true }
  | { ok: false; code: "not_found" | "unknown"; message: string };

// Narrows the generated TablesInsert<"forensic_audit_log"> (action/outcome stay literal unions
// so callers cannot typo an action; detail is Json to satisfy the generated column type).
type AuditRow = {
  admin_user_id: string;
  action: "preserve" | "export_evidence" | "export_record" | "hold_released";
  media_id: string | null;
  event_id: string | null;
  detail?: Json;
  outcome: "ok" | "error";
  error?: string;
};

/** Append one audit row. Best-effort-but-loud: an audit write failure throws to the caller. */
export async function writeForensicAudit(
  admin: ReturnType<typeof createAdminClient>,
  row: AuditRow,
): Promise<void> {
  const { error } = await admin.from("forensic_audit_log").insert(row);
  if (error) throw new Error(`forensic_audit_log insert: ${error.message}`);
}

export async function preserveMedia(args: {
  mediaId: string;
  adminUserId: string;
  reason: string;
}): Promise<PreserveOutcome> {
  const { mediaId, adminUserId, reason } = args;
  const admin = createAdminClient();

  const fail = async (
    code: "not_found" | "copy_failed" | "unknown",
    message: string,
    eventId: string | null,
    detail?: Json,
  ): Promise<PreserveOutcome> => {
    await writeForensicAudit(admin, {
      admin_user_id: adminUserId,
      action: "preserve",
      media_id: mediaId,
      event_id: eventId,
      detail,
      outcome: "error",
      error: message,
    }).catch(() => {}); // the audit itself must not mask the primary failure
    return { ok: false, code, message };
  };

  const { data: media, error: mErr } = await admin
    .from("media")
    .select("*")
    .eq("id", mediaId)
    .maybeSingle();
  if (mErr) return fail("unknown", `media read: ${mErr.message}`, null);
  if (!media) return fail("not_found", "No media row with that id.", null);

  const eventId: string = media.event_id;
  const alreadyHeld = Boolean(media.legal_hold_at);

  // 1. HOLD FIRST — from this write on, every purge path skips the item, so the copy below can
  //    never race a hard delete. If a later step fails the hold deliberately STAYS set (the safe
  //    direction; the audit row carries the error for the operator to retry).
  if (!alreadyHeld) {
    const { error: holdErr } = await admin
      .from("media")
      .update({
        legal_hold_at: new Date().toISOString(),
        legal_hold_reason: reason,
      })
      .eq("id", mediaId);
    if (holdErr)
      return fail("unknown", `set hold: ${holdErr.message}`, eventId);
  }

  // 2. Copy the original into the segregated prefix (idempotent: a re-preserve overwrites the
  //    same deterministic key with the same bytes).
  const ext =
    parseExtFromKey(media.original_key) ??
    (media.type === "video" ? "mp4" : "jpg");
  const destKey = preservedOriginalKey({ eventId, mediaId, ext });
  try {
    await copyObject({ sourceKey: media.original_key, destKey });
  } catch (e) {
    return fail(
      "copy_failed",
      e instanceof Error ? e.message : "R2 copy failed.",
      eventId,
      { dest_key: destKey },
    );
  }

  // 3. Snapshot the DB evidence next to the copy: the media row, its forensic row (null for
  //    pre-capture uploads), and the event context. Session tokens are NOT part of any of these
  //    rows — the forensic row carries guest linkage by id/email, never the capability.
  const { data: forensics } = await admin
    .from("upload_forensics")
    .select("*")
    .eq("media_id", mediaId)
    .maybeSingle();
  const { data: event } = await admin
    .from("events")
    .select("id, name, host_id, created_at")
    .eq("id", eventId)
    .maybeSingle();

  const snapshotKey = preservedForensicsKey({ eventId, mediaId });
  const preservedAt = new Date().toISOString();
  try {
    await putJsonObject({
      key: snapshotKey,
      body: {
        preserved_at: preservedAt,
        preserved_by: adminUserId,
        reason,
        media,
        forensics: forensics ?? null,
        event: event ?? null,
      },
    });
  } catch (e) {
    return fail(
      "copy_failed",
      e instanceof Error ? e.message : "snapshot write failed.",
      eventId,
      { snapshot_key: snapshotKey },
    );
  }

  // 4. Record the preservation on the forensic row. Pre-capture uploads have no row yet →
  //    create one carrying only the preservation state (capture fields stay null, honestly).
  const preservedFields = {
    preserved_at: preservedAt,
    preserved_by: adminUserId,
    preserved_original_key: destKey,
    preserved_forensics_key: snapshotKey,
  };
  if (forensics) {
    const { error } = await admin
      .from("upload_forensics")
      .update(preservedFields)
      .eq("media_id", mediaId);
    if (error)
      return fail("unknown", `record preserve: ${error.message}`, eventId);
  } else {
    const { error } = await admin.from("upload_forensics").insert({
      media_id: mediaId,
      event_id: eventId,
      // Unknowable retroactively — this upload predates the capture seam.
      uploader_kind: media.guest_id ? "guest" : "host",
      guest_id: media.guest_id ?? null,
      ...preservedFields,
    });
    if (error)
      return fail("unknown", `record preserve: ${error.message}`, eventId);
  }

  await writeForensicAudit(admin, {
    admin_user_id: adminUserId,
    action: "preserve",
    media_id: mediaId,
    event_id: eventId,
    detail: { reason, dest_key: destKey, already_held: alreadyHeld },
    outcome: "ok",
  });

  return { ok: true, preservedOriginalKey: destKey, alreadyHeld };
}

/**
 * Release a legal hold. The media re-enters the normal lifecycle (purgeable again once its clock
 * says so); the PRESERVATION COPIES ARE NOT TOUCHED — deleting those is a separate, manual act on
 * the ADR's 1-year clock.
 */
export async function releaseHold(args: {
  mediaId: string;
  adminUserId: string;
}): Promise<ReleaseOutcome> {
  const { mediaId, adminUserId } = args;
  const admin = createAdminClient();

  const { data: media, error: mErr } = await admin
    .from("media")
    .select("id, event_id, legal_hold_at")
    .eq("id", mediaId)
    .maybeSingle();
  if (mErr || !media || !media.legal_hold_at) {
    await writeForensicAudit(admin, {
      admin_user_id: adminUserId,
      action: "hold_released",
      media_id: mediaId,
      event_id: media?.event_id ?? null,
      outcome: "error",
      error: mErr?.message ?? "no active hold on that media id",
    }).catch(() => {});
    return {
      ok: false,
      code: "not_found",
      message: "No active hold on that item.",
    };
  }

  const { error } = await admin
    .from("media")
    .update({ legal_hold_at: null, legal_hold_reason: null })
    .eq("id", mediaId);
  if (error) {
    await writeForensicAudit(admin, {
      admin_user_id: adminUserId,
      action: "hold_released",
      media_id: mediaId,
      event_id: media.event_id,
      outcome: "error",
      error: error.message,
    }).catch(() => {});
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't release the hold.",
    };
  }

  await writeForensicAudit(admin, {
    admin_user_id: adminUserId,
    action: "hold_released",
    media_id: mediaId,
    event_id: media.event_id,
    outcome: "ok",
  });
  return { ok: true };
}
