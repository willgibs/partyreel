"use client";

import { useState, useTransition } from "react";

import { Play } from "lucide-react";
import { toast } from "sonner";

import { DestructiveSheet } from "@/components/admin/destructive-sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatAdminTimestamp } from "@/lib/format/admin-time";
import { formatCount } from "@/lib/format/count";

import {
  releasePruneHoldAction,
  runJobNowAction,
  toggleJobAction,
} from "./actions";
import type { PruneHoldView } from "./prune-hold-view";

// The two operator controls on a job card (admin-portal P8). Both now open the portal's one
// destructive sheet where the act deserves one (`destructive=sheet`, Will 2026-09-20): the pause on
// its OFF edge, and Run now on the jobs the app can start: the purge sweep, the button that
// hard-deletes bytes, and the spend watch, which may pause switches on its own.

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

/**
 * What each startable job's Run now sheet says. The purge's is the one that hard-deletes bytes; the spend watch's
 * may pause lifecycle mail, downloads or the purge on its own, so it says that before the press.
 */
const RUN_NOW_SHEET: Record<string, { lede: string; touches: string[] }> = {
  purge_cron: {
    lede: "The sweep starts immediately and does exactly what its nightly run does.",
    touches: [
      "Binned events and media past their grace are hard-deleted, objects included",
      "Accounts over their cap and inactive events move a step along their clocks",
      "Items under legal hold are skipped, as always",
    ],
  },
  spend_watch: {
    lede: "It reads every counter now and judges each against its ceiling, exactly as its scheduled run does.",
    touches: [
      "A reading past its ceiling alerts: Sentry, and the ops mail at most once a day",
      "A new trip pauses lifecycle mail, downloads or the purge sweep on its own",
      "Guest uploads are only ever offered to you, never paused by it",
    ],
  },
};

export function RunJobNowButton({
  jobId,
  label,
}: {
  jobId: string;
  label: string;
}) {
  const [asking, setAsking] = useState(false);
  const sheet = RUN_NOW_SHEET[jobId] ?? RUN_NOW_SHEET.purge_cron;

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
        lede={sheet.lede}
        verb="Run it now"
        touches={sheet.touches}
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

/**
 * RELEASE THE HOLD, on the backup prune's card (the Advisor's Q20). The prune never lets a held backlog through by
 * itself, so this is the one press that does: the next run deletes what it held, each copy checked again the moment
 * before it goes. Behind the portal's one confirmation, red, because a deleted backup copy is the one thing nothing
 * brings back; no typing, since there is no wrong hold to pick. The pause switch above stays the brake.
 */
export function PruneHoldControl({
  view,
}: {
  view: Exclude<PruneHoldView, null>;
}) {
  const [asking, setAsking] = useState(false);

  if (view.kind === "released") {
    return (
      <p className="text-caption text-muted-foreground">
        Hold released {formatAdminTimestamp(view.releasedAtMs)}: the next run
        deletes what it held, unless the prune is paused.
      </p>
    );
  }

  const items =
    view.heldMedia === null
      ? "Its backlog"
      : `${formatCount(view.heldMedia)} items`;
  const keys =
    view.heldKeys === null
      ? "their backup copies"
      : `${formatCount(view.heldKeys)} backup copies`;
  const past =
    view.threshold === null
      ? ""
      : `, past the ${formatCount(view.threshold)} it holds at`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-caption">
        Held since {formatAdminTimestamp(view.heldSinceMs)}: {items}
        {past}. Nothing is deleted until you release it.
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setAsking(true)}
      >
        Release the hold
      </Button>
      <DestructiveSheet
        open={asking}
        onOpenChange={setAsking}
        title="Release the backup prune's hold?"
        lede="Its next run deletes the backup copies it held: items whose rows and primary objects are both gone."
        verb="Release it"
        touches={[
          `${items} and ${keys}, every one past the 36-day lock`,
          "Each is checked again, row gone and primary object gone, the moment before it is deleted",
          "A deleted backup copy cannot be brought back: if this backlog looks wrong, pause the prune instead",
        ]}
        severity="permanent"
        successMessage="Hold released. The next run deletes what it held."
        onConfirm={() => releasePruneHoldAction()}
      />
    </div>
  );
}
