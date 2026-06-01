"use server";

import { revalidatePath } from "next/cache";

import { type ActionResult } from "@/app/(app)/dashboard/actions";
import { requireAdminAction } from "@/lib/auth/admin-context";
import { captureError } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  announcementSchema,
  type AnnouncementInput,
} from "@/lib/validation/announcement";

// Operator announcement writes. Re-check authz (admin + AAL2) in EVERY action via requireAdminAction.
// The service-role admin client is how the operator writes (the table has NO host write policy — host
// inserts are RLS-denied). Hosts read published rows via the notification center, unchanged.

export async function publishAnnouncementAction(
  input: AnnouncementInput,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;

  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "validation",
      message: parsed.error.issues[0]?.message ?? "Invalid announcement.",
    };
  }
  const { title, body, href, publishedAt } = parsed.data;

  const admin = createAdminClient();
  // A future published_at = scheduled (the host read RLS gates on <= now()); empty = publish now.
  const { error } = await admin.from("announcements").insert({
    title,
    body,
    href: href || null,
    published_at: publishedAt
      ? new Date(publishedAt).toISOString()
      : new Date().toISOString(),
  });

  if (error) {
    captureError("admin", new Error(error.message), {
      action: "publish_announcement",
    });
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't publish the announcement. Please try again.",
    };
  }

  revalidatePath("/admin/announcements");
  return { ok: true };
}

export async function deleteAnnouncementAction(
  id: string,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;

  const admin = createAdminClient();
  const { error } = await admin.from("announcements").delete().eq("id", id);

  if (error) {
    captureError("admin", new Error(error.message), {
      action: "delete_announcement",
      id,
    });
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't delete the announcement. Please try again.",
    };
  }

  revalidatePath("/admin/announcements");
  return { ok: true };
}
