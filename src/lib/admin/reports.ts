import type { BadgeTone } from "@/lib/admin/tone";
import { formatCount } from "@/lib/format/count";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";

/**
 * THE REPORTS INBOX'S OWN WORDS AND RULES, pure (admin-triage r1's six, Will 2026-09-28), so the
 * page, the cards, the actions and their tests read one home and a rule is a unit test.
 *
 *  - `idiom=shape`: Reports takes the shared filter bar and status picker (`TriageFilter`,
 *    `StatusPicker`) and keeps its own words, Open, Dismissed and Actioned, where Support and
 *    Applicants say New, In progress and Closed: merging the words would lose the difference between
 *    a report dismissed and a report acted on.
 *  - `reason=marked`: a report with nothing said keeps its place in time order and says so, muted, in
 *    the same words on both arms (`NO_REASON`).
 *  - `verdict=note`: every verdict can carry one note, written to `reports.resolution_note`.
 *  - `closed=window`: a closed report is one line, and a removal it made can be undone for as long as
 *    the removed item's copy exists, the product's own 30-day window (`wayBackOf`).
 *  - `escalate=door`: Hold for forensics opens the portal's one confirm, filled in from the report
 *    (`holdReasonFor`, `holdTouches`).
 */

/** Every value `report_status` holds. `reviewed` is in the enum and nothing writes it. */
export type ReportStatus = "open" | "reviewed" | "dismissed" | "actioned";

/** The three words Reports speaks, in the order its filter and picker say them. */
export const REPORT_STATUSES = ["open", "dismissed", "actioned"] as const;
export type ReportWord = (typeof REPORT_STATUSES)[number];

/** Each status's word and chip, the shape `TRIAGE_STATUS_META` gives Support and Applicants. */
export const REPORT_STATUS_META: Record<
  ReportStatus,
  { label: string; badge: BadgeTone }
> = {
  open: { label: "Open", badge: "default" },
  reviewed: { label: "Reviewed", badge: "secondary" },
  dismissed: { label: "Dismissed", badge: "outline" },
  actioned: { label: "Actioned", badge: "destructive" },
};

/** Reports' words as the shared filter bar and picker take them (`InboxWords`). */
export const REPORT_WORDS = {
  statuses: REPORT_STATUSES,
  meta: REPORT_STATUS_META,
};

/**
 * What the page can show: one of the three words, or everything. The queue (Open) is where the bare
 * `/admin/reports` lands, so a morning's first look is the work still waiting, never the history.
 */
export const REPORT_FILTERS = ["open", "dismissed", "actioned", "all"] as const;
export type ReportFilter = (typeof REPORT_FILTERS)[number];

/** A raw `?status=` as a filter; anything unknown lands on the queue. */
export function parseReportFilter(
  raw: string | string[] | undefined,
): ReportFilter {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (REPORT_FILTERS as readonly string[]).includes(value ?? "")
    ? (value as ReportFilter)
    : "open";
}

/**
 * What a report with nothing said prints where its sentence would sit (`reason=marked`): muted, in
 * place, never reordered. Both arms, one string: the People arm printed "No reason given." at full
 * weight, a second spelling of one fact.
 */
export const NO_REASON = "No reason provided.";

/** What a closed report's line prints when its verdict carried no note. */
export const NO_NOTE = "No note";

/** A note is as long as a reason may be (`reports_reason_len`), and no longer. */
export const REPORT_NOTE_MAX = 2000;

/**
 * A verdict's note as it is stored: trimmed, an empty one is no note at all (null), and a note past
 * the cap is refused in words rather than cut, so what the operator wrote is what the record keeps.
 */
export function normalizeNote(
  raw: unknown,
): { ok: true; note: string | null } | { ok: false; message: string } {
  if (raw === null || raw === undefined) return { ok: true, note: null };
  if (typeof raw !== "string") {
    return { ok: false, message: "A note is a line of text." };
  }
  const note = raw.trim();
  if (note.length === 0) return { ok: true, note: null };
  if (note.length > REPORT_NOTE_MAX) {
    return {
      ok: false,
      message: `Keep the note under ${formatCount(REPORT_NOTE_MAX)} characters.`,
    };
  }
  return { ok: true, note };
}

/**
 * The same instant, whichever way each side spells it. PostgREST answers `+00:00` with microseconds
 * where JavaScript writes `Z` with milliseconds, so two strings for one moment can differ.
 */
export function sameInstant(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false;
  const left = Date.parse(a);
  const right = Date.parse(b);
  return Number.isFinite(left) && left === right;
}

/** Where a reported item stands now, as the operator's read of the media row says it. */
export type ReportedItemState = {
  status: "pending" | "approved" | "hidden" | "removed";
  /** An operator's removal: out of the host's view, and hers never to restore. */
  removedByAdmin: boolean;
  removedAt: string | null;
  held: boolean;
};

/**
 * A closed report's way back (`closed=window`): "undo" while the removal ITS verdict made still
 * waits out the window (the copy exists until the purge takes it, so Undo lasts exactly as long as a
 * removed item would anyway, one clock), "held" for an item under a legal hold (only Forensics
 * releases one, so it has no Undo), and nothing otherwise.
 *
 * ★ ONLY THE REMOVAL THE VERDICT MADE. The action stamps the removal and the verdict with one
 * instant, so `removedAt` equal to `resolvedAt` is how a line knows the item left because of this
 * report. An item the host, a guest or Albums had already removed was only marked the operator's by
 * the verdict (so the host cannot bring it back), and undoing THAT is not this line's to guess: it is
 * restored from Albums if at all.
 */
export function wayBackOf(report: {
  status: ReportStatus;
  resolvedAt: string | null;
  item: ReportedItemState | null;
}): "undo" | "held" | null {
  const { item } = report;
  if (!item) return null;
  if (item.held) return "held";
  if (report.status !== "actioned") return null;
  if (item.status !== "removed" || !item.removedByAdmin) return null;
  return sameInstant(item.removedAt, report.resolvedAt) ? "undo" : null;
}

/** The line under the closed log that says what its Undo does and for how long. */
export const WAY_BACK_LINE = `An Undo restores the item and reopens the report, for as long as the removed copy exists: the product's own ${RECENTLY_DELETED_WINDOW_DAYS}-day window. A held item has no Undo: only Forensics releases a hold.`;

/** The reason a hold from a report starts with (the runbook's step two: "the report's reference"). */
export function holdReasonFor(reportId: string): string {
  return `Report ${reportId}`;
}

/** What a hold from a report reaches (`escalate=door`): who sent it decides the second clause. */
export type HoldScope = {
  kind: "photo" | "video";
  eventName: string;
  /** The same uploader's other items in the event (the runbook's commingled context). */
  others: number;
  /** A guest's upload, or one the host made herself (no guest row). */
  uploader: "guest" | "host";
};

/**
 * The hold confirm's "What this touches", every line true of what the action does: the reported
 * item first, then the same uploader's other items in the event (runbook step two), each copied to
 * the preservation store, and nobody told.
 */
export function holdTouches(scope: HoldScope): string[] {
  const { kind, eventName, others, uploader } = scope;
  const who = uploader === "host" ? "the host added" : "this guest sent";
  const first =
    others === 0
      ? `This ${kind} in ${eventName}; ${who} nothing else there`
      : `This ${kind} in ${eventName}, and the ${formatCount(others)} other upload${others === 1 ? "" : "s"} ${who} there`;
  return [
    first,
    "Each original and its forensic record, copied to the preservation store",
    "The host and the guest are sent nothing",
  ];
}

/** The success toast for a whole hold, in the count the confirm showed. */
export function heldMessage(total: number): string {
  return total === 1
    ? "Held and preserved."
    : `Held and preserved ${formatCount(total)} items.`;
}
