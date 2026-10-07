/**
 * THE OPERATOR'S UPLOADS CREDITS, AS THE OPERATOR READS THEM (crumbs-92, Will's yes to the calls lab's X6; the write is
 * `mutations/uploads-credit.ts`, the mechanism `grant_uploads_credit` in 20261008060000). `uploads_credits` and
 * `admin_actions` are deny-all, so these ride the service-role admin client; the callers are the admin-gated Accounts
 * pages, which prove their own gate first.
 *
 * ★ A READ THAT FAILS SAYS SO. Every reader answers `Reading` (a failure carries its words and no value, never a zero or
 * an empty list): "no credits" read off a broken query would tell an operator a refused host holds no lift when she
 * does, and a credit unseen is a credit granted twice. Sentry never enters `src/lib/db` (the pages capture the words).
 *
 * ★ A LIVE CREDIT IS ONE WHOSE WINDOW HAS NOT ENDED, and an account holds at most `UPLOADS_CREDIT_MAX_LIVE` of them (the
 * function refuses an eleventh), so one account's read is whole by construction; the list's read chunks its ids so no
 * chunk can reach PostgREST's 1,000-row cut (`MAX_ROWS`) even with every account at the most.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  UPLOADS_CREDIT_MAX_LIVE,
  type UploadsCredit,
} from "@/app/admin/accounts/uploads-credit";
import { mustQuery } from "@/lib/db/must-query";
import type { Reading } from "@/lib/db/queries/accounts";
import { inChunks, MAX_ROWS } from "@/lib/db/read-all";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * ★ THE TYPED SEAM, UNTIL THE TYPES REGENERATE: `uploads_credits` and `admin_actions` arrive with migration
 * 20261008060000, which the Orchestrator applies after the handoff, so these reads go through this untyped client
 * (drop the cast then; `creditDb` in `mutations/uploads-credit.ts` is its twin).
 */
function creditDb(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient;
}

function failure(error: unknown): { ok: false; message: string } {
  const message =
    error instanceof Error
      ? error.message
      : typeof (error as { message?: unknown } | null)?.message === "string"
        ? (error as { message: string }).message
        : String(error);
  return { ok: false, message };
}

/** A row read by the select below, as PostgREST answers it: checked before a field is believed. */
type CreditRead = {
  id: unknown;
  bytes: unknown;
  window_ends_at: unknown;
  created_at: unknown;
  action_id: unknown;
};

/** More than the function ever lets an account hold: seeing this many means the table holds what it should not. */
const READ_LIMIT = UPLOADS_CREDIT_MAX_LIVE * 5;

/**
 * One account's live credits, newest first, each with the reason it was made for, when, and the operator's address.
 * Never throws: a failed read is a `Reading` that says why (the page draws "No reading" and raises one Sentry warning).
 */
export async function readAccountUploadsCredits(
  hostId: string,
  now: Date = new Date(),
): Promise<Reading<UploadsCredit[]>> {
  try {
    const db = creditDb();
    const credits = await mustQuery(
      db
        .from("uploads_credits")
        .select("id, bytes, window_ends_at, created_at, action_id")
        .eq("host_id", hostId)
        .gt("window_ends_at", now.toISOString())
        .order("created_at", { ascending: false })
        .limit(READ_LIMIT),
      "admin/accounts: her uploads credits",
    );
    const rows = (credits ?? []) as CreditRead[];
    if (rows.length >= READ_LIMIT) {
      return failure(
        new Error(
          `more than ${UPLOADS_CREDIT_MAX_LIVE} live credits are on record for one account, which the function refuses`,
        ),
      );
    }
    if (rows.length === 0) return { ok: true, value: [] };

    const actionIds = rows.map((row) => String(row.action_id));
    // row-cap: admin_actions.id is its primary key, so the log rows of one account's live credits (at most UPLOADS_CREDIT_MAX_LIVE ids) read at most one row an id
    const actions = (await mustQuery(
      db
        .from("admin_actions")
        .select("id, operator_id, reason")
        .in("id", actionIds),
      "admin/accounts: her credits' log",
    )) as { id: string; operator_id: string | null; reason: string }[];
    const byAction = new Map(actions.map((action) => [action.id, action]));

    const operatorIds = [
      ...new Set(
        actions.flatMap((action) =>
          action.operator_id ? [action.operator_id] : [],
        ),
      ),
    ];
    // row-cap: profiles.id is its primary key, so the operators of those credits (at most one per credit) read at most one row an id
    const operators =
      operatorIds.length === 0
        ? []
        : ((await mustQuery(
            db.from("profiles").select("id, email").in("id", operatorIds),
            "admin/accounts: her credits' operators",
          )) as { id: string; email: string | null }[]);
    const emailOf = new Map(operators.map((o) => [o.id, o.email]));

    const value: UploadsCredit[] = [];
    for (const row of rows) {
      const action = byAction.get(String(row.action_id));
      const bytes = Number(row.bytes);
      if (
        typeof row.id !== "string" ||
        !Number.isFinite(bytes) ||
        typeof row.window_ends_at !== "string" ||
        typeof row.created_at !== "string" ||
        !action
      ) {
        // A credit whose log row cannot be read is not shown as a clean one: the whole read fails with its words.
        return failure(
          new Error(
            "a live credit is on record without a log row the page can read",
          ),
        );
      }
      value.push({
        id: row.id,
        bytes,
        windowEndsAt: row.window_ends_at,
        grantedAt: row.created_at,
        reason: action.reason,
        operator: action.operator_id
          ? (emailOf.get(action.operator_id) ?? null)
          : null,
      });
    }
    return { ok: true, value };
  } catch (error) {
    return failure(error);
  }
}

/** Ids a chunk may hold so that every account at the most live credits still fits PostgREST's 1,000 rows. */
const LIST_CHUNK = Math.floor(MAX_ROWS / UPLOADS_CREDIT_MAX_LIVE) - 1;

/**
 * What each listed account's live credits add together, for the list's rows: host id to bytes, an account with none
 * absent. Never throws (`Reading`): the list says the credits could not be read and still draws its accounts.
 */
export async function readLiveCreditBytes(
  hostIds: readonly string[],
  now: Date = new Date(),
): Promise<Reading<Map<string, number>>> {
  try {
    // row-cap: an account holds at most UPLOADS_CREDIT_MAX_LIVE live credits (the function refuses an eleventh) and a chunk holds fewer than MAX_ROWS / UPLOADS_CREDIT_MAX_LIVE accounts, so a chunk reads fewer than MAX_ROWS rows
    const rows = await inChunks(
      "admin/accounts: the list's uploads credits",
      hostIds,
      (chunk) =>
        mustQuery(
          creditDb()
            .from("uploads_credits")
            .select("host_id, bytes")
            .in("host_id", chunk)
            .gt("window_ends_at", now.toISOString()),
          "admin/accounts: the list's uploads credits",
        ) as Promise<{ host_id: string; bytes: unknown }[]>,
      { size: LIST_CHUNK },
    );
    const total = new Map<string, number>();
    for (const row of rows) {
      const bytes = Number(row.bytes);
      if (typeof row.host_id !== "string" || !Number.isFinite(bytes)) {
        return failure(new Error("a credit row came back unreadable"));
      }
      total.set(row.host_id, (total.get(row.host_id) ?? 0) + bytes);
    }
    return { ok: true, value: total };
  } catch (error) {
    return failure(error);
  }
}
