import type { BadgeTone } from "@/lib/admin/tone";
import { formatCount } from "@/lib/format/count";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import {
  bySeverity,
  INSTANT_HIDE_KIND,
  isHarmKind,
  type ReportKind,
} from "@/lib/reports/kinds";

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
 *    the removed item's copy exists, the product's own 30-day window (`wayBackOf`). A dismissal
 *    reopens inside the same 30 days (build 19's red-team: one press with no way back let a slip
 *    close a harm report for good).
 *  - `escalate=door`: Hold for forensics opens the portal's one confirm, filled in from the report
 *    (`holdReasonFor`, `holdTouches`).
 *
 * And round two's (Will 2026-09-29), below the first half: `look=grid` (the queue is one ENTRY a thing
 * reported, `entryKeyOf`, sorted into the front, People and the sweep, `laneOf`), `harm=kinds` (the lanes read
 * the kinds, `lib/reports/kinds.ts`), `proof=confirm` (`askableProof`), `phone=stop` with his note (a phone's
 * two acts, `PHONE_*`), the hold rebuilt on his word (Take it down too, `holdTouches`' `takeDown`) and the
 * instant hide's way back (`hideUndoOf`).
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
 * A closed line's way back: "undo" restores the item its verdict removed and reopens the report,
 * "reopen" reopens a dismissed report, "held" says why an item stays down, and null offers nothing.
 */
export type WayBack = "undo" | "reopen" | "held" | null;

/**
 * How long a dismissal can be taken back: the product's own window, in the number a removal's Undo
 * already lasts (`closed=window`: "one lifecycle rule instead of two clocks that can disagree").
 */
export const REOPEN_WINDOW_MS = RECENTLY_DELETED_WINDOW_DAYS * 86_400_000;

/**
 * The earliest verdict a reopen can still take back at `nowMs`: the floor the reopen's guarded
 * write compares `resolved_at` against, so the line's offer and the write's refusal are one rule.
 */
export function reopenFloor(nowMs: number): string {
  return new Date(nowMs - REOPEN_WINDOW_MS).toISOString();
}

/** Whether a verdict stamped `resolvedAt` is still inside the window at `nowMs` (the floor's own test). */
export function withinReopenWindow(
  resolvedAt: string | null | undefined,
  nowMs: number,
): boolean {
  if (!resolvedAt) return false;
  const at = Date.parse(resolvedAt);
  return Number.isFinite(at) && at >= nowMs - REOPEN_WINDOW_MS;
}

/**
 * A closed report's way back (`closed=window`), measured at `nowMs`: "undo" while the removal ITS
 * verdict made still waits out the window (the copy exists until the purge takes it, so Undo lasts
 * exactly as long as a removed item would anyway, one clock), "reopen" for a dismissal inside the
 * same 30 days, "held" for an item under a legal hold (only Forensics releases one, so its removal
 * has no Undo), and nothing otherwise.
 *
 * ★ A DISMISSAL TOUCHED ONLY THE REPORT, so reopening is the whole of its undo, and a hold is no bar
 * to it: reopening restores nothing. A report held and then dismissed by a slip is the one that most
 * needs its way back, so a dismissal reads "reopen" before an item's hold is asked about.
 *
 * ★ ONLY THE REMOVAL THE VERDICT MADE. The action stamps the removal and the verdict with one
 * instant, so `removedAt` equal to `resolvedAt` is how a line knows the item left because of this
 * report. An item the host, a guest or Albums had already removed was only marked the operator's by
 * the verdict (so the host cannot bring it back), and undoing THAT is not this line's to guess: it is
 * restored from Albums if at all.
 */
export function wayBackOf(
  report: {
    status: ReportStatus;
    resolvedAt: string | null;
    item: ReportedItemState | null;
  },
  nowMs: number,
): WayBack {
  if (
    report.status === "dismissed" &&
    withinReopenWindow(report.resolvedAt, nowMs)
  ) {
    return "reopen";
  }
  const { item } = report;
  if (!item) return null;
  if (item.held) return "held";
  if (report.status !== "actioned") return null;
  if (item.status !== "removed" || !item.removedByAdmin) return null;
  return sameInstant(item.removedAt, report.resolvedAt) ? "undo" : null;
}

/** The line under the album arm's closed log that says what its Undo does and for how long. */
export const WAY_BACK_LINE = `Undo takes a verdict back inside the product's own ${RECENTLY_DELETED_WINDOW_DAYS}-day window: a dismissal reopens its report, and a removal restores its item too, for as long as the copy exists. A held item is never restored here: only Forensics releases a hold.`;

/** The same line for the People arm, whose verdicts remove nothing. */
export const REOPEN_LINE = `Undo reopens a dismissed report inside the product's own ${RECENTLY_DELETED_WINDOW_DAYS}-day window.`;

/** What a reopen says once it lands, from the toast's Undo or the closed line's. */
export const REOPENED_MESSAGE = "The report is open again.";

/** Why a dismissal past its window stays closed, in the window's own number. */
export const PAST_WINDOW_MESSAGE = `That dismissal is older than ${RECENTLY_DELETED_WINDOW_DAYS} days, past its window, so it stays closed.`;

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
 *
 * ★ TAKE IT DOWN TOO, ON BY DEFAULT (his word, 2026-09-29: "a hold is for what police should see"): with it,
 * every item the hold reaches leaves the album and the host's Deleted at once as an operator's removal, off her
 * storage, each restorable from Albums after review; without it the hold is quiet (a police preservation
 * request about content that is not harmful to show, where a removal would tip someone off), and nothing leaves.
 */
export function holdTouches(
  scope: HoldScope,
  { takeDown = true }: { takeDown?: boolean } = {},
): string[] {
  const { kind, eventName, others, uploader } = scope;
  const who = uploader === "host" ? "the host added" : "this guest sent";
  const first =
    others === 0
      ? `This ${kind} in ${eventName}; ${who} nothing else there`
      : `This ${kind} in ${eventName}, and the ${formatCount(others)} other upload${others === 1 ? "" : "s"} ${who} there`;
  return [
    first,
    takeDown
      ? `${others === 0 ? "It leaves" : "Each leaves"} the album and the host's Deleted at once and stops counting against her storage; restore any from Albums after review`
      : "Nothing leaves the album: the host's own removal of one looks like any other",
    "Each original and its forensic record, copied to the preservation store",
    "The host and the guest are sent nothing",
  ];
}

/** The success toast for a whole hold, in the count the confirm showed. */
export function heldMessage(
  total: number,
  { takeDown = false }: { takeDown?: boolean } = {},
): string {
  const verb = takeDown
    ? "Held, taken down and preserved"
    : "Held and preserved";
  return total === 1 ? `${verb}.` : `${verb} ${formatCount(total)} items.`;
}

/** The hold confirm's one option, and the line under it. */
export const TAKE_DOWN_TOO = {
  label: "Take it down too",
  hint: "Unticked, the hold is quiet: for a preservation request about something not harmful to show, where a removal would tip someone off.",
} as const;

/* ── Round two: one entry a thing reported, in three lanes (look=grid, harm=kinds) ───────────── */

/** What a report is about: a photo or video, a whole album, or a person. */
export type EntrySubject = "item" | "album" | "person";

/**
 * THE THING REPORTED IS THE ENTRY (the carried call `one-entry`: "One, counted, with every reason inside it; a
 * verdict answers all of its reports at once"): an item by its media, an album by its event, a person by its
 * profile. The key is what groups the queue and what a verdict closes.
 */
export function entryKeyOf(report: {
  media_id: string | null;
  event_id: string | null;
  profile_id: string | null;
}): string {
  if (report.media_id) return `item:${report.media_id}`;
  if (report.event_id) return `album:${report.event_id}`;
  return `person:${report.profile_id ?? "unknown"}`;
}

export function subjectOf(report: {
  media_id: string | null;
  event_id: string | null;
}): EntrySubject {
  if (report.media_id) return "item";
  if (report.event_id) return "album";
  return "person";
}

/**
 * Where an entry waits: harm in FRONT (judged one at a time, never ticked: the carried call `front`), a person
 * under PEOPLE (actioned out of band), and everything else in the SWEEP.
 */
export type QueueLane = "front" | "people" | "sweep";

export function laneOf(subject: EntrySubject, kind: ReportKind): QueueLane {
  if (subject === "person") return "people";
  return isHarmKind(kind) ? "front" : "sweep";
}

/** The front's order: worst kind first, then the newest report. The sweep reads newest first. */
export function frontOrder(
  a: { kind: ReportKind; newestAt: string },
  b: { kind: ReportKind; newestAt: string },
): number {
  return bySeverity(a.kind, b.kind) || newestFirst(a, b);
}

export function newestFirst(
  a: { newestAt: string },
  b: { newestAt: string },
): number {
  const at = Date.parse(a.newestAt);
  const bt = Date.parse(b.newestAt);
  return bt - at;
}

/** Each lane's heading and its one line (the board's words). */
export const LANE_WORDS: Record<QueueLane, { label: string; line: string }> = {
  front: {
    label: "In front",
    line: "What its reporter called harm, worst first. Judged one at a time, never in a sweep.",
  },
  people: { label: "People", line: "A person is actioned out of band." },
  sweep: {
    label: "Everything else",
    line: "Tick many with X, and Enter or the bar dismisses them. Space opens one whole.",
  },
};

/**
 * Who sent a report, in the queue's words: the album's own host (build 23's LOW-2: the operator reads a host's
 * report on her own album apart from a guest's), else a guest, signed in or not. Never who she is.
 */
export function reporterWho(report: {
  signedIn: boolean;
  byHost?: boolean;
}): string {
  if (report.byHost) return "The host";
  return report.signedIn ? "Signed-in guest" : "Signed-out guest";
}

/**
 * What a report shows of who sent it (the carried call `reporter`): signed in or not, and whether she can be asked.
 * On the worst kind, which is never asked for proof, the same fact reads as what it decided: a confirmed address is
 * what let the report hide its photograph at once.
 *
 * ★ TRUE AFTER A REOPEN TOO (build 23's NIT-8): the close forgets the address, so a report reopened by Undo can no
 * longer be asked, which its words say; but it was still SENT from a confirmed address, which on the worst kind
 * its kept hash remembers (`confirmed`), so it never reads "no confirmed email" beside "Hidden right away". The
 * host's own report never hides (create_report bars her), so on the worst kind it says only who sent it.
 */
export function reporterWords(report: {
  signedIn: boolean;
  canAsk: boolean;
  /** A confirmed address sent it: one still kept, or, on the worst kind, the hash that outlives it. */
  confirmed?: boolean;
  byHost?: boolean;
  kind?: ReportKind;
}): string {
  const who = reporterWho(report);
  if (report.kind === INSTANT_HIDE_KIND) {
    if (report.byHost) return who;
    return (report.confirmed ?? report.canAsk)
      ? `${who}, email confirmed`
      : `${who}, no confirmed email`;
  }
  return report.canAsk ? `${who}, can be asked` : `${who}, can't be asked`;
}

/* ── Asking for proof (proof=confirm) ─────────────────────────────────────────────────────────── */

/** A question is as long as a note may be. */
export const PROOF_QUESTION_MAX = REPORT_NOTE_MAX;

/**
 * Whether Ask for proof is on offer: a reporter who confirmed an address the report still keeps, and never the
 * worst kind (asking a stranger to send proof of it would invite exactly what must never be sent).
 */
export function askableProof(report: {
  kind: ReportKind;
  canAsk: boolean;
}): boolean {
  return report.canAsk && report.kind !== INSTANT_HIDE_KIND;
}

/** The line where Ask for proof sits while its mail is switched off (his rule holds every new product mail). */
export const PROOF_OFF_LINE =
  "Asking by mail is off until the proof mail is switched on.";

/* ── A phone's two acts (phone=stop, and his note) ────────────────────────────────────────────── */

export const PHONE_TAKE_DOWN = "Take it down now";
export const PHONE_HOLD = "Hold for forensics";

/**
 * What a phone may do, said once under its two acts: each is one press, and the report stays open for a desk,
 * where its verdict, its note and any proof are written.
 */
export const PHONE_LINE =
  "Take it down leaves the album at once. Hold also preserves it and the same uploader's other items, and takes them down too. The report stays open: its verdict, notes and proof wait for a desk.";

/** A phone says this where the report is not an item's: there is nothing to take down from here. */
export const PHONE_DESK_ONLY: Record<Exclude<EntrySubject, "item">, string> = {
  album: "An album is acted on from a desk.",
  person: "A person is actioned out of band, so this one waits for a desk.",
};

/* ── The instant hide's way back ──────────────────────────────────────────────────────────────── */

/**
 * WHAT A DISMISSAL PUTS BACK, when one of its reports hid its item at once (the child-abuse kind's instant hide,
 * "hides the item from every viewer at once pending review, as a takedown would, restorable"). A dismissal says
 * the report was false, so the item returns to where the hide found it: "restore" when the hide took it out of
 * the album (its removal is the hide's own instant), "return" when it was already in the host's Deleted (the
 * hide only made it the operator's there, so the flag goes back), and nothing when it is held (only Forensics
 * releases one) or the removal is no longer the hide's.
 */
export type HideUndo = "restore" | "return" | null;

export function hideUndoOf(
  item: {
    status: ReportedItemState["status"];
    removedByAdmin: boolean;
    removedAt: string | null;
    held: boolean;
  } | null,
  hidAt: string | null,
): HideUndo {
  if (!item || !hidAt || item.held) return null;
  if (item.status !== "removed" || !item.removedByAdmin) return null;
  if (sameInstant(item.removedAt, hidAt)) return "restore";
  const removed = item.removedAt ? Date.parse(item.removedAt) : Number.NaN;
  return Number.isFinite(removed) && removed < Date.parse(hidAt)
    ? "return"
    : null;
}

/** What a dismissal that put a hidden item back says (the toast keeps its Undo, which hides it again). */
export const HIDE_RESTORED_MESSAGE =
  "Report dismissed, and the item it hid is back where it was.";
