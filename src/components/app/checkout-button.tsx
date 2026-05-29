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
