"use client";

import { useState, useTransition } from "react";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";

import { restoreEventAction } from "@/app/(app)/dashboard/[eventId]/actions";
import { PricingSheet } from "@/components/app/pricing/pricing-sheet";
import { Button } from "@/components/ui/button";
import { DEFAULT_TIER, toBillingTier } from "@/lib/constants/tiers";
import { formatCount } from "@/lib/format/count";

/**
 * ★ WHAT A RESTORE LEFT IN DELETED (crumbs-42). The event comes back whole, and what was removed on its
 * own stays in its album's Deleted, counted as that list shows it (`media_still_removed`). Said, so
 * twelve photographs that did not come back read as still there to restore rather than as lost. Its
 * kinds are not counted, so a lone item is "a photo or video", the dashboard's own two-kind count
 * (`claims-card.tsx`).
 */
function stillInDeleted(count: number): string | null {
  if (count <= 0) return null;
  return count === 1
    ? "1 photo or video is still in its album's Deleted."
    : `${formatCount(count)} photos and videos are still in its album's Deleted.`;
}

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
        // A soft-deleted event's custom link is freed at once, so another event may have
        // claimed it while this one waited in Deleted; the restore still succeeds, on the
        // permanent link, and this is the one place the host can be told her old link moved.
        const lines = [
          result.customSlugReleased
            ? "Its custom link went to another event while it was deleted, so it came back on its permanent link instead."
            : null,
          stillInDeleted(result.mediaStillRemoved),
        ].filter((line): line is string => line !== null);
        toast.success("Event restored.", {
          description: lines.length > 0 ? lines.join(" ") : undefined,
        });
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
