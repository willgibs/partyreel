"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { EyeOff, ShieldAlert, Undo2 } from "lucide-react";
import { toast } from "sonner";

import {
  reopenReportAction,
  reopenReportsAction,
  undoReportAction,
  type DismissResult,
} from "@/app/admin/reports/actions";
import { MediaTile } from "@/components/app/media-grid";
import { showUndoToast } from "@/components/shared/undo-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  HIDE_RESTORED_MESSAGE,
  NO_NOTE,
  NO_REASON,
  REOPENED_MESSAGE,
  REPORT_NOTE_MAX,
  REPORT_STATUS_META,
  WAY_BACK_LINE,
} from "@/lib/admin/reports";
import type { ReviewReport } from "@/lib/db/queries/reports";
import { formatAdminDate, formatAdminTimestamp } from "@/lib/format/admin-time";

/**
 * THE REPORTS INBOX'S CLOSED LOG AND ITS SHARED PARTS (admin-triage r1's, Will 2026-09-28). Round two moved the
 * open queue to the review grid (`components/admin/report-queue.tsx`, `look=grid`); what stays here is what both
 * arms still share: the closed line with its way back (`closed=window`), the reason's muted line
 * (`reason=marked`), the verdict's note (`verdict=note`) and the one dismissal toast with its Undo.
 *
 *  - A CLOSED report is one line (`closed=window`): the verdict, its note, the album and when, and an Undo while
 *    the removal it made still waits out its window or a dismissal is inside its 30 days, or Held.
 *
 * ★ NOTHING HERE DECIDES WHAT A VERDICT TOUCHES. The actions read the report's own item and its state; the words
 * below only describe it, from the same read (`wayBack`).
 */

/** The album arm's closed reports, one line each (the open ones are the grid's). */
export function ReportReviewList({ reports }: { reports: ReviewReport[] }) {
  const closed = reports.filter((r) => r.status !== "open");
  if (closed.length === 0) return null;
  return (
    <ClosedLog lede={WAY_BACK_LINE}>
      {closed.map((report) => (
        <ClosedReportLine key={report.id} report={report} />
      ))}
    </ClosedLog>
  );
}

/* ── The parts both arms share ───────────────────────────────────────────── */

/** The reason, or the muted line in its place (`reason=marked`), in time order either way. */
export function ReasonLine({ reason }: { reason: string | null }) {
  return (
    <p className="text-sm text-pretty whitespace-pre-line">
      {reason ?? <span className="text-muted-foreground">{NO_REASON}</span>}
    </p>
  );
}

/**
 * Dismiss's note (`verdict=note`: "Dismiss stays a press with Add a note beside it"): shut, it is
 * the link beside the verbs; open, one field whose line rides whichever verdict is pressed, and
 * which Remove's confirm starts from.
 */
export function useVerdictNote() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  return { open, text, setText, show: () => setOpen(true) };
}

export function NoteField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
}) {
  // The field opens on a press of Add a note, so the cursor goes where the press meant it.
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        Note{" "}
        <span className="font-normal text-muted-foreground">(optional)</span>
      </Label>
      <Textarea
        ref={ref}
        id={id}
        rows={2}
        value={value}
        maxLength={REPORT_NOTE_MAX}
        placeholder="Why, in one line"
        className="min-h-0 resize-none"
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="text-caption text-muted-foreground">
        Kept on the report with the verdict. Only this portal reads it.
      </p>
    </div>
  );
}

/** Add a note, the quiet link beside the verbs. */
export function AddNoteLink({ onPress }: { onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="text-caption text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
    >
      Add a note
    </button>
  );
}

/** The one toast grammar for a verdict. */
export function toastResult(
  result: { ok: true } | { ok: false; message: string },
  done: string,
  failedTitle: string,
) {
  if (result.ok) {
    toast.success(done);
    return;
  }
  toast.error(failedTitle, { description: result.message });
}

/** The portal's one verdict toast with an Undo: a later dismissal's replaces it, Undo and all. */
const DISMISS_TOAST_ID = "admin-report-dismissed";

/**
 * EVERY DISMISS'S TOAST, both arms (build 19's red-team: Dismiss is one press with no confirm, so a
 * slip closed a harm report for good). A dismissal that landed says so with the product's Undo
 * (`showUndoToast`), which reopens the report; one that failed says why, as every verdict does.
 *
 * The page is the server's: the report leaves the queue and comes back with the page's own refresh
 * (each action revalidates it), so there is nothing to put back on screen first, and a reopen that
 * lands says so, as the closed line's Undo does.
 */
export function toastDismissed(result: DismissResult) {
  if (!result.ok) {
    toast.error("Couldn't dismiss the report.", {
      description: result.message,
    });
    return;
  }
  showUndoToast({
    id: DISMISS_TOAST_ID,
    message: result.restored ? HIDE_RESTORED_MESSAGE : "Report dismissed.",
    tone: "success",
    onUndo: () => {},
    // Every report the verdict closed (a verdict answers its whole entry), reopened together.
    undo: () => reopenReportsAction(result.reportIds),
    onUndoFailed: () => {},
    onUndone: () => toast.success(REOPENED_MESSAGE),
  });
}

/**
 * A closed line's Undo (`closed=window`): a removal's restores its item and reopens the report, a
 * dismissal's reopens it. The server decides which a line may offer (`wayBack`) and re-checks it in
 * the write; this only says which and presses it.
 */
export function ClosedUndo({
  reportId,
  way,
}: {
  reportId: string;
  way: "undo" | "reopen";
}) {
  const [pending, startTransition] = useTransition();
  const restores = way === "undo";

  function press() {
    startTransition(async () => {
      const result = restores
        ? await undoReportAction(reportId)
        : await reopenReportAction(reportId);
      toastResult(
        result,
        restores ? "Restored, and the report is open again." : REOPENED_MESSAGE,
        "Couldn't undo that.",
      );
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0"
      disabled={pending}
      onClick={press}
      aria-label={
        restores
          ? "Undo: restore the item and reopen the report"
          : "Undo: reopen the report"
      }
    >
      <Undo2 />
      <span className="hidden sm:inline">Undo</span>
    </Button>
  );
}

/** The closed log: one line a report, under a small label, with what its Undo does. */
export function ClosedLog({
  lede,
  children,
}: {
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-label font-medium text-muted-foreground uppercase">
        Closed
      </p>
      <ul className="rounded-xl border bg-card">{children}</ul>
      {lede ? (
        <p className="mt-2 text-caption text-muted-foreground">{lede}</p>
      ) : null}
    </div>
  );
}

/**
 * One closed report (`closed=window`): what was decided and what it left, in one line. On a phone
 * the album and the time drop under the note, so the line never pushes past the screen.
 */
export function ClosedLine({
  lead,
  status,
  note,
  where,
  resolvedAt,
  end,
}: {
  /** The small square at the head: the frame, or a quiet stand-in. */
  lead: React.ReactNode;
  status: keyof typeof REPORT_STATUS_META;
  note: string | null;
  /** The album's name, or the person's handle. */
  where: string;
  resolvedAt: string | null;
  /** Undo, Held, or nothing. */
  end?: React.ReactNode;
}) {
  const meta = REPORT_STATUS_META[status];
  return (
    <li
      data-closed-report
      className="flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0"
    >
      {lead}
      <div className="grid min-w-0 flex-1 gap-0.5 sm:flex sm:items-center sm:gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:flex-1">
          <Badge variant={meta.badge} className="shrink-0">
            {meta.label}
          </Badge>
          <span className="min-w-0 truncate text-sm">
            {note ?? <span className="text-muted-foreground">{NO_NOTE}</span>}
          </span>
        </div>
        <p className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground sm:shrink-0 sm:gap-3">
          <span className="min-w-0 truncate sm:w-44 sm:text-right">
            {where}
          </span>
          {resolvedAt ? (
            <>
              <span aria-hidden className="sm:hidden">
                ·
              </span>
              <span className="shrink-0 tabular-nums sm:w-40 sm:text-right">
                <span className="sm:hidden">{formatAdminDate(resolvedAt)}</span>
                <span className="hidden sm:inline">
                  {formatAdminTimestamp(resolvedAt)}
                </span>
              </span>
            </>
          ) : null}
        </p>
      </div>
      {/* One width for Undo, Held and nothing, so the times above read as one column at a desk. */}
      <div className="flex shrink-0 justify-end max-sm:empty:hidden sm:w-20">
        {end ?? null}
      </div>
    </li>
  );
}

/* ── A closed album or item report ───────────────────────────────────────── */

function ClosedReportLine({ report }: { report: ReviewReport }) {
  const item = report.media;

  return (
    <ClosedLine
      lead={
        item?.covered || (item && !item.url) ? (
          // ★ THE WORST KINDS STAY COVERED HERE TOO (build 23's NIT-7): the server signs no picture for an
          // item a covered kind names, so the line draws the open queue's cover, small, and loads nothing.
          <span
            data-report-covered
            role="img"
            aria-label="Covered"
            title="Covered: the open queue's View once is the only look"
            className="flex size-8 shrink-0 items-center justify-center rounded bg-foreground/85 text-background"
          >
            <EyeOff className="size-3.5" aria-hidden />
          </span>
        ) : item?.url ? (
          <div className="size-8 shrink-0 overflow-hidden rounded bg-muted">
            <MediaTile
              item={{
                type: item.type,
                url: item.url,
                previewUrl: item.previewUrl,
              }}
              playBadge="none"
            />
          </div>
        ) : (
          <span
            aria-hidden
            className="size-8 shrink-0 rounded border border-dashed"
          />
        )
      }
      status={report.status}
      note={report.resolution_note}
      where={report.event?.name ?? "Unknown event"}
      resolvedAt={report.resolved_at}
      end={
        report.wayBack === "undo" || report.wayBack === "reopen" ? (
          <ClosedUndo reportId={report.id} way={report.wayBack} />
        ) : report.wayBack === "held" ? (
          <span
            className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
            title="Only Forensics releases a hold"
          >
            <ShieldAlert className="size-3.5" aria-hidden />
            Held
          </span>
        ) : null
      }
    />
  );
}
