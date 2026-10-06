"use client";

import { useState } from "react";

import { CheckoutButton } from "@/components/app/checkout-button";
import { ManageBillingButton } from "@/components/app/manage-billing-button";
import { PricingSheet } from "@/components/app/pricing/pricing-sheet";
import { usePlanFacts } from "@/components/app/pricing/use-plan-facts";
import { StorageChart } from "@/components/app/storage/storage-chart";
import {
  formatStored,
  readStorage,
  readUploads,
  uploadsLine,
  uploadsPausedWords,
  type UploadsReading,
} from "@/components/app/storage/storage-figures";
import { StorageList } from "@/components/app/storage/storage-list";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
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
 * one 18px ring and its percent, beside New event. The whole ring is the popover's trigger, and the
 * popover is the storage chart's home (trash-in-storage: her albums and her Deleted drawn apart against
 * the cap, her setting and Empty Deleted beside them), then the size list's door, the plan and billing.
 * The over-limit grace banner stays its own top-level alert on the page (never hidden here).
 *
 * ★ THE RING IS WHAT THE PLAN HOLDS, AMBER WHEN IT MATTERS (`readStorage`): its percent is everything she
 * stores against the cap, her Deleted included, and it turns amber only when what an upload must fit
 * beside nears the cap, so a full Deleted that would make room on its own never reads as trouble.
 *
 * ★ THE UPLOADS LINE IS THE OTHER COUNTER, READ WHEN THE POPOVER OPENS (uploads-meter-ui): this month's uploads
 * against her plan's own allowance, so Free's 300 MB a month is never a surprise. It rides the plan sheet's read
 * (`usePlanFacts`, `/api/stripe/plan-facts`), asked only while the popover is open: never on the page's load,
 * never a poll (the compute budget counts every call). It says nothing rather than guess (`readUploads`: a read
 * that failed, a pass, an unmetered Pro) and never a zero, and the ring stays storage's alone.
 */
export function StorageMeter({
  activeBytes,
  deletedBytes,
  storageCap,
  makeRoom,
  passExpiry,
  planName,
  hasBilling,
  isEventPass,
  tier,
}: {
  /** Her albums, server-derived (`host_storage_summary`). */
  activeBytes: number;
  /** Her Deleted, which her plan holds too. */
  deletedBytes: number;
  storageCap: number | null;
  /** Her setting, Make room from Deleted. */
  makeRoom: boolean;
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
  const reading = readStorage({
    activeBytes,
    deletedBytes,
    capBytes: storageCap,
    makeRoom,
  });
  const stored = reading.storedBytes;
  const warning = reading.warning || reading.over;
  // ★ THE STORAGE FLOW'S ONE ROUNDING (`formatBytesUp`, through `formatStored`):
  // what she stores reads here exactly as the plan's refusal and the size list
  // will read it. A cap is a plan's size, exact either way.
  const capLabel = storageCap ? formatBytes(storageCap) : null;
  const usedLabel = formatStored(stored, capLabel);
  const billingTier = toBillingTier(tier ?? DEFAULT_TIER);
  // The shared estimate, with its camera (host-storage r2), and with video only where the plan
  // takes it: "or 2 min of video" on a photos-only Free plan was a promise it cannot keep.
  const capacity = storageCap
    ? formatCapacity(storageCap, { video: videosAllowedForTier(billingTier) })
    : null;

  // The popover's open is the only moment the uploads figure is read (`usePlanFacts` asks nothing while it is closed),
  // and what it read stays for the next open, so a second look is instant and refreshes behind it.
  const [open, setOpen] = useState(false);
  const { facts, settled, readAt } = usePlanFacts(open);
  // The line is drawn from the read alone (its plan and its figure came together); the props only say whether to hold
  // its place while the read is out: a plan that meters uploads by the month, whatever the figure turns out to be.
  const uploads = facts
    ? readUploads({
        tier: facts.tier,
        capBytes: facts.capBytes,
        monthUploadedBytes: facts.monthUploadedBytes,
      })
    : null;
  const waiting =
    !facts &&
    !settled &&
    readUploads({
      tier: billingTier,
      capBytes: storageCap,
      monthUploadedBytes: 0,
    }) !== null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-storage-ring={reading.ringPct}
          aria-label={`Storage: ${usedLabel}${capLabel ? ` of ${capLabel}` : ""} used. View details.`}
          className={cn(
            "flex h-8 shrink-0 items-center gap-2 rounded-full px-2.5 text-xs tabular-nums transition-[transform,background-color] duration-150 ease-emphasis outline-none hover:bg-muted focus-halo active:scale-[0.97] motion-reduce:active:scale-100",
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
              strokeDasharray={`${(Math.max(reading.ringPct, 2) / 100) * RING_C} ${RING_C}`}
              className={warning ? "stroke-warning" : "stroke-foreground/70"}
            />
          </svg>
          {`${reading.ringPct}%`}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3">
        {passExpiry && (
          <p className="text-xs text-muted-foreground">
            Event Pass · expires {passExpiry}
          </p>
        )}
        <StorageChart
          activeBytes={activeBytes}
          deletedBytes={deletedBytes}
          capBytes={storageCap}
          makeRoom={makeRoom}
          door={
            <>
              <UploadsLine
                reading={uploads}
                waiting={waiting}
                readAt={readAt}
              />
              {/* THE SIZE LIST'S DOOR (host-storage r1): everything she stores,
                  largest first, to see what is filling the plan and delete it for
                  good from one place (`popups`' `lists=panel`: a side panel at a
                  desk, its own screen in a hand whose Back returns to the
                  dashboard). Over her cap, it counts down to it, as the grace
                  banner's does. */}
              {stored > 0 ? (
                <StorageList
                  back="Dashboard"
                  goal={
                    storageCap && stored > storageCap
                      ? { kind: "fit", capBytes: storageCap }
                      : null
                  }
                >
                  <button
                    type="button"
                    data-storage-door=""
                    className="block text-left text-xs font-medium text-foreground underline underline-offset-4"
                  >
                    See what&rsquo;s using space
                  </button>
                </StorageList>
              ) : null}
            </>
          }
        />
        {capacity && (
          <p className="border-t border-border pt-3 text-xs text-muted-foreground">
            Your {planName} plan holds about {capacity}.{" "}
            {/* "Need more?" used to LEAVE the app for a static, tier-blind
                page. It opens the sheet on `room` now (`first=trigger`), which
                is the one door here that already knows how full the host is.
                For a Pro host the same sheet is the six prices with theirs
                marked, smaller sizes included, so the door says what it does
                (the storage guard, billing-caps.md): every switch there is
                checked against what they store. */}
            <PricingSheet
              trigger={{ kind: "room", needed: stored }}
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

/**
 * THE UPLOADS LINE, one quiet line under her storage figures: "Uploads this month: 240 MB of 300 MB". At or past the
 * allowance it takes the warning tone and says what pauses and when it resumes (`uploadsPausedWords`). While the read
 * is out, a plan that meters uploads holds the line's place with the breathing placeholder, so what sits below it
 * does not jump when the figure lands; a read that comes back empty takes the place away (never a zero), and a plan
 * that does not meter by the month (a pass, an unmetered Pro) never draws one.
 */
function UploadsLine({
  reading,
  waiting,
  readAt,
}: {
  reading: UploadsReading | null;
  waiting: boolean;
  /** When the figure was read: the month the pause's resume day is counted from. */
  readAt: Date | null;
}) {
  if (!reading && !waiting) return null;
  return (
    <div
      data-uploads={reading ? "" : "waiting"}
      data-paused={reading?.paused ? "" : undefined}
      aria-live="polite"
      aria-busy={waiting || undefined}
      // One text line tall either way (the placeholder sits centred in it), so the figure replaces it without a jump.
      className="flex min-h-4 flex-col justify-center"
    >
      {reading ? (
        <>
          <p
            className={cn(
              "text-xs tabular-nums",
              reading.paused ? "text-warning" : "text-muted-foreground",
            )}
          >
            {uploadsLine(reading)}
          </p>
          {reading.paused ? (
            <p className="mt-1 text-xs text-pretty text-muted-foreground">
              {uploadsPausedWords(readAt ?? undefined)}
            </p>
          ) : null}
        </>
      ) : (
        <Skeleton aria-hidden className="h-3 w-44" />
      )}
    </div>
  );
}
