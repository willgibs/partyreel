"use client";

import { useState, useTransition } from "react";

import { Play } from "lucide-react";
import { toast } from "sonner";

import { DestructiveSheet } from "@/components/admin/destructive-sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import { runJobNowAction, toggleJobAction } from "./actions";

// The two operator controls on a job card (admin-portal P8). Both now open the portal's one
// destructive sheet where the act deserves one (`destructive=sheet`, Will 2026-09-20): the pause on
// its OFF edge, and Run now on the ONE job the app can start, which is the purge sweep and therefore
// the button that hard-deletes bytes.

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
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();

  function resume() {
    setOn(true);
    startTransition(async () => {
      const res = await toggleJobAction(jobId, true);
      if (!res.ok) {
        setOn(false);
        toast.error(res.message ?? "Couldn't update the switch.");
        return;
      }
      toast.success(`${label} resumed.`);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-caption text-muted-foreground">
        {/* The switch carries the state; the words say what OFF actually does, because "paused"
            alone reads as "already stopped" rather than "will not run next time". */}
        {on ? "Runs on schedule" : "Skips its next run"}
      </span>
      <Switch
        checked={on}
        onCheckedChange={(next) => (next ? resume() : setAsking(true))}
        disabled={pending}
        aria-label={`Toggle ${label}`}
      />
      <DestructiveSheet
        open={asking}
        onOpenChange={setAsking}
        title={`Pause ${label}?`}
        lede="It logs a skipped run instead of running, every time, until you turn it back on."
        verb="Pause the job"
        touches={[
          "Every scheduled run from the next one on",
          "A paused job logs a skipped run, so it never reads as a fault",
          "Nothing this job would have done gets done while it is off",
        ]}
        severity="reversible"
        successMessage={`${label} paused.`}
        onConfirm={async () => {
          const res = await toggleJobAction(jobId, false);
          if (res.ok) setOn(false);
          return res;
        }}
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
  const [asking, setAsking] = useState(false);

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setAsking(true)}
      >
        <Play className="size-3.5" aria-hidden />
        Run now
      </Button>
      <DestructiveSheet
        open={asking}
        onOpenChange={setAsking}
        title={`Run ${label} now?`}
        lede="The sweep starts immediately and does exactly what its nightly run does."
        verb="Run it now"
        touches={[
          "Binned events and media past their grace are hard-deleted, objects included",
          "Accounts over their cap and inactive events move a step along their clocks",
          "Items under legal hold are skipped, as always",
        ]}
        severity="reversible"
        // Deliberately not "Done": the sweep can outlive our wait, and the heartbeat row is the
        // authority on the result. Promising completion here would be the silent failure this whole
        // surface exists to remove.
        successMessage={`${label} started. Refresh for the result.`}
        onConfirm={() => runJobNowAction(jobId)}
      />
    </>
  );
}
