/**
 * What a host has uploaded THIS MONTH, by the ledger (red-team 52's LOW: the plan sheet could not tell a Pro host
 * that a smaller size's allowance sat below what she had already uploaded). The plan sheet's one extra fact
 * (`PlanFacts.monthUploadedBytes`), context for a sentence and never an entitlement (billing-caps.md).
 *
 * ★ THE MONTH'S LEDGER, WHATEVER HER PLAN. A Pro size's allowance counts the calendar month (`storage_ledger`'s
 * `YYYY-MM`, UTC, never decremented), so the figure a switch to Pro is measured against is the month's even for a
 * pass holder, whose own window is her passes' year. `uploads_used` reads the ledger for every tier but the pass,
 * so it is asked as `pro`; it is the one function every writer and advisory reads, so no figure here can disagree
 * with the refusal it warns of.
 *
 * Service-role only (`uploads_used` is granted to no client role, and a caller-supplied host id would read anyone's
 * total), so it rides the admin client and every caller proves whose id it passes first: the plan-facts route with
 * `getUser()`.
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export async function readHostMonthUploads(hostId: string): Promise<number> {
  const { data, error } = await createAdminClient().rpc("uploads_used", {
    p_host_id: hostId,
    p_tier: "pro",
  });
  if (error) throw error;
  // A bigint SUM (a month with no ledger row reads 0).
  return Number(data ?? 0);
}
