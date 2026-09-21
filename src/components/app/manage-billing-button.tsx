"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

// Opens the Stripe Billing Portal for the signed-in host. Only rendered when the host
// already has a Stripe customer (has been through checkout).
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function openPortal() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/portal", { method: "POST" });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (!res.ok || !data?.url) {
          toast.error("Couldn't open billing.", {
            description: data?.message ?? "Please try again.",
          });
          return;
        }
        window.location.href = data.url as string;
      } catch {
        toast.error("Couldn't open billing. Please try again.");
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      {...buttonProps}
      onClick={openPortal}
      disabled={isPending}
    >
      {isPending ? "Opening…" : "Manage billing"}
    </Button>
  );
}
