import { TriangleAlert } from "lucide-react";

import {
  PricingSheet,
  type PricingPlanFacts,
} from "@/components/app/pricing/pricing-sheet";
import { StorageList } from "@/components/app/storage/storage-list";
import { Button } from "@/components/ui/button";
import { formatBytesUp } from "@/lib/billing/storage-guard";
import { PLANS, TIER_NAMES, type Tier } from "@/lib/constants/tiers";
import { formatBytes } from "@/lib/utils";

/**
 * THE OVER-CAP GRACE BANNER: the dashboard's own red alert, never inside the ring (dashboard.md), because
 * its deadline costs her media.
 *
 * ★ THE NUMBER, AND ONE KEY (host-moments r1, Will 2026-10-07, `banner=number`): it says how far over she is and
 * by when ("5.3 GB over Pro 50 GB", then "Free it by November 5"), and its one key, Free 5.3 GB, opens the size
 * list counting down that same number, with See plans beside it. One number, the banner's and the list's: the gap
 * to her plan's plain cap (what she stores, Deleted included, less the cap), rounded up as every figure she must
 * free is (`formatBytesUp`), so freeing exactly what it says is enough.
 *
 * ★ "LARGEST FILES FIRST" HAS A DOOR (crumbs-32, from `storage-wiring`): the size list opens largest first, Deleted
 * at its head, counting down to her own plan's cap (the list's `fit` goal), so she chooses what goes before the
 * sweep chooses for her. ★ AND SAYS THE SWEEP'S ORDER (trash-in-storage): Deleted counts in storage, so at the
 * deadline what she already deleted leaves for good first, and only then her largest files (lifecycle-recovery.md).
 *
 * ★ NOTHING OVER, NOTHING SAID: a grace stands until the next sweep reads her back under, so a host who has already
 * freed the room meets no banner telling her she is over; at the deadline the sweep takes nothing from an account
 * within its cap (what it judges, kept bytes, is never more than what she stores).
 */

/** Her plan as the banner names it: its name and the size she is over ("Pro 50 GB", "Free 100 MB"). */
export function planWithCap(tier: Tier, capBytes: number): string {
  return `${TIER_NAMES[tier]} ${formatBytes(capBytes)}`;
}

/** The banner's words for one account over its cap: the number, by when, and its key; null when it is not over. */
export function graceWords({
  storedBytes,
  capBytes,
  tier,
  deadline,
}: {
  storedBytes: number;
  capBytes: number;
  tier: Tier;
  deadline: string;
}): { title: string; line: string; free: string } | null {
  const over = storedBytes - capBytes;
  if (!(over > 0)) return null;
  const gap = formatBytesUp(over);
  // A bigger plan is offered only where one exists: a host on the largest size has the freeing alone.
  const canGrow = PLANS.some(
    (plan) => plan.tier === "pro" && plan.storageBytes > capBytes,
  );
  return {
    title: `${gap} over ${planWithCap(tier, capBytes)}`,
    line: `Free it by ${deadline}${canGrow ? ", or choose a bigger plan" : ""}. After that we'll make room for you: Deleted first, then your largest files.`,
    free: `Free ${gap}`,
  };
}

export function GraceBanner({
  deadline,
  storageUsed,
  storageCap,
  plan,
}: {
  /** The grace's last day, already in the viewer's zone. */
  deadline: string;
  storageUsed: number;
  /** Her plan's cap; null only for a plan with none, which no grace is ever opened on. */
  storageCap: number | null;
  plan: PricingPlanFacts;
}) {
  if (storageCap === null) return null;
  const words = graceWords({
    storedBytes: storageUsed,
    capBytes: storageCap,
    tier: plan.tier,
    deadline,
  });
  if (!words) return null;
  return (
    <div
      data-grace-banner=""
      className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm sm:flex-row sm:items-center"
    >
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-medium text-foreground tabular-nums">
          <TriangleAlert
            className="size-4 shrink-0 text-destructive"
            aria-hidden
          />
          {words.title}
        </p>
        <p className="mt-1 text-pretty text-muted-foreground">{words.line}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <StorageList
          back="Dashboard"
          goal={{
            kind: "fit",
            capBytes: storageCap,
            plan: planWithCap(plan.tier, storageCap),
          }}
        >
          <Button
            type="button"
            size="sm"
            data-storage-door="grace"
            className="tabular-nums"
          >
            {words.free}
          </Button>
        </StorageList>
        <PricingSheet
          trigger={{ kind: "room", needed: storageUsed }}
          plan={plan}
          returnTo="/dashboard"
        >
          <Button type="button" size="sm" variant="outline">
            See plans
          </Button>
        </PricingSheet>
      </div>
    </div>
  );
}
