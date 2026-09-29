/**
 * Public report submission — a wrapper over the `create_report` capability-token
 * RPC (database-security.md). The opaque qr_token IS the capability, validated inside
 * the SECURITY DEFINER RPC, so nothing here re-checks the event (mirrors createGuest).
 * Called from the `/api/reports` route handler, which maps the result to HTTP.
 *
 * ★ WHAT THE REPORT SAYS AND WHO SENT IT (admin-triage r2, 20260929140000). The kind is the form's; the
 * reporter is the ROUTE's, read from `getUser()` and nothing else: the signed-in id, the address only when
 * `email_confirmed_at` proves it, and that address's HMAC. The RPC is service-role only, so no one but the
 * route can hand it a reporter. A report of kind `child` naming an item, from a confirmed address, hides the
 * item at once as an operator's removal (the RPC's instant hide, with its limits); every other report still
 * INSERTS ONLY and never touches media.status (anon reports are spammable; auto-hide would be a griefing DoS).
 */
import "server-only";

import type { ReportKind } from "@/lib/reports/kinds";
import { createAdminClient } from "@/lib/supabase/admin";

// Postgres SQLSTATEs the RPC raises (stable; match the code, not the message).
const NO_DATA_FOUND = "P0002"; // bad/expired qr_token → event not found
const CHECK_VIOLATION = "23514"; // media_id doesn't belong to this event

/** Who filed it, as the route read it from the session. */
export type ReportReporter = {
  userId: string;
  /** Only an address `auth.users` confirmed; null for an unconfirmed session. */
  confirmedEmail: string | null;
  /** The confirmed address's HMAC (`reporterAddressHash`), null beside a null address. */
  addressHash: string | null;
};

export type CreateReportResult =
  | {
      ok: true;
      data: {
        report_id: string;
        /** The instant hide took the item down at once. */
        hid: boolean;
        /** The reported event, as the RPC answers it (read defensively: null only if the answer lacks it). */
        event_id: string | null;
      };
    }
  | {
      ok: false;
      code: "not_found" | "invalid_media" | "unknown";
      message: string;
    };

function mapError(error: { code?: string }): CreateReportResult {
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

function readAnswer(data: unknown): {
  report_id: string;
  hid: boolean;
  event_id: string | null;
} {
  const row = (data ?? {}) as {
    report_id?: unknown;
    hid?: unknown;
    event_id?: unknown;
  };
  return {
    report_id: String(row.report_id ?? ""),
    hid: row.hid === true,
    event_id: typeof row.event_id === "string" ? row.event_id : null,
  };
}

export async function createReport(input: {
  qrToken: string;
  mediaId?: string | null;
  reason?: string | null;
  kind?: ReportKind;
  reporter?: ReportReporter | null;
}): Promise<CreateReportResult> {
  // Server-mediated (H3): create_report is service-role-only. The qr_token in the body stays the capability
  // the RPC validates; the /api/reports route adds the per-IP rate limit (H3b).
  const reporter = input.reporter ?? null;
  // The address rides only beside its keyed hash (the instant hide's limits count by the hash), else neither.
  const address =
    reporter?.confirmedEmail && reporter.addressHash
      ? { email: reporter.confirmedEmail, hash: reporter.addressHash }
      : null;
  // The generated Args type makes every defaulted parameter OPTIONAL rather than nullable, so an absent one
  // is OMITTED (`undefined` never reaches the wire) instead of sent as null.
  const { data, error } = await createAdminClient().rpc("create_report", {
    p_qr_token: input.qrToken,
    p_media_id: input.mediaId ?? undefined,
    p_reason: input.reason ?? undefined,
    p_kind: input.kind ?? "other",
    p_reporter_user_id: reporter?.userId ?? undefined,
    p_reporter_email: address?.email,
    p_reporter_hash: address?.hash,
  });

  if (error) return mapError(error);
  return { ok: true, data: readAnswer(data) };
}

/**
 * THE REPORTER'S ANSWER (`proof=confirm`): her words land on the report itself, beside its photo, and the link
 * dies with them (its hash cleared, single use). Only an open, unanswered report the token's hash names takes
 * it; anything else answers `gone`, the same for a used, a closed and an unknown link.
 */
export async function answerProof(input: {
  tokenHash: string;
  answer: string;
}): Promise<{ ok: true } | { ok: false; code: "gone" | "unknown" }> {
  const { data, error } = await createAdminClient()
    .from("reports")
    .update({
      proof_answer: input.answer,
      proof_answered_at: new Date().toISOString(),
      proof_token_hash: null,
    })
    .eq("proof_token_hash", input.tokenHash)
    .eq("status", "open")
    .is("proof_answered_at", null)
    .select("id");
  if (error) return { ok: false, code: "unknown" };
  return (data ?? []).length > 0 ? { ok: true } : { ok: false, code: "gone" };
}
