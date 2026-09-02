"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * The confirmation for a completed Stripe Checkout. The checkout route sends the buyer
 * back to `/dashboard?upgraded=1` (src/app/api/stripe/checkout/route.ts) and, until this
 * component, nothing read that flag: a purchase landed on an ordinary dashboard with no
 * acknowledgement at all, which reads as a payment that did not take.
 *
 * WHY the copy is conditional. The webhook is the SOLE writer of profiles.tier
 * (billing-caps.md), and Stripe redirects the buyer the instant payment succeeds, which can
 * beat the webhook by a second or two. So the SERVER decides which of the two true things to
 * say: `applied` means the tier already moved off Free, and otherwise we only claim the
 * payment, never the plan. Do not "simplify" this into one congratulation sentence.
 *
 * The param is stripped through a replace() so a reload or a shared URL can never re-toast,
 * and because that soft navigation re-runs the dashboard RSC it doubles as the re-read that
 * picks up a webhook which landed while the toast was showing. `nextUrl` comes from the
 * server (the same URL minus `upgraded`) rather than useSearchParams, which would drag a
 * Suspense requirement onto the page for nothing.
 */
export function UpgradedToast({
  applied,
  planName,
  nextUrl,
}: {
  applied: boolean;
  planName: string;
  nextUrl: string;
}) {
  const router = useRouter();
  // One toast per arrival: StrictMode mounts effects twice in dev, and the replace()
  // below can re-render this component before the navigation settles.
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    if (applied) {
      toast.success(`You're on ${planName}.`, {
        description: "Your new storage is ready to use.",
      });
    } else {
      toast.success("Payment received.", {
        description: "Your plan is being applied. It shows here in a moment.",
      });
    }

    router.replace(nextUrl, { scroll: false });
  }, [applied, planName, nextUrl, router]);

  return null;
}
