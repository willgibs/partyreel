/**
 * THE STORAGE GUARD: no plan change leaves a host storing more than the new cap.
 *
 * Will, 2026-09-22: "when a user with multiple event passes attempts to purchase a
 * pro plan with less storage than their current active storage total, we should
 * show them their total storage used now and ask them to delete media to get under
 * the storage cap of their selected pro plan before being able to switch ... This
 * eliminates our need to remove any of their media or cover excess storage costs
 * ourselves." And: "Downgrading pro plan should follow event pass with checking the
 * storage and ensuring it fits. Cancellation as normal."
 *
 * So ONE rule, for every purchase that REPLACES the cap (any Pro checkout, any
 * Pro-to-Pro size or interval change), and never for an Event Pass, which only
 * ever ADDS room because passes stack. The checkout route and the change-plan
 * route both call `checkPlanChange`; the plan sheet calls the same functions to
 * open on a size that fits, so the sheet and the refusal cannot disagree.
 *
 * ★ THE PLAIN CAP, NEVER THE WRITE HEADROOM. `create_media` accepts uploads up to
 * the cap plus 10% (`capWithWriteHeadroom`) so a guest mid-upload is not cut off
 * at the line; that slack is a courtesy at write time, not room a host may BUY
 * into. A host storing 105 GB does not fit Pro 100 GB.
 *
 * ★ THE BYTES ARE ACTIVE BYTES, read by the caller through `getHostStorageSummary`
 * (the same definition as the SQL `host_active_bytes()`), never re-derived here.
 * A Remove frees room at once, which is what makes "remove 40 GB first" an
 * instruction a host can follow in a minute.
 *
 * Pure and client-safe: no env, no SDK, no DB, only `tiers.ts` and a formatter.
 */
import {
  plansForTier,
  withinStorage,
  type Plan,
  type PlanId,
} from "@/lib/constants/tiers";
import { formatBytes } from "@/lib/utils";

/**
 * Does buying this plan REPLACE the host's cap? A Pro subscription does (any size,
 * either cadence): its cap becomes the whole allowance, and moving to it consumes
 * every live pass as credit. An Event Pass never does: it stacks another 75 GB on
 * top, so it can only ever make room, which is why a pass is never refused.
 */
export function replacesCap(plan: Plan): boolean {
  return plan.tier === "pro";
}

/** Whether a plan's PLAIN cap holds what the host stores (at the line counts as fitting). */
export function planHolds(plan: Plan, storedBytes: number): boolean {
  return withinStorage(storedBytes, plan.storageBytes);
}

/** The Pro sizes at one cadence whose plain cap holds `storedBytes`, smallest first. */
export function fittingProPlans(
  storedBytes: number,
  interval: "month" | "year" = "month",
): Plan[] {
  return plansForTier("pro", interval)
    .filter((plan) => planHolds(plan, storedBytes))
    .sort((a, b) => a.storageBytes - b.storageBytes);
}

/**
 * A refusal, with the numbers (the brief: stored, the target's cap, the gap, and
 * the sizes that fit). `fits` stays at the cadence the host chose, so a host who
 * picked yearly is offered the yearly size that fits rather than being moved to
 * monthly by the sentence meant to help them. `message` is the plain sentence both
 * routes send and every surface may print as-is.
 */
export type StorageRefusal = {
  code: "over_new_cap";
  planId: PlanId;
  storedBytes: number;
  capBytes: number;
  gapBytes: number;
  fits: PlanId[];
  message: string;
};

export type PlanChangeCheck =
  | { ok: true }
  | { ok: false; refusal: StorageRefusal };

/**
 * THE CHECK. `storedBytes` is the host's ACTIVE bytes; `target` the plan being
 * bought or switched to. Tier-blind by design: a Free host in the over-cap grace
 * (a lapsed Pro still holding 140 GB) meets exactly the same line as a pass holder
 * or a Pro host shrinking, because what they store is the only fact that matters.
 */
export function checkPlanChange(
  storedBytes: number,
  target: Plan,
): PlanChangeCheck {
  if (!replacesCap(target) || planHolds(target, storedBytes)) {
    return { ok: true };
  }
  const fits = fittingProPlans(storedBytes, target.interval ?? "month");
  return {
    ok: false,
    refusal: {
      code: "over_new_cap",
      planId: target.id,
      storedBytes,
      capBytes: target.storageBytes,
      gapBytes: storedBytes - target.storageBytes,
      fits: fits.map((plan) => plan.id),
      message: refusalSentence(storedBytes, target, fits[0] ?? null),
    },
  };
}

/**
 * "You're storing 140 GB. Pro 100 GB holds 100 GB, so remove 40 GB first, or
 * choose Pro 500 GB." (the brief's own words for the plain face). The size named
 * is the SMALLEST that fits, never a bigger one, and when nothing fits the
 * sentence stops at what to remove rather than inventing a plan.
 */
export function refusalSentence(
  storedBytes: number,
  target: Plan,
  fit: Plan | null,
): string {
  const head = `You're storing ${formatBytesUp(storedBytes)}. ${target.name} holds ${formatBytes(target.storageBytes)}, so remove ${formatBytesUp(storedBytes - target.storageBytes)} first`;
  return fit ? `${head}, or choose ${fit.name}.` : `${head}.`;
}

/**
 * `formatBytes`, rounded UP at the one decimal it prints. WHY: the stored figure
 * and the gap are instructions. `formatBytes` rounds to nearest, so a host 40.04 GB
 * over would read "remove 40 GB", do exactly that, and be refused again; and one
 * storing 100.02 GB against a 100 GB cap would read "storing 100 GB" beside a
 * refusal. Rounding up keeps both numbers sufficient. The epsilon stops float noise
 * on an exact value (140 GB) from ticking it up to 140.1.
 */
export function formatBytesUp(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = Math.ceil((bytes / 1024 ** i) * 10 - 1e-9) / 10;
  return `${Number.isInteger(value) ? value : value.toFixed(1)} ${units[i]}`;
}

/**
 * Reads a refusal back out of a route's JSON (client side). The routes are ours,
 * but a proxy, an HTML error page or a future shape change must degrade to the
 * plain message path rather than render `undefined GB`, so every number is
 * checked before a surface is allowed to print it.
 */
export function parseStorageRefusal(data: unknown): StorageRefusal | null {
  if (!data || typeof data !== "object") return null;
  const r = data as Record<string, unknown>;
  if (r.code !== "over_new_cap") return null;
  const numbers = [r.storedBytes, r.capBytes, r.gapBytes];
  if (!numbers.every((n) => typeof n === "number" && Number.isFinite(n))) {
    return null;
  }
  if (typeof r.planId !== "string" || typeof r.message !== "string") {
    return null;
  }
  const fits = Array.isArray(r.fits)
    ? r.fits.filter((id): id is PlanId => typeof id === "string")
    : [];
  return {
    code: "over_new_cap",
    planId: r.planId as PlanId,
    storedBytes: r.storedBytes as number,
    capBytes: r.capBytes as number,
    gapBytes: r.gapBytes as number,
    fits,
    message: r.message,
  };
}
