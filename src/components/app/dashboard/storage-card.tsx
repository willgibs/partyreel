import Link from "next/link";

import { CheckoutButton } from "@/components/app/checkout-button";
import { ManageBillingButton } from "@/components/app/manage-billing-button";
import { Progress } from "@/components/ui/progress";
import {
  type Tier,
  effectiveStorageCap,
  friendlyCapacity,
} from "@/lib/constants/tiers";
import type { ProfileRow } from "@/lib/db/queries/profile";
import { getHostStorageSummary } from "@/lib/db/queries/storage";
import { overStandbyBudget } from "@/lib/lifecycle/recently-deleted";
import { formatBytes } from "@/lib/utils";

/**
 * The dashboard's storage gauge as a STREAMED boundary (Phase 5 S1): the media
 * aggregate query lives here so it never blocks the shell. Profile/tier arrive
 * from the page (already awaited for the welcome gate) - only the byte math
 * waits. Content + meaning unchanged from the pre-decomposition card.
 */
export async function StorageCard({
  profile,
  tier,
  planName,
}: {
  profile: ProfileRow | null;
  tier: Tier;
  planName: string;
}) {
  const storage = await getHostStorageSummary();

  const storageCap = effectiveStorageCap(
    tier,
    profile?.storage_cap_bytes ?? null,
  );
  // The meter shows ACTIVE bytes (non-removed media in non-deleted events) — what the cap is
  // enforced against since Recovery Phase 1, so deleting visibly frees room. (The physical
  // storage_used_bytes counter only drops at hard-purge and no longer gates uploads.)
  const storageUsed = storage.activeBytes;
  const standbyBytes = storage.standbyBytes;
  const overBudget = overStandbyBudget(standbyBytes, storageCap);
  const storagePct =
    storageCap && storageCap > 0
      ? Math.min(100, Math.round((storageUsed / storageCap) * 100))
      : 0;
  // Only hosts who've been through checkout have a Stripe customer to manage.
  const hasBilling = Boolean(profile?.stripe_customer_id);
  // Event Pass holders see when their pass lapses (then it downgrades to Free).
  const passExpiry =
    tier === "event_pass" && profile?.tier_expires_at
      ? new Date(profile.tier_expires_at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null;

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium">Storage</span>
        <span className="text-muted-foreground">
          {formatBytes(storageUsed)}
          {storageCap ? ` of ${formatBytes(storageCap)}` : " used"}
        </span>
      </div>
      {passExpiry && (
        <p className="mt-1 text-xs text-muted-foreground">
          Event Pass · expires {passExpiry}
        </p>
      )}
      {storageCap && (
        <>
          <Progress value={storagePct} className="mt-2" />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Your {planName} plan holds about{" "}
            {friendlyCapacity(storageCap).photos.toLocaleString()} photos or{" "}
            {friendlyCapacity(storageCap).videoMinutes.toLocaleString()} min of
            video.{" "}
            <Link
              href="/pricing"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Need more?
            </Link>
          </p>
        </>
      )}
      {standbyBytes > 0 && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {`+ ${formatBytes(standbyBytes)} in Trash (frees automatically).` +
            (overBudget
              ? " Oldest items are removed early to stay within your plan's recovery limit."
              : "")}
        </p>
      )}
      {(hasBilling || tier === "event_pass") && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          {tier === "event_pass" && (
            <CheckoutButton planId="event_pass" renewal variant="outline">
              Renew Event Pass
            </CheckoutButton>
          )}
          {hasBilling && <ManageBillingButton />}
        </div>
      )}
    </div>
  );
}
