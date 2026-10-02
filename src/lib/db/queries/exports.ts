/**
 * Every read and write of `export_log` past the mint's own insert, and the kill switch's read: the
 * observability surface (`/admin/exports`), the Worker's reports (`/api/export/report`) and the walk's
 * status poll (`/api/export/status`). `export_log` and `ops_flags` are deny-all, so everything here goes
 * through the service-role admin client; the portal is gated by requireAdmin + AAL2 upstream, the report
 * route by the Worker's signature, the status route by the export's own nonce.
 *
 * THE TWO RULES of the heartbeat store (`queries/jobs.ts`) hold here too: the Worker's facts are WRITES
 * that degrade (a report the app cannot keep is logged, never a failed download), and the reads that a
 * page or a walk acts on THROW (`mustQuery`), so "nothing heard" is never what a failed read says.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { mustCount, mustQuery } from "@/lib/db/must-query";
import { createAdminClient } from "@/lib/supabase/admin";

/** How a stream ended, as export_log keeps it (`export_log_stream_outcome_known`). */
export type StreamOutcome = "saved" | "short" | "stopped" | "failed" | "empty";

const OUTCOMES: ReadonlySet<string> = new Set([
  "saved",
  "short",
  "stopped",
  "failed",
  "empty",
]);

/**
 * ★ THE TYPED SEAM, UNTIL THE TYPES REGENERATE: export_log's Worker columns (checked_at, check_found,
 * stream_*) arrive with migration 20261001235500, and `types.ts` learns them only when the Orchestrator
 * regenerates it, so the reads and writes that name them go through this untyped client, which compiles on
 * either side of the regeneration (drop the cast then). Every row it answers is read field by field and
 * checked. Before the apply, those writes fail (logged by the report route) and those reads throw.
 */
function untypedAdmin(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient;
}

const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
const int = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/** What the Worker said about one export, read off its row. */
export type WorkerWord = {
  /** When the Worker answered the check; null when it never did. */
  checkedAt: string | null;
  /** How many the check found; null beside a `checkedAt` when the bucket could not answer. */
  checkFound: number | null;
  streamStartedAt: string | null;
  streamEndedAt: string | null;
  streamOutcome: StreamOutcome | null;
  streamFiles: number | null;
  streamMissing: string[];
};

function workerWordOf(row: Record<string, unknown>): WorkerWord {
  const outcome = str(row.stream_outcome);
  return {
    checkedAt: str(row.checked_at),
    checkFound: int(row.check_found),
    streamStartedAt: str(row.stream_started_at),
    streamEndedAt: str(row.stream_ended_at),
    streamOutcome:
      outcome && OUTCOMES.has(outcome) ? (outcome as StreamOutcome) : null,
    streamFiles: int(row.stream_files),
    streamMissing: Array.isArray(row.stream_missing)
      ? row.stream_missing.filter((m): m is string => typeof m === "string")
      : [],
  };
}

const WORKER_COLUMNS =
  "checked_at, check_found, stream_started_at, stream_ended_at, stream_outcome, stream_files, stream_missing";

export type ExportLogRow = {
  id: string;
  created_at: string;
  scope: string;
  eventId: string | null;
  eventName: string | null;
  itemCount: number;
  totalBytes: number;
  outcome: string;
  /** The Worker's word on this export, once it reported (`export-ends`). */
  worker: WorkerWord;
};

/** Recent export ATTEMPTS, newest-first, with the event name resolved and what the Worker saw. */
export async function listRecentExports(limit = 50): Promise<ExportLogRow[]> {
  const data = await mustQuery(
    untypedAdmin()
      .from("export_log")
      .select(
        `id, created_at, scope, event_id, item_count, total_bytes, outcome, ${WORKER_COLUMNS}`,
      )
      .order("created_at", { ascending: false })
      .limit(limit),
    "admin/exports: recent exports",
  );
  const rows = (Array.isArray(data) ? data : []) as Record<string, unknown>[];

  const ids = [
    ...new Set(
      rows.map((r) => str(r.event_id)).filter((v): v is string => !!v),
    ),
  ];
  const names = new Map<string, string>();
  if (ids.length) {
    // row-cap: the events named on one page of the log: at most `limit` ids (50 from its one caller)
    const evs = await mustQuery(
      createAdminClient().from("events").select("id, name").in("id", ids),
      "admin/exports: event names",
    );
    for (const e of evs ?? []) names.set(e.id, e.name);
  }

  return rows.map((r) => {
    const eventId = str(r.event_id);
    return {
      id: str(r.id) ?? "",
      created_at: str(r.created_at) ?? "",
      scope: str(r.scope) ?? "",
      eventId,
      eventName: eventId ? (names.get(eventId) ?? null) : null,
      itemCount: int(r.item_count) ?? 0,
      totalBytes: int(r.total_bytes) ?? 0,
      outcome: str(r.outcome) ?? "",
      worker: workerWordOf(r),
    };
  });
}

/** Export attempts in the last 24h that did NOT mint (kill-switch / cap / limiter / empty) — the health signal. */
export async function countExportRejections24h(): Promise<number> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 86_400_000).toISOString();
  // mustCount, not `count ?? 0`: this is a HEALTH signal, and a failed count
  // resolves as a confident zero — the one value that reads as "all clear".
  return mustCount(
    admin
      .from("export_log")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since)
      .neq("outcome", "minted"),
    "admin/exports: 24h rejections",
  );
}

/** The export kill-switch state (defaults ON only when the row is genuinely absent). */
export async function getExportEnabled(): Promise<boolean> {
  const admin = createAdminClient();
  // mustQuery is load-bearing here: without it an unreachable ops_flags row
  // reads as `undefined` and the `?? true` silently RE-ENABLES exports that an
  // operator deliberately switched off. A kill switch that fails open is not a
  // kill switch. (The `?? true` still covers the legitimate no-row case.)
  const row = await mustQuery(
    admin
      .from("ops_flags")
      .select("enabled")
      .eq("key", "export_enabled")
      .maybeSingle(),
    "admin/exports: kill switch",
  );
  return row?.enabled ?? true;
}

/* ── the Worker's reports (`/api/export/report`) ─────────────────────────────────────────────── */

/** A report write's result: degrade, never throw (the caller logs it). */
export type ReportWrite = { error: string | null };

async function write(
  run: () => PromiseLike<{ error: { message: string } | null }>,
): Promise<ReportWrite> {
  try {
    const { error } = await run();
    return { error: error?.message ?? null };
  } catch (e) {
    return { error: String(e) };
  }
}

/**
 * The Worker's check, on the mint's row: when it answered, and how many it found (null when the bucket
 * could not answer). The latest check wins: a walk's quiet re-attempt asks again, and its answer is newer.
 */
export function recordWorkerCheck(
  jti: string,
  atMs: number,
  found: number | null,
): Promise<ReportWrite> {
  return write(() =>
    untypedAdmin()
      .from("export_log")
      .update({
        checked_at: new Date(atMs).toISOString(),
        check_found: found,
      })
      .eq("jti", jti)
      .eq("outcome", "minted"),
  );
}

/** The stream began: kept once, so a late or repeated start never moves it. */
export function recordStreamStart(
  jti: string,
  atMs: number,
): Promise<ReportWrite> {
  return write(() =>
    untypedAdmin()
      .from("export_log")
      .update({ stream_started_at: new Date(atMs).toISOString() })
      .eq("jti", jti)
      .eq("outcome", "minted")
      .is("stream_started_at", null),
  );
}

/** How the stream ended: kept once (the first end wins), so a replay never rewrites what was said. */
export function recordStreamEnd(
  jti: string,
  atMs: number,
  end: { outcome: StreamOutcome; files: number; missing: string[] },
): Promise<ReportWrite> {
  return write(() =>
    untypedAdmin()
      .from("export_log")
      .update({
        stream_ended_at: new Date(atMs).toISOString(),
        stream_outcome: end.outcome,
        stream_files: end.files,
        stream_missing: end.missing,
      })
      .eq("jti", jti)
      .eq("outcome", "minted")
      .is("stream_ended_at", null),
  );
}

/* ── the walk's status poll (`/api/export/status`) ──────────────────────────────────────────── */

/** What the walk asks: has this export's stream begun, and how did it end? Null: no such export. */
export async function readStreamWord(jti: string): Promise<WorkerWord | null> {
  const row = await mustQuery(
    untypedAdmin()
      .from("export_log")
      .select(WORKER_COLUMNS)
      .eq("jti", jti)
      .maybeSingle(),
    "export/status: the stream's word",
  );
  return row ? workerWordOf(row as Record<string, unknown>) : null;
}
