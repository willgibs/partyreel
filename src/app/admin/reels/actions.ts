"use server";

import { revalidatePath } from "next/cache";

import { type ActionResult } from "@/app/(app)/dashboard/actions";
import { requireAdminAction } from "@/lib/auth/admin-context";
import { captureError } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";

// The reel-render kill-switch. Flipping `reel_render_enabled` off makes the render route refuse new
// renders within ~one read (no redeploy); in-flight Lambda renders finish + still land in R2. Re-checks
// authz (admin + AAL2) here; the service-role admin client is the only writer (ops_flags is deny-all).
export async function toggleReelRenderAction(
  enabled: boolean,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;

  const admin = createAdminClient();
  const { error } = await admin
    .from("ops_flags")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("key", "reel_render_enabled");

  if (error) {
    captureError("reel", new Error(error.message), {
      action: "toggle_reel_render",
      enabled,
    });
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't update the setting. Please try again.",
    };
  }

  revalidatePath("/admin/reels");
  return { ok: true };
}
