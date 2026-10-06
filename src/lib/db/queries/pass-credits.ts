/**
 * THE PASS-TO-PRO CREDIT'S CLAIMS, AS THE OPERATOR READS THEM (credit-watch; the mechanism is billing-caps.md's).
 * `pass_credits` is deny-all, so these ride the service-role admin client; the callers are the admin-gated Accounts
 * pages, the operator's Retry and /admin/jobs' `pass_credit` signal, which prove their own gate first. READ-ONLY: the
 * webhook's functions are the only writers (the Retry runs the webhook's own path).
 *
 * ★ A STUCK CREDIT IS ONE RULE IN TWO FORMS, held together by their test: `stuckKind` (`billing/passes-stuck.ts`,
 * pure) judges a claim already read, and `stuckFilter` asks the table for the same claims, since neither the list nor
 * the signal reads every claim to judge it.
 *
 * Sentry never enters `src/lib/db`: the pages' readers answer `Reading` (a failure carries its words and no value,
 * never a zero), and the signal's throws, as every health read does (`queries/jobs.ts`).
 */
import "server-only";

import {
  PASS_CREDIT_STUCK_AFTER_MS,
  SETTLE_KINDS,
  SETTLE_WINDOW_MS,
  STUCK_KINDS,
  settleSince,
  stuckSince,
  type CreditClaimState,
  type SettleKind,
  type StuckKind,
} from "@/lib/billing/passes-stuck";
import type { PostgrestError } from "@supabase/supabase-js";

import { mustCount, mustQuery, QueryFailedError } from "@/lib/db/must-query";
import type { Reading } from "@/lib/db/queries/accounts";
import { createAdminClient } from "@/lib/supabase/admin";

/** A claim as the operator reads it: the table's columns (`pass_credits`, 20261005181000 and 20261005201000). */
export type PassCreditRow = CreditClaimState & {
  stripe_session_id: string;
  profile_id: string;
  credit_cents: number;
  pass_ids: string[];
  balance_transaction_id: string | null;
  converted_count: number | null;
};

const COLUMNS =
  "stripe_session_id, profile_id, credit_cents, pass_ids, claimed_until, balance_transaction_id, granted_at, converted_at, converted_count, released_at, created_at";

/** The filters a stuck half applies: any `from("pass_credits")` chain speaks them (PostgREST's builder returns itself). */
type Filterable<Q> = {
  is(column: string, value: null): Q;
  eq(column: string, value: number): Q;
  gt(column: string, value: string): Q;
  lt(column: string, value: string): Q;
  not(column: string, operator: string, value: null): Q;
  or(filters: string): Q;
};

/**
 * The one rule's second form, half by half: the claims never granted (no grant, no live lease, taken before the
 * cutoff) and the grants never converted (granted before the cutoff), neither released. ISO instants carry no comma
 * or parenthesis, so the lease's `or` holds one raw, as every timestamp `or` in the app does.
 */
export function stuckFilter<Q extends Filterable<Q>>(
  kind: StuckKind,
  query: Q,
  nowMs: number,
): Q {
  const cutoff = new Date(nowMs - PASS_CREDIT_STUCK_AFTER_MS).toISOString();
  return kind === "never_granted"
    ? query
        .is("released_at", null)
        .is("granted_at", null)
        .lt("created_at", cutoff)
        .or(
          `claimed_until.is.null,claimed_until.lte.${new Date(nowMs).toISOString()}`,
        )
    : query
        .is("released_at", null)
        .not("granted_at", "is", null)
        .is("converted_at", null)
        .lt("granted_at", cutoff);
}

/**
 * The settle rule's second form (`settleKind`, `billing/passes-stuck.ts`, held to it by their test): a claim released
 * beside a grant, or a conversion of none, inside the month.
 */
export function settleFilter<Q extends Filterable<Q>>(
  kind: SettleKind,
  query: Q,
  nowMs: number,
): Q {
  const since = new Date(nowMs - SETTLE_WINDOW_MS).toISOString();
  return kind === "granted_twice"
    ? query
        .not("released_at", "is", null)
        .not("granted_at", "is", null)
        .gt("released_at", since)
    : query
        .not("converted_at", "is", null)
        .eq("converted_count", 0)
        .gt("converted_at", since);
}

/** The column a stuck half began owing on (`stuckSince`'s), which its reads take oldest first. */
const SINCE_COLUMN: Record<StuckKind, "created_at" | "granted_at"> = {
  never_granted: "created_at",
  never_converted: "granted_at",
};

/**
 * A page of a stuck half AND its exact count in ONE request (PostgREST answers the count beside a limited page), so the
 * list and the signal, which the portal's bell reads on every admin view, pay one request a half. A failed read throws
 * (`QueryFailedError`, as `mustQuery`), and a count that did not come back is a broken read, never a zero.
 */
async function pageAndCount<T>(
  query: PromiseLike<{
    data: T[] | null;
    count: number | null;
    error: PostgrestError | null;
  }>,
  context: string,
): Promise<{ rows: T[]; total: number }> {
  const { data, count, error } = await query;
  if (error) throw new QueryFailedError(context, error);
  if (count === null) throw new Error(`${context}: no count came back`);
  return { rows: data ?? [], total: count };
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

/** A stuck claim on the Accounts list, with the account it is owed to. */
export type StuckCredit = PassCreditRow & {
  kind: StuckKind;
  /** When it began owing (`stuckSince`). */
  since: string;
  /** Her address and name for the link; null when her profile came back without them. */
  email: string | null;
  displayName: string | null;
};

/** How many stuck claims the list draws, oldest owing first; its count says when there are more. */
export const STUCK_LIST_LIMIT = 20;

type StuckRead = PassCreditRow & {
  profiles: { email: string | null; display_name: string | null } | null;
};

/**
 * ★ EVERY STUCK CLAIM, FOR THE ACCOUNTS LIST: how many there are (a head count a half, never a page's length) and the
 * oldest few of each half with the account each is owed to, oldest owing first. Never throws: a failed read is
 * `{ ok: false }` with its words, which the page says as No reading, never as none stuck.
 */
export async function readStuckPassCredits(
  nowMs: number = Date.now(),
): Promise<Reading<{ total: number; rows: StuckCredit[] }>> {
  try {
    const db = createAdminClient();
    const halves = await Promise.all(
      STUCK_KINDS.map(async (kind) => {
        const { rows, total } = await pageAndCount(
          stuckFilter(
            kind,
            db
              .from("pass_credits")
              .select(
                `${COLUMNS}, profiles!pass_credits_profile_id_fkey(email, display_name)`,
                { count: "exact" },
              )
              .order(SINCE_COLUMN[kind], { ascending: true })
              .limit(STUCK_LIST_LIMIT),
            nowMs,
          ),
          `admin/accounts: stuck credits (${kind})`,
        );
        return {
          count: total,
          // The embed is to-one (her profile, by the claim's own foreign key), which PostgREST answers as an object;
          // the select is built from `COLUMNS` at run time, so the typed parser cannot see it, and the row is stated.
          rows: ((rows ?? []) as unknown as StuckRead[]).map(
            ({ profiles, ...claim }): StuckCredit => ({
              ...claim,
              kind,
              since: stuckSince(claim, kind),
              email: profiles?.email ?? null,
              displayName: profiles?.display_name ?? null,
            }),
          ),
        };
      }),
    );
    const rows = halves
      .flatMap((half) => half.rows)
      .sort((a, b) => Date.parse(a.since) - Date.parse(b.since))
      .slice(0, STUCK_LIST_LIMIT);
    return {
      ok: true,
      value: { total: halves.reduce((n, half) => n + half.count, 0), rows },
    };
  } catch (error) {
    return failure(error);
  }
}

/** A claim only Stripe can settle, on the Accounts list, with the account it is hers. */
export type SettleCredit = PassCreditRow & {
  kind: SettleKind;
  /** When it came to wait on Stripe (`settleSince`). */
  since: string;
  email: string | null;
  displayName: string | null;
};

/** The column a settle kind came to wait on Stripe at. */
const SETTLE_COLUMN: Record<SettleKind, "released_at" | "converted_at"> = {
  granted_twice: "released_at",
  converted_none: "converted_at",
};

/**
 * ★ EVERY CLAIM ONLY STRIPE CAN SETTLE, inside the month, for the Accounts list (credit-watch's red-team): two credits
 * for one set of passes, newest first, each with the account it is hers, counted past what it lists. Never throws: a
 * failed read is No reading, never "nothing to settle".
 */
export async function readCreditsToSettle(
  nowMs: number = Date.now(),
): Promise<Reading<{ total: number; rows: SettleCredit[] }>> {
  try {
    const db = createAdminClient();
    const halves = await Promise.all(
      SETTLE_KINDS.map(async (kind) => {
        const { rows, total } = await pageAndCount(
          settleFilter(
            kind,
            db
              .from("pass_credits")
              .select(
                `${COLUMNS}, profiles!pass_credits_profile_id_fkey(email, display_name)`,
                { count: "exact" },
              )
              .order(SETTLE_COLUMN[kind], { ascending: false })
              .limit(STUCK_LIST_LIMIT),
            nowMs,
          ),
          `admin/accounts: credits to settle in Stripe (${kind})`,
        );
        return {
          count: total,
          // The embed is to-one, as the stuck read's.
          rows: ((rows ?? []) as unknown as StuckRead[]).map(
            ({ profiles, ...claim }): SettleCredit => ({
              ...claim,
              kind,
              since: settleSince(claim, kind),
              email: profiles?.email ?? null,
              displayName: profiles?.display_name ?? null,
            }),
          ),
        };
      }),
    );
    const rows = halves
      .flatMap((half) => half.rows)
      .sort((a, b) => Date.parse(b.since) - Date.parse(a.since))
      .slice(0, STUCK_LIST_LIMIT);
    return {
      ok: true,
      value: { total: halves.reduce((n, half) => n + half.count, 0), rows },
    };
  } catch (error) {
    return failure(error);
  }
}

/** How many claims an account's page draws: one a credited Pro checkout of hers, which Checkout opens only while she is not Pro. */
export const ACCOUNT_CREDITS_LIMIT = 20;

/**
 * Her claims for her account's page, newest first: every credited Pro checkout of hers, settled or not, so the
 * operator reads what happened to each (Retry sits beside a stuck one). Never throws (`Reading`).
 */
export async function readAccountPassCredits(
  hostId: string,
): Promise<Reading<PassCreditRow[]>> {
  try {
    const rows = await mustQuery(
      createAdminClient()
        .from("pass_credits")
        .select(COLUMNS)
        .eq("profile_id", hostId)
        .order("created_at", { ascending: false })
        .limit(ACCOUNT_CREDITS_LIMIT),
      "admin/accounts: her credits",
    );
    return { ok: true, value: (rows ?? []) as PassCreditRow[] };
  } catch (error) {
    return failure(error);
  }
}

/** One claim by its checkout, for the operator's Retry (which holds it to the account before it runs). Throws on a failed read. */
export async function readPassCredit(
  sessionId: string,
): Promise<PassCreditRow | null> {
  const row = await mustQuery(
    createAdminClient()
      .from("pass_credits")
      .select(COLUMNS)
      .eq("stripe_session_id", sessionId)
      .maybeSingle(),
    "admin/accounts: a credit",
  );
  return (row as PassCreditRow | null) ?? null;
}

/**
 * ★ THE `pass_credit` SIGNAL'S OWN HALVES (/admin/jobs; its failures are `job_runs`' rows, read beside the other
 * signals'): the credits honoured in the window (converted, which follows only a grant), and what is owed (every stuck
 * claim, and when the oldest began owing). Throws on a failed read, as every health read does: a console reading
 * "nothing stuck" when it could read nothing is the failure it exists to prevent.
 */
export async function readPassCreditSignal(
  nowMs: number,
  sinceIso: string,
): Promise<{ ok24h: number; owed: number; owedSinceMs: number | null }> {
  const db = createAdminClient();
  const [honoured, ...halves] = await Promise.all([
    // Honoured: converted in the window, at least one pass of it (a conversion of none met passes credited already).
    mustCount(
      db
        .from("pass_credits")
        .select("*", { count: "exact", head: true })
        .gt("converted_at", sinceIso)
        .gt("converted_count", 0),
      "admin/jobs: 24h credits honoured",
    ),
    // Each half's count and its oldest in one request: the bell reads this on every admin page view.
    ...STUCK_KINDS.map(async (kind) => {
      const { rows, total } = await pageAndCount(
        stuckFilter(
          kind,
          db
            .from("pass_credits")
            .select(SINCE_COLUMN[kind], { count: "exact" })
            .order(SINCE_COLUMN[kind], { ascending: true })
            .limit(1),
          nowMs,
        ),
        `admin/jobs: stuck credits (${kind})`,
      );
      const at = (rows[0] as Record<string, unknown> | undefined)?.[
        SINCE_COLUMN[kind]
      ];
      return {
        count: total,
        sinceMs: typeof at === "string" ? Date.parse(at) : NaN,
      };
    }),
  ]);
  const sinces = halves
    .filter((half) => half.count > 0 && Number.isFinite(half.sinceMs))
    .map((half) => half.sinceMs);
  return {
    ok24h: honoured,
    owed: halves.reduce((n, half) => n + half.count, 0),
    owedSinceMs: sinces.length > 0 ? Math.min(...sinces) : null,
  };
}

/**
 * ★ THE NEWEST CONVERSION OF HER PASSES INTO PRO CREDIT, for the account page's Plan card (billing-orphans,
 * `billing/pro-pending.ts` decides). Read on the admin client (the table is deny-all) for the id the page's own
 * `getUser()` gave, never a client's. Unreleased conversions of at least one pass within Stripe's retry window, newest
 * first, one row. THROWS: the caller says nothing rather than a guess.
 */
export async function readNewestCreditConversion(
  profileId: string,
  sinceIso: string,
): Promise<{
  converted_at: string;
  converted_count: number | null;
  released_at: string | null;
} | null> {
  const rows = await mustQuery(
    createAdminClient()
      .from("pass_credits")
      .select("converted_at, converted_count, released_at")
      .eq("profile_id", profileId)
      .is("released_at", null)
      .gt("converted_count", 0)
      .gt("converted_at", sinceIso)
      .order("converted_at", { ascending: false })
      .limit(1),
    "account: her newest credit conversion",
  );
  const row = rows?.[0];
  return row?.converted_at
    ? {
        converted_at: row.converted_at,
        converted_count: row.converted_count,
        released_at: row.released_at,
      }
    : null;
}
