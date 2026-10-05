/**
 * PURE Event Pass ledger math (no DB, no Stripe SDK, no env) — billing-caps.md.
 *
 * The ledger (public.event_passes) stores one row per PURCHASE with its own
 * [start_at, expires_at) window and the price actually paid. What the checkout and the
 * webhook decide off those windows lives here, unit-testable with fixture rows:
 *
 *   • STACKING (Will, 2026-08-27): concurrent passes are rows whose windows overlap
 *     "now", each one an event slot and one pass's room. ★ The profile those windows
 *     derive is SQL's (`recompute_pass_entitlement`, 20261005181000): it reads them and
 *     writes the profile under her profiles row lock, one statement, since a derivation
 *     read here and written in a second request let a conversion land between the two.
 *   • RENEWAL EXTENDS, NEVER RESETS (billing-caps.md): a renewal is a
 *     NEW row whose window starts where the soonest-expiring active pass ends, so it
 *     never grants a second concurrent slot and an untouched renewal year credits
 *     at 100%.
 *   • PRORATED PRO CREDIT (Will, 2026-08-27: "I only pay for what I've used, and
 *     everything else goes toward what I get moving forward. Nothing gets lost,
 *     nothing gets banked."): each live pass contributes
 *     floor(price_cents x remaining / total) of ITS OWN window at ITS OWN paid price
 *     (promo-code purchases prorate off what was actually charged). ★ The checkout
 *     stamps the credit with every pass it counted (`passCreditMetadata`), and the
 *     webhook converts exactly those (`creditedPassIds`), never a pass bought since.
 *
 * Boundary convention: a window is active while startMs <= now < expiresMs. At the
 * exact expiry instant a pass is spent — zero slots, zero credit.
 */
import { GIGABYTE, planById } from "@/lib/constants/tiers";

/** The ledger columns the math needs (matches public.event_passes). */
export type PassRow = {
  id: string;
  start_at: string;
  expires_at: string;
  price_cents: number;
  consumed_at: string | null;
};

/** One pass's storage grant — the single event_pass plan number, never restated. */
export const PASS_STORAGE_BYTES = planById("event_pass").storageBytes;
export const PASS_TERM_DAYS = planById("event_pass").termDays ?? 365;
const TERM_MS = 86_400_000;

function ms(iso: string): number {
  const parsed = Date.parse(iso);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

/** Unconsumed rows — the only rows that can ever grant anything or credit anything. */
export function livePasses(passes: PassRow[]): PassRow[] {
  return passes.filter((p) => p.consumed_at === null);
}

/** Live rows whose window contains `now` — each one is a concurrent slot + one pass's room. */
export function activeNowPasses(passes: PassRow[], now: Date): PassRow[] {
  const t = now.getTime();
  return livePasses(passes).filter((p) => {
    const start = ms(p.start_at);
    const end = ms(p.expires_at);
    return (
      Number.isFinite(start) && Number.isFinite(end) && start <= t && t < end
    );
  });
}

/**
 * The window a new PURCHASE occupies. Initial: a fresh term from the purchase.
 * Renewal: continues the soonest-expiring ACTIVE pass (the one that needs it first),
 * so overlapping stacks each keep their own continuity; with nothing active it
 * degrades to a fresh term rather than failing a paid purchase.
 */
export function passWindowForPurchase(
  kind: "initial" | "renewal",
  passes: PassRow[],
  purchasedAtMs: number,
  termDays: number = PASS_TERM_DAYS,
): { startAt: string; expiresAt: string } {
  let startMs = purchasedAtMs;
  if (kind === "renewal") {
    const active = activeNowPasses(passes, new Date(purchasedAtMs));
    let soonest = Number.NaN;
    for (const p of active) {
      const end = ms(p.expires_at);
      if (Number.isFinite(end) && !(end >= soonest)) soonest = end;
    }
    if (Number.isFinite(soonest) && soonest > purchasedAtMs) startMs = soonest;
  }
  return {
    startAt: new Date(startMs).toISOString(),
    expiresAt: new Date(startMs + termDays * TERM_MS).toISOString(),
  };
}

/**
 * The prorated Pro credit, in cents, across every live pass (billing-caps.md). A window
 * that has not opened yet credits its full price; a window at its last instant
 * credits zero; floor() per pass so the sum never over-credits by rounding.
 */
export function passProCreditCents(passes: PassRow[], now: Date): number {
  const t = now.getTime();
  let credit = 0;
  for (const p of livePasses(passes)) {
    const start = ms(p.start_at);
    const end = ms(p.expires_at);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= t) continue;
    const total = end - start;
    if (total <= 0) continue;
    const remaining = Math.min(end - Math.max(t, start), total);
    credit += Math.min(
      p.price_cents,
      Math.floor((p.price_cents * remaining) / total),
    );
  }
  return credit;
}

/**
 * Stripe holds 500 characters a metadata value: 13 pass ids (36 characters each) and their commas fit one.
 */
const PASS_IDS_PER_KEY = 13;
/** Stripe holds 50 metadata keys a session: the credit's names take at most 40, beside the checkout's own. */
const MAX_PASS_ID_KEYS = 40;
/** The most passes one credit names: far past any stack a host would hold rather than start Pro. */
export const MAX_CREDITED_PASSES = PASS_IDS_PER_KEY * MAX_PASS_ID_KEYS;

/** `credited_pass_ids`, then `credited_pass_ids_2`, `_3`, ...: the first key is the one older checkouts wrote. */
function passIdsKey(index: number): string {
  return index === 0 ? "credited_pass_ids" : `credited_pass_ids_${index + 1}`;
}

/**
 * ★ WHAT A PRO CHECKOUT STAMPS FOR ITS CREDIT (billing-integrity): the prorated credit and EVERY pass it was computed
 * over, by id, with their count, so the webhook converts exactly those passes and never one bought after the checkout
 * (a pass checkout opened before going Pro can still be paid after it). The credit is computed over exactly the passes
 * named: past `MAX_CREDITED_PASSES` (unreachable: hundreds of passes) the ones with the most credit are named and the
 * rest are neither credited nor converted, so nothing is credited twice. No credit, no keys. The value list was cut at
 * ten ids, which made a credited pass past the tenth one the conversion could not name.
 */
export function passCreditMetadata(
  passes: PassRow[],
  now: Date,
): Record<string, string> {
  const end = (p: PassRow) => {
    const e = ms(p.expires_at);
    return Number.isFinite(e) ? e : Number.NEGATIVE_INFINITY;
  };
  const named = livePasses(passes)
    .slice()
    .sort((a, b) => end(b) - end(a) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, MAX_CREDITED_PASSES);
  const creditCents = passProCreditCents(named, now);
  if (creditCents <= 0) return {};
  const metadata: Record<string, string> = {
    pass_credit_cents: String(creditCents),
    credited_pass_count: String(named.length),
  };
  for (let key = 0; key * PASS_IDS_PER_KEY < named.length; key += 1) {
    metadata[passIdsKey(key)] = named
      .slice(key * PASS_IDS_PER_KEY, (key + 1) * PASS_IDS_PER_KEY)
      .map((p) => p.id)
      .join(",");
  }
  return metadata;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The passes a credited checkout names (`passCreditMetadata`'s keys), each once, or null when it names none it can be
 * held to: no key, an id that is not one, or a count that disagrees with the ids read (a key lost). A checkout from
 * before billing-integrity wrote one key of at most ten ids and no count; it reads as the ids it wrote.
 */
export function creditedPassIds(
  metadata: Record<string, string> | null | undefined,
): string[] | null {
  if (!metadata) return null;
  const ids: string[] = [];
  for (let key = 0; key < MAX_PASS_ID_KEYS; key += 1) {
    const value = metadata[passIdsKey(key)];
    if (value === undefined) break;
    for (const id of value.split(",")) {
      if (!UUID.test(id)) return null;
      ids.push(id.toLowerCase());
    }
  }
  if (ids.length === 0) return null;
  const count = metadata.credited_pass_count;
  if (count !== undefined && Number(count) !== ids.length) return null;
  return [...new Set(ids)];
}

/** GB figure for copy/UI ("150 GB across 2 passes"). */
export function passStorageGb(count: number): number {
  return Math.round((count * PASS_STORAGE_BYTES) / GIGABYTE);
}
