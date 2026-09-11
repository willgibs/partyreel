"use client";

import { useState, useTransition } from "react";

import { Play } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import { runJobNowAction, toggleJobAction } from "./actions";

// The two operator controls on a job card (admin-portal P8). Same optimistic-toggle shape as the
// exports and reels kill switches, so all three behave identically under an operator's hand.

export function JobKillSwitch({
  jobId,
  label,
  enabled,
}: {
  jobId: string;
  label: string;
  enabled: boolean;
}) {
  const [on, setOn] = useState(enabled);
  const [pending, startTransition] = useTransition();

  function onChange(next: boolean) {
    setOn(next);
    startTransition(async () => {
      const res = await toggleJobAction(jobId, next);
      if (!res.ok) {
        setOn(!next);
        toast.error(res.message ?? "Couldn't update the switch.");
        return;
      }
      toast.success(next ? `${label} resumed.` : `${label} paused.`);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground">
        {/* The switch carries the state; the words say what OFF actually does, because "paused"
            alone reads as "already stopped" rather than "will not run next time". */}
        {on ? "Runs on schedule" : "Skips its next run"}
      </span>
      <Switch
        checked={on}
        onCheckedChange={onChange}
        disabled={pending}
        aria-label={`Toggle ${label}`}
      />
    </div>
  );
}

export function RunJobNowButton({
  jobId,
  label,
}: {
  jobId: string;
  label: string;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const res = await runJobNowAction(jobId);
      if (!res.ok) {
        toast.error(res.message ?? "Couldn't start the run.");
        return;
      }
      // Deliberately not "Done": the sweep can outlive our wait, and the heartbeat row is the
      // authority on the result. Promising completion here would be the silent failure this whole
      // surface exists to remove.
      toast.success(`${label} started. Refresh for the result.`);
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={onClick}
      disabled={pending}
    >
      <Play className="size-3.5" aria-hidden />
      {pending ? "Starting" : "Run now"}
    </Button>
  );
}
