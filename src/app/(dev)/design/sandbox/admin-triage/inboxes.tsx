"use client";

import { ChevronDown, Flag, LifeBuoy, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TRIAGE_STATUS_META, TRIAGE_STATUSES } from "@/lib/constants/triage";
import { cn } from "@/lib/utils";

import { INBOX, type InboxKind, type InboxRow } from "./fixtures";
import { StateChip } from "./shell";

/**
 * FOUR INBOXES, THREE VOCABULARIES, ONE NAV GROUP.
 *
 * Support and Applicants share `TriageStatusControl` and `TriageFilter` and run
 * on `TRIAGE_STATUSES` (New, In progress, Closed) with a DB CHECK mirroring the
 * constant. Reports hand-rolls an Open/All filter over a four-value enum whose
 * "Reviewed" nothing writes. Albums, one row down the rail, hand-rolls a fifth
 * set (Active, Pending, Approved, Hidden, Removed). Same operator, same
 * gesture, three spellings.
 *
 * ★ THE CONTROLS ARE LOOK-ALIKES ON THE REAL CONSTANTS. `TriageStatusControl`
 * takes its action as a prop and imports nothing live, so it COULD be mounted;
 * it would fire a sonner toast into the frame on every press, which is noise in
 * a capture and a portal in an iframe. The trigger below is the same `Button`
 * and the same `Badge` it renders, and the words come from
 * `src/lib/constants/triage.ts` rather than from a second list, so what is
 * copied is markup and nothing that could drift.
 */

export type IdiomShape = "three" | "shape" | "one-inbox";

export const idiomOf = (v: string | undefined): IdiomShape =>
  v === "three" || v === "shape" || v === "one-inbox" ? v : "shape";

const KIND_META: Record<
  InboxKind,
  { label: string; icon: typeof Flag; surface: string }
> = {
  report: { label: "Reports", icon: Flag, surface: "/admin/reports" },
  support: { label: "Support", icon: LifeBuoy, surface: "/admin/support" },
  applicant: { label: "Applicants", icon: Users, surface: "/admin/applicants" },
};

/* ── The two controls, drawn from each surface's own words ───────────────── */

function Tabs({ words, active }: { words: string[]; active: string }) {
  return (
    <nav data-tri-tabs className="flex flex-wrap gap-1">
      {words.map((w) => (
        <span
          key={w}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm",
            w === active
              ? "bg-foreground text-background"
              : "text-muted-foreground",
          )}
        >
          {w}
        </span>
      ))}
    </nav>
  );
}

/** The shared control's trigger: the current status as a badge, and a chevron. */
function StatusPicker({ status }: { status: string }) {
  return (
    <Button
      type="button"
      data-tri-control="picker"
      variant="outline"
      size="sm"
      className="gap-1.5"
    >
      <Badge variant="secondary">{status}</Badge>
      <ChevronDown className="size-3.5 opacity-60" />
    </Button>
  );
}

/* ── One inbox panel ─────────────────────────────────────────────────────── */

function Panel({
  kind,
  words,
  active,
  control,
  rows,
}: {
  kind: InboxKind;
  words: string[];
  active: string;
  /** "picker" is the shared dropdown; "badge" is what Reports draws today. */
  control: "picker" | "badge";
  rows: InboxRow[];
}) {
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  return (
    <section className="rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-4 border-b px-4 py-2.5">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Icon className="size-4 opacity-70" />
          {meta.label}
          <span className="font-normal text-muted-foreground">
            {meta.surface}
          </span>
        </p>
        <Tabs words={words} active={active} />
      </div>
      <div className="divide-y">
        {rows.map((row) => (
          <div key={`${row.kind}-${row.who}`} className="flex items-center gap-3 px-4 py-2.5">
            <span className="w-40 shrink-0 truncate text-sm font-medium">
              {row.who}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              {row.line}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {row.when}
            </span>
            {control === "picker" ? (
              <StatusPicker status={row.status} />
            ) : (
              <Badge data-tri-control="badge" variant="default">
                {row.status}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── The three answers ───────────────────────────────────────────────────── */

const TRIAGE_WORDS = [
  "All",
  ...TRIAGE_STATUSES.map((s) => TRIAGE_STATUS_META[s].label),
];

const rowsOf = (kind: InboxKind) => INBOX.filter((r) => r.kind === kind);

export function Inboxes({ shape }: { shape: IdiomShape }) {
  if (shape === "one-inbox") {
    const counts = {
      report: rowsOf("report").length,
      support: rowsOf("support").length,
      applicant: rowsOf("applicant").length,
    };
    return (
      <div className="space-y-4">
        <Tabs
          words={[
            `Everything ${INBOX.length}`,
            `Reports ${counts.report}`,
            `Support ${counts.support}`,
            `Applicants ${counts.applicant}`,
          ]}
          active={`Everything ${INBOX.length}`}
        />
        <section className="rounded-xl border bg-card">
          <div className="divide-y">
            {INBOX.map((row) => {
              const Icon = KIND_META[row.kind].icon;
              return (
                <div
                  key={`${row.kind}-${row.who}`}
                  className="flex items-center gap-3 px-4 py-2.5"
                >
                  <Icon className="size-4 shrink-0 opacity-60" />
                  <span className="w-40 shrink-0 truncate text-sm font-medium">
                    {row.who}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                    {row.line}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {row.when}
                  </span>
                  <StatusPicker
                    status={row.status === "Open" ? "New" : row.status}
                  />
                </div>
              );
            })}
          </div>
        </section>
        <p className="text-xs text-muted-foreground">
          One vocabulary for everything an operator answers. A report&apos;s
          outcome stops being a status and becomes the line it closes with.
        </p>
      </div>
    );
  }

  // TODAY, and the one change under `shape`: Reports keeps its own words and
  // gains the control and the tab bar the other two already share.
  const reportWords =
    shape === "three"
      ? ["Open", "All"]
      : ["All", "Open", "Dismissed", "Actioned"];

  return (
    <div className="space-y-4">
      <Panel
        kind="report"
        words={reportWords}
        active="Open"
        control={shape === "three" ? "badge" : "picker"}
        rows={rowsOf("report")}
      />
      <Panel
        kind="support"
        words={TRIAGE_WORDS}
        active="New"
        control="picker"
        rows={rowsOf("support")}
      />
      <Panel
        kind="applicant"
        words={TRIAGE_WORDS}
        active="New"
        control="picker"
        rows={rowsOf("applicant")}
      />
      <p className="text-xs text-muted-foreground">
        {shape === "three" ? (
          <>
            Three filter bars, two shapes of status control, and Albums next
            door spells a fifth set of words.{" "}
            <StateChip level="open" className="align-middle">
              3 vocabularies
            </StateChip>
          </>
        ) : (
          <>
            One control and one tab bar, taking their words from the surface.
            Reports keeps the outcome a report needs.{" "}
            <StateChip level="dismissed" className="align-middle">
              1 component
            </StateChip>
          </>
        )}
      </p>
    </div>
  );
}
