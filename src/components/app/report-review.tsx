"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ShieldAlert, Undo2 } from "lucide-react";
import { toast } from "sonner";

import {
  actionReportAction,
  dismissReportAction,
  holdFromReportAction,
  holdScopeAction,
  reopenReportAction,
  undoReportAction,
} from "@/app/admin/reports/actions";
import { DestructiveSheet } from "@/components/admin/destructive-sheet";
import { StatusPicker } from "@/components/admin/triage-status-control";
import { MediaTile } from "@/components/app/media-grid";
import { showUndoToast } from "@/components/shared/undo-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  heldMessage,
  holdReasonFor,
  holdTouches,
  type HoldScope,
  NO_NOTE,
  NO_REASON,
  REOPENED_MESSAGE,
  REPORT_NOTE_MAX,
  REPORT_STATUS_META,
  REPORT_WORDS,
  type ReportWord,
  WAY_BACK_LINE,
} from "@/lib/admin/reports";
import type { ReviewReport } from "@/lib/db/queries/reports";
import { formatAdminDate, formatAdminTimestamp } from "@/lib/format/admin-time";
import { operatorRemovalTouches } from "@/lib/moderation/operator-actions";

/**
 * THE OPERATOR'S REPORTS, AS ADMIN-TRIAGE ROUND ONE LEFT THEM (Will, 2026-09-28), in today's layout
 * (round two redraws the queue itself). The page (server) gates, reads and presigns; this client
 * layer wires the verdicts.
 *
 *  - An OPEN report is a card: its album, the shared status picker in Reports' own words
 *    (`idiom=shape`), when and what was reported, the frame, the reason or a muted "No reason
 *    provided." in place (`reason=marked`), Hold for forensics on an item (`escalate=door`), and the
 *    verbs: Dismiss at one press with Add a note beside it, and its Undo on the toast (build 19's
 *    red-team), Remove (or Action, for an album) through the portal's one confirm with an optional
 *    note (`verdict=note`).
 *  - A CLOSED report is one line (`closed=window`): the verdict, its note, the album and when, and
 *    an Undo while the removal it made still waits out its window or a dismissal is inside its 30
 *    days, or Held.
 *
 * ★ NOTHING HERE DECIDES WHAT A VERDICT TOUCHES. The actions read the report's own item and its
 * state; the words below only describe it, from the same read (`standing`, `held`, `wayBack`).
 */

export function ReportReviewList({ reports }: { reports: ReviewReport[] }) {
  const open = reports.filter((r) => r.status === "open");
  const closed = reports.filter((r) => r.status !== "open");
  return (
    <div className="space-y-6">
      {open.length > 0 ? (
        <div className="space-y-4">
          {open.map((report) => (
            <OpenReportCard key={report.id} report={report} />
          ))}
        </div>
      ) : null}
      {closed.length > 0 ? (
        <ClosedLog lede={WAY_BACK_LINE}>
          {closed.map((report) => (
            <ClosedReportLine key={report.id} report={report} />
          ))}
        </ClosedLog>
      ) : null}
    </div>
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
export function toastDismissed(
  result: { ok: true } | { ok: false; message: string },
  reportId: string,
) {
  if (!result.ok) {
    toast.error("Couldn't dismiss the report.", {
      description: result.message,
    });
    return;
  }
  showUndoToast({
    id: DISMISS_TOAST_ID,
    message: "Report dismissed.",
    tone: "success",
    onUndo: () => {},
    undo: () => reopenReportAction(reportId),
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

/* ── An open album or item report ────────────────────────────────────────── */

function OpenReportCard({ report }: { report: ReviewReport }) {
  const [pending, startTransition] = useTransition();
  const [asking, setAsking] = useState<"verdict" | "hold" | null>(null);
  const [scope, setScope] = useState<HoldScope | null>(null);
  const note = useVerdictNote();
  const noteId = `report-note-${report.id}`;
  const item = report.media;
  const kind = item?.type ?? "photo";
  const eventName = report.event?.name ?? "this event";

  function dismiss() {
    startTransition(async () => {
      const result = await dismissReportAction(report.id, note.text);
      toastDismissed(result, report.id);
    });
  }

  function openHold() {
    startTransition(async () => {
      const result = await holdScopeAction(report.id);
      if (!result.ok) {
        toast.error("Couldn't open the hold.", { description: result.message });
        return;
      }
      setScope(result.scope);
      setAsking("hold");
    });
  }

  function pick(next: ReportWord) {
    if (next === "dismissed") dismiss();
    else if (next === "actioned") setAsking("verdict");
  }

  const verdict = verdictSheet(report, kind, eventName);

  return (
    <Card data-report-id={report.id}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="min-w-0 break-words">{eventName}</CardTitle>
          <StatusPicker
            status={"open" as ReportWord}
            words={REPORT_WORDS}
            moves={["dismissed", "actioned"]}
            // Every Actioned on this card opens the confirm, so the menu says a step follows.
            moveLabel={(next) =>
              next === "actioned" ? "Actioned…" : REPORT_STATUS_META[next].label
            }
            onPick={pick}
            disabled={pending}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {formatAdminTimestamp(report.created_at)}
          {item ? " · item reported" : " · album reported"}
          {item?.standing === "removed" ? " · already out of the album" : ""}
          {item?.standing === "operator" ? " · already taken down" : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {item ? (
          <div className="aspect-square w-40 overflow-hidden rounded-lg bg-black/10">
            <MediaTile item={item} />
          </div>
        ) : null}
        <ReasonLine reason={report.reason} />
        {item ? (
          item.held ? (
            <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
              <ShieldAlert className="size-3.5 shrink-0" aria-hidden />
              Held for forensics. Only Forensics releases it.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={openHold}
              >
                <ShieldAlert />
                Hold for forensics
              </Button>
              <span className="text-caption text-muted-foreground">
                Sets the hold, preserves the evidence and keeps this report
                open.
              </span>
            </div>
          )
        ) : null}
        {note.open ? (
          <NoteField id={noteId} value={note.text} onChange={note.setText} />
        ) : null}
      </CardContent>
      <CardFooter className="flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={dismiss}
        >
          Dismiss
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() => setAsking("verdict")}
        >
          {verdict.button}
        </Button>
        {note.open ? null : <AddNoteLink onPress={note.show} />}
      </CardFooter>

      <DestructiveSheet
        open={asking === "verdict"}
        onOpenChange={(open) => setAsking(open ? "verdict" : null)}
        title={verdict.title}
        lede={verdict.lede}
        verb={verdict.verb}
        touches={verdict.touches}
        severity="reversible"
        note={{
          label: "Note",
          defaultValue: note.text,
          placeholder: "Why, in one line",
          hint: "Kept on the report with the verdict. Only this portal reads it.",
          maxLength: REPORT_NOTE_MAX,
        }}
        successMessage={verdict.done}
        onConfirm={(_typed, written) => actionReportAction(report.id, written)}
      />
      {scope ? (
        <DestructiveSheet
          open={asking === "hold"}
          onOpenChange={(open) => setAsking(open ? "hold" : null)}
          title={`Hold and preserve this ${scope.kind}?`}
          lede="It stays out of every purge until the hold is released from Forensics, and this report stays open."
          verb="Set hold and preserve"
          touches={holdTouches(scope)}
          severity="reversible"
          note={{
            label: "Reason, on the record",
            required: true,
            defaultValue: holdReasonFor(report.id),
            placeholder: "e.g. report reference, CyberTipline filing",
            hint: "Written on each hold and in the forensic audit log.",
            maxLength: REPORT_NOTE_MAX,
          }}
          successMessage={heldMessage(1 + scope.others)}
          onConfirm={(_typed, reason) =>
            holdFromReportAction(report.id, reason)
          }
        />
      ) : null}
    </Card>
  );
}

/**
 * What the verdict's confirm says, true of THIS item as it stands: still up (a removal), already out
 * of the album by someone else's hand (made the operator's), already an operator's removal (the
 * report only closes), or an album (the report only closes; the album is acted on from Albums).
 */
function verdictSheet(
  report: ReviewReport,
  kind: "photo" | "video",
  eventName: string,
): {
  button: string;
  title: string;
  lede: string;
  verb: string;
  touches: string[];
  done: string;
} {
  const item = report.media;
  if (!item) {
    return {
      button: "Action…",
      title: "Action this report?",
      lede: "The report closes as Actioned; nothing else changes.",
      verb: "Action",
      touches: [
        "This report moves to Actioned",
        "The album itself is unchanged: act on it from Albums",
      ],
      done: "Report actioned.",
    };
  }
  if (item.standing === "operator") {
    return {
      button: "Action…",
      title: "Close this report as Actioned?",
      lede: `The ${kind} is already taken down; the report closes as Actioned.`,
      verb: "Action",
      touches: [
        "This report moves to Actioned",
        `The ${kind} stays down: restore it from Albums if it should come back`,
      ],
      done: "Report actioned.",
    };
  }
  const live = item.standing === "live";
  return {
    button: "Remove…",
    title: `Remove this ${kind}?`,
    lede: live
      ? "It leaves the album and the host's Deleted now, and the report closes as Actioned."
      : "It is already out of the album; this takes it out of the host's Deleted too, and the report closes as Actioned.",
    verb: "Remove",
    touches: operatorRemovalTouches({
      kind,
      eventName,
      from: live ? "album" : "deleted",
      wayBack: live ? "undo" : "albums",
    }),
    done: live
      ? `Removed, and the report is actioned.`
      : "Taken from the host, and the report is actioned.",
  };
}

/* ── A closed album or item report ───────────────────────────────────────── */

function ClosedReportLine({ report }: { report: ReviewReport }) {
  const item = report.media;

  return (
    <ClosedLine
      lead={
        item ? (
          <div className="size-8 shrink-0 overflow-hidden rounded bg-muted">
            <MediaTile item={item} playBadge="none" />
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
