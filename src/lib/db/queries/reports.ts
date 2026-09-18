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

  let query = admin
    .from("reports")
    .select("id, reason, created_at, status, resolved_at, event_id, media_id")
    .order("created_at", { ascending: false });
  if (filter === "open") query = query.eq("status", "open");

  const { data: reports, error } = await query;
  if (error) throw error;
  if (!reports || reports.length === 0) return [];

  const eventIds = [...new Set(reports.map((r) => r.event_id))];
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
    event: eventById.get(r.event_id) ?? null,
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
