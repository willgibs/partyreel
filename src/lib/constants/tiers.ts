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
 *   • The MONTHLY INGRESS meter counts bytes UPLOADED per month and NEVER refunds on
 *     delete — storage caps alone don't stop delete→re-upload egress burn. It reads
 *     `storage_ledger.cumulative_bytes`, which never decrements. Free is a flat
 *     20 GB (`MONTHLY_INGRESS_BYTES`); paid tiers derive INGRESS_CAP_MULTIPLIER x the
 *     effective storage cap (`monthlyIngressCap`), so the abuse bound scales with
 *     what the host pays for (ADR-0021).
 *
 * Keep these numbers in lockstep with the Postgres `public.tier_limits()` fn (DB
 * enforcement) — a Vitest parity test guards the pairing. The universal per-file
 * limit (10 GB per file, size is the ONLY per-file gate) is NOT here — it lives in
 * lib/media/limits.ts because it applies to every tier. (The `tier_type` enum still lists a retired `max`
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
  "pro_100_yr",
  "pro_500_yr",
  "pro_2tb_yr",
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
  /** Subscription cadence; undefined = "month" (annual ruled 2026-08-27). */
  interval?: "month" | "year";
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
  // Annual Pro (ruled 2026-08-27): exactly x10 the monthly, marketed as "two
  // months free". x10 is a DRIFT GUARD as much as a price: a test pins each
  // yearly label to 10x its monthly sibling, so the pair can only move together.
  {
    id: "pro_100_yr",
    tier: "pro",
    name: "Pro 100 GB",
    storageBytes: 100 * GIGABYTE,
    priceLabel: "$90/yr",
    billing: "subscription",
    interval: "year",
    stripePriceEnvKey: "STRIPE_PRICE_PRO_100_YR",
  },
  {
    id: "pro_500_yr",
    tier: "pro",
    name: "Pro 500 GB",
    storageBytes: 500 * GIGABYTE,
    priceLabel: "$190/yr",
    billing: "subscription",
    interval: "year",
    stripePriceEnvKey: "STRIPE_PRICE_PRO_500_YR",
  },
  {
    id: "pro_2tb_yr",
    tier: "pro",
    name: "Pro 2 TB",
    storageBytes: 2 * TERABYTE,
    priceLabel: "$390/yr",
    billing: "subscription",
    interval: "year",
    stripePriceEnvKey: "STRIPE_PRICE_PRO_2TB_YR",
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

/**
 * The Event Pass RENEWAL price label (display only — the Stripe price
 * STRIPE_PRICE_EVENT_PASS_RENEWAL is the billing truth, see PRICING.md). A
 * separate cheaper one-time price that extends a live pass by another year
 * (ADR-0021 decision 3); surfaced on /pricing so the keep-it-alive cost is
 * never a surprise.
 */
export const EVENT_PASS_RENEWAL_PRICE_LABEL = "$15";

/** Events that may EXIST per tier — the free→paid wall. null = unlimited. */
export const MAX_EVENTS: Record<Tier, number | null> = {
  free: 1,
  pro: null,
  event_pass: 1,
};

/**
 * Monthly uploaded-bytes (ingress) STATIC cap — anti-abuse, unmarketed, never refunds.
 * Free is a flat 20 GB; null = DERIVED for paid tiers (INGRESS_CAP_MULTIPLIER x the
 * effective storage cap — use monthlyIngressCap, never this record directly, for a
 * paid tier's bound). MUST mirror tier_limits().monthly_ingress_bytes.
 */
export const MONTHLY_INGRESS_BYTES: Record<Tier, number | null> = {
  free: 20 * GIGABYTE, // generous; only catches extreme churn
  pro: null, // derived: 3x the purchased storage cap (300 GB / 1.5 TB / 6 TB)
  event_pass: null, // derived: 3x 75 GB = 225 GB
};

/**
 * Paid-tier monthly ingress = this multiple of the EFFECTIVE storage cap (ADR-0021).
 * Why a multiplier, not static bytes: the abuse bound scales with what the host pays
 * for, stays unmarketed, and 3x leaves a full extra refill cycle of legitimate
 * headroom (too-low blocks a paying customer; too-high is only mild abuse headroom).
 * MUST mirror tier_limits().ingress_cap_multiplier.
 */
export const INGRESS_CAP_MULTIPLIER = 3;

/**
 * The monthly ingress cap for a host: Free = the static meter; paid = the multiplier
 * times the effective storage cap (the host's actual storage_cap_bytes — Pro has
 * three cap sizes — falling back to the tier default). A paid profile with no cap on
 * record yet (the Stripe webhook writes it) returns null = unmetered: fail OPEN,
 * never block a paying host on missing data. Mirrors the SQL monthly_ingress_cap()
 * fn the upload RPCs enforce with.
 */
export function monthlyIngressCap(
  tier: Tier,
  storageCapBytes: number | null,
): number | null {
  const staticBytes = MONTHLY_INGRESS_BYTES[tier];
  if (staticBytes !== null) return staticBytes;
  const cap = effectiveStorageCap(tier, storageCapBytes);
  return cap === null ? null : INGRESS_CAP_MULTIPLIER * cap;
}

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

/**
 * Plans belonging to a tier at one billing cadence, in declared order. The
 * interval DEFAULTS to "month" so every pre-annual caller keeps meaning "the 3
 * Pro storage options"; yearly is an explicit opt-in (`plansForTier("pro",
 * "year")`). Non-subscription plans (Free, the pass) carry no interval and are
 * treated as monthly-cadence for this filter.
 */
export function plansForTier(
  tier: Tier,
  interval: "month" | "year" = "month",
): Plan[] {
  return PLANS.filter(
    (p) => p.tier === tier && (p.interval ?? "month") === interval,
  );
}

/**
 * The annual sibling of a monthly Pro plan (the `<id>_yr` convention), or null
 * for plans with no annual form. Drives the pricing page's cadence toggle.
 */
export function annualPlanFor(id: PlanId): Plan | null {
  const yearly = PLANS.find((p) => p.id === `${id}_yr`);
  return yearly ?? null;
}

/**
 * Host event-settings gated to paid tiers (locked + an upgrade hint on Free):
 * `password` (password-protected albums) and `custom_slug` (a custom /e/[slug] link).
 * Add more here as they become tier-gated. ("Locked" = `tier === "free"`, so paid tiers —
 * pro + event_pass — all have them.) Note: locked only blocks CREATE/CHANGE; a downgraded host
 * keeps the existing artifact and can still REMOVE it (see EventPasswordControl / clear_event_slug).
 *
 * NOTE: "Require accounts to upload" (`allow_anonymous_uploads`) was previously gated here but is now
 * FREE for any tier and DEFAULT-ON (safety + guest-email capture grows the platform; anon uploads
 * capture no emails, so free events seeded no new account-holders). It's an opt-in-anon toggle now,
 * not a Pro feature.
 */
export const GATED_EVENT_SETTINGS = ["password", "custom_slug"] as const;
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
 * Max highlight-reel length in seconds (ADR-0021): Free 30, paid 60. Length carries
 * no render cost (client-side encode) — this is a product lever, marketed on
 * /pricing, so a number can only safely move UP later (grandfathering makes marketed
 * numbers sticky). MUST mirror tier_limits().max_reel_seconds.
 */
export const MAX_REEL_SECONDS: Record<Tier, number> = {
  free: 30,
  pro: 60,
  event_pass: 60,
};

/**
 * Clamp a requested reel length to the tier cap. Auto (null/0/negative) fills UP TO
 * the cap; an explicit request clamps DOWN to it (a downgraded host's stored 60
 * renders as 30). Always returns a positive number of seconds. The composer preview
 * and the render/mint path both pass their length through this, and the reel-config
 * RPC applies the same clamp in SQL — the server never trusts the stored or client
 * value.
 */
export function clampReelSeconds(
  tier: Tier,
  requested: number | null | undefined,
): number {
  const cap = MAX_REEL_SECONDS[tier];
  return requested && requested > 0 ? Math.min(requested, cap) : cap;
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

/**
 * The cap INCLUDING the deliberate write-path headroom. `create_media` / `create_media_as_host`
 * accept an upload while `host_active_bytes + size <= v_cap + (v_cap / 10)`; this mirrors that SQL
 * so the nightly over-cap sweep engages at the SAME line it enforces at write time.
 *
 * ★ Keep the two in lockstep (QA #26): with the sweep at a bare `cap`, a host sitting legitimately
 * inside the headroom (bytes the product just accepted) received "you're over your limit" emails
 * and, at grace expiry, auto-removals. Integer division mirrors plpgsql's `/` on bigint.
 */
export function capWithWriteHeadroom(capBytes: number): number {
  return capBytes + Math.floor(capBytes / 10);
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
// Exported (2026-09) so the blog's spec components can cite the rule of thumb itself
// (<PhotoAverageSize />, <VideoMinuteSize />) instead of an author typing "4 MB".
export const AVG_PHOTO_BYTES = 4 * 1024 ** 2;
export const VIDEO_BYTES_PER_MIN = 150 * 1024 ** 2;

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

/**
 * The capacity estimate as a sentence fragment ("19,200 photos or 9 hours of video").
 * One formatter for every surface that says it (the blog's <CapacityEstimate />, /pricing's
 * `capacityPhrase`), so two pages never describe one cap in two ways.
 * `video: false` renders photos only, which is what the Free tier gets (photos-only).
 * Locale is pinned: this renders on the server and in tests, and a machine-dependent
 * thousands separator would make llms.txt / snapshot output drift by host.
 */
export function formatCapacity(
  bytes: number,
  { video = true }: { video?: boolean } = {},
): string {
  const { photos, videoMinutes } = friendlyCapacity(bytes);
  const photosText = `${photos.toLocaleString("en-US")} photos`;
  if (!video) return photosText;
  // Hours from two hours up (the /pricing threshold the site shipped with); minutes below.
  const videoText =
    videoMinutes >= 120
      ? `${Math.round(videoMinutes / 60).toLocaleString("en-US")} hours of video`
      : `${videoMinutes.toLocaleString("en-US")} minutes of video`;
  return `${photosText} or ${videoText}`;
}
