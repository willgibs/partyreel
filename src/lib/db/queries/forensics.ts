/**
 * Admin reads for the forensics surface (`/admin/forensics`). upload_forensics,
 * forensic_audit_log, and media.legal_hold_* are deny-all / service-role territory, so every read
 * goes through the admin client (the portal is gated by requireAdmin + AAL2 upstream). Powers the
 * capture-coverage health signal, the holds list, and the audit trail.
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import type { SupabaseClient } from "@supabase/supabase-js";

// SEAM: the new tables/columns aren't in the generated Database types until the orchestrator
// regenerates post-apply; these local row shapes are superseded by src/lib/db/types.ts then.
type UntypedAdmin = SupabaseClient;

export type ForensicsHealth = {
  /** Uploads recorded in the last 24h (media rows). */
  uploads24h: number;
  /** Forensic rows captured in the last 24h — should track uploads24h; a gap is the alarm. */
  captured24h: number;
  activeHolds: number;
  auditErrors24h: number;
};

export async function getForensicsHealth(): Promise<ForensicsHealth> {
  const admin = createAdminClient() as UntypedAdmin;
  const since = new Date(Date.now() - 86_400_000).toISOString();

  const [uploads, captured, holds, auditErrors] = await Promise.all([
    admin
      .from("media")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    admin
      .from("upload_forensics")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since)
      // Only rows the UPLOAD SEAM wrote count as coverage; preserve-created rows for
      // pre-capture uploads carry no request facts (user_agent is the reliable marker —
      // every real browser sends one).
      .not("user_agent", "is", null),
    admin
      .from("media")
      .select("id", { count: "exact", head: true })
      .not("legal_hold_at", "is", null),
    admin
      .from("forensic_audit_log")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since)
      .eq("outcome", "error"),
  ]);

  return {
    uploads24h: uploads.count ?? 0,
    captured24h: captured.count ?? 0,
    activeHolds: holds.count ?? 0,
    auditErrors24h: auditErrors.count ?? 0,
  };
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

/** Every media row under an active legal hold, with its preservation state. */
export async function listHeldMedia(): Promise<HeldMediaRow[]> {
  const admin = createAdminClient() as UntypedAdmin;
  const { data, error } = await admin
    .from("media")
    .select("id, event_id, status, legal_hold_at, legal_hold_reason")
    .not("legal_hold_at", "is", null)
    .order("legal_hold_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const mediaIds = rows.map((r: { id: string }) => r.id);
  const eventIds = [...new Set(rows.map((r: { event_id: string }) => r.event_id))];

  const [{ data: forensics }, { data: events }] = await Promise.all([
    admin
      .from("upload_forensics")
      .select("media_id, preserved_at")
      .in("media_id", mediaIds),
    admin.from("events").select("id, name").in("id", eventIds),
  ]);
  const preservedBy = new Map<string, string | null>(
    (forensics ?? []).map((f: { media_id: string; preserved_at: string | null }) => [
      f.media_id,
      f.preserved_at,
    ]),
  );
  const names = new Map<string, string>(
    (events ?? []).map((e: { id: string; name: string }) => [e.id, e.name]),
  );

  return rows.map(
    (r: {
      id: string;
      event_id: string;
      status: string;
      legal_hold_at: string;
      legal_hold_reason: string | null;
    }) => ({
      id: r.id,
      eventId: r.event_id,
      eventName: names.get(r.event_id) ?? null,
      status: r.status,
      heldAt: r.legal_hold_at,
      holdReason: r.legal_hold_reason,
      preservedAt: preservedBy.get(r.id) ?? null,
    }),
  );
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
export async function listForensicAudit(limit = 50): Promise<ForensicAuditRow[]> {
  const admin = createAdminClient() as UntypedAdmin;
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
