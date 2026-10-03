import {
  PricingSheet,
  type PricingPlanFacts,
} from "@/components/app/pricing/pricing-sheet";
import { StorageList } from "@/components/app/storage/storage-list";

/**
 * THE OVER-CAP GRACE BANNER: the dashboard's own red alert, never inside the ring (dashboard.md), because
 * its deadline costs her media. It names two ways out, and each is a door: Upgrade (the plans, opened on how
 * full she is) and remove media.
 *
 * ★ "LARGEST FILES FIRST" HAS A DOOR (crumbs-32, from `storage-wiring`): it said what the sweep will take
 * with no way to see it. Remove opens the size list, largest first, counting down to her own plan's cap (the
 * meter's number; the list's `fit` goal), so she chooses what goes before the sweep chooses for her.
 */
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
  return (
    <div
      data-grace-banner=""
      className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm"
    >
      <p className="font-medium text-foreground">
        You&rsquo;re over your storage limit
      </p>
      <p className="mt-1 text-muted-foreground">
        Upgrade or remove media by{" "}
        <strong className="text-foreground">{deadline}</strong>. After that
        we&rsquo;ll automatically reduce your storage (largest files first).{" "}
        <PricingSheet
          trigger={{ kind: "room", needed: storageUsed }}
          plan={plan}
          returnTo="/dashboard"
        >
          <button
            type="button"
            className="font-medium text-foreground underline underline-offset-4"
          >
            See plans
          </button>
        </PricingSheet>{" "}
        or{" "}
        <StorageList
          back="Dashboard"
          goal={storageCap ? { kind: "fit", capBytes: storageCap } : null}
        >
          <button
            type="button"
            data-storage-door="grace"
            className="font-medium text-foreground underline underline-offset-4"
          >
            see what&rsquo;s using space
          </button>
        </StorageList>
        .
      </p>
    </div>
  );
}
