/**
 * THE PLAN LIMITS' RUN (admin-observability.md, "Plan limits"): it rides the spend watch's daily run (`spend-watch-run.ts`
 * calls it; Hobby allows two crons and both exist), takes every meter of `limits-watch-limits.ts` from the one reader
 * that can answer it, judges each against its plan's limit (`limits-watch.ts`), mails what newly crossed a threshold
 * and hands back the record the run keeps in `job_runs.counts.limits`. The rules are pure; this file only reads, writes
 * and tells.
 *
 * NEVER THROWS, NEVER SILENT: each reader answers for its own meters and a read that fails becomes a meter that says why
 * (the spend watch's run then closes as an error, so the card reads "Last run failed" rather than a calm night); a
 * mail that fails is captured and tried again next run, since a meter is told only once its mail went.
 *
 * ★ A GAP IS NOT A FAILURE. A meter whose credential the app does not hold (a deliberate gap) or whose vendor
 * reports none says "No reading" and why on the card, and does not fail the run: a run red forever over a question
 * would hide the day it is red for a real reason.
 */
import "server-only";

import { ADMIN_HOST } from "@/lib/auth/admin-host";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/constants/site";
import { mustQuery } from "@/lib/db/must-query";
import { sendOnce } from "@/lib/email/send";
import { serverEnv } from "@/lib/env";
import {
  assessAll,
  crossingKey,
  gaugeHistory,
  levelCounts,
  meterName,
  nextTold,
  parseStoredLimits,
  planCrossings,
  storedLimits,
  toldFrom,
  type Level,
  type MeterTaken,
  type StoredLimits,
  type Told,
} from "@/lib/jobs/limits-watch";
import {
  METERS,
  meterById,
  type MeterId,
} from "@/lib/jobs/limits-watch-limits";
import { limitsWatchEmail } from "@/lib/jobs/limits-watch-mail";
import { readResendMeters } from "@/lib/jobs/limits-watch-resend";
import { readVercelUsage } from "@/lib/jobs/limits-watch-vercel";
import { captureError, captureWarning } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

const DAY_MS = 24 * 60 * 60 * 1000;
/** How far back the earlier records are read: a gauge's climb looks back 8 days, and what was told, the newest record. */
const HISTORY_MS = 9 * DAY_MS;

/** The portal's card for a job or a section, on the admin host where one is configured. */
export function adminJobsUrl(anchor: string): string {
  return ADMIN_HOST
    ? `https://${ADMIN_HOST}/admin/jobs#${anchor}`
    : `${SITE_URL}/admin/jobs#${anchor}`;
}

// ── Reading ───────────────────────────────────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The two database meters and the month's signed-in accounts. Never throws. */
async function readDbMeters(
  admin: AdminClient,
  now: Date,
): Promise<Partial<Record<MeterId, MeterTaken>>> {
  const out: Partial<Record<MeterId, MeterTaken>> = {};
  const failed = (why: string): MeterTaken => ({
    kind: "none",
    cause: "failed",
    why,
  });

  // Each call in its own async function, so a call that throws before it returns a promise is a rejection too.
  const [readings, signIns] = await Promise.allSettled([
    (async () => admin.rpc("limits_watch_readings"))(),
    (async () =>
      admin.rpc("spend_watch_sign_ins", {
        p_since: new Date(now.getTime() - 30 * DAY_MS).toISOString(),
        p_now: now.toISOString(),
      }))(),
  ]);

  // The database's size and the bucket's bytes: one call, a section that fails is missing alone.
  if (readings.status === "rejected") {
    const why = `the database reading could not be taken: ${String(readings.reason).slice(0, 120)}`;
    out.supabase_db_size = failed(why);
    out.r2_storage = failed(why);
  } else if (readings.value.error) {
    const { message, code } = readings.value.error;
    // PGRST202: the function is not in the schema cache, which is the migration not yet applied: a known gap.
    const notApplied =
      code === "PGRST202" || /could not find the function/i.test(message);
    const taken: MeterTaken = notApplied
      ? {
          kind: "none",
          cause: "needs",
          why: "Not wired yet: the limits_watch_readings migration is not applied",
        }
      : failed(`the database reading failed: ${message.slice(0, 140)}`);
    out.supabase_db_size = taken;
    out.r2_storage = taken;
  } else {
    const data = readings.value.data;
    const errors = isRecord(data) && isRecord(data.errors) ? data.errors : {};
    const section = (key: "db_bytes" | "media_bytes"): MeterTaken => {
      if (!isRecord(data))
        return failed("the database reading was not an object");
      const err = errors[key];
      if (typeof err === "string")
        return failed(`${key}: ${err.slice(0, 140)}`);
      const n = data[key];
      return typeof n === "number" && Number.isFinite(n) && n >= 0
        ? { kind: "gauge", used: n }
        : failed(`${key} was not a count of bytes`);
    };
    out.supabase_db_size = section("db_bytes");
    const media = section("media_bytes");
    // Previews and the backup bucket are not in it: a floor of what the bucket holds.
    out.r2_storage =
      media.kind === "gauge" ? { ...media, atLeast: true } : media;
  }

  // Accounts whose last sign-in falls in the 30 days: Supabase's MAU also counts token refreshes, so a floor.
  if (signIns.status === "rejected") {
    out.supabase_mau = failed(
      `the sign-ins reading could not be taken: ${String(signIns.reason).slice(0, 120)}`,
    );
  } else if (signIns.value.error) {
    out.supabase_mau = failed(
      `the sign-ins reading failed: ${signIns.value.error.message.slice(0, 140)}`,
    );
  } else {
    const n = signIns.value.data;
    out.supabase_mau =
      typeof n === "number" && Number.isFinite(n) && n >= 0
        ? { kind: "gauge", used: n, atLeast: true }
        : failed("the sign-ins reading was not a count");
  }
  return out;
}

/** The meters no reader answers: each one a gap that says why (`needs` a credential, or the vendor `unavailable`). */
function gapMeters(): Partial<Record<MeterId, MeterTaken>> {
  const out: Partial<Record<MeterId, MeterTaken>> = {};
  for (const def of METERS) {
    if (def.gap) {
      out[def.id] = { kind: "none", cause: def.gap.cause, why: def.gap.why };
    }
  }
  return out;
}

/** Every meter, taken: the readers run side by side and none can fail another. */
export async function takeMeters(
  admin: AdminClient,
  now: Date,
): Promise<Partial<Record<MeterId, MeterTaken>>> {
  const nowMs = now.getTime();
  const [vercel, db, resend] = await Promise.all([
    readVercelUsage(serverEnv.VERCEL_USAGE_TOKEN, nowMs),
    readDbMeters(admin, now),
    readResendMeters(nowMs),
  ]);
  return { ...gapMeters(), ...vercel, ...db, ...resend };
}

// ── The record: earlier runs' blocks, and the latest for the card ─────────────────────────────────

/**
 * The watch's own earlier limits blocks over the trailing days, newest first: what each meter was last told, and a
 * gauge's earlier readings. THROWS (a read that fails must say so: a mail sent on a history it could not read would
 * repeat one already sent).
 */
export async function readLimitsHistory(
  admin: AdminClient,
  nowMs: number,
): Promise<StoredLimits[]> {
  const rows = await mustQuery(
    admin
      .from("job_runs")
      .select("started_at, limits:counts->limits")
      .eq("job", "spend_watch")
      .in("status", ["ok", "error"])
      .gte("started_at", new Date(nowMs - HISTORY_MS).toISOString())
      .order("started_at", { ascending: false })
      .limit(400),
    "plan limits: its own history",
  );
  const out: StoredLimits[] = [];
  for (const row of rows ?? []) {
    const block = parseStoredLimits(row.limits);
    if (block) out.push(block);
  }
  return out;
}

/** The newest run that carried a limits block, for the console's card. THROWS. */
export async function readLatestLimits(): Promise<{
  limits: StoredLimits;
  startedAt: string;
  status: string;
} | null> {
  const rows = await mustQuery(
    createAdminClient()
      .from("job_runs")
      .select("started_at, status, limits:counts->limits")
      .eq("job", "spend_watch")
      .in("status", ["ok", "error"])
      .order("started_at", { ascending: false })
      .limit(12),
    "admin/jobs: the plan limits' last readings",
  );
  for (const row of rows ?? []) {
    const limits = parseStoredLimits(row.limits);
    if (limits)
      return { limits, startedAt: row.started_at, status: row.status };
  }
  return null;
}

// ── The run ───────────────────────────────────────────────────────────────────────────────────────

export type LimitsOutcome = {
  /** `job_runs.counts.limits`, or null when nothing could be judged (the run keeps no block that night). */
  stored: Record<string, unknown> | null;
  warn: MeterId[];
  critical: MeterId[];
  /** Meters whose read FAILED (a gap is not one): they fail the run. */
  failed: MeterId[];
  /** Meters left a gap: a credential not provisioned, or a vendor that reports none. */
  gaps: MeterId[];
  /** The meters this run's mail told the operator of. */
  mailed: MeterId[];
  /** The run's own problem beyond a meter: the history or the mail could not be done. */
  problem: boolean;
  /** Words for the run's note, most urgent first. */
  notes: string[];
};

const EMPTY: LimitsOutcome = {
  stored: null,
  warn: [],
  critical: [],
  failed: [],
  gaps: [],
  mailed: [],
  problem: false,
  notes: [],
};

function labelOf(id: MeterId): string {
  const def = meterById(id);
  return def ? meterName(def) : id;
}

/**
 * Take every plan meter, judge it, mail what newly crossed a threshold, and say what the run keeps. NEVER THROWS: a
 * step that fails is a note, a Sentry capture and `problem`, and the spend watch's run carries on.
 */
export async function runLimitsWatch(opts: {
  admin: AdminClient;
  now: Date;
}): Promise<LimitsOutcome> {
  const { admin, now } = opts;
  const nowMs = now.getTime();
  const notes: string[] = [];
  let problem = false;

  try {
    // 1. What the earlier runs told, and a gauge's earlier readings.
    let history: StoredLimits[] = [];
    let historyRead = true;
    try {
      history = await readLimitsHistory(admin, nowMs);
    } catch (e) {
      historyRead = false;
      problem = true;
      captureError("cron", e, { job: "spend_watch", phase: "limits_history" });
      notes.push(
        "The plan limits' history could not be read, so no crossing was mailed.",
      );
    }

    // 2. The meters, taken and judged.
    const taken = await takeMeters(admin, now);
    const assessed = assessAll(taken, {
      nowMs,
      gauge: Object.fromEntries(
        METERS.filter((m) => m.shape === "gauge").map((m) => [
          m.id,
          gaugeHistory(history, m.id),
        ]),
      ),
    });

    // 3. What is new since the last telling, and the one mail that tells it.
    const previous: Told | null = historyRead ? toldFrom(history) : null;
    const { fresh, held } = planCrossings(assessed, previous);
    const mailed = new Set<MeterId>();
    if (fresh.length > 0) {
      try {
        const mail = limitsWatchEmail({
          crossings: fresh,
          jobsUrl: adminJobsUrl("plan-limits"),
        });
        // `false` is "already sent" (this day's same set): told all the same.
        await sendOnce({
          kind: "spend_watch",
          dedupeKey: crossingKey(nowMs, fresh),
          to: serverEnv.CONTACT_NOTIFY_EMAIL ?? SUPPORT_EMAIL,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        });
        for (const c of fresh) mailed.add(c.id);
        captureWarning("cron", "plan_limits_crossed", {
          job: "spend_watch",
          crossings: fresh.map((c) => `${c.id}:${c.level}`),
        });
      } catch (e) {
        problem = true;
        captureError("cron", e, { job: "spend_watch", phase: "limits_mail" });
        notes.push(
          "The plan limits' mail could not be sent: it is tried again next run.",
        );
      }
    }
    if (held) {
      notes.push(
        "A plan limit is past a threshold, but its mail is held until the history can be read.",
      );
    }

    // 4. What each meter is now told at, and the record.
    const told: Told = {};
    for (const def of METERS) {
      const prev: Level = previous?.[def.id] ?? "ok";
      told[def.id] = nextTold(prev, assessed[def.id], mailed.has(def.id));
    }
    const stored = storedLimits({
      nowMs,
      assessed,
      told,
      toldKnown: previous !== null,
    });

    // 5. Say it.
    const counts = levelCounts(assessed);
    if (counts.critical.length > 0) {
      notes.unshift(
        `Plan limits critical: ${counts.critical.map(labelOf).join(", ")}.`,
      );
    }
    if (counts.warn.length > 0) {
      notes.push(
        `Plan limits warning: ${counts.warn.map(labelOf).join(", ")}.`,
      );
    }
    if (counts.failed.length > 0) {
      captureWarning("cron", "plan_limits_read_failed", {
        job: "spend_watch",
        meters: Object.fromEntries(
          counts.failed.map((id) => {
            const a = assessed[id];
            return [id, a?.state === "none" ? a.why : "unknown"];
          }),
        ),
      });
      notes.push(
        `No plan-limits reading: ${counts.failed.map(labelOf).join(", ")}.`,
      );
    }
    return {
      stored,
      warn: counts.warn,
      critical: counts.critical,
      failed: counts.failed,
      gaps: counts.gaps,
      mailed: [...mailed],
      problem,
      notes,
    };
  } catch (e) {
    // The belt to the steps' braces: a bug here must never take the spend watch's own readings down with it.
    captureError("cron", e, { job: "spend_watch", phase: "limits" });
    return {
      ...EMPTY,
      problem: true,
      notes: [
        `The plan limits could not be read: ${(e instanceof Error ? e.message : String(e)).slice(0, 120)}.`,
      ],
    };
  }
}
