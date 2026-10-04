/**
 * EVERY PLAN LIMIT THE LIMITS WATCH MEASURES, IN ONE FILE (lane `limits-watch`, 2026-10-04; admin-observability.md,
 * "Plan limits"). Each limit is the vendor's own current number for the plan we are on TODAY, read from the vendor's
 * page on the date written beside it and never remembered or guessed: when a plan changes (Vercel Pro, Resend Pro and
 * Workers Paid at launch) the edit is here and nowhere else, and the page it came from is the line to re-read.
 *
 * PURE on purpose (no env, no DB, no `server-only`): the run reads and judges, the card and the mail say, and all of
 * them take the limit, the label and the words from this file.
 *
 * ★ A UNIT IS THE CONSERVATIVE ONE. No vendor page below says whether its GB is 10^9 or 2^30 bytes, so a limit in GB is
 * counted in 10^9 (a smaller limit reads a larger share, so a watch that misjudges the unit warns early, never late).
 */
import { RESEND_DAILY_QUOTA } from "@/lib/jobs/spend-watch";

const GB = 1_000_000_000;
const HOUR_S = 3_600;

export type VendorId = "vercel" | "supabase" | "cloudflare" | "resend";

/** Each vendor, with the plan we are on today (the page each limit was read from is cited at `METERS`). */
export const VENDORS: Record<VendorId, { label: string; plan: string }> = {
  vercel: { label: "Vercel", plan: "Hobby" },
  // ★ NOT THE FREE PLAN the brief assumed: the org ("Partyreel Team") is on Pro, read through the Supabase MCP's
  // `get_organization` (plan: pro) on 2026-10-04, beside durability-backups.md's "Supabase Pro's daily backup".
  supabase: { label: "Supabase", plan: "Pro" },
  cloudflare: { label: "Cloudflare", plan: "Free" },
  resend: { label: "Resend", plan: "Free" },
};

export const VENDOR_ORDER: readonly VendorId[] = [
  "vercel",
  "supabase",
  "cloudflare",
  "resend",
];

export type MeterId =
  | "vercel_active_cpu"
  | "vercel_invocations"
  | "vercel_fast_origin"
  | "vercel_fast_data"
  | "vercel_cdn_requests"
  | "vercel_image_transforms"
  | "supabase_db_size"
  | "supabase_mau"
  | "supabase_egress"
  | "supabase_realtime"
  | "r2_storage"
  | "r2_class_a"
  | "r2_class_b"
  | "workers_requests"
  | "resend_month"
  | "resend_day";

/**
 * How a limit is counted, which decides how its climb is projected (`limits-watch.ts`):
 *  - `rolling`: a total over the trailing 30 days, read as daily buckets (Vercel Hobby: "wait until 30 days have
 *    passed"), so the days that roll out of the window are known and counted in the projection;
 *  - `gauge`: a level now (the database's size, the bucket's bytes, the month's signed-in accounts), its climb taken
 *    from our own earlier readings;
 *  - `month`: a total since the 1st (UTC), reset by the calendar;
 *  - `day`: a total per UTC day, so the reading is the week's busiest day and no days-left is told.
 */
export type MeterShape = "rolling" | "gauge" | "month" | "day";

export type Measure = "count" | "bytes" | "seconds";

export type MeterDef = {
  id: MeterId;
  vendor: VendorId;
  label: string;
  /** The plan's limit in base units: calls, bytes, or CPU seconds. */
  limit: number;
  measure: Measure;
  shape: MeterShape;
  /** What the limit is counted over, in the card's words. */
  per: string;
  /** Computed from a calibration, not reported by the vendor: the card and the mail say so. */
  estimated?: true;
  /** Where the number comes from, in the card's words. */
  source: string;
  /** What breaking the limit does, said where the meter is. */
  past: string;
  /**
   * No reader exists for it. `needs`: a credential the app does not hold (admin-observability.md, "Plan limits" says which);
   * `unavailable`: the vendor's API reports none. Either way the card says "No reading" and why, never a zero.
   */
  gap?: { cause: "needs" | "unavailable"; why: string };
};

// ── Vercel (Hobby) ────────────────────────────────────────────────────────────────────────────────

/**
 * The team the usage is read for (the same id `usher/kit/vercel-lib.mjs` and `scripts/prune-vercel-deployments.mjs`
 * hold: an identifier, not a secret).
 */
export const VERCEL_TEAM_ID = "team_ht9qAVBQVZf60dpGNJUwmaj5";

/**
 * ★ ACTIVE CPU IS ESTIMATED. Hobby's API answers no Active CPU (that is Observability Plus), so the watch multiplies the
 * 30-day function calls it does answer by the CPU a call costs, read off the dashboard by hand: 3 h 56 m (14,160 s)
 * against 320,789 calls on 2026-10-04 at 15:45Z is 44 ms a call. It mirrors `CPU_SECONDS_PER_CALL` in
 * `usher/kit/vercel-usage.mjs`: recalibrate both together, and the card names the date.
 */
export const VERCEL_CPU_SECONDS_PER_CALL = 0.044;
export const VERCEL_CPU_CALIBRATED = "2026-10-04";

/** Vercel's one wording of what a Hobby break does (docs/plans/hobby, "Hobby billing cycle", read 2026-10-04). */
const VERCEL_PAST =
  "Past a Hobby limit the feature stops until 30 days have passed, and the team's functions pause with it.";

// ── The meters ────────────────────────────────────────────────────────────────────────────────────

/**
 * THE METERS, in the card's order. Sources, all read 2026-10-04:
 *  - Vercel, https://vercel.com/docs/plans/hobby (updated 2026-09-14) and /docs/limits/fair-use-guidelines: Active
 *    CPU 4 hours, Function Invocations 1,000,000, Fast Origin Transfer 10 GB, Fast Data Transfer 100 GB, CDN
 *    Requests 1,000,000, Image Transformations 5,000 a month. ISR Reads has NO Hobby allowance on either page (nor
 *    on /docs/incremental-static-regeneration/limits-and-pricing), and the usage API's `data_cache` answers no rows,
 *    so it is not a meter until Vercel states a limit (`NOT_WATCHED`, below).
 *  - Supabase Pro, https://supabase.com/pricing and /docs/guides/platform/cost-control: 8 GB disk, 100,000 MAU,
 *    250 GB egress, 5 million Realtime messages a month; the spend cap (on by default) disallows what passes a quota
 *    until the next billing cycle, and off it bills the overage.
 *  - Cloudflare, https://developers.cloudflare.com/r2/pricing/ (free tier, Standard storage only: 10 GB-month, 1
 *    million Class A, 10 million Class B a month, overage billed) and /workers/platform/limits/ (Free: 100,000
 *    requests a day for the whole account, resetting at midnight UTC, Error 1027 past it).
 *  - Resend, https://resend.com/docs/knowledge-base/account-quotas-and-limits: 100 a UTC day, 3,000 a month, both
 *    sent and received mail counting.
 */
export const METERS: readonly MeterDef[] = [
  {
    id: "vercel_active_cpu",
    vendor: "vercel",
    label: "Active CPU",
    limit: 4 * HOUR_S,
    measure: "seconds",
    shape: "rolling",
    per: "over a rolling 30 days",
    estimated: true,
    source: `Estimated: the usage API's 30-day function calls times ${Math.round(VERCEL_CPU_SECONDS_PER_CALL * 1000)} ms of CPU a call, calibrated by hand on the dashboard (${VERCEL_CPU_CALIBRATED}); Hobby's API reports no Active CPU`,
    past: VERCEL_PAST,
  },
  {
    id: "vercel_invocations",
    vendor: "vercel",
    label: "Function invocations",
    limit: 1_000_000,
    measure: "count",
    shape: "rolling",
    per: "over a rolling 30 days",
    source:
      "The usage API's daily function calls (successful, errored and timed out), summed over 30 days",
    past: VERCEL_PAST,
  },
  {
    id: "vercel_fast_origin",
    vendor: "vercel",
    label: "Fast Origin Transfer",
    limit: 10 * GB,
    measure: "bytes",
    shape: "rolling",
    per: "over a rolling 30 days",
    source: "Data between the CDN and our functions",
    past: VERCEL_PAST,
    gap: {
      cause: "unavailable",
      why: "Hobby's usage API reports no Fast Origin Transfer: read it on the dashboard's Usage page",
    },
  },
  {
    id: "vercel_fast_data",
    vendor: "vercel",
    label: "Fast Data Transfer",
    limit: 100 * GB,
    measure: "bytes",
    shape: "rolling",
    per: "over a rolling 30 days",
    // https://vercel.com/docs/manage-cdn-usage: "Incoming data transfer corresponds to the request, and outgoing
    // corresponds to the response", both counted.
    source:
      "The usage API's daily outgoing and incoming bandwidth, summed over 30 days (Vercel counts both directions)",
    past: VERCEL_PAST,
  },
  {
    id: "vercel_cdn_requests",
    vendor: "vercel",
    label: "CDN requests",
    limit: 1_000_000,
    measure: "count",
    shape: "rolling",
    per: "over a rolling 30 days",
    source:
      "The usage API's daily request hits and misses, summed over 30 days (the dashboard's CDN Requests, formerly Edge Requests)",
    past: VERCEL_PAST,
  },
  {
    id: "vercel_image_transforms",
    vendor: "vercel",
    label: "Image transformations",
    limit: 5_000,
    measure: "count",
    shape: "rolling",
    per: "a month",
    source: "Images Vercel resized or reformatted",
    past: VERCEL_PAST,
    gap: {
      cause: "unavailable",
      why: "The usage API reports no image transformations: read them on the dashboard's Usage page",
    },
  },
  // ── Supabase (Pro) ──
  {
    id: "supabase_db_size",
    vendor: "supabase",
    label: "Database size",
    limit: 8 * GB,
    measure: "bytes",
    shape: "gauge",
    per: "of disk, included with Pro",
    source: "pg_database_size: the whole database, one SQL call",
    past: "Past the included disk Supabase disallows the use until the next billing cycle while the spend cap is on (Pro's default), and bills $0.125 a GB while it is off.",
  },
  {
    id: "supabase_mau",
    vendor: "supabase",
    label: "Monthly active users",
    limit: 100_000,
    measure: "count",
    shape: "gauge",
    per: "a billing month",
    source:
      "Accounts whose last sign-in falls in the past 30 days (auth.users): a floor, since Supabase also counts token refreshes",
    past: "Past the quota Supabase disallows sign-ins until the next billing cycle while the spend cap is on, and bills $0.00325 a user while it is off.",
  },
  {
    id: "supabase_egress",
    vendor: "supabase",
    label: "Egress",
    limit: 250 * GB,
    measure: "bytes",
    shape: "month",
    per: "a billing month",
    source: "Every Supabase service's outgoing bytes",
    past: "Past the quota Supabase disallows the use until the next billing cycle while the spend cap is on, and bills $0.09 a GB while it is off.",
    gap: {
      cause: "needs",
      why: "Not wired: needs a Supabase personal access token for the Management API, and the app holds none (Plan limits, admin-observability.md)",
    },
  },
  {
    id: "supabase_realtime",
    vendor: "supabase",
    label: "Realtime messages",
    limit: 5_000_000,
    measure: "count",
    shape: "month",
    per: "a billing month",
    source: "Every album's pings, one per change plus one per listener",
    past: "Past the quota Supabase disallows Realtime until the next billing cycle while the spend cap is on, and bills $2.50 a million while it is off.",
    gap: {
      cause: "needs",
      why: "Not wired: needs a Supabase personal access token for the Management API, and the app holds none (Plan limits, admin-observability.md)",
    },
  },
  // ── Cloudflare (Free) ──
  {
    id: "r2_storage",
    vendor: "cloudflare",
    label: "R2 storage",
    limit: 10 * GB,
    measure: "bytes",
    shape: "gauge",
    per: "a month (each day's peak, averaged)",
    source:
      "The bytes of every media row's original and phone copy (our own counter): a floor, since previews and the backup bucket are not in it",
    past: "Past the free tier R2 bills $0.015 a GB-month; nothing stops.",
  },
  {
    id: "r2_class_a",
    vendor: "cloudflare",
    label: "R2 Class A operations",
    limit: 1_000_000,
    measure: "count",
    shape: "month",
    per: "a month",
    source: "Writes and lists: every upload part, copy and listing",
    past: "Past the free tier R2 bills $4.50 a million; nothing stops.",
    gap: {
      cause: "needs",
      why: "Not wired: needs a Cloudflare API token with Account Analytics: Read, and the app holds none (Plan limits, admin-observability.md)",
    },
  },
  {
    id: "r2_class_b",
    vendor: "cloudflare",
    label: "R2 Class B operations",
    limit: 10_000_000,
    measure: "count",
    shape: "month",
    per: "a month",
    source: "Reads: every GET and HEAD",
    past: "Past the free tier R2 bills $0.36 a million; nothing stops.",
    gap: {
      cause: "needs",
      why: "Not wired: needs a Cloudflare API token with Account Analytics: Read, and the app holds none (Plan limits, admin-observability.md)",
    },
  },
  {
    id: "workers_requests",
    vendor: "cloudflare",
    label: "Workers requests",
    limit: 100_000,
    measure: "count",
    shape: "day",
    per: "a UTC day, for the whole account",
    source: "The export and backup Workers' requests together",
    past: "Past it Cloudflare answers Error 1027 (or skips the Worker) until midnight UTC.",
    gap: {
      cause: "needs",
      why: "Not wired: needs a Cloudflare API token with Account Analytics: Read, and the app holds none (Plan limits, admin-observability.md)",
    },
  },
  // ── Resend (Free) ──
  {
    id: "resend_month",
    vendor: "resend",
    label: "Mail a month",
    limit: 3_000,
    measure: "count",
    shape: "month",
    per: "a month (UTC)",
    source:
      "Resend's own list of sent mail, every sender (sign-in codes included), counted from the 1st",
    past: "Past it Resend stops sending: the sign-in codes and these alerts with it.",
  },
  // A launch switch with the spend watch's own: Resend Pro has no daily cap, so `RESEND_DAILY_QUOTA` goes null there
  // and this meter goes with it (the month's limit, above, is the Pro cutover's other edit).
  ...(RESEND_DAILY_QUOTA === null
    ? []
    : [
        {
          id: "resend_day" as const,
          vendor: "resend" as const,
          label: "Mail a day",
          limit: RESEND_DAILY_QUOTA,
          measure: "count" as const,
          shape: "day" as const,
          per: "a UTC day",
          source:
            "Resend's own list of sent mail: the busiest UTC day of the past week",
          past: "Past it Resend stops sending until midnight UTC: the sign-in codes and these alerts with it.",
        },
      ]),
];

/**
 * LIMITS THE BRIEF NAMED THAT ARE NOT METERS, AND WHY: the card says so, so an absence is never read as calm.
 */
export const NOT_WATCHED: readonly { label: string; why: string }[] = [
  {
    label: "Vercel ISR Reads",
    why: "Vercel lists no Hobby allowance for it (its docs, read 2026-10-04) and the usage API's data_cache answers no rows",
  },
];

export function meterById(id: string): MeterDef | undefined {
  return METERS.find((m) => m.id === id);
}
