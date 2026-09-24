/**
 * Operator-internal report reads for /admin/reports. Uses the SERVICE-ROLE admin client
 * (bypasses the reports table's deny-all RLS by design — reports are operator-internal; hosts
 * must NOT see reports on their own events). The page gates on requireAdmin() before calling this.
 *
 * Reported media is presigned HERE (server-side) so the operator can see the content — raw R2
 * keys never reach the browser (uploads-and-r2.md). Events + media are fetched in batched `.in()` lookups
 * rather than PostgREST embeds to keep the shapes flat and the nullable media_id easy to reason about.
 *
 * ★ THE NEWEST FEW, THEIR LOOKUPS CHUNKED (the 1,000-row round, 2026-09-23). Each queue reads the
 * newest `show` reports and knows whether there are more (`lib/admin/list-depth.ts`, the page says so),
 * where it read every report and ended silently at the thousandth; its event, media and profile
 * lookups ride `inChunks` (at most 150 ids a URL), where one `.in()` carried every id; and the
 * presigns run in parallel. The count behind the rail's badge is a HEAD count, and the operator
 * queue's "oldest waiting" one row ordered oldest first.
 */
import "server-only";

import { readNewest } from "@/lib/admin/list-depth";
import { mustQuery } from "@/lib/db/must-query";
import { inChunks } from "@/lib/db/read-all";
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

/** A page's cursor on a newest-first queue: the last report's raw timestamp string and its id. */
type NewestFirst = { at: string; id: string } | null;

/** The newest `show` album reports, and whether the queue holds more. */
export async function listReports(
  filter: ReportFilter,
  show: number,
): Promise<{ reports: ReviewReport[]; more: boolean }> {
  const admin = createAdminClient();

  // ★ THE ALBUM ARM ONLY. Since 20260919130000 a report may name a PERSON
  // instead of an event (Will, `block=report`), and those rows carry no event,
  // no media and nothing to presign: listProfileReports below is their read and
  // the page renders them in their own section. Filtering here rather than
  // letting a null event_id fall through keeps this function's shape honest.
  const { rows: reports, more } = await readNewest(
    "admin reports: album reports",
    show,
    (after: NewestFirst, limit) => {
      let q = admin
        .from("reports")
        .select(
          "id, reason, created_at, status, resolved_at, event_id, media_id",
        )
        .not("event_id", "is", null)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit);
      if (filter === "open") q = q.eq("status", "open");
      if (after) {
        q = q.or(
          `created_at.lt.${after.at},and(created_at.eq.${after.at},id.lt.${after.id})`,
        );
      }
      return q;
    },
    (row) => ({ at: row.created_at, id: row.id }),
  );
  if (reports.length === 0) return { reports: [], more };

  const eventIds = reports.flatMap((r) => (r.event_id ? [r.event_id] : []));
  const mediaIds = reports.flatMap((r) => (r.media_id ? [r.media_id] : []));

  const [events, media] = await Promise.all([
    inChunks("admin reports: events", eventIds, async (chunk) =>
      (await mustQuery(
        admin.from("events").select("id, name").in("id", chunk),
        "admin reports: events",
      )) ?? [],
    ),
    inChunks("admin reports: media", mediaIds, async (chunk) =>
      (await mustQuery(
        admin.from("media").select("id, type, original_key").in("id", chunk),
        "admin reports: media",
      )) ?? [],
    ),
  ]);
  const eventById = new Map(events.map((e) => [e.id, e]));

  // Every presign at once: each is a local signature, and signing them one after another made a
  // long queue wait on the slowest sum of them for nothing.
  const signed = await Promise.all(
    media.map(async (m) => ({
      id: m.id,
      type: m.type,
      url: await presignDownload({ key: m.original_key }),
    })),
  );
  const mediaById = new Map(signed.map((m) => [m.id, m]));

  return {
    reports: reports.map((r) => ({
      id: r.id,
      reason: r.reason,
      created_at: r.created_at,
      status: r.status,
      resolved_at: r.resolved_at,
      event: r.event_id ? (eventById.get(r.event_id) ?? null) : null,
      media: r.media_id ? (mediaById.get(r.media_id) ?? null) : null,
    })),
    more,
  };
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

/**
 * When the oldest OPEN report arrived, either arm, or null when none is open: one row, oldest
 * first, the same set `countOpenReports` counts.
 */
export async function oldestOpenReportAt(): Promise<string | null> {
  const row = await mustQuery(
    createAdminClient()
      .from("reports")
      .select("created_at")
      .eq("status", "open")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle(),
    "admin reports: oldest open",
  );
  return row?.created_at ?? null;
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
 * Reported PEOPLE, for the person section of /admin/reports: the newest `show`, and whether there
 * are more. The operator gets the name, the handle (which the page turns into a link to the live
 * profile) and the reason: everything needed to look and decide, and nothing about the reporter,
 * who is not stored.
 *
 * Same service-role read as listReports over the same deny-all table, and the
 * same batched `.in()` lookup rather than an embed (reports now carries two
 * profiles-adjacent FKs, profile_id and resolved_by, so a bare embed would be
 * PGRST201-ambiguous).
 *
 * reports.profile_id arrived with migration 20260919130000 (applied 2026-09-19).
 */
export async function listProfileReports(
  filter: ReportFilter,
  show: number,
): Promise<{ reports: ReviewProfileReport[]; more: boolean }> {
  const admin = createAdminClient();

  const { rows, more } = await readNewest(
    "admin reports: person reports",
    show,
    (after: NewestFirst, limit) => {
      let q = admin
        .from("reports")
        .select("id, reason, created_at, status, resolved_at, profile_id")
        .not("profile_id", "is", null)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit);
      if (filter === "open") q = q.eq("status", "open");
      if (after) {
        q = q.or(
          `created_at.lt.${after.at},and(created_at.eq.${after.at},id.lt.${after.id})`,
        );
      }
      return q;
    },
    (row) => ({ at: row.created_at, id: row.id }),
  );
  // The filter above leaves no row without a profile id; narrowed here for the type.
  const reports = rows.flatMap((r) =>
    r.profile_id ? [{ ...r, profile_id: r.profile_id }] : [],
  );
  if (reports.length === 0) return { reports: [], more };

  const profiles = await inChunks(
    "admin reports: reported profiles",
    reports.map((r) => r.profile_id),
    async (chunk) =>
      (await mustQuery(
        admin.from("profiles").select("id, display_name, slug").in("id", chunk),
        "admin reports: reported profiles",
      )) ?? [],
  );
  const byId = new Map(
    profiles.map((p) => [
      p.id,
      { id: p.id, displayName: p.display_name, slug: p.slug },
    ]),
  );

  return {
    reports: reports.map((r) => ({
      id: r.id,
      reason: r.reason,
      created_at: r.created_at,
      status: r.status,
      resolved_at: r.resolved_at,
      profile: byId.get(r.profile_id) ?? null,
    })),
    more,
  };
}
