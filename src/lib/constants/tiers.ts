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
 *     counts events that EXIST (deleted_at IS NULL); deleting one is the only way to
 *     free a slot.
 *   • THE UPLOADS ALLOWANCE counts bytes UPLOADED and NEVER refunds on delete:
 *     storage caps alone don't stop delete→re-upload churn, which the backup and every
 *     upload's operations bill whatever the cap says. It is PUBLISHED (the pricing
 *     table's Uploads row, `uploadsLabel`), so every plan carries its own number sized
 *     with its price (PRICING.md, "What it costs us"), never a multiple of its cap: the
 *     allowance a GB falls as the plans grow, since a big plan's month never re-fills
 *     it. It counts over its window (`UPLOADS_WINDOW`): Free and Pro a calendar month
 *     (`storage_ledger.cumulative_bytes`, which never decrements), the Event Pass its
 *     own year, on the pass itself (`event_passes.uploaded_bytes`), so a pass's event
 *     can take its whole allowance on its one night (billing-caps.md).
 *
 * Keep these numbers in lockstep with the Postgres `public.tier_limits()` and
 * `public.upload_allowance()` fns (DB enforcement): a Vitest parity test
 * (`tier-limits-parity.test.ts`) guards the pairing. The universal per-file
 * limit (10 GB per file, size is the ONLY per-file gate) is NOT here — it lives in
 * lib/media/limits.ts because it applies to every tier. (The `tier_type` enum still lists a retired `max`
 * value — folded into Pro storage options; it is unused, left in place because
 * dropping a Postgres enum value is risky.)
 *
 * This file is import-safe from client components — it holds NO secrets. The
 * env-referenced Stripe Price IDs and `planForPriceId()` live in lib/stripe/.
 */

import { formatCount } from "@/lib/format/count";
import { formatBytes } from "@/lib/utils";

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

export const MEGABYTE = 1024 ** 2;
export const GIGABYTE = 1024 ** 3;
export const TERABYTE = 1024 ** 4;

export type BillingKind = "free" | "subscription" | "one_time";

export const PLAN_IDS = [
  "free",
  "pro_50",
  "pro_200",
  "pro_1tb",
  "pro_50_yr",
  "pro_200_yr",
  "pro_1tb_yr",
  "event_pass",
] as const;
export type PlanId = (typeof PLAN_IDS)[number];

/** A purchasable plan = billing tier + storage cap + (Stripe) price. */
export type Plan = {
  id: PlanId;
  tier: Tier;
  name: string;
  storageBytes: number;
  /**
   * What the plan lets a host and her guests upload in its window (`UPLOADS_WINDOW`: a month,
   * or a pass's year), deletions included. PUBLISHED: the pricing table's Uploads row.
   * The pass's is EACH pass's (passes stack); Pro's is its size's.
   */
  uploadsBytes: number;
  /**
   * Who the size is for, in a host's words: the label a Pro size wears on the pricing page's
   * slider (a plan is never named by its size alone; the GB sits in its row beside it).
   */
  use?: string;
  /** Display only — Stripe Prices are the billing truth. */
  priceLabel: string;
  billing: BillingKind;
  /** Subscription cadence; undefined = "month". */
  interval?: "month" | "year";
  /** Env var holding the Stripe Price ID (paid plans only). */
  stripePriceEnvKey?: string;
  /** Event Pass only — fixed term before it lapses into the retention flow. */
  termDays?: number;
};

/**
 * ★ LADDER A (Will, 2026-10-03 23:58Z and 2026-10-04 02:50Z: "send it on pricing tier A with $99",
 * the renewal at $19): an event, or a year of them. Its reasons are PRICING.md's ("What it costs
 * us"); the shape in one breath: the first paid steps are one big event (the pass) or several (Pro
 * 50 GB), then each Pro step is a host's next natural use at a gently falling price a GB ($0.18,
 * $0.145, $0.097) that never drops under the plan's worst month, and every published uploads
 * number is sized so that worst month stays under the price (rule 2). Every marketed number here
 * only moves UP after launch (grandfathering): raising one is a gift, lowering one a broken promise.
 */
export const PLANS: Plan[] = [
  // ★ FREE IS THE WHOLE EXPERIENCE, SIZED FOR A SMALL GATHERING (Will, 2026-09-28): "the free
  // plan feels very close to the same pro experience, minus a few core blockers". The password,
  // the custom link and full-length clips are on every plan now, and the room is 100 MB (about
  // thirty photos at an iPhone's defaults), so what paid adds is a short list a host can read at
  // a glance: video, more storage, unlimited events, clips with no mark. Starting this low is
  // the reversible direction: raising a marketed limit later is a gift, lowering one is not.
  // Its uploads are three times its room a month: a small event's guests re-adding a few photos
  // never meet it, and a script re-filling 100 MB costs us nothing worth a breaker.
  {
    id: "free",
    tier: "free",
    name: "Free",
    storageBytes: 100 * MEGABYTE,
    uploadsBytes: 300 * MEGABYTE,
    use: "A small gathering",
    priceLabel: "$0",
    billing: "free",
  },
  // ★ THE PRO SIZES ARE A HOST'S NEXT USES, and their uploads rise down the ladder while the share
  // of the room they re-fill falls (twice the room a month, then once, then half): a big plan is a
  // venue's archive, which never turns over in a month, and its worst month is what sizes its price.
  {
    id: "pro_50",
    tier: "pro",
    name: "Pro 50 GB",
    storageBytes: 50 * GIGABYTE,
    uploadsBytes: 100 * GIGABYTE,
    use: "A season of parties",
    priceLabel: "$9/mo",
    billing: "subscription",
    stripePriceEnvKey: "STRIPE_PRICE_PRO_50",
  },
  {
    id: "pro_200",
    tier: "pro",
    name: "Pro 200 GB",
    storageBytes: 200 * GIGABYTE,
    uploadsBytes: 200 * GIGABYTE,
    use: "A planner's year",
    priceLabel: "$29/mo",
    billing: "subscription",
    stripePriceEnvKey: "STRIPE_PRICE_PRO_200",
  },
  {
    id: "pro_1tb",
    tier: "pro",
    name: "Pro 1 TB",
    storageBytes: TERABYTE,
    uploadsBytes: 500 * GIGABYTE,
    use: "A venue's year",
    priceLabel: "$99/mo",
    billing: "subscription",
    stripePriceEnvKey: "STRIPE_PRICE_PRO_1TB",
  },
  // Annual Pro: exactly x10 the monthly, marketed as "two
  // months free". x10 is a DRIFT GUARD as much as a price: a test pins each
  // yearly label to 10x its monthly sibling, so the pair can only move together.
  {
    id: "pro_50_yr",
    tier: "pro",
    name: "Pro 50 GB",
    storageBytes: 50 * GIGABYTE,
    uploadsBytes: 100 * GIGABYTE,
    use: "A season of parties",
    priceLabel: "$90/yr",
    billing: "subscription",
    interval: "year",
    stripePriceEnvKey: "STRIPE_PRICE_PRO_50_YR",
  },
  {
    id: "pro_200_yr",
    tier: "pro",
    name: "Pro 200 GB",
    storageBytes: 200 * GIGABYTE,
    uploadsBytes: 200 * GIGABYTE,
    use: "A planner's year",
    priceLabel: "$290/yr",
    billing: "subscription",
    interval: "year",
    stripePriceEnvKey: "STRIPE_PRICE_PRO_200_YR",
  },
  {
    id: "pro_1tb_yr",
    tier: "pro",
    name: "Pro 1 TB",
    storageBytes: TERABYTE,
    uploadsBytes: 500 * GIGABYTE,
    use: "A venue's year",
    priceLabel: "$990/yr",
    billing: "subscription",
    interval: "year",
    stripePriceEnvKey: "STRIPE_PRICE_PRO_1TB_YR",
  },
  // ★ THE PASS IS ONE BIG EVENT KEPT A YEAR: 25 GB holds a 200-guest wedding twice over, and it is
  // the room its $19 renewal can carry for a whole year (a full pass costs us about $10.72 a year
  // to keep), so the renewal holds at the pass's own size. Its uploads count over ITS year, not a
  // month: the event and a full second round land on one night, which a monthly allowance would
  // ration in the one month that matters and waste in the eleven that do not.
  {
    id: "event_pass",
    tier: "event_pass",
    name: "Event Pass",
    storageBytes: 25 * GIGABYTE,
    uploadsBytes: 50 * GIGABYTE,
    use: "One big event",
    priceLabel: "$29 one-time",
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
 * (billing-caps.md); surfaced on /pricing so the keep-it-alive cost is
 * never a surprise. $19, not $15 (the Advisor's Q16): once sold it binds every
 * holder who renews, so it has to outlast our vendors' prices, and $19 absorbs
 * a 45% rise in what a pass costs us where $15 absorbs 14%. Its year carries
 * the pass's own uploads, since a renewal is a new ledger row with its own count.
 */
export const EVENT_PASS_RENEWAL_PRICE_LABEL = "$19";

/** Events that may EXIST per tier — the free→paid wall. null = unlimited. */
export const MAX_EVENTS: Record<Tier, number | null> = {
  free: 1,
  pro: null,
  event_pass: 1,
};

/**
 * The window each tier's uploads count over. A calendar month (UTC, the ledger's `YYYY-MM`) for
 * Free and Pro; a pass's own year for the Event Pass, counted on its ledger row from its purchase
 * (or, for a renewal, from the day its year opens), so a pass's year is the one it paid for, never
 * the calendar's. Mirrors which count `uploads_used()` reads.
 */
export const UPLOADS_WINDOW: Record<Tier, "month" | "year"> = {
  free: "month",
  pro: "month",
  event_pass: "year",
};

/**
 * The uploads allowance a TIER sets on its own: Free's, and ONE pass's (a stack multiplies it,
 * `uploadAllowance`). Pro is null here because its allowance is its size's, exactly as its storage
 * is (`profiles.storage_cap_bytes`, never a tier default). Derived from the plans, never typed
 * twice. MUST mirror tier_limits().uploads_bytes.
 */
export const UPLOADS_BYTES: Record<Tier, number | null> = {
  free: planById("free").uploadsBytes,
  pro: null,
  event_pass: planById("event_pass").uploadsBytes,
};

/**
 * What a host may upload in her current window, by her plan: what the upload RPCs refuse past
 * (`upload_allowance()`, which this mirrors under the parity test).
 *
 *  - Free: its own number.
 *  - An Event Pass: one pass's allowance for each pass her room holds (passes stack, and the
 *    recompute writes her cap as the passes' rooms summed), never fewer than one pass's.
 *  - Pro: her size's number, read off the cap the webhook wrote, at the SMALLEST Pro size that
 *    holds it, and the largest size's above them all. A cap between sizes only exists on a
 *    subscription at a price we no longer sell (or a hand-set comp), and taking the larger
 *    size's number there fails toward the host. A Pro profile with no cap on record yet (the
 *    webhook writes it) is unmetered: fail OPEN, never block a paying host on missing data.
 */
export function uploadAllowance(
  tier: Tier,
  storageCapBytes: number | null,
): number | null {
  if (tier === "pro") {
    if (storageCapBytes === null) return null;
    const sizes = plansForTier("pro");
    const size =
      sizes.find((p) => storageCapBytes <= p.storageBytes) ??
      sizes[sizes.length - 1];
    return size.uploadsBytes;
  }
  if (tier === "event_pass") {
    const pass = planById("event_pass");
    const room = effectiveStorageCap(tier, storageCapBytes) ?? pass.storageBytes;
    return pass.uploadsBytes * Math.max(1, Math.floor(room / pass.storageBytes));
  }
  return planById("free").uploadsBytes;
}

/** The window an allowance counts over, in words: the one place "a month" and "over its year" are spelled. */
function uploadsWindowWords(plan: Plan): string {
  return UPLOADS_WINDOW[plan.tier] === "year" ? "over its year" : "a month";
}

/**
 * A plan's Uploads row as the pricing table prints it: "300 MB a month", "50 GB over its year".
 * The one way an allowance is said, so the table, the help and llms.txt never word it twice.
 */
export function uploadsLabel(plan: Plan): string {
  return `${formatBytes(plan.uploadsBytes)} ${uploadsWindowWords(plan)}`;
}

/**
 * The same allowance as a card's own line, where a table's cell has its row label to say what it counts:
 * "100 GB of uploads a month", "50 GB of uploads over its year" (red-team 52: the plan sheet's cards named each
 * size's storage and estimate and never its uploads).
 */
export function uploadsPhrase(plan: Plan): string {
  return `${formatBytes(plan.uploadsBytes)} of uploads ${uploadsWindowWords(plan)}`;
}

/**
 * Per-tier default storage cap, used when `profiles.storage_cap_bytes` is null.
 * Pro is null on purpose — a Pro account's cap is always set explicitly by the
 * webhook from the purchased plan. The pass's is ONE pass's room; the recompute
 * writes a stack's sum. MUST mirror tier_limits().default_storage_cap_bytes.
 */
export const DEFAULT_STORAGE_CAP_BYTES: Record<Tier, number | null> = {
  free: planById("free").storageBytes,
  pro: null,
  event_pass: planById("event_pass").storageBytes,
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
 * The host event settings a paid gate CAN hold: `password` (password-protected albums) and
 * `custom_slug` (a custom /e/[slug] link). Each keeps its locked branch, the lock chip and an
 * upgrade hint on Free, whenever it sits in GATED_EVENT_SETTINGS below.
 */
export type GatedEventSetting = "password" | "custom_slug";

/**
 * The settings gated TODAY: none (the free/pro shift, Will 2026-09-28). The password and the
 * custom link came down to Free, so Pro is defined by what a host feels (video, more storage,
 * unlimited events, clips with no mark) rather than by a lock on a setting. The lock machinery
 * stays for video (`videosAllowedForTier`, the `video` lock chip), and a setting added back
 * here is locked again at every call site at once, with its SQL setter's refusal restored in
 * the same change (`tiers-sql.test.ts` holds the two halves together). Locked only ever
 * blocks CREATE/CHANGE: a downgraded host keeps the artifact and can still REMOVE it
 * (EventPasswordControl / clear_event_slug).
 *
 * NOTE: the door's safety switches are FREE on every tier and never belong here: Require verified
 * emails (`require_verified_email`, on by default: a confirmed address is a guest the host can
 * identify, and one who can keep what they add) and Require an upload to view
 * (`require_upload_to_view`). Safety behind a paywall is the trade this list refuses.
 */
export const GATED_EVENT_SETTINGS: readonly GatedEventSetting[] = [];

/** Locked = on Free AND gated today; paid tiers (pro + event_pass) never are. */
export function isSettingLocked(
  setting: GatedEventSetting,
  tier: Tier,
): boolean {
  return tier === "free" && GATED_EVENT_SETTINGS.includes(setting);
}

/**
 * Video uploads are a paid feature (Phase 2): a free event is photos-only, for
 * guests AND the host. Authoritatively enforced in create_media /
 * create_media_as_host (a free host's event rejects type='video'); this helper
 * drives the host upload UI + the settings status row. Like isSettingLocked,
 * "allowed" = any non-free tier (pro + event_pass). The universal per-file SIZE
 * ceiling (lib/media/limits.ts, MAX_UPLOAD_BYTES) is orthogonal — it applies to paid
 * video too. There is no duration cap: the retired 5-min / 2-GB pair this line used
 * to cite has not been the limit since size became the only per-file gate.
 */
export function videosAllowedForTier(tier: Tier): boolean {
  return tier !== "free";
}

/**
 * Max clip length in seconds (billing-caps.md): 60 on every tier since the free/pro shift
 * (Free was 30). Will put "reel clip time" among "the less important stuff", so what paid
 * still changes about a clip is its mark, not its length. Length carries no render cost
 * (client-side encode) — this is a product lever, marketed on /pricing, so a number can only
 * safely move UP later (grandfathering makes marketed numbers sticky). Kept per tier so the
 * lever survives. MUST mirror tier_limits().max_reel_seconds.
 */
export const MAX_REEL_SECONDS: Record<Tier, number> = {
  free: 60,
  pro: 60,
  event_pass: 60,
};

/**
 * Clamp a requested reel length to the tier cap. Auto (null/0/negative) fills UP TO
 * the cap; an explicit request clamps DOWN to it (a stored length past a tier's cap
 * renders at the cap). Always returns a positive number of seconds. The composer preview
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
 * ★ Keep the two in lockstep: with the sweep at a bare `cap`, a host sitting legitimately
 * inside the headroom (bytes the product just accepted) received "you're over your limit" emails
 * and, at grace expiry, auto-removals. Integer division mirrors plpgsql's `/` on bigint.
 */
export function capWithWriteHeadroom(capBytes: number): number {
  return capBytes + Math.floor(capBytes / 10);
}

/**
 * Format a cap for display; `null` renders as the unlimited label. A number reads through `formatCount` (en-US,
 * pinned): a bare `toLocaleString()` printed the RUNTIME's locale, the server's while rendering and a visitor's
 * own on hydration.
 */
export function formatLimit(
  value: number | null,
  unlimited = "Unlimited",
): string {
  return value === null ? unlimited : formatCount(value);
}

/**
 * ★ THE ESTIMATES ASSUME AN IPHONE AT ITS DEFAULTS, AND EVERY ONE SAYS SO (host-storage r2,
 * Will: "iPhone is probably our most commonly expected upload device and camera, most users
 * probably haven't changed default settings on those either. Would likely be most fair
 * 'average'"). A photos-or-minutes figure with no camera behind it is a random claim: a
 * guest's megapixels or frame rate moves it several times over.
 *
 *  - A PHOTO: the default capture is a 24 MP High Efficiency (HEIF) photo (Settings > Camera >
 *    Formats > Photo Mode, where the Main camera defaults to 24 MP; Apple's "About Apple
 *    ProRAW", support.apple.com/en-us/119916: "standard HEIF offers up to 24 MP"). Apple prints
 *    no size for it but brackets it: a 48 MP HEIF Max is about 5 MB (Settings > Camera >
 *    Formats > Pro Default), and a 12 MP HEIF about a tenth of a 12 MP ProRAW's 25 MB (the same
 *    page: "ProRAW files are 10 to 12 times larger than HEIF or JPEG files"). 3.5 MB sits
 *    between the two, toward the larger, so no estimate promises more photos than a host gets.
 *  - A MINUTE OF VIDEO: Settings > Camera > Record Video defaults to 1080p HD at 30 fps in High
 *    Efficiency (HEVC), which that screen lists at about 65 MB a minute.
 *
 * Both are BINARY megabytes, the site's own (`formatBytes`), so they print as Apple's figures
 * ("3.5 MB", "65 MB"); Apple's MB is decimal, so the constants run about 5% heavy, which errs
 * toward fewer photos and minutes, never more. Exported so the blog's spec components cite the
 * rule itself (<PhotoAverageSize />, <VideoMinuteSize />) instead of an author typing a number.
 */
export const AVG_PHOTO_BYTES = 3.5 * MEGABYTE;
export const VIDEO_BYTES_PER_MIN = 65 * MEGABYTE;

/** The camera every estimate assumes, as the words that follow it ("29 photos at ..."). */
export const ESTIMATE_BASIS = "at an iPhone's default camera settings";

/**
 * The basis with its working, for a surface that has the room to show it (under /pricing's
 * plans, the calculator, a table's caption): the two defaults and what each weighs.
 */
export const ESTIMATE_BASIS_NOTE = `Estimates are ${ESTIMATE_BASIS}: about ${AVG_PHOTO_BYTES / MEGABYTE} MB a photo (24 MP) and ${VIDEO_BYTES_PER_MIN / MEGABYTE} MB a minute of video (1080p at 30 fps).`;

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
 * The capacity estimate as a sentence fragment ("21,943 photos or 20 hours of video at an
 * iPhone's default camera settings"). One formatter for every surface that says it (the
 * blog's <CapacityEstimate />, /pricing's `capacityPhrase`, the plan sheet), so two pages
 * never describe one cap in two ways. `video: false` renders photos only, which is what the
 * Free tier gets (photos-only).
 *
 * ★ THE BASIS RIDES ALONG BY DEFAULT: an estimate that loses its camera is the random claim
 * the round retired. `basis: false` is only for a surface that says it once already, beside
 * the figures (a list of plan cards over one note, a table under its caption).
 *
 * Locale is pinned (`formatCount`): this renders on the server and in tests, and a machine-dependent
 * thousands separator would make llms.txt / snapshot output drift by host.
 */
export function formatCapacity(
  bytes: number,
  { video = true, basis = true }: { video?: boolean; basis?: boolean } = {},
): string {
  const { photos, videoMinutes } = friendlyCapacity(bytes);
  const photosText = `${formatCount(photos)} photos`;
  // Hours from two hours up (the /pricing threshold the site shipped with); minutes below.
  const videoText =
    videoMinutes >= 120
      ? `${formatCount(Math.round(videoMinutes / 60))} hours of video`
      : `${formatCount(videoMinutes)} minutes of video`;
  const estimate = video ? `${photosText} or ${videoText}` : photosText;
  return basis ? `${estimate} ${ESTIMATE_BASIS}` : estimate;
}

/**
 * ★ THE BIG PARTY, THE UNIT A CARD LEADS WITH (the cost atlas's reference party): a host reads "a
 * 200-guest wedding, twice over" before she reads 25 GB, so the pricing cards count their room in
 * these. 200 guests over an evening, adding about 2,000 photos and 100 half-minute clips, at the
 * iPhone defaults every estimate assumes: about 10 GB of originals, which is what a plan's storage
 * counts (the previews and phone-size copies are ours). Like every estimate it says its working
 * once, where it prints (`BIG_PARTY_NOTE`).
 */
export const BIG_PARTY = {
  guests: 200,
  photos: 2_000,
  clips: 100,
  clipSeconds: 30,
} as const;

export const BIG_PARTY_BYTES =
  BIG_PARTY.photos * AVG_PHOTO_BYTES +
  BIG_PARTY.clips * (BIG_PARTY.clipSeconds / 60) * VIDEO_BYTES_PER_MIN;

/**
 * How many big parties a room holds, the friendly way: whole under ten (2, 5), then to the
 * nearest five (20, 100), since "102 parties" claims a precision the estimate never had.
 */
export function partiesHeld(bytes: number): number {
  const n = bytes / BIG_PARTY_BYTES;
  return n < 10 ? Math.round(n) : Math.round(n / 5) * 5;
}

/** The party's working, for the note under the cards that count in it. */
export const BIG_PARTY_NOTE = `A ${BIG_PARTY.guests}-guest party is counted at about ${formatCount(BIG_PARTY.photos)} photos and ${BIG_PARTY.clips} clips of ${BIG_PARTY.clipSeconds} seconds.`;
