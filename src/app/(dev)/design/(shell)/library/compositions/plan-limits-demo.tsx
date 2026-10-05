import { PlanLimitsCard } from "@/app/admin/jobs/limits-card";
import type { Level, StoredLimits, StoredMeter } from "@/lib/jobs/limits-watch";
import { METERS, type MeterId } from "@/lib/jobs/limits-watch-limits";

/**
 * THE PLAN LIMITS' CARD, THE REAL ONE, OVER RUNS WRITTEN BY HAND (`limits-card.tsx`; admin-observability.md, "Plan
 * limits"). /admin/jobs cannot be opened on localhost (the portal needs an operator's session), and the card is
 * presentation only: the page reads the spend watch's last run and hands it down, so a run written here is the page's
 * own input and nothing is faked past it. Every run is built from `METERS`, so a meter added to
 * `limits-watch-limits.ts` appears on every card by itself, and `NOW` is the page's one `nowMs`, so staleness never
 * drifts with the clock.
 *
 * ★ FOUR CARDS ON ONE PAGE REPEAT ITS DOM IDS (`#plan-limits`, `#limit-<meter>`, `#limits-<vendor>`): harmless in a
 * catalog (the headings they label read the same) and never in the portal, which draws one. Its vendor headings are
 * h3s with ids, which the shell's "On this page" would list as if they were sections of the entry, so each card
 * stands in a `data-toc-skip` (the scan's own way out).
 */

export type PlanLimitsState =
  | "healthy"
  | "critical"
  | "failed"
  | "gaps"
  | "never"
  | "unreadable";

const AT = Date.parse("2026-10-04T05:00:00.000Z");
const NOW = AT + 60 * 60 * 1000;

type Meters = Partial<Record<MeterId, StoredMeter>>;

/** A meter read: a share of its limit, climbing steadily unless told otherwise. */
function read(
  share: number,
  used: number,
  level: Level = "ok",
  extra: Partial<Extract<StoredMeter, { state: "read" }>> = {},
): StoredMeter {
  return {
    state: "read",
    used,
    share,
    level,
    rate: Math.round(used / 30),
    daysLeft: null,
    atLeast: false,
    ...extra,
  };
}

/**
 * A run that read every meter, a few percent in. `gaps` leaves a gap where the watch has no reader (a credential the
 * app does not hold, an API that reports none), saying what the meter's own definition says, as production does;
 * `over` replaces some meters.
 */
function run(over: Meters = {}, gaps = false): StoredLimits {
  const meters: Meters = {};
  for (const def of METERS) {
    meters[def.id] =
      gaps && def.gap
        ? { state: "none", cause: def.gap.cause, why: def.gap.why }
        : read(0.05, Math.round(def.limit * 0.05));
  }
  return { atMs: AT, meters: { ...meters, ...over } };
}

/** One refusal reads all four Vercel meters, as the reader fails them together (`readVercelUsage`). */
const VERCEL_REFUSED = Object.fromEntries(
  METERS.filter((m) => m.vendor === "vercel" && !m.gap).map((m) => [
    m.id,
    {
      state: "none",
      cause: "failed",
      why: "Vercel refused the token (HTTP 403): mint a new VERCEL_USAGE_TOKEN",
    },
  ]),
) as Meters;

const RUNS: Record<PlanLimitsState, StoredLimits | null> = {
  healthy: run(),
  critical: run({
    vercel_active_cpu: read(0.98, 14_110, "critical", {
      rate: 1_067,
      daysLeft: 0.28,
    }),
    vercel_cdn_requests: read(0.74, 741_697, "warn", {
      rate: 24_257,
      daysLeft: 10.6,
    }),
    r2_storage: read(0.087, 870_000_000, "ok", { atLeast: true, rate: null }),
  }),
  failed: run(VERCEL_REFUSED),
  gaps: run({}, true),
  never: null,
  unreadable: null,
};

export function PlanLimitsDemo({ state }: { state: PlanLimitsState }) {
  const limits = RUNS[state];
  return (
    <div data-toc-skip="">
      <PlanLimitsCard
        latest={
          limits
            ? { limits, startedAt: new Date(AT).toISOString(), status: "ok" }
            : null
        }
        unreadable={
          state === "unreadable"
            ? "plan limits: its own history: connection reset"
            : null
        }
        nowMs={NOW}
      />
    </div>
  );
}
