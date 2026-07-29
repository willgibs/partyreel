"use server";

import { revalidatePath } from "next/cache";

import type { SupabaseClient } from "@supabase/supabase-js";

import { type ActionResult } from "@/app/(app)/dashboard/actions";
import { requireAdminAction } from "@/lib/auth/admin-context";
import {
  removalUpdate,
  restoreUpdate,
} from "@/lib/moderation/operator-actions";
import { captureError } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";

// Proactive-moderation writes. Re-check authz (admin + AAL2) in EVERY action via
// requireAdminAction (an action is its own entry point; the layout gate is not enough).
// Both use the service-role admin client (cross-host; bypasses the media-via-events RLS) and
// apply ABSOLUTE state via the pure helpers — the same soft-remove the reports "Action" runs,
// minus the report row. "layout" revalidation refreshes BOTH the feed and any album drill-in.

/**
 * Pre-regen typing seam (same pattern as account/social-actions.ts): the moderation payloads carry
 * `removed_by_admin`, which lands with migration 20260729180000 and is absent from the generated
 * types until the orchestrator runs `pnpm db:types` post-apply. Erase the row typing at the client,
 * not at the payload, so the helper's own union keeps checking the shape. Drop after the regen.
 */
function untypedAdmin(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient;
}

export async function removeMediaByOperatorAction(
  mediaId: string,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;

  const admin = untypedAdmin();
  // `.neq('status','removed')` so re-removing never resets an existing 7-day grace clock.
  const { error } = await admin
    .from("media")
    .update(removalUpdate())
    .eq("id", mediaId)
    .neq("status", "removed");

  if (error) {
    captureError("admin", new Error(error.message), {
      action: "operator_remove_media",
      mediaId,
    });
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't remove that item. Please try again.",
    };
  }

  revalidatePath("/admin/albums", "layout");
  return { ok: true };
}

export async function restoreMediaAction(
  mediaId: string,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;

  const admin = untypedAdmin();
  // Only un-remove things still 'removed' (the cron may have already purged older ones).
  // restoreUpdate()'s 'approved' is a floor: the DB trigger lands the row on the status it held
  // before the takedown, so restoring never un-hides content the host had hidden (QA #24).
  const { error } = await admin
    .from("media")
    .update(restoreUpdate())
    .eq("id", mediaId)
    .eq("status", "removed");

  if (error) {
    captureError("admin", new Error(error.message), {
      action: "operator_restore_media",
      mediaId,
    });
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't restore that item. Please try again.",
    };
  }

  revalidatePath("/admin/albums", "layout");
  return { ok: true };
}
