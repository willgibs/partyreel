"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { announceChangePlanError } from "@/components/app/pricing/change-plan-request";
import {
  usePricingDoors,
  usePricingRouter,
} from "@/components/app/pricing/pricing-doors";
import { Button } from "@/components/ui/button";
import { loginPath } from "@/lib/auth/return-path";
import type { StorageRefusal } from "@/lib/billing/storage-guard";
import type { ProPlanId } from "@/lib/validation/checkout";

/**
 * A Pro host's switch to one of the six prices (the storage guard, billing-caps.md).
 * It asks `/api/stripe/change-plan`, which checks the storage and answers with
 * Stripe's confirm page for exactly this price; the host confirms there (proration
 * and 3DS stay Stripe's) and lands back on `next`. It never opens the general
 * billing portal, whose switcher cannot know what a host stores.
 *
 * A storage refusal goes to `onRefused` so the surface can print the numbers where
 * the host is looking; without one it falls back to a toast that carries them.
 *
 * Its route and its router are the surface's doors (`pricing-doors.tsx`): the real ones by default, a specimen's own
 * where pressing Switch must not reach Stripe. Every caller, `RefusalFace`'s included, is door-aware without a prop.
 */
export function ChangePlanButton({
  planId,
  next,
  onRefused,
  children,
  ...buttonProps
}: Omit<
  React.ComponentProps<typeof Button>,
  "onClick" | "disabled" | "asChild"
> & {
  planId: ProPlanId;
  /** Where a confirmed change lands; re-checked server-side against the allow-list. */
  next?: string;
  onRefused?: (refusal: StorageRefusal) => void;
}) {
  const router = usePricingRouter();
  const { changePlan } = usePricingDoors();
  const [isPending, startTransition] = useTransition();

  function change() {
    startTransition(async () => {
      const outcome = await changePlan(planId, next);
      switch (outcome.kind) {
        case "redirect":
          window.location.href = outcome.url;
          return;
        case "signin":
          router.push(loginPath(window.location.pathname));
          return;
        case "refused":
          if (onRefused) onRefused(outcome.refusal);
          else
            toast.error("That size is smaller than what you store.", {
              description: outcome.refusal.message,
              duration: 10_000,
            });
          return;
        case "error":
          announceChangePlanError(outcome, toast);
      }
    });
  }

  return (
    <Button onClick={change} disabled={isPending} {...buttonProps}>
      {isPending ? "Opening…" : children}
    </Button>
  );
}
