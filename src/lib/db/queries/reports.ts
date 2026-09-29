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

import { readNewest } from "@/lib/admin/list-depth";
import {
  entryKeyOf,
  type EntrySubject,
  frontOrder,
  laneOf,
  newestFirst,
  type QueueLane,
  type ReportFilter,
  type ReportStatus,
  sameInstant,
  subjectOf,
  type WayBack,
  wayBackOf,
} from "@/lib/admin/reports";
import { mustCount, mustQuery } from "@/lib/db/must-query";
import { inChunks, type PageResult } from "@/lib/db/read-all";
import { seamFrom, seamRpc } from "@/lib/db/triage-seam";
import {
  resolveUploaderIdentity,
  type UploaderRow,
} from "@/lib/media/uploader-identity";
import { presignDownload } from "@/lib/r2/presign";
import {
  INSTANT_HIDE_KIND,
  parseReportKind,
  type ReportKind,
  worstKind,
} from "@/lib/reports/kinds";
import { createAdminClient } from "@/lib/supabase/admin";

export type { ReportFilter, ReportStatus } from "@/lib/admin/reports";

/** Where a reported item stands now: still up (any live status), removed by someone else, or an operator's removal. */
export type ItemStanding = "live" | "removed" | "operator";

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
    /** Short-lived presigned URL for operator review; never a raw key. */
    url: string;
    /** The small preview, for a closed report's thumbnail; null when the upload made none. */
    previewUrl: string | null;
    standing: ItemStanding;
    /** Under a legal hold: the door reads Held, and a closed line offers no Undo. */
    held: boolean;
  } | null;
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

  const [events, media] = await Promise.all([
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
  ]);
  const eventById = new Map(events.map((e) => [e.id, e]));
  const rowById = new Map((media as MediaRow[]).map((m) => [m.id, m]));

  // Every presign at once: each is a local signature, and signing them one after another made a
  // long queue wait on the slowest sum of them for nothing.
  const signed = await Promise.all(
    (media as MediaRow[]).map(async (m) => ({
      id: m.id,
      type: m.type,
      url: await presignDownload({ key: m.original_key }),
      previewUrl: m.preview_key
        ? await presignDownload({ key: m.preview_key })
        : null,
      standing: standingOf(m),
      held: m.legal_hold_at !== null && m.legal_hold_at !== undefined,
    })),
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

/**
 * THE PORTAL'S OWN SIGNAL FOR A REPORT THAT CANNOT WAIT (admin-triage r2): the open child-abuse reports, hidden
 * at once or still up, which the rail and the bell wear in the destructive tone beside the open count. A HEAD
 * count, one per request through `readPendingWork`.
 */
export async function countUrgentReports(): Promise<number> {
  return mustCount(
    seamFrom(createAdminClient(), "reports")
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
  const admin = createAdminClient();
  const row = (await mustQuery(
    seamFrom(admin, "reports")
      .select("id, status, event_id, proof_question, proof_answered_at")
      .eq("proof_token_hash", tokenHash)
      .maybeSingle(),
    "report answer: the ask",
  )) as {
    status: string;
    event_id: string | null;
    proof_question: string | null;
    proof_answered_at: string | null;
  } | null;
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
  /** This report's instant hide took the item down at this instant. */
  hidAt: string | null;
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

type OpenRow = {
  id: string;
  reason: string | null;
  created_at: string;
  event_id: string | null;
  media_id: string | null;
  kind: string | null;
  reporter_signed_in: boolean | null;
  reporter_email: string | null;
  hid_at: string | null;
  proof_asked_at: string | null;
  proof_question: string | null;
  proof_answered_at: string | null;
  proof_answer: string | null;
};

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
  "id, reason, created_at, event_id, media_id, kind, reporter_signed_in, reporter_email, hid_at, proof_asked_at, proof_question, proof_answered_at, proof_answer";

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
      let q = seamFrom(admin, "reports")
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
      return q as unknown as PromiseLike<PageResult<OpenRow>>;
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

  const [events, media, facts] = await Promise.all([
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
      seamRpc<QueueFacts>(admin, "report_queue_facts", {
        p_media_ids: mediaIds,
        p_event_ids: eventIds,
      }),
      "admin reports: queue facts",
    ),
  ]);

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

  const entries: ReviewEntry[] = [...groups.entries()].map(([key, list]) => {
    const newest = list[0];
    const subject = subjectOf(newest);
    const reports: EntryReport[] = list.map((r) => ({
      id: r.id,
      reason: r.reason,
      createdAt: r.created_at,
      kind: parseReportKind(r.kind),
      signedIn: Boolean(r.reporter_signed_in),
      canAsk: Boolean(r.reporter_email),
      hidAt: r.hid_at ?? null,
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
    const event = newest.event_id ? eventById.get(newest.event_id) : undefined;
    const host = event ? hostById.get(event.host_id) : undefined;
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
