"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";

import { restoreEventAction } from "@/app/(app)/dashboard/[eventId]/actions";
import { Button } from "@/components/ui/button";

// "Restore" on a soft-deleted event card (dashboard "Recently deleted" tab). Calls the Phase-3
// restoreEventAction (capacity- + slot-gated inside the RPC). On an EXPECTED refusal we toast the
// friendly message + an Upgrade -> /pricing CTA (the create-wizard pattern); other failures get a
// plain error toast. Success revalidates /dashboard, so the card moves to "Your events".
export function RestoreEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
          action: { label: "Upgrade", onClick: () => router.push("/pricing") },
        });
        return;
      }
      toast.error("Couldn't restore that event.", {
        description: result.message,
      });
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      disabled={isPending}
      onClick={onRestore}
    >
      <Undo2 /> Restore
    </Button>
  );
}
