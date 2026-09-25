"use server";

import { revalidatePath } from "next/cache";

import { type ActionResult } from "@/app/(app)/dashboard/actions";
import { requireAdminAction } from "@/lib/auth/admin-context";
import { captureError } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";

// The export kill-switch. Flipping `export_enabled` off makes the mint routes refuse new exports within
// ~2 min (live tokens expire) WITHOUT a Worker redeploy. Re-checks authz (admin + AAL2) here; the
// service-role admin client is the only writer (ops_flags is deny-all).
export async function toggleExportsAction(
  enabled: boolean,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;

  const admin = createAdminClient();
  const { error } = await admin
    .from("ops_flags")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("key", "export_enabled");

  if (error) {
    captureError("export", new Error(error.message), {
      action: "toggle_exports",
      enabled,
    });
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't update the setting. Please try again.",
    };
  }

  revalidatePath("/admin/exports");
  return { ok: true };
}

// The live reel's platform lever (reel-teardown). Off means no tile, no view, no screen and no Make
// your own anywhere (gallery-reel.ts's `liveReelAvailable`, read fresh on every poll — no redeploy);
// the host dashboard's Reel card, its "What needs you" step and the old `/reel` room's redirect all
// read the same fact server-side and say the reel is off too (reel-progress.ts). Same authz + admin
// write shape as the switch above.
export async function toggleLiveReelAction(
  enabled: boolean,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;

  const admin = createAdminClient();
  const { error } = await admin
    .from("ops_flags")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("key", "live_reel_enabled");

  if (error) {
    captureError("reel", new Error(error.message), {
      action: "toggle_live_reel",
      enabled,
    });
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't update the setting. Please try again.",
    };
  }

  revalidatePath("/admin/exports");
  return { ok: true };
}
