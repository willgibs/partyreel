/**
 * Operator-internal account reads for the admin Accounts browser (P4). SERVICE-ROLE admin client,
 * because RLS scopes `profiles` to its owner and an operator reads every account's whole row (the
 * social reads take only a profile's four public card columns). The /admin/accounts pages gate on
 * requireAdmin() first. READ-ONLY: billing changes go through Stripe (the webhook stays the SOLE
 * writer of tier/cap/subscription); nothing here writes, and nothing here lifts an uploads count
 * (the ledger sits behind billing enforcement: admin-observability.md).
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  effectiveStorageCap,
  toBillingTier,
  uploadAllowance,
  UPLOADS_WINDOW,
  type Tier,
} from "@/lib/constants/tiers";
import { readAllPages } from "@/lib/db/read-all";
import { readHostStorageSummary } from "@/lib/db/queries/storage";
import type { Tables } from "@/lib/db/types";
import { serverEnv } from "@/lib/env";
import { buildStripeCustomerUrl } from "@/lib/stripe/dashboard";
import { createAdminClient } from "@/lib/supabase/admin";

const TIER_LABEL: Record<Tier, string> = {
  free: "Free",
  pro: "Pro",
  event_pass: "Event Pass",
};

/** Human tier label from a raw DB `tier` value (coerces the retired `max` via toBillingTier). */
export function accountTierLabel(dbTier: string): string {
  return TIER_LABEL[toBillingTier(dbTier)];
}

export type AccountListItem = Pick<
  Tables<"profiles">,
  | "id"
  | "email"
  | "display_name"
  | "tier"
  | "storage_cap_bytes"
  | "storage_used_bytes"
  | "last_active_at"
  | "created_at"
>;

export type AccountDetail = {
  profile: Tables<"profiles">;
  tierLabel: string;
  /** null = unlimited (Pro). */
  effectiveCapBytes: number | null;
  /** Her albums: non-removed media in non-deleted events (matches the over-capacity sweep). */
  activeBytes: number;
  /** Her Deleted, exactly what her two Deleted lists show (inside their 30 days), which her plan's cap holds too. */
  deletedBytes: number;
  /** What her plan's cap holds: her albums and her Deleted together (`host_storage_summary`'s `storedBytes`). */
  storedBytes: number;
  /** Raw counter (real R2 bytes; only drops at hard-purge). */
  storageUsedBytes: number;
  eventCount: number;
  mediaCount: number;
  hasSubscription: boolean;
  /** Stripe dashboard deep-link, or null if the host has no Stripe customer yet. */
  stripeCustomerUrl: string | null;
};

/** Account list, newest-active first, with an optional email/name search. Capped at 50. */
export async function searchAccounts(q?: string): Promise<AccountListItem[]> {
  const admin = createAdminClient();
  let query = admin
    .from("profiles")
    .select(
      "id, email, display_name, tier, storage_cap_bytes, storage_used_bytes, last_active_at, created_at",
    )
    .order("last_active_at", { ascending: false })
    .limit(50);

  const term = q?.trim().replace(/[,()*]/g, ""); // strip chars that would break the or() filter
  if (term) {
    query = query.or(`email.ilike.%${term}%,display_name.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getAccountDetail(
  id: string,
): Promise<AccountDetail | null> {
  const admin = createAdminClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!profile) return null;

  // ACTIVE media (non-removed, in non-deleted events): the bytes from the one aggregate the host's own meter and the
  // storage guard read (`host_storage_summary`, whose active filter is host_active_bytes'), and the count as an exact
  // HEAD count under the same filters. Neither reads rows, so neither is capped at PostgREST's 1,000 (an unpaged row
  // read would sum the first thousand items of a large account and show the operator a fraction of it).
  // ★ THE SAME ROW HOLDS HER DELETED, and the plan's cap holds the two together (billing-caps.md: a delete frees
  // nothing until the item leaves Deleted for good), so an operator reading `activeBytes` alone would see a host
  // inside her plan whom the cap refuses. Its `storedBytes` is the figure every refusal reads.
  const [
    { activeBytes, deletedBytes, storedBytes },
    { count: mediaCount, error: mErr },
  ] = await Promise.all([
    readHostStorageSummary(id),
    admin
      .from("media")
      .select("id, events!media_event_id_fkey!inner(host_id, deleted_at)", {
        count: "exact",
        head: true,
      })
      .eq("events.host_id", id)
      .is("events.deleted_at", null)
      .neq("status", "removed"),
  ]);
  if (mErr) throw mErr;

  const { count: eventCount, error: eErr } = await admin
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("host_id", id)
    .is("deleted_at", null);
  if (eErr) throw eErr;

  const tier = toBillingTier(profile.tier);
  // The Stripe dashboard has separate test/live spaces; derive the mode from the secret-key prefix
  // server-side so the customer deep-link lands in the right space (only the URL is exposed).
  const stripeLive =
    serverEnv.STRIPE_SECRET_KEY?.startsWith("sk_live") ?? false;

  return {
    profile,
    tierLabel: TIER_LABEL[tier],
    effectiveCapBytes: effectiveStorageCap(tier, profile.storage_cap_bytes),
    activeBytes,
    deletedBytes,
    storedBytes,
    storageUsedBytes: profile.storage_used_bytes,
    eventCount: eventCount ?? 0,
    mediaCount: mediaCount ?? 0,
    hasSubscription: Boolean(profile.stripe_subscription_id),
    stripeCustomerUrl: profile.stripe_customer_id
      ? buildStripeCustomerUrl(profile.stripe_customer_id, stripeLive)
      : null,
  };
}

/**
 * A read that may have failed. The failure carries its words and NO value, so a caller cannot print a zero for a
 * reading that was never taken (admin-observability.md: "a reading that could not be taken is never a calm one").
 */
export type Reading<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

function failure(error: unknown): { ok: false; message: string } {
  const message =
    error instanceof Error
      ? error.message
      : typeof (error as { message?: unknown } | null)?.message === "string"
        ? (error as { message: string }).message
        : String(error);
  return { ok: false, message };
}

export type AccountUploads = {
  /** What the allowance counts over: a calendar month (Free, Pro), or a pass's own year (`UPLOADS_WINDOW`). */
  window: "month" | "year";
  /** Her plan's own published number (`uploadAllowance`, tiers.ts); null = unmetered, a Pro with no cap on record yet. */
  allowanceBytes: number | null;
  /** What her window has used, as the upload RPCs read it (`uploads_used`). */
  used: Reading<number>;
  /**
   * ★ A PASS WITH NO LIVE YEAR (the completes' Q26 F1 refusal): her profile still says Event Pass, but no pass of hers
   * is live, so every upload, hers and her guests', is refused in the allowance's words until the nightly recompute
   * moves her to Free, and `used` is a figure over no window at all. `since` is when her last pass stopped being live
   * (null when no pass of hers ever was). Null for every account holding a live window, and whenever `used` was not
   * read, since a reading that was not taken says nothing.
   */
  lapsed: { since: string | null } | null;
};

/** One row of `uploads_windows` (20261005130000), as PostgREST answers it. */
type UploadsWindowRow = {
  host_id: string;
  used_bytes: unknown;
  pass_lapsed: unknown;
  pass_lapsed_at: unknown;
};

/**
 * ★ THE TYPED SEAM, UNTIL THE TYPES REGENERATE: `uploads_windows` arrives with migration 20261005130000, so its call
 * goes through this untyped client (drop the cast then).
 */
function uploadsWindowsDb(db: ReturnType<typeof createAdminClient>) {
  return db as unknown as SupabaseClient;
}

/** What a listed account says when its row did not come back: the account was not found by the read. */
const NO_ROW = "uploads_windows answered no row for this account";

/**
 * ★ EVERY LISTED HOST'S UPLOADS AGAINST HER ALLOWANCE, AS THE PRODUCT ENFORCES THEM, IN ONE READ (`uploads_windows`,
 * 20261005130000). It was one `uploads_used` call a row, 50 a page view. Each figure is still `uploads_used(host,
 * tier)` asked with HER OWN tier, exactly as `create_media*` and `meter_upload` ask it (the SQL calls it per row: this
 * calendar month's ledger for Free and Pro, her live passes' own year for a pass holder), so no row can disagree with
 * the refusal it warns of; and beside it whether she is a pass holder with no live window (`lapsed`), which a figure
 * of 0 B could only hide. (`readHostMonthUploads` asks as `pro` on purpose, for the plan sheet's "what a switch to Pro
 * is measured against", so it would show a pass holder the month's ledger her allowance never reads.) The number each
 * is held to is `uploadAllowance`, the one home in tiers.ts, which mirrors the SQL `upload_allowance()` under the
 * parity test. Answers in the order asked; the ids ride the POST body, keyset-paged on the profile id.
 *
 * ★ A FAILED READ IS "NO READING", NEVER A ZERO: this never throws, so the failure cannot take the page from an
 * operator who came to read something else (the delete beside it), and it carries its words for the caller's Sentry
 * capture (Sentry never enters `src/lib/db`). A failed call fails every row it was asked for, and an account the read
 * did not answer (deleted since the list was read) fails its own. Service-role, so the CALLER proves the ids came
 * from an admin-gated read.
 */
export async function readAccountsUploads(
  profiles: readonly Pick<
    Tables<"profiles">,
    "id" | "tier" | "storage_cap_bytes"
  >[],
): Promise<AccountUploads[]> {
  const held = profiles.map((profile) => {
    const tier = toBillingTier(profile.tier);
    return {
      window: UPLOADS_WINDOW[tier],
      allowanceBytes: uploadAllowance(tier, profile.storage_cap_bytes),
    };
  });
  if (profiles.length === 0) return [];
  let rows: UploadsWindowRow[];
  try {
    const db = uploadsWindowsDb(createAdminClient());
    const ids = [...new Set(profiles.map((profile) => profile.id))];
    ({ rows } = await readAllPages(
      "accounts: uploads windows",
      (after: string | null, limit) =>
        db.rpc("uploads_windows", {
          p_host_ids: ids,
          p_after_id: after,
          p_limit: limit,
        }),
      (row: UploadsWindowRow) => row.host_id,
    ));
  } catch (error) {
    const unread = failure(error);
    return held.map((h) => ({ ...h, used: unread, lapsed: null }));
  }
  const byId = new Map(rows.map((row) => [row.host_id, row]));
  return profiles.map((profile, index) => {
    const row = byId.get(profile.id);
    const read = row
      ? readWindow(row)
      : { used: { ok: false as const, message: NO_ROW }, lapsed: null };
    return { ...held[index], ...read };
  });
}

/**
 * One row's reading, or why it is none. `uploads_used` coalesces to 0, so a figure that is not a size is a broken
 * read, never an empty month, and a lapsed flag that is not a boolean is no flag at all.
 */
function readWindow(
  row: UploadsWindowRow,
): Pick<AccountUploads, "used" | "lapsed"> {
  const used = row.used_bytes;
  if (typeof used !== "number" || !Number.isFinite(used) || used < 0) {
    return {
      used: {
        ok: false,
        message: "uploads_windows answered something other than a size",
      },
      lapsed: null,
    };
  }
  if (typeof row.pass_lapsed !== "boolean") {
    return {
      used: {
        ok: false,
        message: "uploads_windows answered no lapsed flag",
      },
      lapsed: null,
    };
  }
  const since =
    typeof row.pass_lapsed_at === "string" &&
    Number.isFinite(Date.parse(row.pass_lapsed_at))
      ? row.pass_lapsed_at
      : null;
  return {
    used: { ok: true, value: used },
    lapsed: row.pass_lapsed ? { since } : null,
  };
}

/** One host's uploads, through the same read as the list's (the account's page), so a row and its card agree. */
export async function readAccountUploads(
  profile: Pick<Tables<"profiles">, "id" | "tier" | "storage_cap_bytes">,
): Promise<AccountUploads> {
  const [uploads] = await readAccountsUploads([profile]);
  return uploads!;
}

const HOUR_MS = 60 * 60 * 1000;

/**
 * ★ THE HOUR'S BREAKER, as `meter_upload` keeps it: the uploads an account started in the CURRENT CLOCK HOUR (UTC),
 * tallied on this month's ledger row (`hour_started_at`, `hour_uploads`). A row whose hour is not this one holds an
 * earlier hour's tally, and the tally restarts at one with the next presign, so this hour's is zero; a month with no
 * row has taken no upload at all. (A zero here is a reading; a failed read is `ok: false`, never a zero.) The
 * ceiling is the SQL's alone (`c_uploads_an_hour`), mirrored in `admin/accounts/uploads.ts` under a parity test.
 *
 * The ledger is deny-all to every client role, so this rides the admin client; the CALLER proves the id.
 */
export async function readAccountHourUploads(
  hostId: string,
): Promise<Reading<number>> {
  try {
    const now = Date.now();
    // The ledger's key is the UTC month (`to_char(now(), 'YYYY-MM')` on a UTC database).
    const period = new Date(now).toISOString().slice(0, 7);
    const { data, error } = await createAdminClient()
      .from("storage_ledger")
      .select("hour_started_at, hour_uploads")
      .eq("host_id", hostId)
      .eq("period", period)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { ok: true, value: 0 };
    const thisHour = Math.floor(now / HOUR_MS) * HOUR_MS;
    const tallied =
      data.hour_started_at !== null &&
      Date.parse(data.hour_started_at) === thisHour;
    return { ok: true, value: tallied ? data.hour_uploads : 0 };
  } catch (error) {
    return failure(error);
  }
}
