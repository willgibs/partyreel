/**
 * Operator-internal report reads for /admin/reports. Uses the SERVICE-ROLE admin client
 * (bypasses the reports table's deny-all RLS by design — reports are operator-internal; hosts
 * must NOT see reports on their own events). The page gates on requireAdmin() before calling this.
 *
 * Reported media is presigned HERE (server-side) so the operator can see the content — raw R2
 * keys never reach the browser (uploads-and-r2.md). Events + media are fetched in batched `.in()` lookups
 * rather than PostgREST embeds to keep the shapes flat and the nullable media_id easy to reason about.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";
import { presignDownload } from "@/lib/r2/presign";
import { createAdminClient } from "@/lib/supabase/admin";

export type ReportStatus = Database["public"]["Enums"]["report_status"];

/** "open" = the active queue; "all" = full history (resolved rows render read-only in the UI). */
export type ReportFilter = "open" | "all";

export type ReviewReport = {
  id: string;
  reason: string | null;
  created_at: string;
  status: ReportStatus;
  resolved_at: string | null;
  event: { id: string; name: string } | null;
  media: {
    id: string;
    type: "photo" | "video";
    /** Short-lived presigned URL for operator review; never a raw key. */
    url: string;
  } | null;
};

export async function listReports(
  filter: ReportFilter = "open",
): Promise<ReviewReport[]> {
  const admin = createAdminClient();

  // ★ THE ALBUM ARM ONLY. Since 20260919130000 a report may name a PERSON
  // instead of an event (Will, `block=report`), and those rows carry no event,
  // no media and nothing to presign: listProfileReports below is their read and
  // the page renders them in their own section. Filtering here rather than
  // letting a null event_id fall through keeps this function's shape honest.
  let query = admin
    .from("reports")
    .select("id, reason, created_at, status, resolved_at, event_id, media_id")
    .not("event_id", "is", null)
    .order("created_at", { ascending: false });
  if (filter === "open") query = query.eq("status", "open");

  const { data: reports, error } = await query;
  if (error) throw error;
  if (!reports || reports.length === 0) return [];

  const eventIds = [
    ...new Set(
      reports
        .map((r) => r.event_id)
        .filter((id): id is string => id !== null),
    ),
  ];
  const mediaIds = [
    ...new Set(
      reports.map((r) => r.media_id).filter((id): id is string => id !== null),
    ),
  ];

  const { data: events, error: eErr } = await admin
    .from("events")
    .select("id, name")
    .in("id", eventIds);
  if (eErr) throw eErr;
  const eventById = new Map((events ?? []).map((e) => [e.id, e]));

  const mediaById = new Map<
    string,
    { id: string; type: "photo" | "video"; url: string }
  >();
  if (mediaIds.length > 0) {
    const { data: media, error: mErr } = await admin
      .from("media")
      .select("id, type, original_key")
      .in("id", mediaIds);
    if (mErr) throw mErr;
    for (const m of media ?? []) {
      mediaById.set(m.id, {
        id: m.id,
        type: m.type,
        url: await presignDownload({ key: m.original_key }),
      });
    }
  }

  return reports.map((r) => ({
    id: r.id,
    reason: r.reason,
    created_at: r.created_at,
    status: r.status,
    resolved_at: r.resolved_at,
    event: r.event_id ? (eventById.get(r.event_id) ?? null) : null,
    media: r.media_id ? (mediaById.get(r.media_id) ?? null) : null,
  }));
}

/** Open-report count for the Overview badge. Cheap head+count query. */
export async function countOpenReports(): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");
  if (error) throw error;
  return count ?? 0;
}

// ── Person reports (the /u/[slug] menu's first row) ──────────────────────────

export type ReviewProfileReport = {
  id: string;
  reason: string | null;
  created_at: string;
  status: ReportStatus;
  resolved_at: string | null;
  /** Null only if the reported account was deleted between the report and the
   *  read (the FK cascades, so this is a race window, not a steady state). */
  profile: { id: string; displayName: string | null; slug: string | null } | null;
};

/**
 * Reported PEOPLE, for the person section of /admin/reports. The operator gets
 * the name, the handle (which the page turns into a link to the live profile)
 * and the reason: everything needed to look and decide, and nothing about the
 * reporter, who is not stored.
 *
 * Same service-role read as listReports over the same deny-all table, and the
 * same batched `.in()` lookup rather than an embed (reports now carries two
 * profiles-adjacent FKs, profile_id and resolved_by, so a bare embed would be
 * PGRST201-ambiguous).
 *
 * ★ Pre-regen typing seam: reports.profile_id lands with 20260919130000 and
 * src/lib/db/types.ts is generated by the Orchestrator afterwards, so this read
 * goes through the untyped client until then. Drop the cast at that point.
 */
export async function listProfileReports(
  filter: ReportFilter = "open",
): Promise<ReviewProfileReport[]> {
  const admin = createAdminClient();

  let query = (admin as unknown as SupabaseClient)
    .from("reports")
    .select("id, reason, created_at, status, resolved_at, profile_id")
    .not("profile_id", "is", null)
    .order("created_at", { ascending: false });
  if (filter === "open") query = query.eq("status", "open");

  const { data, error } = await query;
  if (error) throw error;
  const reports = (data ?? []) as {
    id: string;
    reason: string | null;
    created_at: string;
    status: ReportStatus;
    resolved_at: string | null;
    profile_id: string;
  }[];
  if (reports.length === 0) return [];

  const { data: profiles, error: pErr } = await admin
    .from("profiles")
    .select("id, display_name, slug")
    .in("id", [...new Set(reports.map((r) => r.profile_id))]);
  if (pErr) throw pErr;
  const byId = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      { id: p.id, displayName: p.display_name, slug: p.slug },
    ]),
  );

  return reports.map((r) => ({
    id: r.id,
    reason: r.reason,
    created_at: r.created_at,
    status: r.status,
    resolved_at: r.resolved_at,
    profile: byId.get(r.profile_id) ?? null,
  }));
}
