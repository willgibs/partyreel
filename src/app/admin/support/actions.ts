"use server";

import { revalidatePath } from "next/cache";

import { type ActionResult } from "@/app/(app)/dashboard/actions";
import { requireAdminAction } from "@/lib/auth/admin-context";
import { triageStatusSchema, type TriageStatus } from "@/lib/constants/triage";
import { captureError } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";

// Re-checks authz (admin + AAL2) as its own entry point, then writes via the service-role
// admin client (contact_submissions is deny-all RLS). handled_by/handled_at record the triage.
export async function setContactStatus(
  id: string,
  status: TriageStatus,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;

  const parsed = triageStatusSchema.safeParse(status);
  if (!parsed.success) {
    return { ok: false, code: "validation", message: "Invalid status." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("contact_submissions")
    .update({
      status: parsed.data,
      handled_by: auth.ctx.userId,
      handled_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    captureError("admin", new Error(error.message), {
      action: "set_contact_status",
      id,
    });
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't update the submission. Please try again.",
    };
  }

  revalidatePath("/admin/support");
  return { ok: true };
}
