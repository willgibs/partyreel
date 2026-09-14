import { Check } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { CheckoutButton } from "@/components/app/checkout-button";
import { PricePop } from "@/components/marketing/sections/home/price-pop";
import { Reveal } from "@/components/marketing/system/reveal";
import { trackAttrs } from "@/lib/analytics/events";
import {
  EVENT_PASS_RENEWAL_PRICE_LABEL,
  friendlyCapacity,
  MAX_REEL_SECONDS,
  planById,
} from "@/lib/constants/tiers";
import { OVER_CAP_GRACE_DAYS } from "@/lib/lifecycle/over-cap";
import { formatBytes } from "@/lib/utils";

/**
 * The one-time option, stretched under the pair (Will's brief: "a shorter but
 * full width third card beneath the side-by-side"). The dashed vertical rule is
 * the ticket stub read (the divider grammar: dashed = sub-division of one
 * thing), separating the identity half from the what-you-get half.
 *
 * Both ADR-0025 promises render here because both are TRUE in the product now:
 * passes stack, and unused pass time converts to prorated credit on Pro.
 */

function PassPoint({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2} />
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}

export function PassCard() {
  const pass = planById("event_pass");
  const cap = friendlyCapacity(pass.storageBytes);

  return (
    <Reveal className="mx-auto mt-5 max-w-4xl">
      <div
        data-mkt-reveal
        style={{ "--i": 0 } as CSSProperties}
        className="flex flex-col gap-6 rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 sm:p-7 lg:flex-row lg:items-stretch lg:gap-0"
      >
        {/* The identity stub. */}
        <div className="flex flex-col gap-2 lg:w-[38%] lg:pr-7">
          <h2 className="font-heading text-xl">{pass.name}</h2>
          <p className="text-sm text-pretty text-muted-foreground">
            One big event, paid once.
          </p>
          {/* The display face for money: Urbanist with tabular digits, the
              register every subject number on the site now shares; qualifiers
              drop small via PricePop. */}
          <div className="mt-3 font-heading text-4xl tabular-nums">
            <PricePop label={pass.priceLabel} />
          </div>
          <p className="text-xs text-muted-foreground/70">
            Covers its event for about a year. Keep it live longer for{" "}
            {EVENT_PASS_RENEWAL_PRICE_LABEL} a year.
          </p>
          <div className="mt-auto pt-5">
            <CheckoutButton
              planId="event_pass"
              {...trackAttrs("checkout_start", { plan: "event_pass" })}
              variant="outline"
              className="w-full lg:w-auto lg:px-8"
            >
              Buy a pass
            </CheckoutButton>
          </div>
        </div>

        {/* The ticket rule: dashed = one thing, two halves. */}
        <div className="hidden border-l border-dashed lg:block" aria-hidden />
        <div className="border-t border-dashed lg:hidden" aria-hidden />

        {/* The what-you-get half. */}
        <div className="flex flex-1 flex-col gap-4 lg:pl-7">
          <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            <PassPoint>
              {formatBytes(pass.storageBytes)} of storage: about{" "}
              {cap.photos.toLocaleString()} photos or{" "}
              {Math.round(cap.videoMinutes / 60)} hours of video
            </PassPoint>
            <PassPoint>Photos and video, like Pro</PassPoint>
            <PassPoint>
              {MAX_REEL_SECONDS.event_pass}-second reels, no watermark
            </PassPoint>
            <PassPoint>Password lock, custom link, your host page</PassPoint>
            <PassPoint>
              Passes stack: each one adds an event and{" "}
              {formatBytes(pass.storageBytes)}
            </PassPoint>
            <PassPoint>
              Go Pro later and unused pass time converts to credit, prorated to
              the day
            </PassPoint>
          </ul>
          <p className="mt-auto text-xs text-pretty text-muted-foreground/70">
            No subscription. When the year ends, renew for{" "}
            {EVENT_PASS_RENEWAL_PRICE_LABEL} or let it lapse: you drop back to
            Free with a {OVER_CAP_GRACE_DAYS}-day window to free up space or
            upgrade before anything moves toward the trash.
          </p>
        </div>
      </div>
    </Reveal>
  );
}
