"use client";

import { useState, useTransition } from "react";

import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";

import { toggleExportsAction } from "./actions";

// The "Download all" kill-switch. Optimistic toggle → the server action flips ops_flags.export_enabled;
// reverts + toasts on failure. Off pauses ALL new exports platform-wide within ~2 min (no Worker redeploy).
export function ExportKillSwitch({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled);
  const [pending, startTransition] = useTransition();

  function onChange(next: boolean) {
    setOn(next);
    startTransition(async () => {
      const res = await toggleExportsAction(next);
      if (!res.ok) {
        setOn(!next);
        toast.error(res.message ?? "Couldn't update the setting.");
        return;
      }
      toast.success(next ? "Downloads enabled." : "Downloads paused.");
    });
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        {/* Stable feature-name label; the switch carries the state (see the reels twin for the
            double-negative WHY). */}
        <p className="text-sm font-medium">Album downloads</p>
        <p className="text-xs text-muted-foreground">
          {on
            ? "On. Hosts and guests can download albums."
            : "Paused. New downloads are blocked across the platform."}
        </p>
      </div>
      <Switch
        checked={on}
        onCheckedChange={onChange}
        disabled={pending}
        aria-label="Toggle downloads"
      />
    </div>
  );
}
