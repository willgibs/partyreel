"use server";

import { revalidatePath } from "next/cache";

import type { SupabaseClient } from "@supabase/supabase-js";

import { type ActionResult } from "@/app/(app)/dashboard/actions";
import { requireAdminAction } from "@/lib/auth/admin-context";
import { removalUpdate } from "@/lib/moderation/operator-actions";
import { captureError } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";

// Operator actions re-check authz IN EVERY action via the requireAdminAction seam
// (re-validates the user, confirms admin, AND requires AAL2 — an action is its own
// entry point; the layout gate is not enough). Writes use the service-role admin
// client to bypass the reports deny-all RLS.

export async function dismissReportAction(
  reportId: string,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;

  const admin = createAdminClient();
  const { error } = await admin
    .from("reports")
    .update({
      status: "dismissed",
      resolved_by: auth.ctx.userId,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId)
    .eq("status", "open");

  if (error) {
    captureError("admin", new Error(error.message), {
      action: "dismiss_report",
      reportId,
    });
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't dismiss the report. Please try again.",
    };
  }

  revalidatePath("/admin/reports");
  return { ok: true };
}

export async function actionReportAction(
  reportId: string,
  mediaId: string | null,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;

  const admin = createAdminClient();

  // If the report names a specific item, soft-remove it (status='removed' +
  // removed_at) — the purge cron then reclaims R2 + the row. Album-level reports
  // (no media_id) just get marked actioned; the operator handles the album out
  // of band. `.neq('status','removed')` so we don't reset an existing grace clock.
  //
  // Shares removalUpdate() with the Albums browser rather than repeating the payload: the two
  // operator takedown paths MUST stamp removed_by_admin identically, or the reported host can
  // still restore whichever one forgot it (QA #8). The untyped client is the pre-regen seam for
  // that column (see admin/albums/actions.ts).
  if (mediaId) {
    const { error: mErr } = await (admin as unknown as SupabaseClient)
      .from("media")
      .update(removalUpdate())
      .eq("id", mediaId)
      .neq("status", "removed");
    if (mErr) {
      captureError("admin", new Error(mErr.message), {
        action: "remove_media",
        reportId,
        mediaId,
      });
      return {
        ok: false,
        code: "unknown",
        message: "Couldn't remove the reported item. Please try again.",
      };
    }
  }

  const { error } = await admin
    .from("reports")
    .update({
      status: "actioned",
      resolved_by: auth.ctx.userId,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId)
    .eq("status", "open");

  if (error) {
    captureError("admin", new Error(error.message), {
      action: "action_report",
      reportId,
    });
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't update the report. Please try again.",
    };
  }

  revalidatePath("/admin/reports");
  return { ok: true };
}
