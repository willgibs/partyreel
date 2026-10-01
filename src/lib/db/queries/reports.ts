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
 *
 * ★ EACH REPORT SAYS WHERE ITS ITEM STANDS NOW (admin-triage r1, 2026-09-28). A verdict's note
 * (`resolution_note`) comes back with it, and the reported item's standing (up, removed by someone
 * else, or an operator's removal) and whether it is held, because the confirm, the hold's door and
 * the closed line's Undo (`closed=window`) each say something different about each. The item's
 * timestamps stay here: the line's way back is decided on the server (`wayBackOf`, measured at the
 * page's one clock read) and only its answer goes to the browser, a dismissal's reopen included.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { readNewest } from "@/lib/admin/list-depth";
import {
  type AddressStrikes,
  addressStrikes,
  entryKeyOf,
  type EntrySubject,
  frontOrder,
  laneOf,
  newestFirst,
  type QueueLane,
  type ReportFilter,
  type ReportStatus,
  sameInstant,
  type StrikeReading,
  type StrikeRule,
  subjectOf,
  type WayBack,
  wayBackOf,
} from "@/lib/admin/reports";
import { mustCount, mustQuery, QueryFailedError } from "@/lib/db/must-query";
import { inChunks, readAllPages } from "@/lib/db/read-all";
import type { Tables } from "@/lib/db/types";
import {
  resolveUploaderIdentity,
  type UploaderRow,
} from "@/lib/media/uploader-identity";
import { presignDownload } from "@/lib/r2/presign";
import { reporterAddressHash } from "@/lib/reports/reporter.server";
import {
  INSTANT_HIDE_KIND,
  isCoveredKind,
  parseReportKind,
  REPORT_KINDS,
  type ReportKind,
  worstKind,
} from "@/lib/reports/kinds";
import { createAdminClient } from "@/lib/supabase/admin";

export type { ReportFilter, ReportStatus } from "@/lib/admin/reports";

/** Where a reported item stands now: still up (any live status), removed by someone else, or an operator's removal. */
export type ItemStanding = "live" | "removed" | "operator";

/**
 * ★ WHAT A REPORT NAMED, ONCE ITS ITEM IS GONE (crumbs-21, migration 20260929231000). A report keeps the id
 * of the item it named, and whether it was a photo or a video, after the item's row is purged (a removal's
 * window ending, a withdrawal, a Delete permanently, each once the report closed), so it reads as that
 * item's report, never as its album's. `type` is null only while the kind cannot be read yet (the
 * migration unapplied: `readNamedKinds`).
 */
export type DeletedItem = { id: string; type: "photo" | "video" | null };

export type ReviewReport = {
  id: string;
  reason: string | null;
  created_at: string;
  status: ReportStatus;
  resolved_at: string | null;
  /** The verdict's note (`verdict=note`), or null when none was written. */
  resolution_note: string | null;
  event: { id: string; name: string } | null;
  media: {
    id: string;
    type: "photo" | "video";
    /**
     * ★ THE WORST KINDS STAY COVERED WHEREVER THEY APPEAR (build 23's NIT-7): an item any report names as one
     * of the covered kinds (`isCoveredKind`, open or closed) carries no picture here at all, so the closed
     * log draws its cover and never loads a frame. Only the open queue's View once shows one.
     */
    covered: boolean;
    /** Short-lived presigned URL for operator review; never a raw key. Null while covered. */
    url: string | null;
    /** The small preview, for a closed report's thumbnail; null when the upload made none, or while covered. */
    previewUrl: string | null;
    standing: ItemStanding;
    /** Under a legal hold: the door reads Held, and a closed line offers no Undo. */
    held: boolean;
  } | null;
  /** The item it named, when that item's row is gone (`media` is then null); absent on an album report. */
  deleted?: DeletedItem | null;
  /** A closed report's way back (`closed=window`), decided here from the item's own row. */
  wayBack: WayBack;
};

/** A page's cursor on a newest-first queue: the last report's raw timestamp string and its id. */
type NewestFirst = { at: string; id: string } | null;

/** The rows a filter reads: one of the three words, or every report. */
function statusFilter(filter: ReportFilter): ReportStatus | null {
  return filter === "all" ? null : filter;
}

type MediaRow = {
  id: string;
  type: "photo" | "video";
  original_key: string;
  preview_key: string | null;
  status: "pending" | "approved" | "hidden" | "removed";
  removed_by_admin: boolean;
  removed_at: string | null;
  legal_hold_at: string | null;
};

/**
 * The newest `show` album reports, and whether the queue holds more. `nowMs` is the page's one clock
 * read (`serverNow()`), the instant every closed line's window is measured from.
 */
export async function listReports(
  filter: ReportFilter,
  show: number,
  nowMs: number,
): Promise<{ reports: ReviewReport[]; more: boolean }> {
  const admin = createAdminClient();
  const only = statusFilter(filter);

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
          "id, reason, created_at, status, resolved_at, resolution_note, event_id, media_id",
        )
        .not("event_id", "is", null)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit);
      if (only) q = q.eq("status", only);
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

  const [events, media, covered] = await Promise.all([
    inChunks(
      "admin reports: events",
      eventIds,
      async (chunk) =>
        (await mustQuery(
          admin.from("events").select("id, name").in("id", chunk),
          "admin reports: events",
        )) ?? [],
    ),
    inChunks(
      "admin reports: media",
      mediaIds,
      async (chunk) =>
        (await mustQuery(
          admin
            .from("media")
            .select(
              "id, type, original_key, preview_key, status, removed_by_admin, removed_at, legal_hold_at",
            )
            .in("id", chunk),
          "admin reports: media",
        )) ?? [],
    ),
    readCoveredItems({ mediaIds }),
  ]);
  const eventById = new Map(events.map((e) => [e.id, e]));
  const rowById = new Map((media as MediaRow[]).map((m) => [m.id, m]));
  // An item report whose item's row is gone still names it (20260929231000): its kind, read apart.
  const gone = reports.filter((r) => r.media_id && !rowById.has(r.media_id));
  const kinds = await readNamedKinds(gone.map((r) => r.id));

  // Every presign at once: each is a local signature, and signing them one after another made a
  // long queue wait on the slowest sum of them for nothing. A covered item is never signed.
  const signed = await Promise.all(
    (media as MediaRow[]).map(async (m) => {
      const cover = covered.has(m.id);
      return {
        id: m.id,
        type: m.type,
        covered: cover,
        url: cover ? null : await presignDownload({ key: m.original_key }),
        previewUrl:
          cover || !m.preview_key
            ? null
            : await presignDownload({ key: m.preview_key }),
        standing: standingOf(m),
        held: m.legal_hold_at !== null && m.legal_hold_at !== undefined,
      };
    }),
  );
  const mediaById = new Map(signed.map((m) => [m.id, m]));

  return {
    reports: reports.map((r) => {
      const row = r.media_id ? rowById.get(r.media_id) : undefined;
      return {
        id: r.id,
        reason: r.reason,
        created_at: r.created_at,
        status: r.status,
        resolved_at: r.resolved_at,
        resolution_note: r.resolution_note ?? null,
        event: r.event_id ? (eventById.get(r.event_id) ?? null) : null,
        media: r.media_id ? (mediaById.get(r.media_id) ?? null) : null,
        deleted:
          r.media_id && !row
            ? { id: r.media_id, type: kinds.get(r.id) ?? null }
            : null,
        wayBack: wayBackOf(
          {
            status: r.status,
            resolvedAt: r.resolved_at,
            item: row
              ? {
                  status: row.status,
                  removedByAdmin: Boolean(row.removed_by_admin),
                  removedAt: row.removed_at ?? null,
                  held:
                    row.legal_hold_at !== null &&
                    row.legal_hold_at !== undefined,
                }
              : null,
          },
          nowMs,
        ),
      };
    }),
    more,
  };
}

function standingOf(
  m: Pick<MediaRow, "status" | "removed_by_admin">,
): ItemStanding {
  if (m.status !== "removed") return "live";
  return m.removed_by_admin ? "operator" : "removed";
}

/** The kinds that arrive covered, from their one pure home (`isCoveredKind`), for the read's own filter. */
const COVERED_KINDS: ReportKind[] = REPORT_KINDS.filter(isCoveredKind);

/**
 * ★ THE WORST KINDS STAY COVERED WHEREVER AN OPERATOR MEETS THEM (build 23's NIT-7, the albums grid since
 * crumbs-21), ONE HOME: which of these items any report, open or closed, names as a covered kind. The
 * inbox's closed log and the albums grid both read it, and neither signs a picture of what it answers
 * (only the open queue's View once shows one). Asked by the items a list holds (the inbox, the albums
 * feed) or by one album (its drill-in, every item at once). An item can be reported many times, so every
 * report is read whole.
 */
export async function readCoveredItems(
  scope: { mediaIds: readonly string[] } | { eventId: string },
): Promise<Set<string>> {
  const admin = createAdminClient();
  const named = (rows: { media_id: string | null }[]) =>
    new Set(rows.flatMap((r) => (r.media_id ? [r.media_id] : [])));
  if ("eventId" in scope) {
    const { rows } = await readAllPages(
      "admin: an album's covered items",
      (after: string | null, limit) => {
        // row-cap: COVERED_KINDS is a constant subset of the six report kinds (isCoveredKind), never a runtime id list
        let q = admin
          .from("reports")
          .select("id, media_id")
          .eq("event_id", scope.eventId)
          .not("media_id", "is", null)
          .in("kind", COVERED_KINDS)
          .order("id", { ascending: true })
          .limit(limit);
        if (after) q = q.gt("id", after);
        return q;
      },
      (report) => report.id,
    );
    return named(rows);
  }
  const rows = await inChunks(
    "admin: covered items",
    scope.mediaIds,
    async (chunk) =>
      (
        await readAllPages(
          "admin: covered items",
          (after: string | null, limit) => {
            // row-cap: COVERED_KINDS is a constant subset of the six report kinds (isCoveredKind), never a runtime id list
            let q = admin
              .from("reports")
              .select("id, media_id")
              .in("media_id", chunk)
              .in("kind", COVERED_KINDS)
              .order("id", { ascending: true })
              .limit(limit);
            if (after) q = q.gt("id", after);
            return q;
          },
          (report) => report.id,
        )
      ).rows,
  );
  return named(rows);
}

/** A column this code reads before its migration stands answers one of these (the seam below). */
const NOT_PROVISIONED = new Set(["42703", "PGRST204"]);

/**
 * THE KIND OF THE GONE ITEM EACH OF THESE REPORTS NAMED (`reports.media_type`, 20260929231000), by report id.
 * ★ A SEAM ACROSS THE APPLY: the column is the migration's, so until it stands PostgREST answers an
 * undefined column, and this reads as kinds unknown (an empty map: the line says "an item") rather than
 * failing the whole inbox; any other failure throws. Asked only for reports whose item is gone, which is
 * rare. The cast holds until src/lib/db/types.ts is regenerated with the column.
 */
export async function readNamedKinds(
  reportIds: readonly string[],
): Promise<Map<string, "photo" | "video">> {
  const kinds = new Map<string, "photo" | "video">();
  if (reportIds.length === 0) return kinds;
  const admin = createAdminClient();
  let rows: { id: string; media_type: unknown }[];
  try {
    rows = await inChunks(
      "admin reports: what a report named",
      reportIds,
      async (chunk) =>
        ((await mustQuery(
          admin.from("reports").select("id, media_type").in("id", chunk),
          "admin reports: what a report named",
        )) ?? []) as unknown as { id: string; media_type: unknown }[],
    );
  } catch (e) {
    if (e instanceof QueryFailedError && NOT_PROVISIONED.has(e.code ?? "")) {
      return kinds;
    }
    throw e;
  }
  for (const r of rows) {
    if (r.media_type === "photo" || r.media_type === "video") {
      kinds.set(r.id, r.media_type);
    }
  }
  return kinds;
}

/** What `report_strikes` answers (20261001100000): the rule's numbers, and each asked address's reading. */
export type StrikesAnswer = {
  rule: StrikeRule;
  addresses: ReadonlyMap<string, StrikeReading>;
};

/** A function this code calls before its migration stands answers one of these (the seam below). */
const FUNCTION_NOT_PROVISIONED = new Set(["PGRST202", "42883"]);

/**
 * THE INSTANT HIDE'S STRIKES ON THESE ADDRESSES (`report_strikes`, 20261001100000): the rule's one home, which
 * `create_report` asks too, so the queue's line never counts by a copy of it. Keyed on the hashes the reports kept;
 * only counts and instants come back. ★ A SEAM ACROSS THE APPLY: until the function stands PostgREST answers that
 * it does not exist, and this reads as NO READING (null: the queue says nothing of strikes, never "no strikes")
 * rather than failing the queue; any other failure throws, as the queue's facts do. The cast holds until
 * src/lib/db/types.ts is regenerated with the function.
 */
export async function readStrikes(
  hashes: readonly string[],
): Promise<StrikesAnswer | null> {
  if (hashes.length === 0) return null;
  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data, error } = await admin.rpc("report_strikes", {
    p_reporter_hashes: [...new Set(hashes)],
  });
  if (error) {
    if (FUNCTION_NOT_PROVISIONED.has(error.code ?? "")) return null;
    throw new QueryFailedError("admin reports: strikes", error);
  }
  return parseStrikes(data);
}

/** The answer read defensively: a shape this code does not know is no reading, never a zero. */
function parseStrikes(data: unknown): StrikesAnswer | null {
  if (!data || typeof data !== "object") return null;
  const answer = data as Record<string, unknown>;
  const strikes = answer.strikes;
  const fresh = answer.fresh_lapses_at;
  const addresses = answer.addresses;
  if (
    typeof strikes !== "number" ||
    !Number.isInteger(strikes) ||
    strikes < 1 ||
    typeof fresh !== "string" ||
    !Number.isFinite(Date.parse(fresh)) ||
    !addresses ||
    typeof addresses !== "object"
  ) {
    return null;
  }
  const read = new Map<string, StrikeReading>();
  for (const [hash, value] of Object.entries(addresses)) {
    const v = value as Record<string, unknown>;
    if (
      typeof v?.live !== "number" ||
      typeof v.barred !== "boolean" ||
      !Array.isArray(v.lapses)
    ) {
      continue;
    }
    read.set(hash, {
      live: v.live,
      barred: v.barred,
      // ISO on the way out, so every browser reads the instant the server read (Postgres writes microseconds).
      lapses: v.lapses.flatMap((at) =>
        typeof at === "string" && Number.isFinite(Date.parse(at))
          ? [new Date(Date.parse(at)).toISOString()]
          : [],
      ),
    });
  }
  return {
    rule: {
      strikes,
      freshLapsesAt: new Date(Date.parse(fresh)).toISOString(),
    },
    addresses: read,
  };
}

/**
 * THE PORTAL'S OWN SIGNAL FOR A REPORT THAT CANNOT WAIT (admin-triage r2): the open child-abuse reports, hidden
 * at once or still up, which the rail and the bell wear in the destructive tone beside the open count. A HEAD
 * count, one per request through `readPendingWork`.
 */
export async function countUrgentReports(): Promise<number> {
  return mustCount(
    createAdminClient()
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open")
      .eq("kind", INSTANT_HIDE_KIND),
    "admin reports: urgent count",
  );
}

/**
 * The proof mail's switch (`ops_flags.report_proof_mail_enabled`, seeded OFF): absent reads as off, because it
 * sends a new product mail, and his rule holds every one for the email exploration until his yes flips it.
 */
export async function readProofMailEnabled(): Promise<boolean> {
  const row = await mustQuery(
    createAdminClient()
      .from("ops_flags")
      .select("enabled")
      .eq("key", "report_proof_mail_enabled")
      .maybeSingle(),
    "admin reports: proof mail switch",
  );
  return row?.enabled ?? false;
}

/**
 * WHAT AN ANSWER LINK OPENS (`/report/<token>`): the operator's question on the report the token names, while
 * that report is open and unanswered, and the album's name. Null for anything else (a used, closed or unknown
 * link reads the same). The token is compared by its hash; the reporter's address is never read here.
 */
export async function readProofAsk(tokenHash: string): Promise<{
  question: string;
  eventName: string | null;
} | null> {
  const row = await mustQuery(
    createAdminClient()
      .from("reports")
      .select("id, status, event_id, proof_question, proof_answered_at")
      .eq("proof_token_hash", tokenHash)
      .maybeSingle(),
    "report answer: the ask",
  );
  if (!row || row.status !== "open" || row.proof_answered_at) return null;
  if (!row.proof_question) return null;
  const eventName = row.event_id ? await readEventName(row.event_id) : null;
  return { question: row.proof_question, eventName };
}

/** An event's name, for the operator's alert (the route's `after`). */
export async function readEventName(eventId: string): Promise<string | null> {
  const row = await mustQuery(
    createAdminClient()
      .from("events")
      .select("name")
      .eq("id", eventId)
      .maybeSingle(),
    "admin reports: event name",
  );
  return row?.name ?? null;
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
  /** The verdict's note (`verdict=note`), or null when none was written. */
  resolution_note: string | null;
  /** Null only if the reported account was deleted between the report and the
   *  read (the FK cascades, so this is a race window, not a steady state). */
  profile: {
    id: string;
    displayName: string | null;
    slug: string | null;
  } | null;
  /**
   * A closed report's way back: a person's verdicts remove nothing, so a dismissal inside the window
   * reopens (`closed=window`) and nothing else has one.
   */
  wayBack: "reopen" | null;
};

/**
 * Reported PEOPLE, for the person section of /admin/reports: the newest `show`, and whether there
 * are more. The operator gets the name, the handle (which the page turns into a link to the live
 * profile) and the reason: everything needed to look and decide, and nothing about the reporter,
 * who is not stored. `nowMs` is the page's one clock read, as `listReports` takes it.
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
  nowMs: number,
): Promise<{ reports: ReviewProfileReport[]; more: boolean }> {
  const admin = createAdminClient();
  const only = statusFilter(filter);

  const { rows, more } = await readNewest(
    "admin reports: person reports",
    show,
    (after: NewestFirst, limit) => {
      let q = admin
        .from("reports")
        .select(
          "id, reason, created_at, status, resolved_at, resolution_note, profile_id",
        )
        .not("profile_id", "is", null)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit);
      if (only) q = q.eq("status", only);
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
      resolution_note: r.resolution_note ?? null,
      profile: byId.get(r.profile_id) ?? null,
      wayBack:
        wayBackOf(
          { status: r.status, resolvedAt: r.resolved_at, item: null },
          nowMs,
        ) === "reopen"
          ? "reopen"
          : null,
    })),
    more,
  };
}

// ── The open queue, one entry a thing reported (admin-triage r2, `look=grid`) ──────────────────

/** One report inside an entry, as the queue shows it: never who sent it, only what her session proved. */
export type EntryReport = {
  id: string;
  reason: string | null;
  createdAt: string;
  kind: ReportKind;
  /** She was signed in (the carried call `reporter`: one fact, never who). */
  signedIn: boolean;
  /** A confirmed address is kept on the report (it is never printed: Ask for proof mails it). */
  canAsk: boolean;
  /**
   * A confirmed address sent it: one still kept, or, on the worst kind, the hash that outlives it, so a report
   * reopened by Undo (its address forgotten at the close) still says so (build 23's NIT-8).
   */
  confirmed: boolean;
  /**
   * The album's own host sent it (build 23's LOW-2): her confirmed address, or on the worst kind its hash, is the
   * one the report keeps. Known while the report keeps either, which is while the open queue shows it.
   */
  byHost: boolean;
  /** This report's instant hide took the item down at this instant. */
  hidAt: string | null;
  /**
   * ★ ITS ADDRESS'S STRIKES (crumbs-33): on a child-abuse report that kept its address's hash, how many live
   * strikes the address holds and what a Dismiss of this entry would make of them, read from the rule's one home
   * (`report_strikes`). Null on every other report, and while the strikes cannot be read (`readStrikes`).
   */
  strikes: AddressStrikes | null;
  /** What was asked, and what came back (`proof=confirm`). */
  proof: {
    askedAt: string;
    question: string;
    answeredAt: string | null;
    answer: string | null;
  } | null;
};

/**
 * ONE THING REPORTED, with every open report on it (the carried call `one-entry`): the verbs act through its
 * newest report's id, and the server answers the whole entry. Every fact the grid, the front's cards and the
 * peek print is here, decided on the server; the item's keys stay here, only presigned links leave.
 */
export type ReviewEntry = {
  key: string;
  /** The newest open report's id, which the verbs carry. */
  reportId: string;
  subject: EntrySubject;
  lane: QueueLane;
  /** The worst kind any of its reports names. */
  kind: ReportKind;
  newestAt: string;
  /** Newest first. */
  reports: EntryReport[];
  event: {
    id: string;
    name: string;
    /** The host's name or address, which an operator reads and a host never learns was read. */
    host: string | null;
    uploads: number | null;
    guests: number | null;
  } | null;
  media: {
    id: string;
    type: "photo" | "video";
    url: string;
    previewUrl: string | null;
    standing: ItemStanding;
    held: boolean;
    /** Down because one of its reports hid it at once (the hide's instant is its removal's). */
    hidden: boolean;
  } | null;
  /**
   * The item an item report named, when its row is gone (`media` is then null): a dismissal reopened after
   * its item was purged. Absent while the item stands and on an album report.
   */
  deleted?: DeletedItem | null;
  uploader: {
    name: string | null;
    verified: boolean;
    isHost: boolean;
    /** Her other items in this album, the reports on them, and how many of those are held. */
    more: number | null;
    otherReports: number | null;
    held: number | null;
  } | null;
};

/** The columns the open queue reads off a report, as the generated row types them. */
type OpenRow = Pick<
  Tables<"reports">,
  | "id"
  | "reason"
  | "created_at"
  | "event_id"
  | "media_id"
  | "kind"
  | "reporter_signed_in"
  | "reporter_email"
  | "reporter_hash"
  | "hid_at"
  | "proof_asked_at"
  | "proof_question"
  | "proof_answered_at"
  | "proof_answer"
>;

type QueueMediaRow = MediaRow & {
  event_id: string;
  guest_id: string | null;
  guests: UploaderRow["guests"];
};

type QueueFacts = {
  items?: Record<string, { more?: number; held?: number; reports?: number }>;
  events?: Record<string, { uploads?: number; guests?: number }>;
};

const OPEN_COLUMNS =
  "id, reason, created_at, event_id, media_id, kind, reporter_signed_in, reporter_email, reporter_hash, hid_at, proof_asked_at, proof_question, proof_answered_at, proof_answer";

/**
 * ★ WHETHER THE ALBUM'S OWN HOST SENT A REPORT, from what the report itself keeps (build 23's LOW-2): its
 * confirmed address, compared with the host's own, or on the worst kind the address's hash (which outlives the
 * close), compared with the hash of hers. The report stores no account, by design ("never who sent it"); this
 * asks only "the host's address again?", the one question the hash answers. A hash that cannot be taken (no
 * secret) answers no, as an unknown reporter.
 */
function sentByHost(
  report: { reporter_email: string | null; reporter_hash: string | null },
  hostEmail: string | null | undefined,
): boolean {
  const host = hostEmail?.trim().toLowerCase();
  if (!host) return false;
  if (report.reporter_email) return report.reporter_email === host;
  if (!report.reporter_hash) return false;
  try {
    return reporterAddressHash(host) === report.reporter_hash;
  } catch {
    return false;
  }
}

/**
 * A child-abuse report's address against the instant hide (crumbs-33), and what a Dismiss of its entry would make
 * of it: a verdict closes every open report on the entry, so each of this address's child-abuse reports there
 * becomes a strike. An address the reading does not name has none. Null on any other report, and with no reading.
 */
function strikesOf(
  report: Pick<OpenRow, "kind" | "reporter_hash">,
  entry: readonly Pick<OpenRow, "kind" | "reporter_hash">[],
  answer: StrikesAnswer | null,
): AddressStrikes | null {
  const hash = report.reporter_hash;
  if (!answer || !hash || report.kind !== INSTANT_HIDE_KIND) return null;
  const adding = entry.filter(
    (r) => r.kind === INSTANT_HIDE_KIND && r.reporter_hash === hash,
  ).length;
  const reading = answer.addresses.get(hash) ?? {
    live: 0,
    barred: false,
    lapses: [],
  };
  return addressStrikes(reading, answer.rule, adding);
}

/**
 * THE OPEN QUEUE, AS ENTRIES: the newest `show` open album and item reports (the People arm is
 * `listProfileReports`), grouped into one entry a thing reported, each carrying every fact the grid prints, and
 * sorted into its lane (the front worst first then newest, the sweep newest first). The lookups ride `inChunks`,
 * the facts are one `report_queue_facts` jsonb, and the presigns run at once. ★ The reporter's address never
 * leaves this function: `canAsk` is its only trace.
 */
export async function listOpenEntries(
  show: number,
): Promise<{ entries: ReviewEntry[]; more: boolean }> {
  const admin = createAdminClient();
  const { rows, more } = await readNewest(
    "admin reports: open queue",
    show,
    (after: NewestFirst, limit) => {
      let q = admin
        .from("reports")
        .select(OPEN_COLUMNS)
        .eq("status", "open")
        .not("event_id", "is", null)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit);
      if (after) {
        q = q.or(
          `created_at.lt.${after.at},and(created_at.eq.${after.at},id.lt.${after.id})`,
        );
      }
      return q;
    },
    (row) => ({ at: row.created_at, id: row.id }),
  );
  if (rows.length === 0) return { entries: [], more };

  const eventIds = [
    ...new Set(rows.flatMap((r) => (r.event_id ? [r.event_id] : []))),
  ];
  const mediaIds = [
    ...new Set(rows.flatMap((r) => (r.media_id ? [r.media_id] : []))),
  ];
  // The addresses whose strikes the line says: every open child-abuse report kept its address's hash.
  const strikeHashes = [
    ...new Set(
      rows.flatMap((r) =>
        r.kind === INSTANT_HIDE_KIND && r.reporter_hash
          ? [r.reporter_hash]
          : [],
      ),
    ),
  ];

  const [events, media, factsAnswer, strikes] = await Promise.all([
    inChunks(
      "admin reports: queue events",
      eventIds,
      async (chunk) =>
        (await mustQuery(
          admin.from("events").select("id, name, host_id").in("id", chunk),
          "admin reports: queue events",
        )) ?? [],
    ),
    inChunks(
      "admin reports: queue media",
      mediaIds,
      async (chunk) =>
        ((await mustQuery(
          admin
            .from("media")
            .select(
              "id, type, original_key, preview_key, status, removed_by_admin, removed_at, legal_hold_at, event_id, guest_id, guests!media_guest_id_fkey(user_id, email, display_name, verified_at, profiles!guests_user_id_fkey(display_name))",
            )
            .in("id", chunk),
          "admin reports: queue media",
        )) ?? []) as unknown as QueueMediaRow[],
    ),
    mustQuery(
      admin.rpc("report_queue_facts", {
        p_media_ids: mediaIds,
        p_event_ids: eventIds,
      }),
      "admin reports: queue facts",
    ),
    readStrikes(strikeHashes),
  ]);
  // The function answers one jsonb, shaped by the migration (`report_queue_facts`).
  const facts = factsAnswer as QueueFacts | null;

  const hostIds = [...new Set(events.map((e) => e.host_id))];
  const hosts = await inChunks(
    "admin reports: queue hosts",
    hostIds,
    async (chunk) =>
      (await mustQuery(
        admin
          .from("profiles")
          .select("id, display_name, email")
          .in("id", chunk),
        "admin reports: queue hosts",
      )) ?? [],
  );
  const hostById = new Map(hosts.map((h) => [h.id, h]));
  const eventById = new Map(events.map((e) => [e.id, e]));
  const mediaById = new Map(media.map((m) => [m.id, m]));

  const signed = new Map(
    await Promise.all(
      media.map(
        async (m) =>
          [
            m.id,
            {
              url: await presignDownload({ key: m.original_key }),
              previewUrl: m.preview_key
                ? await presignDownload({ key: m.preview_key })
                : null,
            },
          ] as const,
      ),
    ),
  );

  // Group: every open report on one thing, newest first (the read's own order).
  const groups = new Map<string, OpenRow[]>();
  for (const row of rows) {
    const key = entryKeyOf({ ...row, profile_id: null });
    const list = groups.get(key);
    if (list) list.push(row);
    else groups.set(key, [row]);
  }
  // An item whose row is gone is still the one its reports named (20260929231000): its kind, read apart.
  const goneNewest = [...groups.values()].flatMap(([newest]) =>
    newest.media_id && !mediaById.has(newest.media_id) ? [newest.id] : [],
  );
  const kinds = await readNamedKinds(goneNewest);

  const entries: ReviewEntry[] = [...groups.entries()].map(([key, list]) => {
    const newest = list[0];
    const subject = subjectOf(newest);
    // One thing reported is in one album, so every report here shares its event and its host.
    const event = newest.event_id ? eventById.get(newest.event_id) : undefined;
    const host = event ? hostById.get(event.host_id) : undefined;
    const reports: EntryReport[] = list.map((r) => ({
      id: r.id,
      reason: r.reason,
      createdAt: r.created_at,
      kind: parseReportKind(r.kind),
      signedIn: Boolean(r.reporter_signed_in),
      canAsk: Boolean(r.reporter_email),
      confirmed: Boolean(r.reporter_email) || Boolean(r.reporter_hash),
      byHost: sentByHost(r, host?.email),
      hidAt: r.hid_at ?? null,
      strikes: strikesOf(r, list, strikes),
      proof:
        r.proof_asked_at && r.proof_question
          ? {
              askedAt: r.proof_asked_at,
              question: r.proof_question,
              answeredAt: r.proof_answered_at ?? null,
              answer: r.proof_answer ?? null,
            }
          : null,
    }));
    const kind = worstKind(reports.map((r) => r.kind));
    const eventFacts = event ? facts?.events?.[event.id] : undefined;
    const row = newest.media_id ? mediaById.get(newest.media_id) : undefined;
    const links = row ? signed.get(row.id) : undefined;
    const itemFacts = row ? facts?.items?.[row.id] : undefined;
    const identity = row
      ? resolveUploaderIdentity(
          { guest_id: row.guest_id, guests: row.guests },
          host?.display_name ?? null,
        )
      : null;
    return {
      key,
      reportId: newest.id,
      subject,
      lane: laneOf(subject, kind),
      kind,
      newestAt: newest.created_at,
      reports,
      event: event
        ? {
            id: event.id,
            name: event.name,
            host: host?.display_name ?? host?.email ?? null,
            uploads: eventFacts?.uploads ?? null,
            guests: eventFacts?.guests ?? null,
          }
        : null,
      media:
        row && links
          ? {
              id: row.id,
              type: row.type,
              url: links.url,
              previewUrl: links.previewUrl,
              standing: standingOf(row),
              held:
                row.legal_hold_at !== null && row.legal_hold_at !== undefined,
              hidden:
                row.status === "removed" &&
                Boolean(row.removed_by_admin) &&
                reports.some((r) => sameInstant(r.hidAt, row.removed_at)),
            }
          : null,
      deleted:
        newest.media_id && !row
          ? { id: newest.media_id, type: kinds.get(newest.id) ?? null }
          : null,
      uploader: identity
        ? {
            name: identity.displayName,
            verified: identity.isVerified,
            isHost: identity.isHost,
            more: itemFacts?.more ?? null,
            otherReports: itemFacts?.reports ?? null,
            held: itemFacts?.held ?? null,
          }
        : null,
    };
  });

  const front = entries.filter((e) => e.lane === "front").sort(frontOrder);
  const sweep = entries.filter((e) => e.lane !== "front").sort(newestFirst);
  return { entries: [...front, ...sweep], more };
}
