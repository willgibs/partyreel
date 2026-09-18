"use client";

import { Play } from "lucide-react";

import { DistributionChart } from "@/components/admin/metrics-charts";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { JOB_ROWS, RUN_ROWS, TIER_MIX, type JobRow } from "./fixtures";
import {
  type Colour,
  type Level,
  StateChip,
  rowStyle,
  stateInk,
} from "./state-ui";

/**
 * THE JOBS CONSOLE, WHICH IS WHERE STATE COLOUR EARNS ITS PLACE OR DOES NOT.
 *
 * This is the newest and best surface in the portal and the only one whose
 * whole job is to say what is wrong, so it is the fair test of a colour policy:
 * four jobs in four different states on one screen, and eight runs beneath them
 * of which two failed. Today's page gives "Overdue" and "Last run failed" the
 * shipped `--destructive` red and everything else a grey badge, so a healthy
 * job, a paused job and a job that has never run are the same colour, which is
 * three different meanings sharing one voice.
 *
 * ★ THE CHART DOES NOT CHANGE BETWEEN THE OPTIONS, ON PURPOSE. Which five
 * colours the `--chart-N` ramp takes is a question already on the desk (the
 * loose ends board's first two decisions), cut before the ruling that says the
 * admin wants real colour. Asking it again here would be two boards competing
 * for one answer. It sits in frame so a state colour is judged beside the ramp
 * it has to live with, and nothing more.
 *
 * ★ AND THE CONSOLE IS DRAWN DENSE UNDER EVERY OPTION. A job is five facts and
 * a switch; today it is a Card with a description, which is 180 pixels a job
 * and two jobs a screen. The row below is the board's proposal, held constant
 * across the three colour answers so the only thing that moves is the colour.
 */

const LEVEL: Record<JobRow["state"], Level> = {
  ok: "ok",
  failed: "fail",
  missed: "fail",
  paused: "off",
  running: "info",
};

const RUN_LEVEL: Record<string, Level> = {
  Succeeded: "ok",
  Failed: "fail",
  Skipped: "off",
  Running: "info",
};

const TH = "py-2 pr-3 text-left text-xs font-medium text-muted-foreground";
const TD = "py-2 pr-3 align-middle";

function JobLine({ job, colour }: { job: JobRow; colour: Colour }) {
  const level = LEVEL[job.state];
  const tint = rowStyle(level, colour);
  return (
    <li
      className={cn("flex items-center gap-4 px-4 py-3", tint.className)}
      style={tint.style}
    >
      <span className="w-44 shrink-0">
        <span className="block text-sm font-medium">{job.label}</span>
        <span className="block text-xs text-muted-foreground">
          {job.cadence}
        </span>
      </span>
      <span className="w-36 shrink-0">
        <StateChip level={level} colour={colour}>
          {job.health}
        </StateChip>
      </span>
      <span className="min-w-0 flex-1 text-xs text-muted-foreground">
        <span className="block">
          {job.lastRun}, {job.outcome}
          {job.reported ? `, ${job.reported}` : ""}
        </span>
        {job.note ? (
          <span className="block truncate text-foreground">{job.note}</span>
        ) : null}
      </span>
      <span className="flex shrink-0 items-center gap-3">
        {job.canRunNow ? (
          <Button type="button" size="sm" variant="outline">
            <Play className="size-3.5" aria-hidden />
            Run now
          </Button>
        ) : null}
        <Switch checked={job.state !== "paused"} aria-label={job.label} />
      </span>
    </li>
  );
}

export function AdminJobs({ colour }: { colour: Colour }) {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <PageHeading>Jobs</PageHeading>
          <p className="text-sm text-muted-foreground">
            Every backend job, its last runs, and the switch that stops it.
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          Heartbeat read 10 hours ago
        </span>
      </div>

      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {JOB_ROWS.map((job) => (
          <JobLine key={job.id} job={job} colour={colour} />
        ))}
      </ul>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b px-4 py-2.5">
            <p className="text-sm font-medium">Recent runs</p>
            <p className="text-xs text-muted-foreground">
              The last eight across every job, newest first.
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className={cn(TH, "w-40 pl-4")}>Started</th>
                <th className={cn(TH, "w-44")}>Job</th>
                <th className={cn(TH, "w-28")}>Outcome</th>
                <th className={cn(TH, "w-24")}>Trigger</th>
                <th className={cn(TH, "w-20 text-right")}>Took</th>
                <th className={cn(TH, "pr-4")}>Note</th>
              </tr>
            </thead>
            <tbody>
              {RUN_ROWS.map((r, i) => {
                const level = RUN_LEVEL[r.outcome] ?? "off";
                const tint = rowStyle(level, colour);
                return (
                  <tr
                    key={`${r.job}-${i}`}
                    className={cn("border-b last:border-0", tint.className)}
                    style={tint.style}
                  >
                    <td
                      className={cn(
                        TD,
                        "pl-4 whitespace-nowrap text-muted-foreground",
                      )}
                    >
                      {r.started}
                    </td>
                    <td className={TD}>{r.job}</td>
                    <td className={TD} style={stateInk(level, colour)}>
                      {r.outcome}
                    </td>
                    <td className={cn(TD, "text-muted-foreground")}>
                      {r.trigger}
                    </td>
                    <td
                      className={cn(
                        TD,
                        "text-right text-muted-foreground tabular-nums",
                      )}
                    >
                      {r.took}
                    </td>
                    <td className={cn(TD, "pr-4 text-muted-foreground")}>
                      {r.note}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b px-4 py-2.5">
            <p className="text-sm font-medium">Accounts by plan</p>
            <p className="text-xs text-muted-foreground">
              The chart ramp is asked on the loose ends board, not here.
            </p>
          </div>
          <div className="px-4 py-3">
            <DistributionChart
              height={180}
              data={TIER_MIX.map((d, i) => ({
                ...d,
                color: `var(--color-chart-${i + 2})`,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
