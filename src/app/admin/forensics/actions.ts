"use server";

import { revalidatePath } from "next/cache";

import { type ActionResult } from "@/app/(app)/dashboard/actions";
import { requireAdminAction } from "@/lib/auth/admin-context";
import { preserveMedia, releaseHold } from "@/lib/forensics/preserve";
import { captureError } from "@/lib/observability/sentry";

// The preserve/hold actions for /admin/forensics (ADR-0020). Both re-check authz (admin + AAL2);
// both audit inside the service layer (success AND failure), so nothing here is silent.

export async function preserveMediaAction(
  mediaId: string,
  reason: string,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;

  const trimmedId = mediaId.trim();
  const trimmedReason = reason.trim();
  if (!/^[0-9a-f-]{36}$/i.test(trimmedId)) {
    return { ok: false, code: "unknown", message: "Enter a valid media id (UUID)." };
  }
  if (!trimmedReason) {
    return { ok: false, code: "unknown", message: "A hold reason is required." };
  }

  try {
    const result = await preserveMedia({
      mediaId: trimmedId,
      adminUserId: auth.ctx.userId,
      reason: trimmedReason,
    });
    if (!result.ok) return { ok: false, code: "unknown", message: result.message };
    revalidatePath("/admin/forensics");
    return { ok: true };
  } catch (e) {
    captureError("security", e, { action: "preserve_media", media_id: trimmedId });
    return {
      ok: false,
      code: "unknown",
      message: "Preserve failed. Check the audit log.",
    };
  }
}

export async function releaseHoldAction(mediaId: string): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;

  try {
    const result = await releaseHold({
      mediaId,
      adminUserId: auth.ctx.userId,
    });
    if (!result.ok) return { ok: false, code: "unknown", message: result.message };
    revalidatePath("/admin/forensics");
    return { ok: true };
  } catch (e) {
    captureError("security", e, { action: "release_hold", media_id: mediaId });
    return {
      ok: false,
      code: "unknown",
      message: "Release failed. Check the audit log.",
    };
  }
}
