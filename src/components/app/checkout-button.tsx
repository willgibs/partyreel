"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { announceChangePlanError } from "@/components/app/pricing/change-plan-request";
import {
  usePricingDoors,
  usePricingRouter,
} from "@/components/app/pricing/pricing-doors";
import { loginPath } from "@/lib/auth/return-path";
import type { StorageRefusal } from "@/lib/billing/storage-guard";
import type { PlanId } from "@/lib/constants/tiers";
import { isProPlanId, type ProPlanId } from "@/lib/validation/checkout";
import { Button } from "@/components/ui/button";

type CheckoutButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "onClick" | "disabled" | "asChild"
> & {
  planId: PlanId;
  /** Event Pass only — uses the cheaper renewal price (gated server-side). */
  renewal?: boolean;
  /**
   * Where Checkout should land the buyer (`back=finish`, Will 2026-09-20): the
   * app path they were refused at, so paying finishes the job they started.
   * A PREFERENCE, never a redirect: the route re-validates it against the
   * same-origin allow-list in `pricing/return-path.ts` and silently falls back
   * to the dashboard, so nothing a browser can put here leaves the app.
   */
  next?: string;
  /**
   * The storage guard's refusal (the host stores more than this plan holds), for a
   * surface that prints the numbers in place, like the plan sheet. Without it the
   * button shows them in a toast, so a refusal never reads as a bare failure.
   */
  onRefused?: (refusal: StorageRefusal) => void;
};

/**
 * How long a sentence the host has not read yet holds the way to Stripe's confirm page: one reading, then she goes on
 * (and it is still her page to confirm or leave there). 22 words at a reader's pace, so the page never leaves
 * mid-sentence; the toast outlasts it by a beat and carries the way to stop it.
 *
 * ★ THE HOLD IS A TIMER OF ITS OWN, NEVER AWAITED INSIDE THE TRANSITION. React entangles every transition with an
 * async one that is still pending, the router's included, so a press on any link in the app during a held `await` did
 * nothing for the whole hold (measured in a browser: the click landed and the page stayed put until the redirect won).
 * The transition ends when the route has answered; the hold is a state, a timer and a cleanup, so she can leave.
 */
const NOTICE_HOLD_MS = 5_000;

// Starts a Stripe Checkout session for a plan and leaves for Stripe. Signed-out
// visitors (the public pricing page) are sent to /login first, and come back to the
// page they pressed it on (`loginPath`). The server route is authoritative — this is
// just the trigger.
//
// ★ IT REACHES NOTHING ITSELF: Checkout, the change-plan hop and the way out are the
// surface's doors (`pricing/pricing-doors.tsx`), the real ones on every page of the
// app and a specimen's own in the Library, so what a reviewer there presses is this
// very button.
//
// Rest props pass through to the Button so MARKETING call sites can attach
// trackAttrs(...) data attributes. Keep analytics imports OUT of this file: it
// is shared with the app dashboard, and the marketing island's delegated
// listener is what scopes those attributes to marketing-only firing.
export function CheckoutButton({
  planId,
  renewal,
  next,
  onRefused,
  children,
  ...buttonProps
}: CheckoutButtonProps) {
  const router = usePricingRouter();
  const { startCheckout, changePlan, leave } = usePricingDoors();
  const [isPending, startTransition] = useTransition();
  // The sentence's hold before Stripe's page (below): a timer she can stop, by Stay here or by leaving the page.
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdToast = useRef<string | number | undefined>(undefined);
  function stopHold() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setHolding(false);
  }
  // Leaving the page ends it: a hold that outlived the button would take her to Stripe from somewhere else, and its
  // sentence would linger over the page she went to, beside a Stay here that now stays nothing.
  useEffect(
    () => () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      if (holdToast.current !== undefined) toast.dismiss(holdToast.current);
    },
    [],
  );

  /** The numbers where the host is looking, or in a toast that carries them. */
  function showRefusal(refusal: StorageRefusal) {
    if (onRefused) {
      onRefused(refusal);
      return;
    }
    toast.error("That plan is smaller than what you store.", {
      description: refusal.message,
      duration: 10_000,
    });
  }

  // ── A PRO HOST CHOOSING A PRO PLAN IS A CHANGE, NOT A PURCHASE ────────────
  // /pricing is statically generated and therefore tier-blind, so a host
  // already on Pro clicking a size reaches checkout and is refused there with
  // `already_subscribed`. Rather than make the page dynamic to relabel one
  // button, we act on that answer by posting the SAME plan to change-plan, which
  // runs the storage check and opens Stripe's confirm page for exactly that
  // price. It never opens the general portal: that portal's switcher cannot
  // know what a host stores. A Pro host clicking a PASS keeps the checkout's
  // own sentence (Pro already includes everything a pass adds).
  async function switchPlan(plan: ProPlanId) {
    const outcome = await changePlan(plan, next);
    if (outcome.kind === "redirect") {
      // ★ A SWITCH BELOW THIS MONTH'S UPLOADS SAYS SO BEFORE IT LEAVES (crumbs-70). The plan sheet says it on the
      // size's own card before the press; this page is tier-blind and has no card, so the route answers the
      // sentence (`uploadsPauseNote`) and it is shown here, held one reading while the button still says it is
      // working, and hers to stop (Stay here, or simply leaving the page: a wait with no way out is not one the
      // brief allows). Words, never a refusal and never a confirm: the webhook allows the switch, and she goes on
      // unless she says otherwise.
      if (outcome.notice) {
        const url = outcome.url;
        setHolding(true);
        holdToast.current = toast(outcome.notice, {
          duration: NOTICE_HOLD_MS + 1_000,
          action: { label: "Stay here", onClick: stopHold },
        });
        holdTimer.current = setTimeout(() => {
          holdTimer.current = null;
          leave(url);
        }, NOTICE_HOLD_MS);
        return;
      }
      leave(outcome.url);
      return;
    }
    if (outcome.kind === "signin") {
      router.push(loginPath(window.location.pathname));
      return;
    }
    if (outcome.kind === "refused") {
      showRefusal(outcome.refusal);
      return;
    }
    announceChangePlanError(outcome, toast);
  }

  function press() {
    startTransition(async () => {
      const outcome = await startCheckout(planId, { renewal, next });
      switch (outcome.kind) {
        case "redirect":
          leave(outcome.url);
          return;
        case "signin":
          router.push(loginPath(window.location.pathname));
          return;
        case "refused":
          // THE STORAGE GUARD (billing-caps.md): a Pro plan smaller than what the host stores is refused with the
          // numbers, and they are what a host reads.
          showRefusal(outcome.refusal);
          return;
        case "subscribed":
          if (isProPlanId(planId)) {
            await switchPlan(planId);
            return;
          }
          toast.error("Couldn't start checkout.", {
            description: outcome.message,
          });
          return;
        case "error":
          toast.error("Couldn't start checkout.", {
            description: outcome.message,
          });
      }
    });
  }

  return (
    <Button onClick={press} disabled={isPending || holding} {...buttonProps}>
      {isPending || holding ? "Starting…" : children}
    </Button>
  );
}
