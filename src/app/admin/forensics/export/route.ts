/**
 * The server-mediated evidence export (ADR-0020): an admin-only, AUDIT-LOGGED download of
 * preserved evidence. Two shapes:
 *   ?media=<uuid>&what=evidence — redirects to a short-lived presigned attachment GET of the
 *     preserved ORIGINAL copy (the same signed-disposition mechanism as per-item Save; the app is
 *     the authz oracle and the 5-minute TTL bounds a leaked URL).
 *   ?media=<uuid>&what=record   — returns the DB evidence (forensic row + media row + event
 *     context) as a JSON attachment, served directly from this handler.
 * Every export attempt (success or refusal) writes a forensic_audit_log row.
 */
import { NextResponse } from "next/server";

import { requireAdminAction } from "@/lib/auth/admin-context";
import { writeForensicAudit } from "@/lib/forensics/preserve";
import { captureError } from "@/lib/observability/sentry";
import { presignDownload } from "@/lib/r2/presign";
import { parseExtFromKey } from "@/lib/r2/keys";
import { createAdminClient } from "@/lib/supabase/admin";

import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// SEAM: untyped until the orchestrator regenerates src/lib/db/types.ts post-apply.
type UntypedAdmin = SupabaseClient;

const EXPORT_TTL_SECONDS = 5 * 60;

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminAction();
  if (!auth.ok) return NextResponse.json(auth.result, { status: 403 });

  const url = new URL(request.url);
  const mediaId = url.searchParams.get("media")?.trim() ?? "";
  const what = url.searchParams.get("what") ?? "evidence";
  if (!/^[0-9a-f-]{36}$/i.test(mediaId) || !["evidence", "record"].includes(what)) {
    return NextResponse.json(
      { ok: false, message: "Pass ?media=<uuid>&what=evidence|record." },
      { status: 400 },
    );
  }

  const admin = createAdminClient() as UntypedAdmin;
  const action = what === "evidence" ? "export_evidence" : "export_record";

  try {
    const { data: forensics, error } = await admin
      .from("upload_forensics")
      .select("*")
      .eq("media_id", mediaId)
      .maybeSingle();
    if (error) throw new Error(`forensics read: ${error.message}`);

    if (what === "evidence") {
      const key: string | null = forensics?.preserved_original_key ?? null;
      if (!key) {
        await writeForensicAudit(admin, {
          admin_user_id: auth.ctx.userId,
          action,
          media_id: mediaId,
          event_id: forensics?.event_id ?? null,
          outcome: "error",
          error: "not preserved yet",
        });
        return NextResponse.json(
          { ok: false, message: "That item has no preserved copy yet. Preserve it first." },
          { status: 404 },
        );
      }
      await writeForensicAudit(admin, {
        admin_user_id: auth.ctx.userId,
        action,
        media_id: mediaId,
        event_id: forensics.event_id,
        detail: { key },
        outcome: "ok",
      });
      const ext = parseExtFromKey(key) ?? "bin";
      const signed = await presignDownload({
        key,
        expiresInSeconds: EXPORT_TTL_SECONDS,
        downloadFilename: `evidence-${mediaId}.${ext}`,
      });
      return NextResponse.redirect(signed, 302);
    }

    // what === "record": the DB evidence as a JSON attachment. Media/event rows may be gone for
    // an old export (the forensic row itself cascades with media, so usually both exist).
    const [{ data: media }, { data: event }] = await Promise.all([
      admin.from("media").select("*").eq("id", mediaId).maybeSingle(),
      forensics?.event_id
        ? admin
            .from("events")
            .select("id, name, host_id, created_at")
            .eq("id", forensics.event_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    if (!forensics && !media) {
      await writeForensicAudit(admin, {
        admin_user_id: auth.ctx.userId,
        action,
        media_id: mediaId,
        event_id: null,
        outcome: "error",
        error: "no forensic or media row",
      });
      return NextResponse.json(
        { ok: false, message: "Nothing recorded for that media id." },
        { status: 404 },
      );
    }
    await writeForensicAudit(admin, {
      admin_user_id: auth.ctx.userId,
      action,
      media_id: mediaId,
      event_id: forensics?.event_id ?? media?.event_id ?? null,
      outcome: "ok",
    });
    const body = JSON.stringify(
      {
        exported_at: new Date().toISOString(),
        exported_by: auth.ctx.userId,
        forensics: forensics ?? null,
        media: media ?? null,
        event: event ?? null,
      },
      null,
      2,
    );
    return new Response(body, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="forensic-record-${mediaId}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    captureError("security", e, { action, media_id: mediaId });
    return NextResponse.json(
      { ok: false, message: "Export failed. Check the audit log." },
      { status: 500 },
    );
  }
}
