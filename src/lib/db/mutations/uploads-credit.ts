/**
 * THE OPERATOR'S UPLOADS CREDIT, THE WRITE (crumbs-92, Will's yes to the calls lab's X6). One definer RPC,
 * `grant_uploads_credit` (20261008060000): the operator must be an admin profile (checked in SQL as well as by the
 * server action's `requireAdminAction`), the reason is required, the host's row is locked first, her live credits are
 * bounded, and the credit and its `admin_actions` row land in one transaction, once per request key. It writes neither
 * `storage_ledger` nor a pass's count, so the spend watch's meter does not move (admin-observability.md, Accounts).
 *
 * The function is the service role's alone, so this rides the admin client and the CALLER proves who is asking: the
 * only caller is the operator's action, behind `requireAdminAction()`. Sentry never enters `src/lib/db`: a refusal is
 * a value (`ok: false`, a `why`), and a failure is a throw for the action to capture.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  isCreditWhy,
  type CreditFacts,
  type CreditWhy,
} from "@/app/admin/accounts/uploads-credit";
import { mustQuery } from "@/lib/db/must-query";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * ★ THE TYPED SEAM, UNTIL THE TYPES REGENERATE: `grant_uploads_credit` arrives with migration 20261008060000, which the
 * Orchestrator applies after the handoff, so this call goes through the untyped client (drop the cast then, as
 * `queries/uploads-credits.ts` does for its tables).
 */
function creditDb(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient;
}

export type UploadsCreditGranted = {
  ok: true;
  creditId: string;
  bytes: number;
  /** When its window ends and it with it (ISO). */
  windowEndsAt: string;
  /** Everything she now holds that is live, this credit included. */
  liveBytes: number;
  /** One more of her plan's allowance: the most her live credits may add together. */
  maxBytes: number | null;
  /** True when this request key had already made it (a double press, or a retry after a dropped answer). */
  replayed: boolean;
};

export type UploadsCreditRefused = { ok: false; why: CreditWhy } & CreditFacts;

const num = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

/**
 * The function's one jsonb, checked before it is believed. Pure, so the shapes are tested without a database. Anything
 * it does not answer (a state it never gives, a figure that is no number, a reason it does not know) is an Error and
 * never a guess: a credit read as granted that was not is the failure this exists to prevent.
 */
export function readCreditAnswer(
  answer: unknown,
): UploadsCreditGranted | UploadsCreditRefused {
  const a = (answer && typeof answer === "object" ? answer : {}) as Record<
    string,
    unknown
  >;
  if (a.state === "refused" && isCreditWhy(a.why)) {
    return {
      ok: false,
      why: a.why,
      minBytes: num(a.min_bytes),
      maxBytes: num(a.max_bytes),
      liveBytes: num(a.live_bytes),
      liveCount: num(a.live_count),
    };
  }
  if (
    a.state === "granted" &&
    typeof a.credit_id === "string" &&
    num(a.bytes) !== undefined &&
    typeof a.window_ends_at === "string" &&
    Number.isFinite(Date.parse(a.window_ends_at)) &&
    num(a.live_bytes) !== undefined &&
    (a.max_bytes === null || num(a.max_bytes) !== undefined) &&
    typeof a.replayed === "boolean"
  ) {
    return {
      ok: true,
      creditId: a.credit_id,
      bytes: a.bytes as number,
      windowEndsAt: a.window_ends_at,
      liveBytes: a.live_bytes as number,
      maxBytes: a.max_bytes === null ? null : (a.max_bytes as number),
      replayed: a.replayed,
    };
  }
  throw new Error("grant_uploads_credit answered a shape it never does");
}

/**
 * Credit a host's uploads window. `requestId` is the press's own key (the sheet mints one as it opens): the same key
 * answers the credit it already made. Throws on a failed call (including the SQL's 42501 for an operator who is not
 * one); a refusal in words comes back as `ok: false`.
 */
export async function grantUploadsCredit(input: {
  operatorId: string;
  hostId: string;
  bytes: number;
  reason: string;
  requestId: string;
}): Promise<UploadsCreditGranted | UploadsCreditRefused> {
  const answer = await mustQuery(
    creditDb().rpc("grant_uploads_credit", {
      p_operator_id: input.operatorId,
      p_host_id: input.hostId,
      p_bytes: input.bytes,
      p_reason: input.reason,
      p_request_id: input.requestId,
    }),
    "admin/accounts: grant an uploads credit",
  );
  return readCreditAnswer(answer);
}
