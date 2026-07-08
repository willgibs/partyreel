"use client";

import { useState, useTransition } from "react";

import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";

import { toggleReelRenderAction } from "./actions";

// The reel-render kill-switch. Optimistic toggle → the server action flips ops_flags.reel_render_enabled;
// reverts + toasts on failure. Off pauses ALL new reel video renders platform-wide (in-flight renders
// finish + still land in R2).
export function ReelRenderKillSwitch({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled);
  const [pending, startTransition] = useTransition();

  function onChange(next: boolean) {
    setOn(next);
    startTransition(async () => {
      const res = await toggleReelRenderAction(next);
      if (!res.ok) {
        setOn(!next);
        toast.error(res.message ?? "Couldn't update the setting.");
        return;
      }
      toast.success(next ? "Reel videos enabled." : "Reel videos paused.");
    });
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        {/* A STABLE feature-name label: a state-describing label ("Reel videos paused") next to
            an OFF switch reads as "pausing is off" (the double-negative trap; it confused the
            operator in the M1 drill). The switch position carries the state; the caption spells
            it out. */}
        <p className="text-sm font-medium">Reel video renders</p>
        <p className="text-xs text-muted-foreground">
          {on
            ? "On. Hosts can render their highlight reel to video."
            : "Paused. New renders are blocked across the platform."}
        </p>
      </div>
      <Switch
        checked={on}
        onCheckedChange={onChange}
        disabled={pending}
        aria-label="Toggle reel videos"
      />
    </div>
  );
}
