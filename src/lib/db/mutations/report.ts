/**
 * Public report submission — a wrapper over the `create_report` capability-token
 * RPC (database-security.md). Anonymous: the opaque qr_token IS the auth, validated inside
 * the SECURITY DEFINER RPC, so there's no `getUser()` here (mirrors createGuest).
 * Called from the `/api/reports` route handler, which maps the result to HTTP.
 *
 * The RPC INSERTS ONLY — it never mutates media.status (anon reports are
 * spammable; auto-hide would be a griefing DoS). An operator decides via /admin.
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

// Postgres SQLSTATEs the RPC raises (stable; match the code, not the message).
const NO_DATA_FOUND = "P0002"; // bad/expired qr_token → event not found
const CHECK_VIOLATION = "23514"; // media_id doesn't belong to this event

export type CreateReportResult =
  | { ok: true; data: { report_id: string } }
  | {
      ok: false;
      code: "not_found" | "invalid_media" | "unknown";
      message: string;
    };

export async function createReport(input: {
  qrToken: string;
  mediaId?: string | null;
  reason?: string | null;
}): Promise<CreateReportResult> {
  // Server-mediated (H3): create_report is service-role-only now (revoked from anon). The qr_token in the
  // body stays the capability the RPC validates; the /api/reports route adds the per-IP rate limit (H3b).
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("create_report", {
    p_qr_token: input.qrToken,
    p_media_id: input.mediaId ?? undefined,
    p_reason: input.reason ?? undefined,
  });

  if (error) {
    if (error.code === NO_DATA_FOUND) {
      return {
        ok: false,
        code: "not_found",
        message: "This event link is no longer valid.",
      };
    }
    if (error.code === CHECK_VIOLATION) {
      return {
        ok: false,
        code: "invalid_media",
        message: "That item couldn't be found in this event.",
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
