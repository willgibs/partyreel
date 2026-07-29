"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { PlanId } from "@/lib/constants/tiers";
import { Button } from "@/components/ui/button";

type CheckoutButtonProps = {
  planId: PlanId;
  /** Event Pass only — uses the cheaper renewal price (gated server-side). */
  renewal?: boolean;
  children: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
};

// Starts a Stripe Checkout session for a Pro plan and redirects to Stripe. Anonymous
// visitors (the public pricing page) are sent to /login first. The server route is
// authoritative — this is just the trigger.
export function CheckoutButton({
  planId,
  renewal,
  children,
  variant,
  className,
}: CheckoutButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function startCheckout() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ planId, renewal }),
        });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const data = await res.json();

        // ── Will's ruling (2026-07-29): a plan SWITCH belongs in the billing portal ──────────
        // /pricing is statically generated and therefore tier-blind, so a host already on Pro
        // clicking a different Pro size reaches checkout and is refused there. Rather than make
        // the page dynamic just to relabel one button, we act on the server's refusal code: it
        // already knows the caller holds a subscription, and the portal is exactly where Stripe
        // handles a size change (with correct proration, which a fresh checkout would not give).
        // Only `already_subscribed` routes here. An Event Pass refusal deliberately does NOT: it
        // is a one-time payment with no subscription for the portal to manage.
        if (res.status === 409 && data?.code === "already_subscribed") {
          const portal = await fetch("/api/stripe/portal", { method: "POST" });
          const portalData = await portal.json();
          if (portal.ok && portalData?.url) {
            window.location.href = portalData.url as string;
            return;
          }
          // Portal unreachable: fall through to the server's own refusal copy rather than
          // inventing a second failure message.
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
    <Button
      onClick={startCheckout}
      disabled={isPending}
      variant={variant}
      className={className}
    >
      {isPending ? "Starting…" : children}
    </Button>
  );
}
