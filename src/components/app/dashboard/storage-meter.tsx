"use client";

import { CheckoutButton } from "@/components/app/checkout-button";
import { ManageBillingButton } from "@/components/app/manage-billing-button";
import { PricingSheet } from "@/components/app/pricing/pricing-sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DEFAULT_TIER,
  friendlyCapacity,
  toBillingTier,
} from "@/lib/constants/tiers";
import { cn, formatBytes } from "@/lib/utils";

/**
 * The AMBIENT storage meter (Phase 5 S2b, the ratified hybrid): demotes the old
 * in-your-face storage card to a slim header bar — polished + visible to
 * incentivize the upgrade when it matters, never a hero block. The whole row is
 * a popover trigger; every datum the old card showed (friendly capacity, Event
 * Pass expiry, standby/Trash overflow, the billing buttons) lives in the popover,
 * so nothing is lost, just the chrome is demoted. The high-urgency over-limit
 * grace banner stays its own top-level alert on the page (never hidden here).
 * The page renders this only for a host with 1+ created events (hosting telemetry).
 */
export function StorageMeter({
  storageUsed,
  storageCap,
  storagePct,
  standbyBytes,
  overBudget,
  passExpiry,
  planName,
  hasBilling,
  isEventPass,
  tier,
}: {
  storageUsed: number;
  storageCap: number | null;
  storagePct: number;
  standbyBytes: number;
  overBudget: boolean;
  passExpiry: string | null;
  planName: string;
  hasBilling: boolean;
  isEventPass: boolean;
  /**
   * The host's tier, server-derived (`profiles.tier` through the dashboard's
   * RLS-scoped read). Optional so the lab's fixtures keep compiling; it only
   * ever decides which sentence the pricing sheet leads with.
   */
  tier?: string;
}) {
  // Amber only when it MATTERS (near the cap, or over the recovery budget); else
  // quiet neutral telemetry.
  const warning = overBudget || storagePct >= 85;
  const usedLabel = formatBytes(storageUsed);
  const capLabel = storageCap ? formatBytes(storageCap) : null;
  const capacity = storageCap ? friendlyCapacity(storageCap) : null;
  const billingTier = toBillingTier(tier ?? DEFAULT_TIER);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Storage: ${usedLabel}${capLabel ? ` of ${capLabel}` : ""} used. View details.`}
          className="flex w-full items-center gap-3 rounded-lg px-1.5 py-1 text-left outline-none transition-[transform,background-color] duration-150 ease-emphasis hover:bg-muted/40 active:scale-[0.995] focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            Storage
          </span>
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <span
              className={cn(
                "block h-full rounded-full",
                warning ? "bg-warning" : "bg-foreground/70",
              )}
              style={{ width: `${storagePct}%` }}
            />
          </span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {usedLabel}
            {capLabel ? ` / ${capLabel}` : ""}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-2.5">
        <div>
          <p className="text-sm font-medium">
            {usedLabel}
            {capLabel ? ` of ${capLabel}` : " used"}
          </p>
          {passExpiry && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Event Pass · expires {passExpiry}
            </p>
          )}
        </div>
        {capacity && (
          <p className="text-xs text-muted-foreground">
            Your {planName} plan holds about{" "}
            {capacity.photos.toLocaleString()} photos or{" "}
            {capacity.videoMinutes.toLocaleString()} min of video.{" "}
            {/* "Need more?" used to LEAVE the app for a static, tier-blind
                page. It opens the sheet on `room` now (`first=trigger`), which
                is the one door here that already knows how full the host is.
                For a Pro host the same sheet is the six prices with theirs
                marked, smaller sizes included, so the door says what it does
                (the storage guard, billing-caps.md): every switch there is
                checked against what they store. */}
            <PricingSheet
              trigger={{ kind: "room", needed: storageUsed }}
              plan={{ tier: billingTier, hasBilling, passExpiry }}
              returnTo="/dashboard"
            >
              <button
                type="button"
                className="font-medium text-foreground underline underline-offset-4"
              >
                {billingTier === "pro" ? "Change plan" : "Need more?"}
              </button>
            </PricingSheet>
          </p>
        )}
        {standbyBytes > 0 && (
          <p className="text-xs text-muted-foreground">
            {`+ ${formatBytes(standbyBytes)} in Deleted (frees automatically).` +
              (overBudget
                ? " Oldest items are removed early to stay within your plan's recovery limit."
                : "")}
          </p>
        )}
        {(hasBilling || isEventPass) && (
          <div className="flex flex-wrap gap-2 border-t border-border pt-2.5">
            {isEventPass && (
              <CheckoutButton planId="event_pass" renewal variant="outline">
                Renew Event Pass
              </CheckoutButton>
            )}
            {hasBilling && <ManageBillingButton />}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
