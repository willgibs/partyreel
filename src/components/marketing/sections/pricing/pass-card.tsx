import { Check } from "lucide-react";
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { CheckoutButton } from "@/components/app/checkout-button";
import { PricePop } from "@/components/marketing/sections/home/price-pop";
import { StatRow } from "@/components/marketing/sections/pricing/plan-cards";
import { Reveal } from "@/components/marketing/system/reveal";
import { trackAttrs } from "@/lib/analytics/events";
import { marketingImage } from "@/lib/constants/marketing-media";
import {
  EVENT_PASS_RENEWAL_PRICE_LABEL,
  friendlyCapacity,
  MAX_REEL_SECONDS,
  planById,
} from "@/lib/constants/tiers";
import { OVER_CAP_GRACE_DAYS } from "@/lib/lifecycle/over-cap";
import { formatBytes } from "@/lib/utils";

/**
 * THE EVENT PASS, REDRAWN AS A TICKET (`pass=under` + `pair=pro` with his flip,
 * Will 2026-09-20): "Should get a redesign, but stay wide beneath", and "make
 * event pass feel more unique as its own option... make the Event Pass card
 * below more beautiful." It keeps its place under the pair and stops being the
 * pair's third column in a stretched suit.
 *
 * ★ A PHOTOGRAPH IS WHAT MAKES IT A TICKET. The pair carries small stacked
 * PRINTS above each head (the lying-on-paper read); the pass carries ONE frame
 * down its whole left edge, so it is the same family and unmistakably its own
 * object. It also costs the card nothing in height: the frame is the card's
 * height, never an added band, because the plans block above is already tall.
 * Bible 1 (media is the color) and 18 (a page argues in photographs) both land
 * on the same decision, and the picture is a real event, the thing one pass
 * covers.
 *
 * ★ THE PERFORATION IS PUNCHED, not drawn. The dashed stub rule was already
 * the divider grammar's "one thing, two halves"; a notch at each end is what
 * makes a reader read "ticket" rather than "dashed border". Each notch is a
 * disc in the PAGE colour sitting half outside the card, and the card's
 * `overflow-hidden` does the cutting: what survives is a hairline arc biting
 * into the edge with the card's own border interrupted around it. Under
 * Graphite the card and the page are the same white, so the notch is read by
 * its rim, which is exactly how a punched hole reads on paper.
 *
 * ★ THE STATS ARE THE PAIR'S INSTRUMENT (StatRow, imported rather than
 * re-typed): the pass's room now answers in the same hairline trio Free and Pro
 * answer in, and the bullet that spelled the same three numbers in a sentence
 * is gone. Five capability lines are left, which is what the right half is for.
 *
 * Both billing-caps.md promises render here because both are TRUE in the
 * product now: passes stack, and unused pass time converts to prorated credit
 * on Pro. Every number comes from tiers.ts.
 */

/** The frame: the one big event a pass covers. */
const PASS_IMAGE = "wedding-petals";

function PassPoint({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2} />
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}

/**
 * The stub rule and its two punched notches. Rendered twice (the row's
 * vertical rule from lg, the column's horizontal one below it) rather than
 * rotated: each posture needs its notches on a different pair of card edges,
 * and the element itself is what carries them there.
 */
function Perforation() {
  return (
    <>
      <div aria-hidden className="relative hidden shrink-0 lg:block">
        <div className="h-full border-l border-dashed" />
        <span className="absolute -top-2.5 left-1/2 size-5 -translate-x-1/2 rounded-full border bg-background" />
        <span className="absolute -bottom-2.5 left-1/2 size-5 -translate-x-1/2 rounded-full border bg-background" />
      </div>
      <div aria-hidden className="relative lg:hidden">
        <div className="border-t border-dashed" />
        <span className="absolute top-1/2 -left-2.5 size-5 -translate-y-1/2 rounded-full border bg-background" />
        <span className="absolute top-1/2 -right-2.5 size-5 -translate-y-1/2 rounded-full border bg-background" />
      </div>
    </>
  );
}

export function PassCard() {
  const pass = planById("event_pass");
  const cap = friendlyCapacity(pass.storageBytes);
  const frame = marketingImage(PASS_IMAGE);

  return (
    <Reveal className="mx-auto mt-5 max-w-4xl">
      <div
        data-mkt-reveal
        style={{ "--i": 0 } as CSSProperties}
        className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card ring-1 ring-foreground/5 lg:flex-row lg:items-stretch"
      >
        {/* The frame. aria-hidden by omission: the alt is empty because the
            picture is identity, and every word of the offer is beside it. */}
        <div className="relative h-44 w-full shrink-0 sm:h-52 lg:h-auto lg:w-60">
          <Image
            src={frame.src}
            alt=""
            fill
            sizes="(min-width: 1024px) 15rem, 100vw"
            className="object-cover transition-transform duration-300 ease-emphasis group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        </div>

        {/* The stub: who it is for, what it costs, what it holds. */}
        <div className="flex flex-col gap-2 p-6 sm:p-7 lg:w-72 lg:shrink-0">
          <h2 className="font-heading text-subsection">{pass.name}</h2>
          <p className="text-sm text-pretty text-muted-foreground">
            One big event, paid once.
          </p>
          {/* The display face for money: Urbanist with tabular digits, the
              register every subject number on the site now shares; the
              "one-time" qualifier drops small via PricePop. */}
          <div className="mt-2 font-heading text-section tabular-nums">
            <PricePop label={pass.priceLabel} />
          </div>
          <div className="mt-3">
            <StatRow
              stats={[
                { value: formatBytes(pass.storageBytes), label: "Storage" },
                { value: `≈ ${cap.photos.toLocaleString()}`, label: "Photos" },
                {
                  value: `${Math.round(cap.videoMinutes / 60).toLocaleString()} h`,
                  label: "Video",
                },
              ]}
            />
          </div>
          <div className="mt-auto pt-5">
            <CheckoutButton
              planId="event_pass"
              {...trackAttrs("checkout_start", { plan: "event_pass" })}
              variant="outline"
              className="w-full"
            >
              Buy a pass
            </CheckoutButton>
          </div>
        </div>

        <Perforation />

        {/* The what-you-get half. */}
        <div className="flex flex-1 flex-col gap-4 p-6 sm:p-7">
          <ul className="flex flex-col gap-2.5">
            <PassPoint>Photos and video, like Pro</PassPoint>
            <PassPoint>
              {MAX_REEL_SECONDS.event_pass}-second reels, no watermark
            </PassPoint>
            <PassPoint>Password lock, custom link, no inactivity sweep</PassPoint>
            <PassPoint>
              Passes stack: each one adds an event and{" "}
              {formatBytes(pass.storageBytes)}
            </PassPoint>
            <PassPoint>
              Go Pro later and unused pass time converts to credit, prorated to
              the day
            </PassPoint>
          </ul>
          <p className="mt-auto text-xs text-pretty text-faint">
            Covers its event for about a year. Renew for{" "}
            {EVENT_PASS_RENEWAL_PRICE_LABEL} a year or let it lapse: you drop
            back to Free with a {OVER_CAP_GRACE_DAYS}-day window to free up
            space or upgrade before anything moves toward Deleted.
          </p>
        </div>
      </div>
    </Reveal>
  );
}
