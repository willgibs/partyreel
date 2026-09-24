/**
 * Operator-internal reads for the admin Applicants inbox (job applications). SERVICE-ROLE admin
 * client (`job_applications` is deny-all RLS). The /admin/applicants page gates on requireAdmin()
 * first. Each row's `role_slug` is mapped to a human title via getJob() (falls back to the raw
 * slug if the posting was removed). Triage writes live in src/app/admin/applicants/actions.ts.
 */
import "server-only";

import { getJob } from "@/lib/constants/careers";
import { type TriageStatus } from "@/lib/constants/triage";
import type { Tables } from "@/lib/db/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type JobApplication = Tables<"job_applications"> & {
  /** Human title for `role_slug`; falls back to the slug for a removed/unknown posting. */
  roleTitle: string;
};

export async function listJobApplications(
  status?: TriageStatus,
): Promise<JobApplication[]> {
  const admin = createAdminClient();
  // row-cap-todo: M10 every application, cut at 1,000
  let query = admin
    .from("job_applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    roleTitle: getJob(row.role_slug)?.title ?? row.role_slug,
  }));
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
