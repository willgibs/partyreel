/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Pricing & limits — the SINGLE source of truth.
 * ─────────────────────────────────────────────────────────────────────────────
 * Every limit number lives here exactly once. The marketing pricing page, the
 * dashboard, and the server-side enforcement (create-event guard, `create_media`
 * RPC) all read from this file. Do NOT hardcode caps anywhere else.
 *
 * WHY the model looks the way it does (anti-abuse — do not "simplify" this away):
 *   • Events PERSIST until the host deletes them. There is deliberately NO event
 *     end date. If an event could be "ended" while keeping its media accessible,
 *     a user could fill → end → create-new → fill repeatedly and use Partyreel as
 *     unlimited free cloud storage. Closing that loophole is why `maxEvents`
 *     counts the total number of events that EXIST (deleted_at IS NULL), not a
 *     concurrent/"active" count. The only way to free a slot is to delete an
 *     event, which destroys its media.
 *   • `maxEvents` × per-event caps = the hard ceiling on simultaneously stored
 *     files for free / event_pass / pro.
 *   • Monthly upload caps (free/pro) stop delete-and-re-upload churn from draining
 *     bandwidth. They count uploads MADE that month; deletes do NOT refund the
 *     counter.
 *   • Max removes per-event and event-count limits (huge events / many events) and
 *     instead constrains by total stored bytes (`storageCapBytes`, tracked via
 *     profiles.storage_used_bytes).
 *
 * Keep `Tier` in lockstep with the Postgres `tier_type` enum
 * (free | event_pass | pro | max). Universal media limits (5 min / 2 GB per clip)
 * are NOT here — they live in lib/media/limits.ts because they apply to every tier.
 */

export const TIERS = ["free", "event_pass", "pro", "max"] as const;
export type Tier = (typeof TIERS)[number];

/** New profiles start here (mirrors profiles.tier default). */
export const DEFAULT_TIER: Tier = "free";

export type BillingKind = "free" | "one_time" | "subscription";

export const GIGABYTE = 1024 ** 3;
export const TERABYTE = 1024 ** 4;

export type TierLimits = {
  /** Photos per single event. `null` = unlimited (Max). */
  maxPhotosPerEvent: number | null;
  /** Videos per single event. `null` = unlimited (Max). */
  maxVideosPerEvent: number | null;
  /** Total events that may EXIST at once (persist until deleted). `null` = unlimited. */
  maxEvents: number | null;
  /** Photo uploads counted per calendar month; deletes never refund. `null` = not metered. */
  monthlyPhotoCap: number | null;
  /** Video uploads counted per calendar month; deletes never refund. `null` = not metered. */
  monthlyVideoCap: number | null;
  /**
   * Total stored-bytes ceiling. Only meaningful for Max (governs instead of the
   * event/monthly caps). For Max the REAL ceiling is per-profile
   * (profiles.storage_cap_bytes) chosen from MAX_STORAGE_OPTIONS; the value here
   * is the entry-plan default. `null` for non-Max tiers.
   */
  storageCapBytes: number | null;
  /** Free exports carry a Partyreel watermark. */
  watermark: boolean;
};

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    maxPhotosPerEvent: 75,
    maxVideosPerEvent: 15,
    maxEvents: 1,
    monthlyPhotoCap: 750,
    monthlyVideoCap: 150,
    storageCapBytes: null,
    watermark: true,
  },
  event_pass: {
    maxPhotosPerEvent: 400,
    maxVideosPerEvent: 75,
    maxEvents: 1,
    monthlyPhotoCap: null,
    monthlyVideoCap: null,
    storageCapBytes: null,
    watermark: false,
  },
  pro: {
    maxPhotosPerEvent: 400,
    maxVideosPerEvent: 75,
    maxEvents: 10,
    monthlyPhotoCap: 8000,
    monthlyVideoCap: 1500,
    storageCapBytes: null,
    watermark: false,
  },
  max: {
    maxPhotosPerEvent: null,
    maxVideosPerEvent: null,
    maxEvents: null,
    monthlyPhotoCap: null,
    monthlyVideoCap: null,
    storageCapBytes: 500 * GIGABYTE, // entry default; real cap is per-profile
    watermark: false,
  },
};

export type MaxStorageOption = {
  label: string;
  bytes: number;
  priceLabel: string;
};

/** Storage variants a Max subscriber picks from; drives profiles.storage_cap_bytes. */
export const MAX_STORAGE_OPTIONS: MaxStorageOption[] = [
  { label: "500 GB", bytes: 500 * GIGABYTE, priceLabel: "$25/mo" },
  { label: "2 TB", bytes: 2 * TERABYTE, priceLabel: "$50/mo" },
  { label: "5 TB", bytes: 5 * TERABYTE, priceLabel: "$100/mo" },
];

export type TierPlan = {
  tier: Tier;
  name: string;
  /** Primary price, e.g. "$0", "$9", "$12", "from $25". */
  priceLabel: string;
  /** Cadence shown after the price, e.g. "/mo". One-time/free omit this. */
  priceSuffix?: string;
  billing: BillingKind;
  tagline: string;
  ctaLabel: string;
  /** Featured column in the pricing grid. */
  highlighted?: boolean;
};

/** Display copy for the pricing page. NUMBERS are derived from TIER_LIMITS, not duplicated here. */
export const TIER_PLANS: Record<Tier, TierPlan> = {
  free: {
    tier: "free",
    name: "Free",
    priceLabel: "$0",
    billing: "free",
    tagline: "One event, on the house.",
    ctaLabel: "Start free",
  },
  event_pass: {
    tier: "event_pass",
    name: "Event Pass",
    priceLabel: "$9",
    billing: "one_time",
    tagline: "One big event, kept for a year.",
    ctaLabel: "Buy a pass",
  },
  pro: {
    tier: "pro",
    name: "Pro",
    priceLabel: "$12",
    priceSuffix: "/mo",
    billing: "subscription",
    tagline: "For hosts who throw a lot of parties.",
    ctaLabel: "Go Pro",
    highlighted: true,
  },
  max: {
    tier: "max",
    name: "Max",
    priceLabel: "from $25",
    priceSuffix: "/mo",
    billing: "subscription",
    tagline: "Unlimited events. Storage you control.",
    ctaLabel: "Choose Max",
  },
};

/** Plans in display order for the pricing grid. */
export const ORDERED_PLANS: TierPlan[] = TIERS.map((tier) => TIER_PLANS[tier]);

/** Format a cap for display; `null` renders as the unlimited label. */
export function formatLimit(
  value: number | null,
  unlimited = "Unlimited",
): string {
  return value === null ? unlimited : value.toLocaleString();
}

/**
 * The canonical "can I add one more?" check, shared by event-count, per-event,
 * and monthly enforcement. `null` limit = unlimited. `current` is the count
 * BEFORE the new item.
 */
export function withinLimit(current: number, limit: number | null): boolean {
  return limit === null || current < limit;
}

/**
 * Human-readable feature bullets for a plan, derived from TIER_LIMITS so the
 * pricing page never restates a number that enforcement doesn't also use.
 */
export function tierHighlights(tier: Tier): string[] {
  const l = TIER_LIMITS[tier];
  const lines: string[] = [];

  lines.push(
    l.maxEvents === null
      ? "Unlimited events"
      : `${l.maxEvents} event${l.maxEvents === 1 ? "" : "s"}`,
  );
  lines.push(
    `${formatLimit(l.maxPhotosPerEvent)} photos · ${formatLimit(l.maxVideosPerEvent)} videos per event`,
  );
  if (l.storageCapBytes !== null) {
    lines.push(`From ${MAX_STORAGE_OPTIONS[0].label} of storage`);
  }
  if (l.monthlyPhotoCap !== null) {
    lines.push(
      `${formatLimit(l.monthlyPhotoCap)} photos / ${formatLimit(l.monthlyVideoCap)} videos per month`,
    );
  }
  lines.push(l.watermark ? "Partyreel watermark on exports" : "No watermark");

  return lines;
}
