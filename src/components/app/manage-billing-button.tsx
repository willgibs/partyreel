"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import {
  usePricingDoors,
  usePricingRouter,
} from "@/components/app/pricing/pricing-doors";
import { Button } from "@/components/ui/button";
import { loginPath } from "@/lib/auth/return-path";

// Opens the Stripe Billing Portal for the signed-in host: the card on file, the
// invoices and cancelling. Only rendered when the host already has a Stripe customer
// (has been through checkout). It is NOT the way to change a Pro size or cadence:
// that is the plan sheet's price list through /api/stripe/change-plan, which checks
// what the host stores first (the storage guard, billing-caps.md).
//
// ★ IT REACHES NOTHING ITSELF: the portal and the way out are the surface's doors
// (`pricing/pricing-doors.tsx`), the real ones on every page of the app and a
// specimen's own in the Library, so what a reviewer there presses is this very button.
//
// Rest props pass through to the Button (like CheckoutButton's) so the pricing sheet
// can give a Pro host a full-width portal door without a second component; the default
// outline/sm pair is what every shipped call site already renders.
export function ManageBillingButton({
  ...buttonProps
}: Omit<
  React.ComponentProps<typeof Button>,
  "onClick" | "disabled" | "asChild" | "children"
> = {}) {
  const router = usePricingRouter();
  const { openPortal, leave } = usePricingDoors();
  const [isPending, startTransition] = useTransition();

  function open() {
    startTransition(async () => {
      const outcome = await openPortal();
      switch (outcome.kind) {
        case "redirect":
          leave(outcome.url);
          return;
        case "signin":
          router.push(loginPath(window.location.pathname));
          return;
        case "error":
          toast.error("Couldn't open billing.", {
            description: outcome.message,
          });
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      {...buttonProps}
      onClick={open}
      disabled={isPending}
    >
      {isPending ? "Opening…" : "Manage billing"}
    </Button>
  );
}
