"use client";

import { useState, type ReactNode } from "react";
import { ArrowUpRight, Check } from "lucide-react";

import { CheckoutButton } from "@/components/app/checkout-button";
import { ManageBillingButton } from "@/components/app/manage-billing-button";
import { ProPriceList } from "@/components/app/pricing/pro-price-list";
import {
  LOCKED_FEATURES,
  openingPlanFor,
  proBenefitLines,
  type PricingTrigger,
} from "@/components/app/pricing/triggers";
import { usePlanFacts } from "@/components/app/pricing/use-plan-facts";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { trackAttrs } from "@/lib/analytics/events";
import {
  formatBytesUp,
  planHolds,
  refusalSentence,
  type StorageRefusal,
} from "@/lib/billing/storage-guard";
import {
  DEFAULT_TIER,
  TIER_NAMES,
  formatCapacity,
  planById,
  plansForTier,
  type Plan,
  type Tier,
} from "@/lib/constants/tiers";
import { cn, formatBytes } from "@/lib/utils";

/**
 * PRICING, INSIDE THE APP (`object=sheet` + `first=trigger` + `carry=cards` +
 * `learn=foot` + `pass=line`, Will 2026-09-20).
 *
 * Eleven pricing clicks in the host app used to leave it for a static,
 * tier-blind marketing page. This is what they open instead: the ONE responsive
 * Sheet (a bottom sheet in a hand, a side panel at a desk), led by the reason
 * it opened, carrying two cards and a price, the pass on one line, and a quiet
 * foot to the full page.
 *
 * ★ HIS `carry` RULING OVERRULED THE BOARD, AND THE HEIGHT IS THE REASON.
 * "This is a much cleaner design. It feels more intuitive about what to do next
 * without all the complex toggles getting in the way. We still have the full
 * pricing page for full information." So: no storage selector, no cadence
 * toggle, no table, no calculator. One Pro size at one cadence, and every other
 * question is answered a click away. His one addition is the Pro card's three
 * benefit lines ("phrased better"), which live in `triggers.ts`.
 *
 * ★ IT KNOWS WHAT THE HOST STORES (the storage guard, Will 2026-09-22: no plan
 * change leaves a host storing more than the new cap). When it opens it reads
 * `/api/stripe/plan-facts`, so it opens on the smallest Pro size that FITS
 * whatever door opened it, says which smaller sizes it skipped, and shows a Pro
 * host the six prices with theirs marked (`pro-price-list.tsx`), each switch
 * going through the storage check before Stripe's confirm page. The facts beat
 * the door's claim when they arrive: they are fresher and come from the server.
 *
 * ★ NOTHING HERE DECIDES AN ENTITLEMENT, AND IT COULD NOT IF IT TRIED
 * (billing-caps.md). The tier, the bytes and the current price only pick which
 * sentence a host reads and which size the card offers; the Stripe webhook
 * remains the sole writer of `profiles.tier` and `storage_cap_bytes`; and the
 * checkout and change-plan routes re-resolve everything from `profiles` and
 * Stripe before they will open a session, so a forged prop buys a wrong
 * headline and nothing else. Every price on this surface is read from `tiers.ts`.
 *
 * ★ IT IS BOTH A TRIGGERED AND A CONTROLLED SURFACE. A door that is a BUTTON
 * (the Plan card's Upgrade, the storage meter's Need more, the lock chip)
 * passes `children` and lets the Sheet own its own state; a door that is a
 * TOAST ACTION or a refusal has no element to hang a trigger on, so those
 * callers drive `open` / `onOpenChange` themselves.
 */

export type PricingPlanFacts = {
  /** Server-derived, from the RLS-scoped profile row. Never a client claim. */
  tier: Tier;
  /** A Stripe customer exists, so the billing portal has something to open. */
  hasBilling: boolean;
  /** An Event Pass holder's expiry, already formatted by the server. */
  passExpiry?: string | null;
};

export type PricingSheetProps = {
  trigger: PricingTrigger;
  /**
   * What the door knows (tier, billing, pass expiry): the first paint. The
   * sheet's own read replaces it once it lands, so a door never has to carry
   * bytes or a current price.
   */
  plan: PricingPlanFacts;
  /**
   * The app path Checkout should come back to (`back=finish`). Validated AGAIN
   * server-side against the allow-list in `return-path.ts`, so this prop is a
   * preference, never a redirect.
   */
  returnTo?: string;
  /** The element that opens it. Omit for a caller-controlled sheet. */
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/** "about 25,600 photos or 10 hours of video", the shared formatter's sentence. */
function holds(bytes: number, video = true): string {
  return `about ${formatCapacity(bytes, { video })}`;
}

/** The words at the top: the one thing a static /pricing can never say. */
function lead(
  trigger: PricingTrigger,
  tier: Tier,
  opening: Plan,
  passExpiry?: string | null,
  switchBlocked = false,
): { title: string; sub: string } {
  if (tier === "pro") {
    return {
      title: `You are on ${TIER_NAMES.pro} already`,
      // Never promise a switch the list below cannot open.
      sub: switchBlocked
        ? "Here is every Pro size. This plan can't switch from here right now; the note under the list says why."
        : "Change your size, or switch between monthly and yearly, here. Your card, invoices and cancelling stay in the billing portal.",
    };
  }
  if (tier === "event_pass") {
    const pass = planById("event_pass");
    return {
      title: passExpiry
        ? `Your ${pass.name} runs to ${passExpiry}`
        : `You are on the ${pass.name}`,
      sub: `Add a pass for another event, or move to ${TIER_NAMES.pro} and the time left on this one becomes credit.`,
    };
  }
  if (trigger.kind === "locked") {
    const feature = LOCKED_FEATURES[trigger.feature];
    return { title: feature.unlocks, sub: feature.why };
  }
  if (trigger.kind === "room") {
    return {
      title: "You are out of room",
      sub: `${opening.name} holds ${holds(opening.storageBytes)}, and your guests can keep going.`,
    };
  }
  return {
    title: "Your plan",
    sub: `You are on ${TIER_NAMES.free}. Here is what paid adds.`,
  };
}

/**
 * The one line under the cards about FIT (plain until the `host-storage` board
 * designs it): nothing when every size holds what the host stores; the sizes the
 * sheet skipped when it opened on a bigger one; the numbers when even the largest
 * cannot, since that checkout would only be refused.
 */
function fitNote(stored: number, opening: Plan): string | null {
  if (stored <= 0) return null;
  if (!planHolds(opening, stored)) {
    return refusalSentence(stored, opening, null);
  }
  // Only sizes that truly cannot hold it: a door's own byte count may have
  // raised the opening size too, and the note must never blame a size that fits.
  const skipped = plansForTier("pro", opening.interval ?? "month").filter(
    (plan) =>
      plan.storageBytes < opening.storageBytes && !planHolds(plan, stored),
  );
  if (skipped.length === 0) return null;
  const names = skipped.map((plan) => plan.name).join(" and ");
  return `${names} ${skipped.length === 1 ? "holds" : "hold"} less than the ${formatBytesUp(stored)} you store.`;
}

function Benefit({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-xs">
      <Check
        className="mt-0.5 size-3.5 shrink-0 text-background/70"
        strokeWidth={2}
        aria-hidden
      />
      <span className="text-background/80">{children}</span>
    </li>
  );
}

/** One plan as a card. Pro is the same sheet in ink, the pair's shipped read. */
function PlanCard({
  plan,
  ink = false,
  held = false,
  children,
}: {
  plan: Plan;
  ink?: boolean;
  held?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      data-plan={plan.id}
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-3 rounded-xl border p-4",
        ink ? "border-transparent bg-foreground" : "bg-card",
      )}
    >
      <div className="space-y-1">
        <p
          className={cn(
            "text-sm font-medium",
            ink ? "text-background" : "text-foreground",
          )}
        >
          {plan.name}
        </p>
        <p
          className={cn(
            "font-heading text-subsection tabular-nums",
            ink && "text-background",
          )}
        >
          {plan.priceLabel}
        </p>
        <p className={cn("text-xs", ink ? "text-background/70" : "text-faint")}>
          {holds(plan.storageBytes, plan.tier !== "free")}
        </p>
      </div>
      {children}
      {held ? (
        <span className="mt-auto inline-flex h-7 items-center justify-center rounded-action-sm border border-border text-xs text-muted-foreground">
          Your plan
        </span>
      ) : null}
    </div>
  );
}

export function PricingSheet({
  trigger,
  plan,
  returnTo,
  children,
  open,
  onOpenChange,
}: PricingSheetProps) {
  // Uncontrolled when a trigger child is given; the caller's state otherwise.
  const [selfOpen, setSelfOpen] = useState(false);
  const controlled = open !== undefined;
  const isOpen = controlled ? open : selfOpen;
  const setOpen = controlled ? (onOpenChange ?? (() => {})) : setSelfOpen;

  // The server's answer, once it lands (null until then, and in the Library).
  const facts = usePlanFacts(isOpen);
  // A refusal a buy or switch came back with; cleared when the sheet closes.
  const [refusal, setRefusal] = useState<StorageRefusal | null>(null);
  function changeOpen(next: boolean) {
    if (!next) setRefusal(null);
    setOpen(next);
  }

  const tier = facts?.tier ?? plan.tier ?? DEFAULT_TIER;
  const hasBilling = facts?.hasBilling ?? plan.hasBilling;
  const passExpiry = facts ? facts.passExpiry : plan.passExpiry;
  const stored = facts?.activeBytes ?? 0;

  const free = planById("free");
  const pass = planById("event_pass");
  const opening = openingPlanFor(trigger, stored);
  const head = lead(
    trigger,
    tier,
    opening,
    passExpiry,
    Boolean(facts?.changeBlocked),
  );
  const isFree = tier === "free";
  const note = fitNote(stored, opening);
  // Moving to a cap SMALLER than the one in force (a pass holder with stacked
  // passes into a small Pro) shrinks Deleted too; said before they buy.
  const shrinks =
    facts?.capBytes != null &&
    opening.storageBytes < facts.capBytes &&
    planHolds(opening, stored);

  return (
    <Sheet open={isOpen} onOpenChange={changeOpen}>
      {children ? <SheetTrigger asChild>{children}</SheetTrigger> : null}
      <SheetContent
        responsive
        data-pricing-sheet={trigger.kind}
        className="overflow-y-auto"
      >
        <SheetHeader className="pr-10">
          <SheetTitle className="text-pretty">{head.title}</SheetTitle>
          <SheetDescription className="text-pretty">
            {head.sub}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 px-4">
          {tier === "pro" ? (
            /* A subscriber is told she subscribes, and her plan is six prices
               with hers marked. Sizes and cadences change HERE, through the
               storage check; the portal keeps the card, the invoices and
               cancelling (billing-caps.md). */
            <>
              <ProPriceList
                facts={facts}
                returnTo={returnTo}
                refusal={refusal}
                onRefused={setRefusal}
              />
              {hasBilling ? <ManageBillingButton className="w-full" /> : null}
            </>
          ) : (
            <>
              <div className="flex gap-3">
                {/* ★ FREE IS A PEER ONLY FOR A FREE HOST. His `carry` ruling is
                    "Free beside one Pro size", and that pair is the FREE host's
                    moment: this is what you have, this is the step up. A pass
                    holder cannot move TO Free (it is what happens if the pass
                    lapses), so drawing it beside Pro would sell them a
                    downgrade; their pair is the Pro card and the pass line
                    under it, which is the move they can actually make. */}
                {isFree && <PlanCard plan={free} held />}
                <PlanCard plan={opening} ink>
                  <ul className="space-y-1.5">
                    {proBenefitLines().map((line) => (
                      <Benefit key={line}>{line}</Benefit>
                    ))}
                  </ul>
                  <CheckoutButton
                    planId={opening.id}
                    next={returnTo}
                    onRefused={setRefusal}
                    size="sm"
                    variant="secondary"
                    className="mt-auto w-full"
                    {...trackAttrs("cta_click", {
                      cta: "pricing-sheet-pro",
                      location: trigger.kind,
                    })}
                  >
                    Get {opening.name}
                  </CheckoutButton>
                </PlanCard>
              </div>

              {/* FIT, plainly: the refusal's own numbers when a buy came back
                  refused, else which sizes were skipped and why. */}
              {refusal ? (
                <p
                  role="alert"
                  data-note="refusal"
                  className="text-xs text-pretty text-foreground"
                >
                  {refusal.message}
                </p>
              ) : note ? (
                <p
                  data-note="fit"
                  className="text-xs text-pretty text-muted-foreground"
                >
                  {note}
                </p>
              ) : null}
              {shrinks ? (
                <p
                  data-note="deleted"
                  className="text-xs text-pretty text-muted-foreground"
                >
                  A smaller plan also shrinks Deleted: it keeps items only up to
                  the new size.
                </p>
              ) : null}

              {/* THE PASS ON ONE LINE (`pass=line`). It opens the same gate for
                  less, so leaving it out would be dishonest; giving it Pro's
                  weight is the fork that makes people close the sheet and
                  decide later. A second purchase STACKS, hence "Add a pass". */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed p-3">
                <p className="min-w-0 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {pass.name}
                  </span>{" "}
                  {`one event, paid once: ${pass.priceLabel.replace(" one-time", "")} for ${formatBytes(pass.storageBytes)}.`}
                </p>
                <CheckoutButton
                  planId="event_pass"
                  next={returnTo}
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  {...trackAttrs("cta_click", {
                    cta: "pricing-sheet-pass",
                    location: trigger.kind,
                  })}
                >
                  {tier === "event_pass" ? "Add a pass" : "Buy a pass"}
                </CheckoutButton>
              </div>
            </>
          )}
        </div>

        {/* THE QUIET FOOT (`learn=foot`). The door to the full comparison
            exists and does not compete with buying, and it opens in a NEW tab
            so the host keeps their place in the app: leaving by default is the
            thing this whole round exists to stop doing. */}
        <SheetFooter>
          <Button
            asChild
            variant="link"
            size="sm"
            className="h-auto justify-start p-0 text-xs text-muted-foreground"
          >
            <a
              href="/pricing"
              target="_blank"
              rel="noopener noreferrer"
              {...trackAttrs("cta_click", {
                cta: "pricing-sheet-see-every-plan",
                location: trigger.kind,
              })}
            >
              See every plan <ArrowUpRight />
            </a>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
