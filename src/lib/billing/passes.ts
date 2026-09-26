/**
 * PURE Event Pass ledger math (no DB, no Stripe SDK, no env) — billing-caps.md.
 *
 * The ledger (public.event_passes) stores one row per PURCHASE with its own
 * [start_at, expires_at) window and the price actually paid. Everything the product
 * needs is a pure derivation over those windows, kept here so the webhook, the
 * checkout route, and the nightly sweeps all agree byte-for-byte and every rule is
 * unit-testable with fixture rows:
 *
 *   • STACKING (Will, 2026-08-27): concurrent passes are rows whose windows overlap
 *     "now". Active-now count IS the entitlement: count x 75 GB storage, count event
 *     slots (profiles.event_slots -> the SQL enforce_event_limit override).
 *   • RENEWAL EXTENDS, NEVER RESETS (billing-caps.md): a renewal is a
 *     NEW row whose window starts where the soonest-expiring active pass ends, so it
 *     never grants a second concurrent slot and an untouched renewal year credits
 *     at 100%.
 *   • PRORATED PRO CREDIT (Will, 2026-08-27: "I only pay for what I've used, and
 *     everything else goes toward what I get moving forward. Nothing gets lost,
 *     nothing gets banked."): each live pass contributes
 *     floor(price_cents x remaining / total) of ITS OWN window at ITS OWN paid price
 *     (promo-code purchases prorate off what was actually charged).
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

/** Live rows whose window contains `now` — each one is a concurrent slot + 75 GB. */
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
 * When the CHAIN ends: the max expiry over live rows still ahead of `now`, future
 * windows included (a paid-for renewal year keeps the chain alive even before its
 * window opens). This is what profiles.tier_expires_at carries for the dashboard
 * and the renewal nudges. Null = nothing live ahead.
 */
export function passChainExpiry(passes: PassRow[], now: Date): string | null {
  const t = now.getTime();
  let maxMs = Number.NaN;
  for (const p of livePasses(passes)) {
    const end = ms(p.expires_at);
    if (Number.isFinite(end) && end > t && !(end <= maxMs)) maxMs = end;
  }
  return Number.isFinite(maxMs) ? new Date(maxMs).toISOString() : null;
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

/** The profile fields the ledger derives. Null tier fields = "fall back to Free". */
export type PassEntitlement = {
  activeCount: number;
  /** profiles.tier for a non-Pro profile: 'event_pass' while any slot is live. */
  tier: "event_pass" | "free";
  storageCapBytes: number | null;
  eventSlots: number | null;
  tierExpiresAt: string | null;
};

/**
 * The single derivation the webhook and the nightly sweep both write to profiles
 * (never partially — these four fields move together). Storage sums per active
 * slot: two concurrent passes = 150 GB, dropping back to 75 GB when one lapses
 * (the existing 45-day over-cap grace machinery absorbs the shrink).
 */
export function derivePassEntitlement(
  passes: PassRow[],
  now: Date,
): PassEntitlement {
  const active = activeNowPasses(passes, now);
  if (active.length === 0) {
    return {
      activeCount: 0,
      tier: "free",
      storageCapBytes: null,
      eventSlots: null,
      tierExpiresAt: null,
    };
  }
  return {
    activeCount: active.length,
    tier: "event_pass",
    storageCapBytes: active.length * PASS_STORAGE_BYTES,
    eventSlots: active.length,
    tierExpiresAt: passChainExpiry(passes, now),
  };
}

/** GB figure for copy/UI ("150 GB across 2 passes"). */
export function passStorageGb(count: number): number {
  return Math.round((count * PASS_STORAGE_BYTES) / GIGABYTE);
}
