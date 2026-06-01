/**
 * Operator-internal reads for the admin Support inbox (contact form submissions). Uses the
 * SERVICE-ROLE admin client (the `contact_submissions` table is deny-all RLS, operator-internal).
 * The /admin/support page gates on requireAdmin() before calling these. No presigning needed
 * (no media). Triage writes live in src/app/admin/support/actions.ts.
 */
import "server-only";

import { type TriageStatus } from "@/lib/constants/triage";
import type { Tables } from "@/lib/db/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type ContactSubmission = Tables<"contact_submissions">;

/** Submissions newest-first; optional status filter (the page's `?status=` tab). */
export async function listContactSubmissions(
  status?: TriageStatus,
): Promise<ContactSubmission[]> {
  const admin = createAdminClient();
  let query = admin
    .from("contact_submissions")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Count submissions in a status (for the Overview "new" badge). Cheap head+count query. */
export async function countContactByStatus(
  status: TriageStatus,
): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("contact_submissions")
    .select("*", { count: "exact", head: true })
    .eq("status", status);
  if (error) throw error;
  return count ?? 0;
}
