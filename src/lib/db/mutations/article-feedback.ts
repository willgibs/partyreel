/**
 * THE FEEDBACK BEACON'S ONE WRITE (help-center r1 `feedback=beacon`, migration 20260928150000):
 * one `article_feedback` row a click, on the service-role client, from `POST /api/help/feedback`
 * alone. The table is deny-all with every client grant revoked, so this is the only insert path.
 *
 * ★ NOTHING IS READ BACK, EVEN HERE. No `.select()` after the insert, so PostgREST answers
 * `return=minimal`: the route that calls this has no row, id or count to leak even by mistake, and
 * the reader's thank-you or sorry never depends on the database.
 *
 * Degrades like every other bookkeeping write: an error comes back as a value, and the route
 * reports it (Sentry never enters `src/lib/db/*`).
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type ArticleFeedbackWrite =
  | { ok: true }
  | { ok: false; code: string | null; message: string };

export async function recordArticleFeedback(input: {
  slug: string;
  helpful: boolean;
}): Promise<ArticleFeedbackWrite> {
  try {
    const client = createAdminClient();
    const { error } = await client
      .from("article_feedback")
      .insert({ slug: input.slug, helpful: input.helpful });
    if (error)
      return { ok: false, code: error.code ?? null, message: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, code: null, message: String(e) };
  }
}
