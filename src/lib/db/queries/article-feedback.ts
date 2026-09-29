/**
 * THE FEEDBACK BEACON'S ONE READ (help-center r1 `feedback=beacon`): per-article Yes and No counts
 * with the last click, newest first, for `/admin/help-feedback` behind `requireAdmin` + AAL2. It is
 * `article_feedback_summary()`, service-role only, returning ONE jsonb value (the row cap's
 * one-row shape), so no page of it can be cut at 1,000.
 *
 * ★ A HEALTH READ, SO IT THROWS (`mustQuery`): a failed read must never draw "No feedback yet",
 * which is the calm-empty-page lie the admin console exists to refuse. The page catches and says so.
 *
 * ★ THE TYPED SEAM: the function is new, so it is called through an untyped client until `types.ts`
 * regenerates with it; the answer is read defensively, row by row, so a changed shape drops a row
 * rather than drawing a wrong number.
 */
import "server-only";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { mustQuery } from "@/lib/db/must-query";
import { createAdminClient } from "@/lib/supabase/admin";

export type ArticleFeedbackSummaryRow = {
  slug: string;
  helpful: number;
  notHelpful: number;
  /** ISO timestamp of the article's newest click. */
  lastAt: string;
};

function count(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isInteger(n) && n >= 0 ? n : null;
}

/** The RPC's jsonb, as rows. Exported for the test: the parse is the contract with the SQL. */
export function parseArticleFeedbackSummary(
  data: unknown,
): ArticleFeedbackSummaryRow[] {
  if (!Array.isArray(data)) return [];
  const rows: ArticleFeedbackSummaryRow[] = [];
  for (const raw of data) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const helpful = count(r.helpful);
    const notHelpful = count(r.not_helpful);
    if (
      typeof r.slug !== "string" ||
      typeof r.last_at !== "string" ||
      helpful === null ||
      notHelpful === null
    ) {
      continue;
    }
    rows.push({ slug: r.slug, helpful, notHelpful, lastAt: r.last_at });
  }
  return rows;
}

export async function getArticleFeedbackSummary(): Promise<
  ArticleFeedbackSummaryRow[]
> {
  const client = createAdminClient() as unknown as SupabaseClient;
  const data = await mustQuery(
    client.rpc("article_feedback_summary") as PromiseLike<{
      data: unknown;
      error: PostgrestError | null;
    }>,
    "admin/help-feedback: article_feedback_summary",
  );
  return parseArticleFeedbackSummary(data);
}
