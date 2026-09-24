/**
 * Operator-internal reads for the admin Applicants inbox (job applications). SERVICE-ROLE admin
 * client (`job_applications` is deny-all RLS). The /admin/applicants page gates on requireAdmin()
 * first. Each row's `role_slug` is mapped to a human title via getJob() (falls back to the raw
 * slug if the posting was removed). Triage writes live in src/app/admin/applicants/actions.ts.
 *
 * ★ THE NEWEST FEW, SAID ON THE PAGE (the 1,000-row round, 2026-09-23): the inbox reads the newest
 * `show` applications and knows whether there are more (`lib/admin/list-depth.ts`), where it used to
 * read every row and end silently at the thousandth. Counts are HEAD counts, and the operator queue's
 * "oldest waiting" is one row ordered oldest first.
 */
import "server-only";

import { readNewest } from "@/lib/admin/list-depth";
import { getJob } from "@/lib/constants/careers";
import { type TriageStatus } from "@/lib/constants/triage";
import { mustQuery } from "@/lib/db/must-query";
import type { Tables } from "@/lib/db/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type JobApplication = Tables<"job_applications"> & {
  /** Human title for `role_slug`; falls back to the slug for a removed/unknown posting. */
  roleTitle: string;
};

/** The newest `show` applications, newest first, and whether there are more; optional status filter. */
export async function listJobApplications(
  status: TriageStatus | undefined,
  show: number,
): Promise<{ rows: JobApplication[]; more: boolean }> {
  const admin = createAdminClient();
  const { rows, more } = await readNewest(
    "admin applicants: applications",
    show,
    (after: { at: string; id: string } | null, limit) => {
      let q = admin
        .from("job_applications")
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
  return {
    rows: rows.map((row) => ({
      ...row,
      roleTitle: getJob(row.role_slug)?.title ?? row.role_slug,
    })),
    more,
  };
}

export async function countApplicationsByStatus(
  status: TriageStatus,
): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("job_applications")
    .select("*", { count: "exact", head: true })
    .eq("status", status);
  if (error) throw error;
  return count ?? 0;
}

/** When the oldest application in a status arrived, or null when none waits: one row, oldest first. */
export async function oldestApplicationAt(
  status: TriageStatus,
): Promise<string | null> {
  const row = await mustQuery(
    createAdminClient()
      .from("job_applications")
      .select("created_at")
      .eq("status", status)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle(),
    "admin applicants: oldest waiting",
  );
  return row?.created_at ?? null;
}
