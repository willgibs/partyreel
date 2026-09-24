/**
 * Admin reads for the forensics surface (`/admin/forensics`). upload_forensics,
 * forensic_audit_log, and media.legal_hold_* are deny-all / service-role territory, so every read
 * goes through the admin client (the portal is gated by requireAdmin + AAL2 upstream). Powers the
 * capture-coverage health signal, the holds list, and the audit trail.
 *
 * ★ EVERY HOLD, EVERY FAILURE LOUD (the 1,000-row round, 2026-09-23). The holds list pages on its
 * own order and its lookups ride `inChunks`, where one read stopped at 1,000 holds and two `.in()`
 * lists carried every held id in a URL; and a failed read THROWS, where the health counts read a
 * failure as a confident zero and the lookups dropped their errors, so a hold could render with no
 * event name or no preservation state and nothing said why.
 */
import "server-only";

import { mustCount, mustQuery } from "@/lib/db/must-query";
import { inChunks, readAllPages } from "@/lib/db/read-all";
import { createAdminClient } from "@/lib/supabase/admin";

export type ForensicsHealth = {
  /** Uploads recorded in the last 24h (media rows). */
  uploads24h: number;
  /** Forensic rows captured in the last 24h — should track uploads24h; a gap is the alarm. */
  captured24h: number;
  activeHolds: number;
  auditErrors24h: number;
};

export async function getForensicsHealth(): Promise<ForensicsHealth> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 86_400_000).toISOString();

  // A failed count THROWS (mustCount): a health signal that reads an unreachable table as zero
  // reports "healthy" exactly when it cannot know.
  const [uploads24h, captured24h, activeHolds, auditErrors24h] =
    await Promise.all([
      mustCount(
        admin
          .from("media")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since),
        "admin forensics: uploads (24h)",
      ),
      mustCount(
        admin
          .from("upload_forensics")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since)
          // Only rows the UPLOAD SEAM wrote count as coverage; preserve-created rows for
          // pre-capture uploads carry no request facts (user_agent is the reliable marker —
          // every real browser sends one).
          .not("user_agent", "is", null),
        "admin forensics: captured (24h)",
      ),
      mustCount(
        admin
          .from("media")
          .select("id", { count: "exact", head: true })
          .not("legal_hold_at", "is", null),
        "admin forensics: active holds",
      ),
      mustCount(
        admin
          .from("forensic_audit_log")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since)
          .eq("outcome", "error"),
        "admin forensics: failed actions (24h)",
      ),
    ]);

  return { uploads24h, captured24h, activeHolds, auditErrors24h };
}

export type HeldMediaRow = {
  id: string;
  eventId: string;
  eventName: string | null;
  status: string;
  heldAt: string;
  holdReason: string | null;
  preservedAt: string | null;
};

/**
 * Every media row under an active legal hold, with its preservation state: newest hold first, read
 * whole on (legal_hold_at desc, id desc), then each hold's preservation state and event name looked
 * up at most 150 ids a request.
 */
export async function listHeldMedia(): Promise<HeldMediaRow[]> {
  const admin = createAdminClient();
  const { rows } = await readAllPages(
    "admin forensics: held media",
    (after: { at: string; id: string } | null, limit) => {
      let q = admin
        .from("media")
        .select("id, event_id, status, legal_hold_at, legal_hold_reason")
        .not("legal_hold_at", "is", null)
        .order("legal_hold_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit);
      if (after) {
        q = q.or(
          `legal_hold_at.lt.${after.at},and(legal_hold_at.eq.${after.at},id.lt.${after.id})`,
        );
      }
      return q;
    },
    (row) => ({ at: heldAt(row), id: row.id }),
  );
  if (rows.length === 0) return [];

  const [forensics, events] = await Promise.all([
    inChunks(
      "admin forensics: preservation state",
      rows.map((r) => r.id),
      async (chunk) => {
        // row-cap: upload_forensics.media_id is unique (upload_forensics_media_idx), so a chunk of media ids reads at most one row an id
        return (
          (await mustQuery(
            admin
              .from("upload_forensics")
              .select("media_id, preserved_at")
              .in("media_id", chunk),
            "admin forensics: preservation state",
          )) ?? []
        );
      },
    ),
    inChunks(
      "admin forensics: held events",
      rows.map((r) => r.event_id),
      async (chunk) =>
        (await mustQuery(
          admin.from("events").select("id, name").in("id", chunk),
          "admin forensics: held events",
        )) ?? [],
    ),
  ]);
  const preservedBy = new Map<string, string | null>(
    forensics.map((f) => [f.media_id, f.preserved_at]),
  );
  const names = new Map<string, string>(events.map((e) => [e.id, e.name]));

  return rows.map((r) => ({
    id: r.id,
    eventId: r.event_id,
    eventName: names.get(r.event_id) ?? null,
    status: r.status,
    heldAt: heldAt(r),
    holdReason: r.legal_hold_reason,
    preservedAt: preservedBy.get(r.id) ?? null,
  }));
}

/** A held row's hold stamp: the list's filter guarantees one, and a cursor without it could not advance. */
function heldAt(row: { id: string; legal_hold_at: string | null }): string {
  if (!row.legal_hold_at) {
    throw new Error(`admin forensics: held media ${row.id} has no legal_hold_at`);
  }
  return row.legal_hold_at;
}

export type ForensicAuditRow = {
  id: string;
  createdAt: string;
  action: string;
  mediaId: string | null;
  outcome: string;
  error: string | null;
};

/** The recent preserve/export/hold audit trail, newest-first. */
export async function listForensicAudit(
  limit = 50,
): Promise<ForensicAuditRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("forensic_audit_log")
    .select("id, created_at, action, media_id, outcome, error")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(
    (r: {
      id: string;
      created_at: string;
      action: string;
      media_id: string | null;
      outcome: string;
      error: string | null;
    }) => ({
      id: r.id,
      createdAt: r.created_at,
      action: r.action,
      mediaId: r.media_id,
      outcome: r.outcome,
      error: r.error,
    }),
  );
}
