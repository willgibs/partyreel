"use client";

import { CheckoutButton } from "@/components/app/checkout-button";
import { ManageBillingButton } from "@/components/app/manage-billing-button";
import { PricingSheet } from "@/components/app/pricing/pricing-sheet";
import { StorageList } from "@/components/app/storage/storage-list";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatBytesUp } from "@/lib/billing/storage-guard";
import {
  DEFAULT_TIER,
  formatCapacity,
  toBillingTier,
  videosAllowedForTier,
} from "@/lib/constants/tiers";
import { cn, formatBytes } from "@/lib/utils";

/** The ring's radius in its 18px box, and its circumference: what the arc is measured against. */
const RING_R = 7;
const RING_C = 2 * Math.PI * RING_R;

/**
 * THE STORAGE RING (host-dashboard r1, the carried `head` call: "the day, then the storage ring and New
 * event in one slim row; the Dashboard title and the full-width storage line go"). The plan's shelf as
 * one 18px ring and its percent, beside New event; amber from the dashboard's own threshold, where it is
 * the storage step the old band used to say. The whole ring is the popover's trigger, and the popover is
 * the meter's, unchanged: every datum the old card showed (friendly capacity, Event Pass expiry,
 * standby in Deleted, the billing buttons) lives there, so nothing is lost, just the chrome is demoted.
 * The over-limit grace banner stays its own top-level alert on the page (never hidden here).
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
  // ★ THE STORAGE FLOW'S ONE ROUNDING (`formatBytesUp`): what she stores reads
  // here exactly as the plan's refusal and the size list will read it, so
  // 110.83 GB is 110.9 GB on every screen between this bar and a switch. A cap
  // is a plan's size, exact either way.
  const usedLabel = formatBytesUp(storageUsed);
  const capLabel = storageCap ? formatBytes(storageCap) : null;
  const billingTier = toBillingTier(tier ?? DEFAULT_TIER);
  // The shared estimate, with its camera (host-storage r2), and with video only where the plan
  // takes it: "or 2 min of video" on a photos-only Free plan was a promise it cannot keep.
  const capacity = storageCap
    ? formatCapacity(storageCap, { video: videosAllowedForTier(billingTier) })
    : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-storage-ring={storagePct}
          aria-label={`Storage: ${usedLabel}${capLabel ? ` of ${capLabel}` : ""} used. View details.`}
          className={cn(
            "flex h-8 shrink-0 items-center gap-2 rounded-full px-2.5 text-xs tabular-nums transition-[transform,background-color] duration-150 ease-emphasis outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.97] motion-reduce:active:scale-100",
            warning ? "text-warning" : "text-muted-foreground",
          )}
        >
          <svg
            viewBox="0 0 18 18"
            className="size-[18px] -rotate-90"
            aria-hidden
          >
            <circle
              cx="9"
              cy="9"
              r={RING_R}
              fill="none"
              strokeWidth="2.5"
              className="stroke-foreground/12"
            />
            <circle
              cx="9"
              cy="9"
              r={RING_R}
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              // A sliver even at nothing used, so the ring reads as a meter rather than a hole.
              strokeDasharray={`${(Math.max(storagePct, 2) / 100) * RING_C} ${RING_C}`}
              className={warning ? "stroke-warning" : "stroke-foreground/70"}
            />
          </svg>
          {`${storagePct}%`}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-2.5">
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
          {/* THE SIZE LIST'S DOOR (host-storage r1): everything she stores,
              largest first, to see what is filling the plan and remove it
              from one place (`popups`' `lists=panel`: a side panel at a desk,
              its own screen in a hand whose Back returns to the dashboard).
              Over her cap, it counts down to it, as the grace banner's does. */}
          {storageUsed > 0 ? (
            <StorageList
              back="Dashboard"
              goal={
                storageCap && storageUsed > storageCap
                  ? { kind: "fit", capBytes: storageCap }
                  : null
              }
            >
              <button
                type="button"
                data-storage-door=""
                className="mt-1 block text-left text-xs font-medium text-foreground underline underline-offset-4"
              >
                See what&rsquo;s using space
              </button>
            </StorageList>
          ) : null}
        </div>
        {capacity && (
          <p className="text-xs text-muted-foreground">
            Your {planName} plan holds about {capacity}.{" "}
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
