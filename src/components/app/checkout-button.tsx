"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  announceChangePlanError,
  requestChangePlan,
} from "@/components/app/pricing/change-plan-request";
import { loginPath } from "@/lib/auth/return-path";
import {
  parseStorageRefusal,
  type StorageRefusal,
} from "@/lib/billing/storage-guard";
import type { PlanId } from "@/lib/constants/tiers";
import { isProPlanId } from "@/lib/validation/checkout";
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
 * mid-sentence; the toast outlasts it by a beat.
 */
const NOTICE_HOLD_MS = 5_000;

// Starts a Stripe Checkout session for a Pro plan and redirects to Stripe. Signed-out
// visitors (the public pricing page) are sent to /login first. The server route is
// authoritative — this is just the trigger.
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

  function startCheckout() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ planId, renewal, next }),
        });
        if (res.status === 401) {
          router.push(loginPath(window.location.pathname));
          return;
        }
        const data = await res.json();

        // THE STORAGE GUARD (billing-caps.md): a Pro plan smaller than what the
        // host stores is refused with the numbers, and they are what a host reads.
        const refusal = parseStorageRefusal(data);
        if (refusal) {
          showRefusal(refusal);
          return;
        }

        // ── A PRO HOST CHOOSING A PRO PLAN IS A CHANGE, NOT A PURCHASE ────────────
        // /pricing is statically generated and therefore tier-blind, so a host
        // already on Pro clicking a size reaches checkout and is refused there with
        // `already_subscribed`. Rather than make the page dynamic to relabel one
        // button, we act on that code by posting the SAME plan to change-plan, which
        // runs the storage check and opens Stripe's confirm page for exactly that
        // price. It never opens the general portal: that portal's switcher cannot
        // know what a host stores. A Pro host clicking a PASS keeps the checkout's
        // own sentence (Pro already includes everything a pass adds).
        if (
          res.status === 409 &&
          data?.code === "already_subscribed" &&
          isProPlanId(planId)
        ) {
          const outcome = await requestChangePlan(planId, next);
          if (outcome.kind === "redirect") {
            // ★ A SWITCH BELOW THIS MONTH'S UPLOADS SAYS SO BEFORE IT LEAVES (crumbs-70). The plan sheet says it on the
            // size's own card before the press; this page is tier-blind and has no card, so the route answers the
            // sentence (`uploadsPauseNote`) and it is shown here, held one reading while the button still says it is
            // working. Words, never a refusal and never a confirm: the webhook allows the switch.
            if (outcome.notice) {
              toast(outcome.notice, { duration: NOTICE_HOLD_MS + 1_000 });
              await new Promise((resolve) =>
                setTimeout(resolve, NOTICE_HOLD_MS),
              );
            }
            window.location.href = outcome.url;
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
          return;
        }

        if (!res.ok || !data?.url) {
          toast.error("Couldn't start checkout.", {
            description: data?.message ?? "Please try again.",
          });
          return;
        }
        window.location.href = data.url as string;
      } catch {
        toast.error("Couldn't start checkout. Please try again.");
      }
    });
  }

  return (
    <Button onClick={startCheckout} disabled={isPending} {...buttonProps}>
      {isPending ? "Starting…" : children}
    </Button>
  );
}
