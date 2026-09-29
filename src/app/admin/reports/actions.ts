"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { type ActionResult } from "@/app/(app)/dashboard/actions";
import {
  type HoldScope,
  normalizeNote,
  PAST_WINDOW_MESSAGE,
  reopenFloor,
  REPORT_NOTE_MAX,
  wayBackOf,
  withinReopenWindow,
} from "@/lib/admin/reports";
import { requireAdminAction } from "@/lib/auth/admin-context";
import { readAllPages } from "@/lib/db/read-all";
import { formatCount } from "@/lib/format/count";
import { preserveMedia } from "@/lib/forensics/preserve";
import {
  adoptionUpdate,
  removalUpdate,
  restoreUpdate,
} from "@/lib/moderation/operator-actions";
import { captureError, captureWarning } from "@/lib/observability/sentry";
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

type Admin = ReturnType<typeof createAdminClient>;

const reportIdSchema = z.uuid();

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

function failed(message: string): ActionResult {
  return { ok: false, code: "unknown", message };
}

function revalidate() {
  revalidatePath("/admin/reports");
  // A removal or a restore changes what Albums shows too.
  revalidatePath("/admin/albums", "layout");
}

export async function dismissReportAction(
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
  const { data, error } = await admin
    .from("reports")
    .update({
      status: "dismissed",
      resolved_by: auth.ctx.userId,
      resolved_at: new Date().toISOString(),
      resolution_note: written.note,
    })
    .eq("id", id.data)
    .eq("status", "open")
    .select("id");

  if (error) {
    captureError("admin", new Error(error.message), {
      action: "dismiss_report",
      reportId: id.data,
    });
    return failed("Couldn't dismiss the report. Please try again.");
  }
  if (!data || data.length === 0) return DECIDED;

  revalidatePath("/admin/reports");
  return { ok: true };
}

/**
 * THE DISMISSAL'S WAY BACK (build 19's red-team; `closed=window`): a report an operator dismissed
 * reopens inside the product's own window, from the toast's Undo or its closed line. Dismiss is one
 * press with no confirm, so this is where a slip is caught; a dismissal touched nothing but the
 * report, so reopening it is the whole of its undo (the verdict's note goes with it, as a removal's
 * Undo clears its own).
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

  const admin = createAdminClient();
  const { data: report, error: readErr } = await admin
    .from("reports")
    .select("id, status, resolved_at")
    .eq("id", id.data)
    .maybeSingle();
  if (readErr) {
    captureError("admin", new Error(readErr.message), {
      action: "reopen_report_read",
      reportId: id.data,
    });
    return failed("Couldn't read the report. Please try again.");
  }
  if (!report) return failed("That report no longer exists.");
  if (report.status === "open") {
    revalidatePath("/admin/reports");
    return { ok: true };
  }
  if (report.status !== "dismissed") return DECIDED;
  const now = Date.now();
  if (!withinReopenWindow(report.resolved_at, now)) {
    return { ok: false, code: "validation", message: PAST_WINDOW_MESSAGE };
  }

  const { data, error } = await admin
    .from("reports")
    .update({
      status: "open",
      resolved_by: null,
      resolved_at: null,
      resolution_note: null,
    })
    .eq("id", id.data)
    .eq("status", "dismissed")
    .gte("resolved_at", reopenFloor(now))
    .select("id");
  if (error) {
    captureError("admin", new Error(error.message), {
      action: "reopen_report",
      reportId: id.data,
    });
    return failed("Couldn't reopen the report. Please try again.");
  }
  if (!data || data.length === 0) return DECIDED;

  revalidatePath("/admin/reports");
  return { ok: true };
}

/**
 * The verdict that acts (`verdict=note`): for an item report, the item is taken down as an
 * OPERATOR's removal, then the report closes as Actioned with its note; for an album or a person,
 * the report only closes (the album and the account are acted on out of band).
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
  const { data: report, error: readErr } = await admin
    .from("reports")
    .select("id, status, media_id")
    .eq("id", id.data)
    .maybeSingle();
  if (readErr) {
    captureError("admin", new Error(readErr.message), {
      action: "action_report_read",
      reportId: id.data,
    });
    return failed("Couldn't read the report. Please try again.");
  }
  if (!report) return failed("That report no longer exists.");
  if (report.status !== "open") return DECIDED;

  const at = new Date();
  if (report.media_id) {
    // Removal first, the report second: a failure between them leaves the item down and the
    // report open, which the operator sees and presses again, never a report that says Actioned
    // over an item still up.
    const removed = await admin
      .from("media")
      .update(removalUpdate(at))
      .eq("id", report.media_id)
      .neq("status", "removed");
    const adopted = removed.error
      ? removed
      : await admin
          .from("media")
          .update(adoptionUpdate())
          .eq("id", report.media_id)
          .eq("status", "removed")
          .eq("removed_by_admin", false);
    const mErr = removed.error ?? adopted.error;
    if (mErr) {
      captureError("admin", new Error(mErr.message), {
        action: "remove_media",
        reportId: id.data,
        mediaId: report.media_id,
      });
      return failed("Couldn't remove the reported item. Please try again.");
    }
  }

  const { data, error } = await admin
    .from("reports")
    .update({
      status: "actioned",
      resolved_by: auth.ctx.userId,
      resolved_at: at.toISOString(),
      resolution_note: written.note,
    })
    .eq("id", id.data)
    .eq("status", "open")
    .select("id");

  if (error) {
    captureError("admin", new Error(error.message), {
      action: "action_report",
      reportId: id.data,
    });
    return failed("Couldn't update the report. Please try again.");
  }
  if (!data || data.length === 0) return DECIDED;

  revalidate();
  return { ok: true };
}

/**
 * THE WAY BACK (`closed=window`): an actioned report whose own removal still waits out its window
 * reopens, and its item returns to where it was (the provenance trigger lands it on the status it
 * held). Reopen first, restore second: a failure between leaves an open report over an item still
 * down, which is the state a Remove starts from, never an Actioned report over an item back up.
 */
export async function undoReportAction(
  reportId: string,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;
  const id = reportIdSchema.safeParse(reportId);
  if (!id.success) return INVALID;

  const admin = createAdminClient();
  const { data: report, error: readErr } = await admin
    .from("reports")
    .select("id, status, media_id, resolved_at")
    .eq("id", id.data)
    .maybeSingle();
  if (readErr) {
    captureError("admin", new Error(readErr.message), {
      action: "undo_report_read",
      reportId: id.data,
    });
    return failed("Couldn't read the report. Please try again.");
  }
  if (!report || report.status !== "actioned" || !report.media_id) {
    return failed("There is nothing to undo on that report.");
  }

  const { data: item, error: itemErr } = await admin
    .from("media")
    .select("id, status, removed_by_admin, removed_at, legal_hold_at")
    .eq("id", report.media_id)
    .maybeSingle();
  if (itemErr) {
    captureError("admin", new Error(itemErr.message), {
      action: "undo_report_item",
      reportId: id.data,
    });
    return failed("Couldn't read the reported item. Please try again.");
  }
  const way = wayBackOf(
    {
      status: report.status,
      resolvedAt: report.resolved_at,
      item: item
        ? {
            status: item.status,
            removedByAdmin: item.removed_by_admin,
            removedAt: item.removed_at,
            held: item.legal_hold_at !== null,
          }
        : null,
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
    .eq("id", id.data)
    .eq("status", "actioned")
    .select("id");
  if (reopenErr) {
    captureError("admin", new Error(reopenErr.message), {
      action: "undo_report_reopen",
      reportId: id.data,
    });
    return failed("Couldn't reopen the report. Please try again.");
  }
  if (!reopened || reopened.length === 0) return DECIDED;

  // Only this removal, and never a held row: the guards are in the write, not only in the read.
  const { data: restored, error: restoreErr } = await admin
    .from("media")
    .update(restoreUpdate())
    .eq("id", report.media_id)
    .eq("status", "removed")
    .eq("removed_by_admin", true)
    .is("legal_hold_at", null)
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

/* ── Hold for forensics, from the report (`escalate=door`) ─────────────────── */

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
): Promise<
  { ok: true; scope: HoldScope } | Extract<ActionResult, { ok: false }>
> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result as Extract<ActionResult, { ok: false }>;
  const id = reportIdSchema.safeParse(reportId);
  if (!id.success) return INVALID as Extract<ActionResult, { ok: false }>;
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
 */
export async function holdFromReportAction(
  reportId: string,
  reason: string,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;
  const id = reportIdSchema.safeParse(reportId);
  if (!id.success) return INVALID;
  const why = typeof reason === "string" ? reason.trim() : "";
  if (!why)
    return {
      ok: false,
      code: "validation",
      message: "A hold reason is required.",
    };
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

  revalidatePath("/admin/reports");
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
    `Held and preserved ${formatCount(held)} of ${formatCount(total)} items. Press Hold for forensics again for the rest; each failure is in the audit log on Forensics.`,
  );
}
