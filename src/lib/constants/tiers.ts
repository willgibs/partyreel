/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Pricing & limits — the SINGLE source of truth (storage-cap model, Phase 4).
 * ─────────────────────────────────────────────────────────────────────────────
 * Every tier number lives here exactly once. The marketing pricing page, the
 * dashboard, server-side enforcement (`create_media` / `get_upload_context` RPCs),
 * and the Stripe webhook all read from this file. Do NOT hardcode caps elsewhere.
 *
 * WHY the model looks the way it does (anti-abuse — do NOT "simplify" this away):
 *   • A tier is a TOTAL stored-bytes cap, not item counts. The granted cap lives in
 *     `profiles.storage_cap_bytes` (set by the Stripe webhook from the purchased
 *     plan); for Free it is null and the code falls back to the tier default below
 *     via `defaultCapForTier`. So Pro's "storage selector" is just different caps
 *     under `tier="pro"`.
 *   • Events PERSIST until the host deletes them — there is deliberately NO event
 *     end date. If an event could be "ended" while keeping its media, a user could
 *     fill → end → create-new → repeat for unlimited free storage. `MAX_EVENTS`
 *     counts events that EXIST (deleted_at IS NULL); deleting one (destroying its
 *     media) is the only way to free a slot.
 *   • The MONTHLY INGRESS meter (`MONTHLY_INGRESS_BYTES`) counts bytes UPLOADED per
 *     month and NEVER refunds on delete — storage caps alone don't stop
 *     delete→re-upload egress burn. It reads `storage_ledger.cumulative_bytes`,
 *     which never decrements.
 *
 * Keep these numbers in lockstep with the Postgres `public.tier_limits()` fn (DB
 * enforcement) — a Vitest parity test guards the pairing. Universal per-file limits
 * (5 min / 2 GB / 50 MB) are NOT here — they live in lib/media/limits.ts because
 * they apply to every tier. (The `tier_type` enum still lists a retired `max`
 * value — folded into Pro storage options; it is unused, left in place because
 * dropping a Postgres enum value is risky.)
 *
 * This file is import-safe from client components — it holds NO secrets. The
 * env-referenced Stripe Price IDs and `planForPriceId()` live in lib/stripe/.
 */

export const BILLING_TIERS = ["free", "pro", "event_pass"] as const;
export type Tier = (typeof BILLING_TIERS)[number];

/** New profiles start here (mirrors the profiles.tier default). */
export const DEFAULT_TIER: Tier = "free";

/**
 * Coerce a DB `tier_type` value (which still carries the retired `max`) to a
 * billing Tier — `max` folds into `pro`, anything unknown falls back to Free.
 * Use this wherever a `profiles.tier` value indexes the records below.
 */
export function toBillingTier(value: string): Tier {
  if (value === "pro" || value === "max") return "pro";
  if (value === "event_pass") return "event_pass";
  return "free";
}

export const GIGABYTE = 1024 ** 3;
export const TERABYTE = 1024 ** 4;

export type BillingKind = "free" | "subscription" | "one_time";

export const PLAN_IDS = [
  "free",
  "pro_100",
  "pro_500",
  "pro_2tb",
  "event_pass",
] as const;
export type PlanId = (typeof PLAN_IDS)[number];

/** A purchasable plan = billing tier + storage cap + (Stripe) price. */
export type Plan = {
  id: PlanId;
  tier: Tier;
  name: string;
  storageBytes: number;
  /** Display only — Stripe Prices are the billing truth. */
  priceLabel: string;
  billing: BillingKind;
  /** Env var holding the Stripe Price ID (paid plans only). */
  stripePriceEnvKey?: string;
  /** Event Pass only — fixed term before it lapses into the retention flow. */
  termDays?: number;
};

export const PLANS: Plan[] = [
  {
    id: "free",
    tier: "free",
    name: "Free",
    storageBytes: 2 * GIGABYTE,
    priceLabel: "$0",
    billing: "free",
  },
  {
    id: "pro_100",
    tier: "pro",
    name: "Pro 100 GB",
    storageBytes: 100 * GIGABYTE,
    priceLabel: "$9/mo",
    billing: "subscription",
    stripePriceEnvKey: "STRIPE_PRICE_PRO_100",
  },
  {
    id: "pro_500",
    tier: "pro",
    name: "Pro 500 GB",
    storageBytes: 500 * GIGABYTE,
    priceLabel: "$19/mo",
    billing: "subscription",
    stripePriceEnvKey: "STRIPE_PRICE_PRO_500",
  },
  {
    id: "pro_2tb",
    tier: "pro",
    name: "Pro 2 TB",
    storageBytes: 2 * TERABYTE,
    priceLabel: "$39/mo",
    billing: "subscription",
    stripePriceEnvKey: "STRIPE_PRICE_PRO_2TB",
  },
  {
    id: "event_pass",
    tier: "event_pass",
    name: "Event Pass",
    storageBytes: 75 * GIGABYTE,
    priceLabel: "$24 one-time",
    billing: "one_time",
    stripePriceEnvKey: "STRIPE_PRICE_EVENT_PASS",
    termDays: 365,
  },
];

/** Human label for a billing tier (the cap message + pricing copy). */
export const TIER_NAMES: Record<Tier, string> = {
  free: "Free",
  pro: "Pro",
  event_pass: "Event Pass",
};

/** Events that may EXIST per tier — the free→paid wall. null = unlimited. */
export const MAX_EVENTS: Record<Tier, number | null> = {
  free: 1,
  pro: null,
  event_pass: 1,
};

/**
 * Monthly uploaded-bytes (ingress) cap — anti-abuse, unmarketed, never refunds.
 * null = unmetered. MUST mirror tier_limits().monthly_ingress_bytes.
 */
export const MONTHLY_INGRESS_BYTES: Record<Tier, number | null> = {
  free: 20 * GIGABYTE, // generous; only catches extreme churn
  pro: null, // revisit — likely a high multiple of the storage cap
  event_pass: null,
};

/**
 * Per-tier default storage cap, used when `profiles.storage_cap_bytes` is null.
 * Pro is null on purpose — a Pro account's cap is always set explicitly by the
 * webhook from the purchased plan (100/500/2048 GB). MUST mirror
 * tier_limits().default_storage_cap_bytes.
 */
export const DEFAULT_STORAGE_CAP_BYTES: Record<Tier, number | null> = {
  free: 2 * GIGABYTE,
  pro: null,
  event_pass: 75 * GIGABYTE,
};

/** The cap to enforce when a profile has no explicit `storage_cap_bytes`. */
export function defaultCapForTier(tier: Tier): number | null {
  return DEFAULT_STORAGE_CAP_BYTES[tier];
}

/** The effective storage cap for a profile: explicit override, else tier default. */
export function effectiveStorageCap(
  tier: Tier,
  storageCapBytes: number | null,
): number | null {
  return storageCapBytes ?? defaultCapForTier(tier);
}

/** Look up a plan by id (PlanId is exhaustive, so this always resolves). */
export function planById(id: PlanId): Plan {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan id: ${id}`);
  return plan;
}

/** Plans belonging to a tier, in declared order (e.g. the 3 Pro options). */
export function plansForTier(tier: Tier): Plan[] {
  return PLANS.filter((p) => p.tier === tier);
}

/**
 * Host event-settings gated to paid tiers (locked + an upgrade hint on Free):
 * `allow_anonymous_uploads` (turning it OFF to require an account to upload),
 * `password` (password-protected albums), and `custom_slug` (a custom /e/[slug] link).
 * Add more here as they become tier-gated. ("Locked" = `tier === "free"`, so paid tiers —
 * pro + event_pass — all have them.) Note: locked only blocks CREATE/CHANGE; a downgraded host
 * keeps the existing artifact and can still REMOVE it (see EventPasswordControl / clear_event_slug).
 */
export const GATED_EVENT_SETTINGS = [
  "allow_anonymous_uploads",
  "password",
  "custom_slug",
] as const;
export type GatedEventSetting = (typeof GATED_EVENT_SETTINGS)[number];

export function isSettingLocked(
  _setting: GatedEventSetting,
  tier: Tier,
): boolean {
  return tier === "free";
}

/**
 * Video uploads are a paid feature (Phase 2): a free event is photos-only, for
 * guests AND the host. Authoritatively enforced in create_media /
 * create_media_as_host (a free host's event rejects type='video'); this helper
 * drives the host upload UI + the settings status row. Like isSettingLocked,
 * "allowed" = any non-free tier (pro + event_pass). The universal 5-min / 2-GB
 * video limits (lib/media/limits.ts) are orthogonal — they apply to paid video too.
 */
export function videosAllowedForTier(tier: Tier): boolean {
  return tier !== "free";
}

/**
 * The canonical "can I add one more?" check for the event-count wall.
 * `null` limit = unlimited. `current` is the count BEFORE the new item.
 */
export function withinLimit(current: number, limit: number | null): boolean {
  return limit === null || current < limit;
}

/** Storage headroom check: are we at/under the byte cap? `null` cap = unlimited. */
export function withinStorage(
  usedBytes: number,
  capBytes: number | null,
): boolean {
  return capBytes === null || usedBytes <= capBytes;
}

/** Format a cap for display; `null` renders as the unlimited label. */
export function formatLimit(
  value: number | null,
  unlimited = "Unlimited",
): string {
  return value === null ? unlimited : value.toLocaleString();
}

// ≈ figures for the pricing page — illustrative, derived from the GB cap so the
// copy can't drift from the enforced number. ~4 MB/photo, ~150 MB/min 1080p video.
const AVG_PHOTO_BYTES = 4 * 1024 ** 2;
const VIDEO_BYTES_PER_MIN = 150 * 1024 ** 2;

/** "≈ X photos or Y min of video" for a byte cap, for friendly capacity copy. */
export function friendlyCapacity(bytes: number): {
  photos: number;
  videoMinutes: number;
} {
  return {
    photos: Math.round(bytes / AVG_PHOTO_BYTES),
    videoMinutes: Math.round(bytes / VIDEO_BYTES_PER_MIN),
  };
}
