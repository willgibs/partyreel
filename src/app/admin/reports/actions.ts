"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { type ActionResult } from "@/app/(app)/dashboard/actions";
import {
  askableProof,
  hideUndoOf,
  holdReasonFor,
  type HoldScope,
  normalizeNote,
  PAST_WINDOW_MESSAGE,
  PROOF_OFF_LINE,
  PROOF_QUESTION_MAX,
  reopenFloor,
  REPORT_NOTE_MAX,
  sameInstant,
  wayBackOf,
  withinReopenWindow,
} from "@/lib/admin/reports";
import { requireAdminAction } from "@/lib/auth/admin-context";
import { SITE_URL } from "@/lib/constants/site";
import { mustQuery } from "@/lib/db/must-query";
import { inChunks, readAllPages } from "@/lib/db/read-all";
import { readProofMailEnabled } from "@/lib/db/queries/reports";
import { seamFrom } from "@/lib/db/triage-seam";
import { sendOnce } from "@/lib/email/send";
import { reportProofAskEmail } from "@/lib/email/templates";
import { formatCount } from "@/lib/format/count";
import { preserveMedia } from "@/lib/forensics/preserve";
import {
  adoptionUpdate,
  removalUpdate,
  restoreUpdate,
} from "@/lib/moderation/operator-actions";
import { captureError, captureWarning } from "@/lib/observability/sentry";
import { INSTANT_HIDE_KIND, parseReportKind } from "@/lib/reports/kinds";
import { newProofToken, proofTokenHash } from "@/lib/reports/proof-token";
import { createAdminClient } from "@/lib/supabase/admin";

// Operator actions re-check authz IN EVERY action via the requireAdminAction seam
// (re-validates the user, confirms admin, AND requires AAL2 — an action is its own
// entry point; the layout gate is not enough). Writes use the service-role admin
// client to bypass the reports deny-all RLS.
//
// ★ A VERDICT READS ITS OWN REPORT (admin-triage r1, 2026-09-28). The item a Remove takes down is
// the report's own `media_id`, read here, never an id the browser sends: the page is the operator's,
// but a verdict that removes whatever id it is handed is one crafted request from removing the wrong
// photograph. And a verdict lands only on an OPEN report, so two tabs deciding one report cannot
// both write, and the second is told in words.
//
// ★ AND IT ANSWERS THE WHOLE ENTRY (admin-triage r2, the carried call `one-entry`: "a verdict answers all of
// its reports at once"). The browser names one report; the server reads the thing it is about (its item, its
// album, or its person) and every report still open on it, and the verdict closes them together. A report
// whose instant hide took its item down is answered by its dismissal too: a dismissal says the report was
// false, so the item goes back where the hide found it (`hideUndoOf`), and the dismissal's Undo hides it again.

type Admin = ReturnType<typeof createAdminClient>;

const reportIdSchema = z.uuid();
const reportIdsSchema = z.array(z.uuid()).min(1).max(200);

const INVALID: ActionResult = {
  ok: false,
  code: "validation",
  message: "That report reference isn't valid.",
};

const DECIDED: ActionResult = {
  ok: false,
  code: "validation",
  message: "That report was already decided. The page has the latest.",
};

type Failure = Extract<ActionResult, { ok: false }>;

function failed(message: string): Failure {
  return { ok: false, code: "unknown", message };
}

function revalidate() {
  revalidatePath("/admin/reports");
  // A removal or a restore changes what Albums shows too.
  revalidatePath("/admin/albums", "layout");
}

/* ── The entry a report is about ──────────────────────────────────────────── */

type ReportRow = {
  id: string;
  status: string;
  media_id: string | null;
  event_id: string | null;
  profile_id: string | null;
  resolved_at: string | null;
};

type EntryReportRow = {
  id: string;
  kind: string | null;
  hid_at: string | null;
};

type Entry = {
  mediaId: string | null;
  eventId: string | null;
  profileId: string | null;
  /** Every report still open on the thing, the named one among them. */
  open: EntryReportRow[];
};

/** The report the browser named, read here: its subject is the server's, never the page's. */
async function readReport(admin: Admin, id: string): Promise<ReportRow | null> {
  return mustQuery(
    admin
      .from("reports")
      .select("id, status, media_id, event_id, profile_id, resolved_at")
      .eq("id", id)
      .maybeSingle(),
    "admin reports: the named report",
  );
}

/** Every open report on the same thing: one item's, one album's own, or one person's. Read whole. */
async function readEntry(admin: Admin, report: ReportRow): Promise<Entry> {
  const { rows } = await readAllPages(
    "admin reports: the entry's open reports",
    (after: string | null, limit) => {
      let q = seamFrom(admin, "reports")
        .select("id, kind, hid_at")
        .eq("status", "open")
        .order("id", { ascending: true })
        .limit(limit);
      if (report.media_id) q = q.eq("media_id", report.media_id);
      else if (report.event_id)
        q = q.eq("event_id", report.event_id).is("media_id", null);
      else q = q.eq("profile_id", report.profile_id ?? "");
      if (after) q = q.gt("id", after);
      return q as unknown as PromiseLike<{
        data: EntryReportRow[] | null;
        error: null;
      }>;
    },
    (row) => row.id,
  );
  return {
    mediaId: report.media_id,
    eventId: report.event_id,
    profileId: report.profile_id,
    open: rows,
  };
}

/** Close every listed report that is still open, with one verdict; the ids it closed. */
async function closeReports(
  admin: Admin,
  ids: readonly string[],
  verdict: {
    status: "dismissed" | "actioned";
    by: string;
    at: string;
    note: string | null;
  },
): Promise<string[]> {
  const closed = await inChunks(
    "admin reports: close",
    ids,
    async (chunk) =>
      (await mustQuery(
        admin
          .from("reports")
          .update({
            status: verdict.status,
            resolved_by: verdict.by,
            resolved_at: verdict.at,
            resolution_note: verdict.note,
          })
          .in("id", chunk)
          .eq("status", "open")
          .select("id"),
        "admin reports: close",
      )) ?? [],
  );
  return closed.map((r) => r.id);
}

type ItemRow = {
  id: string;
  status: "pending" | "approved" | "hidden" | "removed";
  removed_by_admin: boolean;
  removed_at: string | null;
  legal_hold_at: string | null;
};

async function readItem(
  admin: Admin,
  mediaId: string,
): Promise<ItemRow | null> {
  return mustQuery(
    admin
      .from("media")
      .select("id, status, removed_by_admin, removed_at, legal_hold_at")
      .eq("id", mediaId)
      .maybeSingle(),
    "admin reports: the reported item",
  ) as Promise<ItemRow | null>;
}

const itemState = (item: ItemRow) => ({
  status: item.status,
  removedByAdmin: Boolean(item.removed_by_admin),
  removedAt: item.removed_at ?? null,
  held: item.legal_hold_at !== null && item.legal_hold_at !== undefined,
});

/**
 * PUT BACK WHAT A FALSE REPORT'S HIDE TOOK: for each of the entry's reports that hid its item, the item returns
 * where the hide found it, the guards in the write (still the operator's, never held or asked, and for a
 * restore still at the hide's own instant). True when anything came back.
 */
async function undoHides(admin: Admin, entry: Entry): Promise<boolean> {
  if (!entry.mediaId) return false;
  const hides = entry.open.filter((r) => r.hid_at);
  if (hides.length === 0) return false;
  const item = await readItem(admin, entry.mediaId);
  if (!item) return false;
  for (const report of hides) {
    const way = hideUndoOf(itemState(item), report.hid_at);
    if (way === "restore") {
      const done = await mustQuery(
        admin
          .from("media")
          .update(restoreUpdate())
          .eq("id", item.id)
          .eq("status", "removed")
          .eq("removed_by_admin", true)
          .eq("removed_at", item.removed_at ?? "")
          .is("legal_hold_at", null)
          .filter("purge_asked_at", "is", null)
          .select("id"),
        "admin reports: restore a hidden item",
      );
      return (done ?? []).length > 0;
    }
    if (way === "return") {
      const done = await mustQuery(
        admin
          .from("media")
          .update({ removed_by_admin: false })
          .eq("id", item.id)
          .eq("status", "removed")
          .eq("removed_by_admin", true)
          .is("legal_hold_at", null)
          .filter("purge_asked_at", "is", null)
          .select("id"),
        "admin reports: return a hidden item",
      );
      return (done ?? []).length > 0;
    }
  }
  return false;
}

/**
 * HIDE IT AGAIN, for a reopened child-abuse report whose dismissal put its item back (the dismissal's Undo puts
 * back what the dismissal changed). The report's `hid_at` moves to the new removal, so its next dismissal knows
 * the removal as the hide's own. Nothing when the item is held, gone, already down, or the host's own withdrawal.
 */
async function redoHides(admin: Admin, reportIds: readonly string[]) {
  const rows = await inChunks(
    "admin reports: reopened hides",
    reportIds,
    async (chunk) =>
      ((await mustQuery(
        seamFrom(admin, "reports")
          .select("id, media_id, kind, hid_at")
          .in("id", chunk)
          .not("hid_at", "is", null),
        "admin reports: reopened hides",
      )) ?? []) as unknown as {
        id: string;
        media_id: string | null;
        kind: string | null;
        hid_at: string | null;
      }[],
  );
  for (const report of rows) {
    if (parseReportKind(report.kind) !== INSTANT_HIDE_KIND || !report.media_id)
      continue;
    const item = await readItem(admin, report.media_id);
    if (!item || item.legal_hold_at || item.removed_by_admin) continue;
    const at = new Date();
    if (item.status !== "removed") {
      await mustQuery(
        admin
          .from("media")
          .update(removalUpdate(at))
          .eq("id", item.id)
          .neq("status", "removed")
          .select("id"),
        "admin reports: hide again",
      );
      await mustQuery(
        seamFrom(admin, "reports")
          .update({ hid_at: at.toISOString() })
          .eq("id", report.id)
          .select("id"),
        "admin reports: hide again, stamped",
      );
    } else {
      await mustQuery(
        admin
          .from("media")
          .update(adoptionUpdate())
          .eq("id", item.id)
          .eq("status", "removed")
          .eq("removed_by_admin", false)
          .eq("removed_by_uploader", false)
          .select("id"),
        "admin reports: hide again in her Deleted",
      );
    }
  }
}

/* ── Dismiss, and its way back ───────────────────────────────────────────── */

/** A dismissal's answer: the reports it closed (its Undo reopens exactly these) and whether a hidden item came back. */
export type DismissResult =
  | { ok: true; reportIds: string[]; restored: boolean }
  | Failure;

async function dismissOne(
  admin: Admin,
  reportId: string,
  by: string,
  note: string | null,
): Promise<DismissResult> {
  const report = await readReport(admin, reportId);
  if (!report) return failed("That report no longer exists.");
  if (report.status !== "open") return DECIDED as Failure;
  const entry = await readEntry(admin, report);
  if (entry.open.length === 0) return DECIDED as Failure;
  // The item first, the reports second: a failure between leaves an open report over an item back up, which
  // the operator sees and presses again, never a closed report over an item a false report still hides.
  const restored = await undoHides(admin, entry);
  const closed = await closeReports(
    admin,
    entry.open.map((r) => r.id),
    { status: "dismissed", by, at: new Date().toISOString(), note },
  );
  if (closed.length === 0) return DECIDED as Failure;
  return { ok: true, reportIds: closed, restored };
}

export async function dismissReportAction(
  reportId: string,
  note?: string | null,
): Promise<DismissResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result as Failure;
  const id = reportIdSchema.safeParse(reportId);
  if (!id.success) return INVALID as Failure;
  const written = normalizeNote(note);
  if (!written.ok)
    return { ok: false, code: "validation", message: written.message };

  try {
    const result = await dismissOne(
      createAdminClient(),
      id.data,
      auth.ctx.userId,
      written.note,
    );
    if (result.ok) revalidate();
    return result;
  } catch (e) {
    captureError("admin", e, { action: "dismiss_report", reportId: id.data });
    return failed("Couldn't dismiss the report. Please try again.");
  }
}

/**
 * THE SWEEP'S ONE PRESS (`look=grid`: tick many, one Dismiss): every ticked entry dismissed with the same
 * verdict, each through the single dismissal's own rules. A report already decided is skipped, never an error:
 * a sweep across a stale page closes what is still open and says how many.
 */
export async function dismissReportsAction(
  reportIds: string[],
): Promise<DismissResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result as Failure;
  const ids = reportIdsSchema.safeParse(reportIds);
  if (!ids.success) return INVALID as Failure;

  const admin = createAdminClient();
  const closed: string[] = [];
  let restored = false;
  try {
    for (const id of new Set(ids.data)) {
      if (closed.includes(id)) continue;
      const result = await dismissOne(admin, id, auth.ctx.userId, null);
      if (result.ok) {
        closed.push(...result.reportIds);
        restored = restored || result.restored;
      }
    }
  } catch (e) {
    captureError("admin", e, {
      action: "dismiss_reports",
      count: ids.data.length,
      closed: closed.length,
    });
    revalidate();
    return failed(
      closed.length > 0
        ? `Dismissed ${formatCount(closed.length)} before one failed. Please try again for the rest.`
        : "Couldn't dismiss those reports. Please try again.",
    );
  }
  if (closed.length === 0) return DECIDED as Failure;
  revalidate();
  return { ok: true, reportIds: closed, restored };
}

/**
 * THE DISMISSAL'S WAY BACK (build 19's red-team; `closed=window`): a report an operator dismissed
 * reopens inside the product's own window, from the toast's Undo or its closed line. Dismiss is one
 * press with no confirm, so this is where a slip is caught; a dismissal touched nothing but the
 * report, so reopening it is the whole of its undo (the verdict's note goes with it, as a removal's
 * Undo clears its own), except for a child-abuse report whose dismissal put its hidden item back,
 * which is hidden again.
 *
 * ★ THE GUARDS ARE IN THE WRITE, not only in the read before it: only a report still `dismissed`,
 * and only while its verdict is inside the window (`reopenFloor`), so a stale page or a second tab
 * can never reopen a report nobody dismissed, and an actioned one keeps its own Undo, which restores
 * what it removed. A report already open is what the press asked for, and answers done.
 */
export async function reopenReportAction(
  reportId: string,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;
  const id = reportIdSchema.safeParse(reportId);
  if (!id.success) return INVALID;
  return reopenReports([id.data]);
}

/** The sweep's Undo: every report its one press dismissed, reopened together. */
export async function reopenReportsAction(
  reportIds: string[],
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;
  const ids = reportIdsSchema.safeParse(reportIds);
  if (!ids.success) return INVALID;
  return reopenReports(ids.data);
}

async function reopenReports(ids: readonly string[]): Promise<ActionResult> {
  const admin = createAdminClient();
  const unique = [...new Set(ids)];
  let rows: { id: string; status: string; resolved_at: string | null }[];
  try {
    rows = await inChunks(
      "admin reports: reopen read",
      unique,
      async (chunk) =>
        (await mustQuery(
          admin
            .from("reports")
            .select("id, status, resolved_at")
            .in("id", chunk),
          "admin reports: reopen read",
        )) ?? [],
    );
  } catch (e) {
    captureError("admin", e, { action: "reopen_report_read" });
    return failed("Couldn't read the report. Please try again.");
  }
  if (rows.length === 0) return failed("That report no longer exists.");
  const dismissed = rows.filter((r) => r.status === "dismissed");
  if (dismissed.length === 0) {
    if (rows.every((r) => r.status === "open")) {
      revalidatePath("/admin/reports");
      return { ok: true };
    }
    return DECIDED;
  }
  const now = Date.now();
  if (!dismissed.some((r) => withinReopenWindow(r.resolved_at, now))) {
    return { ok: false, code: "validation", message: PAST_WINDOW_MESSAGE };
  }

  let reopened: string[];
  try {
    const written = await inChunks(
      "admin reports: reopen",
      dismissed.map((r) => r.id),
      async (chunk) =>
        (await mustQuery(
          admin
            .from("reports")
            .update({
              status: "open",
              resolved_by: null,
              resolved_at: null,
              resolution_note: null,
            })
            .in("id", chunk)
            .eq("status", "dismissed")
            .gte("resolved_at", reopenFloor(now))
            .select("id"),
          "admin reports: reopen",
        )) ?? [],
    );
    reopened = written.map((r) => r.id);
  } catch (e) {
    captureError("admin", e, { action: "reopen_report" });
    return failed("Couldn't reopen the report. Please try again.");
  }
  if (reopened.length === 0) return DECIDED;

  try {
    await redoHides(admin, reopened);
  } catch (e) {
    captureError("admin", e, { action: "reopen_report_rehide" });
    revalidate();
    return failed(
      "The report is open again, but its item couldn't be hidden again. Take it down from the report.",
    );
  }
  revalidate();
  return { ok: true };
}

/* ── The verdict that acts, and its Undo ─────────────────────────────────── */

/**
 * The verdict that acts (`verdict=note`): for an item report, the item is taken down as an
 * OPERATOR's removal, then every open report on it closes as Actioned with its note; for an album or
 * a person, the reports only close (the album and the account are acted on out of band).
 *
 * ★ THE TAKEDOWN STICKS WHATEVER STATE THE ITEM IS IN. An item still up is removed with
 * `removalUpdate(at)`; one the host, a guest or the system had already removed is made the
 * operator's with `adoptionUpdate()` (it used to be skipped, so a host could restore a reported
 * item from her own Deleted). One instant stamps the removal and the verdict, which is how the
 * closed line knows the removal was this report's (`wayBackOf`, `closed=window`).
 */
export async function actionReportAction(
  reportId: string,
  note?: string | null,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;
  const id = reportIdSchema.safeParse(reportId);
  if (!id.success) return INVALID;
  const written = normalizeNote(note);
  if (!written.ok)
    return { ok: false, code: "validation", message: written.message };

  const admin = createAdminClient();
  let entry: Entry;
  try {
    const report = await readReport(admin, id.data);
    if (!report) return failed("That report no longer exists.");
    if (report.status !== "open") return DECIDED;
    entry = await readEntry(admin, report);
  } catch (e) {
    captureError("admin", e, {
      action: "action_report_read",
      reportId: id.data,
    });
    return failed("Couldn't read the report. Please try again.");
  }
  if (entry.open.length === 0) return DECIDED;

  const at = new Date();
  if (entry.mediaId) {
    // Removal first, the reports second: a failure between them leaves the item down and the
    // reports open, which the operator sees and presses again, never a report that says Actioned
    // over an item still up.
    const removed = await takeDown(admin, entry.mediaId, at);
    if (!removed.ok) {
      captureError("admin", new Error(removed.message), {
        action: "remove_media",
        reportId: id.data,
        mediaId: entry.mediaId,
      });
      return failed("Couldn't remove the reported item. Please try again.");
    }
  }

  let closed: string[];
  try {
    closed = await closeReports(
      admin,
      entry.open.map((r) => r.id),
      {
        status: "actioned",
        by: auth.ctx.userId,
        at: at.toISOString(),
        note: written.note,
      },
    );
  } catch (e) {
    captureError("admin", e, { action: "action_report", reportId: id.data });
    return failed("Couldn't update the report. Please try again.");
  }
  if (closed.length === 0) return DECIDED;

  revalidate();
  return { ok: true };
}

/** The operator's removal of one item, whatever state it is in (the two helpers above, in order). */
async function takeDown(
  admin: Admin,
  mediaId: string,
  at: Date,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const removed = await admin
    .from("media")
    .update(removalUpdate(at))
    .eq("id", mediaId)
    .neq("status", "removed");
  const adopted = removed.error
    ? removed
    : await admin
        .from("media")
        .update(adoptionUpdate())
        .eq("id", mediaId)
        .eq("status", "removed")
        .eq("removed_by_admin", false);
  const error = removed.error ?? adopted.error;
  return error ? { ok: false, message: error.message } : { ok: true };
}

/**
 * THE WAY BACK (`closed=window`): an actioned report whose own removal still waits out its window
 * reopens, and its item returns to where it was (the provenance trigger lands it on the status it
 * held). Every report the same verdict closed reopens with it (one instant stamped them all). Reopen
 * first, restore second: a failure between leaves open reports over an item still down, which is the
 * state a Remove starts from, never an Actioned report over an item back up.
 */
export async function undoReportAction(
  reportId: string,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;
  const id = reportIdSchema.safeParse(reportId);
  if (!id.success) return INVALID;

  const admin = createAdminClient();
  let report: ReportRow | null;
  let item: ItemRow | null = null;
  try {
    report = await readReport(admin, id.data);
    if (report?.media_id) item = await readItem(admin, report.media_id);
  } catch (e) {
    captureError("admin", e, {
      action: "undo_report_read",
      reportId: id.data,
    });
    return failed("Couldn't read the report. Please try again.");
  }
  if (!report || report.status !== "actioned" || !report.media_id) {
    return failed("There is nothing to undo on that report.");
  }

  const way = wayBackOf(
    {
      status: "actioned",
      resolvedAt: report.resolved_at,
      item: item ? itemState(item) : null,
    },
    Date.now(),
  );
  if (way === "held")
    return failed("It is held, and only Forensics releases a hold.");
  if (way !== "undo")
    return failed(
      "That removal can't be undone here any more. Restore it from Albums if its copy remains.",
    );

  const { data: reopened, error: reopenErr } = await admin
    .from("reports")
    .update({
      status: "open",
      resolved_by: null,
      resolved_at: null,
      resolution_note: null,
    })
    .eq("media_id", report.media_id)
    .eq("status", "actioned")
    .eq("resolved_at", report.resolved_at ?? "")
    .select("id");
  if (reopenErr) {
    captureError("admin", new Error(reopenErr.message), {
      action: "undo_report_reopen",
      reportId: id.data,
    });
    return failed("Couldn't reopen the report. Please try again.");
  }
  if (!reopened || reopened.length === 0) return DECIDED;

  // Only this removal, and never a held or asked row: the guards are in the write, not only in the read.
  const { data: restored, error: restoreErr } = await admin
    .from("media")
    .update(restoreUpdate())
    .eq("id", report.media_id)
    .eq("status", "removed")
    .eq("removed_by_admin", true)
    .is("legal_hold_at", null)
    .filter("purge_asked_at", "is", null)
    .select("id");
  if (restoreErr || !restored || restored.length === 0) {
    captureError(
      "admin",
      new Error(restoreErr?.message ?? "undo restored no row"),
      { action: "undo_report_restore", reportId: id.data },
    );
    revalidate();
    return failed(
      "The report reopened, but the item couldn't be restored. Restore it from Albums.",
    );
  }

  revalidate();
  return { ok: true };
}

/* ── A phone's two acts (phone=stop, and his note) ───────────────────────── */

/** Take it down now: the answer carries the removal's instant, which its Undo must match. */
export type TakeDownResult = { ok: true; at: string } | Failure;

/**
 * TAKE IT DOWN, FROM A PHONE: the item leaves the album and the host's Deleted at once, as an operator's
 * removal, and every report on it STAYS OPEN, because its verdict, its note and any proof are a desk's to write
 * (`phone=stop`: "the report stays open until then"). One press, with an Undo on its toast.
 */
export async function takeDownAction(
  reportId: string,
): Promise<TakeDownResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result as Failure;
  const id = reportIdSchema.safeParse(reportId);
  if (!id.success) return INVALID as Failure;

  const admin = createAdminClient();
  let report: ReportRow | null;
  try {
    report = await readReport(admin, id.data);
  } catch (e) {
    captureError("admin", e, { action: "take_down_read", reportId: id.data });
    return failed("Couldn't read the report. Please try again.");
  }
  if (!report || report.status !== "open") return DECIDED as Failure;
  if (!report.media_id)
    return failed("This report names no item to take down.");

  const at = new Date();
  const removed = await takeDown(admin, report.media_id, at);
  if (!removed.ok) {
    captureError("admin", new Error(removed.message), {
      action: "take_down",
      reportId: id.data,
    });
    return failed("Couldn't take it down. Please try again.");
  }
  revalidate();
  return { ok: true, at: at.toISOString() };
}

/** The phone takedown's Undo: only the removal that press made (its instant), never a held or asked row. */
export async function undoTakeDownAction(
  reportId: string,
  at: string,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;
  const id = reportIdSchema.safeParse(reportId);
  const when = z.iso.datetime().safeParse(at);
  if (!id.success || !when.success) return INVALID;

  const admin = createAdminClient();
  const report = await readReport(admin, id.data).catch(() => null);
  if (!report?.media_id) return failed("There is nothing to undo.");
  const item = await readItem(admin, report.media_id).catch(() => null);
  if (!item || !sameInstant(item.removed_at, when.data)) {
    return failed(
      "That removal can't be undone here any more. Restore it from Albums.",
    );
  }
  const { data, error } = await admin
    .from("media")
    .update(restoreUpdate())
    .eq("id", item.id)
    .eq("status", "removed")
    .eq("removed_by_admin", true)
    .eq("removed_at", item.removed_at ?? "")
    .is("legal_hold_at", null)
    .filter("purge_asked_at", "is", null)
    .select("id");
  if (error || !data || data.length === 0) {
    return failed("Couldn't restore it. Restore it from Albums.");
  }
  revalidate();
  return { ok: true };
}

/* ── Hold for forensics, from the report (`escalate=door`, rebuilt on his word) ─ */

type ScopeRead =
  | { ok: false; message: string }
  | { ok: true; scope: HoldScope; reportedId: string; otherIds: string[] };

/**
 * WHAT A HOLD FROM THIS REPORT REACHES: the reported item, and the same uploader's other items in
 * the event (the runbook's step two: commingled content is part of the REPORT Act's preservation
 * duty). The uploader is the item's guest row, and every guest row the same ACCOUNT holds in the
 * event (a signed-in guest can hold one per device she claimed); an item with no guest row is the
 * host's own upload, so the host's other uploads there are its context. Every status counts, a
 * removal included: preservation is about what exists, not what shows.
 */
async function readHoldScope(
  admin: Admin,
  reportId: string,
): Promise<ScopeRead> {
  const { data: report, error } = await admin
    .from("reports")
    .select("id, media_id, event_id")
    .eq("id", reportId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!report?.media_id)
    return {
      ok: false,
      message: "This report names no item that still exists.",
    };

  const { data: item, error: itemErr } = await admin
    .from("media")
    .select("id, event_id, guest_id, type")
    .eq("id", report.media_id)
    .maybeSingle();
  if (itemErr) throw new Error(itemErr.message);
  if (!item)
    return { ok: false, message: "The reported item no longer exists." };

  const { data: event, error: eventErr } = await admin
    .from("events")
    .select("id, name")
    .eq("id", item.event_id)
    .maybeSingle();
  if (eventErr) throw new Error(eventErr.message);

  let guestIds: string[] | null = null;
  if (item.guest_id) {
    const { data: guest, error: guestErr } = await admin
      .from("guests")
      .select("id, user_id")
      .eq("id", item.guest_id)
      .maybeSingle();
    if (guestErr) throw new Error(guestErr.message);
    guestIds = [item.guest_id];
    if (guest?.user_id) {
      // row-cap: one account's guest rows in one event, one per device it claimed: a handful.
      const { data: rows, error: rowsErr } = await admin
        .from("guests")
        .select("id")
        .eq("event_id", item.event_id)
        .eq("user_id", guest.user_id);
      if (rowsErr) throw new Error(rowsErr.message);
      guestIds = [
        ...new Set([item.guest_id, ...(rows ?? []).map((r) => r.id)]),
      ];
    }
  }

  // Read whole: a guest can send more than a thousand things, and a hold that stopped at the cut
  // would leave the rest of the context unpreserved without a word.
  const { rows } = await readAllPages(
    "admin reports: hold scope",
    (after: string | null, limit) => {
      let q = admin
        .from("media")
        .select("id")
        .eq("event_id", item.event_id)
        .neq("id", item.id)
        .order("id", { ascending: true })
        .limit(limit);
      // row-cap: guestIds is one account's guest rows in one event, one per device it claimed: a handful
      q = guestIds ? q.in("guest_id", guestIds) : q.is("guest_id", null);
      if (after) q = q.gt("id", after);
      return q;
    },
    (row) => row.id,
  );

  return {
    ok: true,
    reportedId: item.id,
    otherIds: rows.map((r) => r.id),
    scope: {
      kind: item.type,
      eventName: event?.name ?? "this event",
      others: rows.length,
      uploader: item.guest_id ? "guest" : "host",
    },
  };
}

/** The confirm's numbers, read the moment the door is pressed, so what it says is what it holds. */
export async function holdScopeAction(
  reportId: string,
): Promise<{ ok: true; scope: HoldScope } | Failure> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result as Failure;
  const id = reportIdSchema.safeParse(reportId);
  if (!id.success) return INVALID as Failure;
  try {
    const read = await readHoldScope(createAdminClient(), id.data);
    if (!read.ok)
      return { ok: false, code: "validation", message: read.message };
    return { ok: true, scope: read.scope };
  } catch (e) {
    captureError("security", e, { action: "hold_scope", reportId: id.data });
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't read what the hold would reach.",
    };
  }
}

/** How long the preserve loop may start new copies, inside the page's 60 s. */
const HOLD_BUDGET_MS = 40_000;
/** Preserves in flight at once: each is a handful of round trips and one server-side copy. */
const HOLD_CONCURRENCY = 4;

/**
 * THE DOOR ITSELF: hold and preserve the reported item, then its context, each through the one
 * preserve service /admin/forensics uses (hold first, then the copy, then the evidence snapshot, an
 * audit row either way). The reported item goes first and alone: if it cannot be held nothing else
 * is attempted. The rest run four at a time until the budget, and a partial run says exactly how
 * far it got; pressing again is safe (a re-preserve rewrites the same keys). The report stays open.
 *
 * ★ TAKE IT DOWN TOO, ON BY DEFAULT (Will, 2026-09-29): "a hold is for what police should see", so with it
 * every item the hold reaches becomes an operator's removal BEFORE any copy starts (out of the album and the
 * host's Deleted at once, off her storage, each restorable from Albums after review), and a preserve that
 * runs out of time never leaves anything up. Unticked it is the quiet hold, and nothing leaves the album.
 * A phone presses it in one go, with the report's reference as the reason (`phone=stop`'s `hold` option).
 */
export async function holdFromReportAction(
  reportId: string,
  reason?: string | null,
  takeDownToo: boolean = true,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;
  const id = reportIdSchema.safeParse(reportId);
  if (!id.success) return INVALID;
  const why =
    typeof reason === "string" && reason.trim()
      ? reason.trim()
      : holdReasonFor(id.data);
  if (why.length > REPORT_NOTE_MAX) {
    return {
      ok: false,
      code: "validation",
      message: `Keep the reason under ${formatCount(REPORT_NOTE_MAX)} characters.`,
    };
  }

  const admin = createAdminClient();
  let read: ScopeRead;
  try {
    read = await readHoldScope(admin, id.data);
  } catch (e) {
    captureError("security", e, {
      action: "hold_from_report",
      reportId: id.data,
    });
    return failed("Couldn't read what the hold would reach. Please try again.");
  }
  if (!read.ok) return { ok: false, code: "validation", message: read.message };

  if (takeDownToo) {
    try {
      await takeDownAll(admin, [read.reportedId, ...read.otherIds]);
    } catch (e) {
      captureError("security", e, {
        action: "hold_take_down",
        reportId: id.data,
      });
      revalidate();
      return failed(
        "Couldn't take everything down, so nothing was preserved yet. Press Hold for forensics again.",
      );
    }
  }

  const adminUserId = auth.ctx.userId;
  const started = Date.now();
  try {
    const first = await preserveMedia({
      mediaId: read.reportedId,
      adminUserId,
      reason: why,
    });
    if (!first.ok) return failed(first.message);
  } catch (e) {
    captureError("security", e, {
      action: "hold_from_report",
      reportId: id.data,
      mediaId: read.reportedId,
    });
    return failed("Preserve failed. Check the audit log on Forensics.");
  }

  // The context carries the reason with what it is, so Forensics' holds table tells the reported
  // item from the uploads held beside it.
  const contextReason = `${why} (the same uploader's other upload)`;
  let held = 1;
  let stopped = 0;
  for (let i = 0; i < read.otherIds.length; i += HOLD_CONCURRENCY) {
    if (Date.now() - started > HOLD_BUDGET_MS) {
      stopped = read.otherIds.length - i;
      break;
    }
    const batch = read.otherIds.slice(i, i + HOLD_CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((mediaId) =>
        preserveMedia({ mediaId, adminUserId, reason: contextReason }),
      ),
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value.ok) held += 1;
    }
  }

  revalidate();
  revalidatePath("/admin/forensics");
  const total = 1 + read.otherIds.length;
  if (held === total) return { ok: true };
  captureWarning("security", "hold from report was partial", {
    reportId: id.data,
    held,
    total,
    stopped,
  });
  return failed(
    `Held and preserved ${formatCount(held)} of ${formatCount(total)} items${takeDownToo ? ", every one already taken down" : ""}. Press Hold for forensics again for the rest; each failure is in the audit log on Forensics.`,
  );
}

/**
 * Every item the hold reaches, made an operator's removal at one instant: an item still up leaves the album, an
 * item the host or a guest had removed becomes the operator's in her Deleted (its window unchanged).
 */
async function takeDownAll(admin: Admin, ids: readonly string[]) {
  const at = new Date();
  await inChunks("admin reports: hold take down", ids, async (chunk) => {
    await mustQuery(
      admin
        .from("media")
        .update(removalUpdate(at))
        .in("id", chunk)
        .neq("status", "removed")
        .select("id"),
      "admin reports: hold take down",
    );
    await mustQuery(
      admin
        .from("media")
        .update(adoptionUpdate())
        .in("id", chunk)
        .eq("status", "removed")
        .eq("removed_by_admin", false)
        .select("id"),
      "admin reports: hold take down (already removed)",
    );
    return [];
  });
}

/* ── Ask for proof (`proof=confirm`) ─────────────────────────────────────── */

/**
 * ASK FOR PROOF: the operator's own question, mailed once to the address the reporter confirmed on the form
 * (kept on the report until it closes, and never shown here), with a link to add her answer to the report
 * itself. ★ BEHIND ITS SWITCH (his rule holds every new product mail for the email exploration): while it is
 * off the ask is refused in words and nothing is written. Never for a child-abuse report. The link's token is
 * stored hashed and forgotten at the close, like the address; a failed send takes the ask back.
 */
export async function askProofAction(
  reportId: string,
  question: string,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;
  const id = reportIdSchema.safeParse(reportId);
  if (!id.success) return INVALID;
  const asked = typeof question === "string" ? question.trim() : "";
  if (!asked) {
    return { ok: false, code: "validation", message: "Write the question." };
  }
  if (asked.length > PROOF_QUESTION_MAX) {
    return {
      ok: false,
      code: "validation",
      message: `Keep the question under ${formatCount(PROOF_QUESTION_MAX)} characters.`,
    };
  }

  const admin = createAdminClient();
  try {
    if (!(await readProofMailEnabled())) {
      return { ok: false, code: "validation", message: PROOF_OFF_LINE };
    }
    const report = (await mustQuery(
      seamFrom(admin, "reports")
        .select("id, status, kind, reporter_email, event_id")
        .eq("id", id.data)
        .maybeSingle(),
      "admin reports: proof report",
    )) as {
      id: string;
      status: string;
      kind: string | null;
      reporter_email: string | null;
      event_id: string | null;
    } | null;
    if (!report || report.status !== "open") return DECIDED;
    const kind = parseReportKind(report.kind);
    if (!askableProof({ kind, canAsk: Boolean(report.reporter_email) })) {
      return {
        ok: false,
        code: "validation",
        message:
          kind === INSTANT_HIDE_KIND
            ? "Proof is never asked of this kind of report."
            : "This reporter confirmed no address, so there is no one to ask.",
      };
    }
    const event = report.event_id
      ? await mustQuery(
          admin
            .from("events")
            .select("name")
            .eq("id", report.event_id)
            .maybeSingle(),
          "admin reports: proof event",
        )
      : null;

    const token = newProofToken();
    const askedAt = new Date().toISOString();
    const written = await mustQuery(
      seamFrom(admin, "reports")
        .update({
          proof_asked_at: askedAt,
          proof_question: asked,
          proof_token_hash: proofTokenHash(token),
          proof_answered_at: null,
          proof_answer: null,
        })
        .eq("id", report.id)
        .eq("status", "open")
        .select("id"),
      "admin reports: proof ask",
    );
    if (!written || written.length === 0) return DECIDED;

    const mail = reportProofAskEmail({
      eventName: event?.name ?? "an album",
      question: asked,
      answerUrl: `${SITE_URL}/report/${token}`,
    });
    try {
      await sendOnce({
        kind: "report_proof",
        dedupeKey: `${report.id}:${askedAt}`,
        to: report.reporter_email!,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
    } catch (e) {
      // The mail never went: take the ask back, so the report never says it asked.
      await seamFrom(admin, "reports")
        .update({
          proof_asked_at: null,
          proof_question: null,
          proof_token_hash: null,
        })
        .eq("id", report.id)
        .eq("proof_asked_at", askedAt);
      captureError("admin", e, { action: "ask_proof_send", reportId: id.data });
      return failed("Couldn't send the question. Please try again.");
    }
  } catch (e) {
    captureError("admin", e, { action: "ask_proof", reportId: id.data });
    return failed("Couldn't ask for proof. Please try again.");
  }

  revalidatePath("/admin/reports");
  return { ok: true };
}
