/**
 * Public report submission — a wrapper over the `create_report` capability-token
 * RPC (ADR-0004). Anonymous: the opaque share_token IS the auth, validated inside
 * the SECURITY DEFINER RPC, so there's no `getUser()` here (mirrors createGuest).
 * Called from the `/api/reports` route handler, which maps the result to HTTP.
 *
 * The RPC INSERTS ONLY — it never mutates media.status (anon reports are
 * spammable; auto-hide would be a griefing DoS). An operator decides via /admin.
 */
import "server-only";

import { createClient } from "@/lib/supabase/server";

// Postgres SQLSTATEs the RPC raises (stable; match the code, not the message).
const NO_DATA_FOUND = "P0002"; // bad/expired share_token → event not found
const CHECK_VIOLATION = "23514"; // media_id doesn't belong to this event

export type CreateReportResult =
  | { ok: true; data: { report_id: string } }
  | {
      ok: false;
      code: "not_found" | "invalid_media" | "unknown";
      message: string;
    };

export async function createReport(input: {
  shareToken: string;
  mediaId?: string | null;
  reason?: string | null;
}): Promise<CreateReportResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_report", {
    p_share_token: input.shareToken,
    p_media_id: input.mediaId ?? undefined,
    p_reason: input.reason ?? undefined,
  });

  if (error) {
    if (error.code === NO_DATA_FOUND) {
      return {
        ok: false,
        code: "not_found",
        message: "This album link is no longer valid.",
      };
    }
    if (error.code === CHECK_VIOLATION) {
      return {
        ok: false,
        code: "invalid_media",
        message: "That item couldn't be found in this album.",
      };
    }
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't submit your report. Please try again.",
    };
  }

  return { ok: true, data: data as unknown as { report_id: string } };
}
