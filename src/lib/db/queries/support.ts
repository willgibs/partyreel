/**
 * Operator-internal reads for the admin Support inbox (contact form submissions). Uses the
 * SERVICE-ROLE admin client (the `contact_submissions` table is deny-all RLS, operator-internal).
 * The /admin/support page gates on requireAdmin() before calling these. No presigning needed
 * (no media). Triage writes live in src/app/admin/support/actions.ts.
 *
 * ★ THE NEWEST FEW, SAID ON THE PAGE (the 1,000-row round, 2026-09-23): the inbox reads the newest
 * `show` messages and knows whether there are more (`lib/admin/list-depth.ts`), where it used to read
 * every row and end silently at the thousandth. Counts are HEAD counts, and the operator queue's
 * "oldest waiting" is one row ordered oldest first.
 */
import "server-only";

import { readNewest } from "@/lib/admin/list-depth";
import { mustQuery } from "@/lib/db/must-query";
import { type TriageStatus } from "@/lib/constants/triage";
import type { Tables } from "@/lib/db/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type ContactSubmission = Tables<"contact_submissions">;

/** The newest `show` submissions, newest first, and whether there are more; optional status filter (the page's `?status=` tab). */
export async function listContactSubmissions(
  status: TriageStatus | undefined,
  show: number,
): Promise<{ rows: ContactSubmission[]; more: boolean }> {
  const admin = createAdminClient();
  return readNewest(
    "admin support: submissions",
    show,
    (after: { at: string; id: string } | null, limit) => {
      let q = admin
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit);
      if (status) q = q.eq("status", status);
      if (after) {
        q = q.or(
          `created_at.lt.${after.at},and(created_at.eq.${after.at},id.lt.${after.id})`,
        );
      }
      return q;
    },
    (row) => ({ at: row.created_at, id: row.id }),
  );
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

/** When the oldest submission in a status arrived, or null when none waits: one row, oldest first. */
export async function oldestContactAt(
  status: TriageStatus,
): Promise<string | null> {
  const row = await mustQuery(
    createAdminClient()
      .from("contact_submissions")
      .select("created_at")
      .eq("status", status)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle(),
    "admin support: oldest waiting",
  );
  return row?.created_at ?? null;
}
