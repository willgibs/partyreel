"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

/**
 * Removes an event from the signed-in visitor's "Saved" shelf. Unsave is a plain
 * per-user RLS delete (the `saved_events_owner_all` policy scopes it to auth.uid()),
 * so it goes straight through the browser client — no server action needed. A
 * router.refresh() re-runs the dashboard RSC so the card drops out.
 */
export function UnsaveButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function unsave() {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("saved_events")
      .delete()
      .eq("event_id", eventId);
    if (error) {
      toast.error("Couldn't remove this event.");
      setBusy(false);
      return;
    }
    toast.success("Removed from saved.");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={unsave}
      disabled={busy}
      aria-label="Remove from saved"
      className="flex size-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:bg-background hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-95 disabled:opacity-50"
    >
      <X className="size-4" />
    </button>
  );
}
