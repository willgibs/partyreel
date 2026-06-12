"use client";

import { use } from "react";
import Link from "next/link";

import { CheckoutButton } from "@/components/app/checkout-button";
import { ManageBillingButton } from "@/components/app/manage-billing-button";
import { Progress } from "@/components/ui/progress";
import { friendlyCapacity } from "@/lib/constants/tiers";
import type { getHostStorageSummary } from "@/lib/db/queries/storage";
import { overStandbyBudget } from "@/lib/lifecycle/recently-deleted";
import { formatBytes } from "@/lib/utils";

type StorageSummary = Awaited<ReturnType<typeof getHostStorageSummary>>;

/**
 * The storage gauge as a use()-client section (Phase 5 S1 redo): only the
 * media-aggregate query streams; everything profile-derived (cap, plan name,
 * pass expiry, billing flags) is precomputed SERVER-side in the page and
 * passed as plain props (locale-formatted dates must not re-format on the
 * client - hydration mismatch risk). Content unchanged from the old card.
 */
export function StorageCard({
  promise,
  storageCap,
  planName,
  passExpiry,
  hasBilling,
  isEventPass,
}: {
  promise: Promise<StorageSummary>;
  storageCap: number | null;
  planName: string;
  passExpiry: string | null;
  hasBilling: boolean;
  isEventPass: boolean;
}) {
  const storage = use(promise);

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
      {(hasBilling || isEventPass) && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          {isEventPass && (
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
