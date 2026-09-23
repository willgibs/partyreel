"use client";

import { useState, useTransition } from "react";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";

import { restoreEventAction } from "@/app/(app)/dashboard/[eventId]/actions";
import { PricingSheet } from "@/components/app/pricing/pricing-sheet";
import { Button } from "@/components/ui/button";
import { DEFAULT_TIER, toBillingTier } from "@/lib/constants/tiers";

// "Restore" on a soft-deleted event card (dashboard "Recently deleted" tab). Calls the Phase-3
// restoreEventAction (capacity- + slot-gated inside the RPC). On an EXPECTED refusal we toast the
// friendly message + an Upgrade action that opens the pricing sheet on `room`
// (`first=trigger`, Will 2026-09-20: the refusal already knows the host is out of
// room, which a static /pricing never could); other failures get a plain error toast.
// Success revalidates /dashboard, so the card moves to "Your events".
export function RestoreEventButton({
  eventId,
  /** Server-derived (`profiles.tier`); it only picks the sheet's headline. */
  tier,
}: {
  eventId: string;
  tier?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [pricingOpen, setPricingOpen] = useState(false);

  function onRestore() {
    startTransition(async () => {
      const result = await restoreEventAction(eventId);
      if (result.ok) {
        toast.success("Event restored.");
        return;
      }
      if (
        result.code === "insufficient_space" ||
        result.code === "event_limit"
      ) {
        toast.error(result.message, {
          action: { label: "Upgrade", onClick: () => setPricingOpen(true) },
        });
        return;
      }
      toast.error("Couldn't restore that event.", {
        description: result.message,
      });
    });
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={isPending}
        onClick={onRestore}
      >
        <Undo2 /> Restore
      </Button>
      <PricingSheet
        open={pricingOpen}
        onOpenChange={setPricingOpen}
        trigger={{ kind: "room" }}
        plan={{ tier: toBillingTier(tier ?? DEFAULT_TIER), hasBilling: false }}
        returnTo="/dashboard"
      />
    </>
  );
}
