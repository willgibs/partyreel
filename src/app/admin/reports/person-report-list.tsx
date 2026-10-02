"use client";

import { useTransition } from "react";
import { ArrowUpRight, UserRound } from "lucide-react";

import {
  actionReportAction,
  dismissReportAction,
} from "@/app/admin/reports/actions";
import { StatusPicker } from "@/components/admin/triage-status-control";
import {
  AddNoteLink,
  ClosedLine,
  ClosedLog,
  ClosedUndo,
  NoteField,
  ReasonLine,
  toastDismissed,
  toastResult,
  useVerdictNote,
} from "@/components/app/report-review";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  REOPEN_LINE,
  REPORT_WORDS,
  type ReportWord,
} from "@/lib/admin/reports";
import { SITE_URL } from "@/lib/constants/site";
import type { ReviewProfileReport } from "@/lib/db/queries/reports";
import { formatAdminTimestamp } from "@/lib/format/admin-time";

/**
 * The operator's view of a REPORTED PERSON (Will, `block=report`, 2026-09-19).
 *
 * ★ ITS OWN SECTION, NOT A ROW INSIDE ReportReviewList. That list is built
 * around a presigned photograph and an event; a person report has neither, and
 * bending one card to carry both subjects would leave every media report paying
 * for branches it never takes. Same actions, same queue, same status machine,
 * and since admin-triage r1 the same parts (the picker in Reports' words, the
 * reason's muted line, the verdict's note, the closed line): only the subject
 * differs, so only the card does.
 *
 * ★ AND THE HANDLE IS A LINK, deliberately: deciding about a person means
 * looking at what they published, and /u/<slug> is that page. A reported
 * account with no handle has no page to open, so the name renders plain.
 * Nothing here names the reporter, because nothing stores one.
 *
 * ★ TO THE APP'S OWN ADDRESS, IN A NEW TAB (crumbs-41, from crumbs-39): the
 * portal is its own host, an allow-list (`lib/surface`) that answers a relative
 * `/u/<slug>` with its 404, so the link is the site's absolute address and opens
 * beside the queue, as the help-feedback table's article links do.
 *
 * ★ BOTH VERBS ARE ONE PRESS. Mark actioned removes nothing (a person is
 * actioned out of band, so marking one only closes the report), so it never
 * opens the confirm; its note is where the operator says what was done. A
 * dismissal has its way back, as on the album arm: the toast's Undo, then the
 * closed line's, inside the window.
 */
function PersonReportCard({ report }: { report: ReviewProfileReport }) {
  const [isPending, startTransition] = useTransition();
  const note = useVerdictNote();
  const name = report.profile?.displayName ?? "A deleted account";

  function decide(next: ReportWord) {
    startTransition(async () => {
      if (next === "dismissed") {
        const result = await dismissReportAction(report.id, note.text);
        toastDismissed(result);
      } else if (next === "actioned") {
        // No item: actioning a PERSON marks the report handled. The account
        // itself is dealt with out of band, exactly as an album-level report is.
        const result = await actionReportAction(report.id, note.text);
        toastResult(result, "Report actioned.", "Couldn't action the report.");
      }
    });
  }

  return (
    <Card data-report-id={report.id}>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="truncate">{name}</CardTitle>
          {report.profile?.slug ? (
            <a
              href={`${SITE_URL}/u/${encodeURIComponent(report.profile.slug)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              @{report.profile.slug}
              <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">No public handle</p>
          )}
        </div>
        <StatusPicker
          status={"open" as ReportWord}
          words={REPORT_WORDS}
          moves={["dismissed", "actioned"]}
          onPick={decide}
          disabled={isPending}
        />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <ReasonLine reason={report.reason} />
          <p className="text-xs text-muted-foreground">
            Reported {formatAdminTimestamp(report.created_at)}
          </p>
        </div>
        {note.open ? (
          <NoteField
            id={`report-note-${report.id}`}
            value={note.text}
            onChange={note.setText}
          />
        ) : null}
      </CardContent>
      <CardFooter className="flex-wrap items-center justify-end gap-2">
        {note.open ? null : <AddNoteLink onPress={note.show} />}
        <Button
          variant="outline"
          onClick={() => decide("dismissed")}
          disabled={isPending}
        >
          Dismiss
        </Button>
        <Button
          variant="destructive"
          onClick={() => decide("actioned")}
          disabled={isPending}
        >
          Mark actioned
        </Button>
      </CardFooter>
    </Card>
  );
}

export function PersonReportList({
  reports,
}: {
  reports: ReviewProfileReport[];
}) {
  const open = reports.filter((r) => r.status === "open");
  const closed = reports.filter((r) => r.status !== "open");
  return (
    <div className="space-y-6">
      {open.length > 0 ? (
        <div className="space-y-3">
          {open.map((report) => (
            <PersonReportCard key={report.id} report={report} />
          ))}
        </div>
      ) : null}
      {closed.length > 0 ? (
        <ClosedLog lede={REOPEN_LINE}>
          {closed.map((report) => (
            <ClosedLine
              key={report.id}
              lead={
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border border-dashed text-muted-foreground"
                >
                  <UserRound className="size-4" />
                </span>
              }
              status={report.status}
              note={report.resolution_note}
              where={
                report.profile?.slug
                  ? `@${report.profile.slug}`
                  : (report.profile?.displayName ?? "A deleted account")
              }
              resolvedAt={report.resolved_at}
              end={
                report.wayBack === "reopen" ? (
                  <ClosedUndo reportId={report.id} way="reopen" />
                ) : null
              }
            />
          ))}
        </ClosedLog>
      ) : null}
    </div>
  );
}
