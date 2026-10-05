/**
 * THE HEARTBEAT STORE'S TWO READS THE 1,000-ROW ROUND ADDED, on the PostgREST fake: where a rotating
 * sweep left off (`readSweepCursor`, off the newest finished run, a sub-sweep's own row or one sweep's
 * nested tally on the parent's), and a finished run that stopped early surfacing as `stoppedEarly`
 * (which the catalog reads as `attention`).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

const state = vi.hoisted(() => ({ fake: null as FakePostgrest | null }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(state.fake!),
}));

const { getJobSignals, getJobStates, readSweepCursor } =
  await import("@/lib/db/queries/jobs");

const CURSOR_A = "0a1b2c3d-4e5f-4061-8273-8495a6b7c8d9";
const CURSOR_B = "1b2c3d4e-5f60-4172-8384-95a6b7c8d9ea";

function runRow(
  id: number,
  job: string,
  status: string,
  startedAt: string,
  counts: unknown,
): FakeRow {
  return {
    id: `r${id}`,
    job,
    status,
    triggered_by: "schedule",
    started_at: startedAt,
    finished_at: status === "running" ? null : startedAt,
    duration_ms: status === "running" ? null : 1_000,
    counts,
    note: null,
  };
}

beforeEach(() => {
  state.fake = null;
});

describe("readSweepCursor", () => {
  it("reads a sub-sweep's cursor off its newest finished run, past a running and a skipped one", async () => {
    state.fake = createFakePostgrest({
      tables: {
        job_runs: [
          runRow(
            1,
            "purge_over_capacity",
            "ok",
            "2026-09-21T04:00:00.000000+00:00",
            { resume_after: CURSOR_B },
          ),
          runRow(
            2,
            "purge_over_capacity",
            "error",
            "2026-09-22T04:00:00.000000+00:00",
            { resume_after: CURSOR_A },
          ),
          runRow(
            3,
            "purge_over_capacity",
            "skipped",
            "2026-09-22T12:00:00.000000+00:00",
            null,
          ),
          runRow(
            4,
            "purge_over_capacity",
            "running",
            "2026-09-23T04:00:00.000000+00:00",
            null,
          ),
        ],
      },
    });
    expect(await readSweepCursor("purge_over_capacity")).toBe(CURSOR_A);
  });

  it("reads a parent-row sweep's cursor out of its nested tally", async () => {
    state.fake = createFakePostgrest({
      tables: {
        job_runs: [
          runRow(1, "purge_cron", "ok", "2026-09-22T04:00:00.000000+00:00", {
            renewal_nudges: { nudged: 400, resume_after: CURSOR_A },
            expired_passes: { recomputed: 10 },
          }),
        ],
      },
    });
    expect(await readSweepCursor("purge_cron", "renewal_nudges")).toBe(
      CURSOR_A,
    );
    expect(await readSweepCursor("purge_cron", "expired_passes")).toBeNull();
  });

  it("starts from the beginning when the newest finished run finished its turn", async () => {
    state.fake = createFakePostgrest({
      tables: {
        job_runs: [
          runRow(
            1,
            "purge_inactivity",
            "ok",
            "2026-09-21T04:00:00.000000+00:00",
            { resume_after: CURSOR_A },
          ),
          runRow(
            2,
            "purge_inactivity",
            "ok",
            "2026-09-22T04:00:00.000000+00:00",
            { removed: 3 },
          ),
        ],
      },
    });
    expect(await readSweepCursor("purge_inactivity")).toBeNull();
  });

  it("throws on a failed read, which the cron turns into a fresh start and a warning", async () => {
    state.fake = createFakePostgrest({ tables: {} });
    await expect(readSweepCursor("purge_inactivity")).rejects.toThrow(
      /resume cursor/,
    );
  });
});

describe("getJobStates", () => {
  it("marks a finished run that stopped early, and only that one", async () => {
    state.fake = createFakePostgrest({
      tables: {
        job_runs: [
          runRow(1, "purge_cron", "ok", "2026-09-23T04:00:00.000000+00:00", {
            removed_media: { stopped_early: true, remaining: 12 },
            stopped_early: true,
            sweeps_stopped_early: 1,
          }),
          runRow(2, "purge_orphans", "ok", "2026-09-23T04:00:01.000000+00:00", {
            r2_deleted: 0,
          }),
        ],
      },
    });
    const states = await getJobStates();
    const cron = states.find((s) => s.job === "purge_cron");
    const orphans = states.find((s) => s.job === "purge_orphans");
    expect(cron?.lastRun?.stoppedEarly).toBe(true);
    expect(orphans?.lastRun?.stoppedEarly).toBe(false);
  });
});

describe("getJobSignals", () => {
  // The feedback beacon's window (help-center r1 `feedback=beacon`): the success half is its own
  // rows in the last 24 hours, the failure half the `job_runs` error rows the route writes, so the
  // console can tell "nobody answered" from "every answer was dropped".
  it("windows the help feedback signal on its own rows and its failures", async () => {
    const now = Date.parse("2026-09-28T12:00:00.000Z");
    state.fake = createFakePostgrest({
      tables: {
        // (credit-watch) the pass-to-Pro credit's signal reads its claims.
        pass_credits: [],
        sent_emails: [],
        action_attempts: [],
        unlock_attempts: [],
        article_feedback: [
          {
            slug: "you-cant-sign-in",
            helpful: true,
            created_at: "2026-09-28T11:00:00.000000+00:00",
          },
          {
            slug: "you-cant-sign-in",
            helpful: false,
            created_at: "2026-09-28T02:00:00.000000+00:00",
          },
          {
            slug: "a-video-wont-play",
            helpful: true,
            created_at: "2026-09-26T12:00:00.000000+00:00",
          },
        ],
        job_runs: [
          runRow(
            1,
            "help_feedback",
            "error",
            "2026-09-28T10:00:00.000000+00:00",
            null,
          ),
          runRow(
            2,
            "help_feedback",
            "error",
            "2026-09-25T10:00:00.000000+00:00",
            null,
          ),
          runRow(
            3,
            "abuse_limiter",
            "error",
            "2026-09-28T10:00:00.000000+00:00",
            null,
          ),
        ],
      },
    });
    // `export-ends`: the downloads' signal reads export_log too, so the fixture carries it (empty here), and
    // (crumbs-75) the mail's reads the kept notices.
    state.fake.tables.export_log = [];
    state.fake.tables.notice_retries = [];
    // (drive-wiring) and Send to Google Drive's signal reads its items and its sends.
    state.fake.tables.cloud_export_items = [];
    state.fake.tables.cloud_exports = [];
    const signals = await getJobSignals(now);
    expect(signals.help_feedback).toEqual({ ok24h: 2, failed24h: 1 });
    expect(signals.abuse_limiter).toEqual({ ok24h: 0, failed24h: 1 });
  });

  it("throws when the beacon's table cannot be read, never reading it as quiet", async () => {
    state.fake = createFakePostgrest({
      tables: {
        // (credit-watch) the pass-to-Pro credit's signal reads its claims.
        pass_credits: [],
        sent_emails: [],
        action_attempts: [],
        unlock_attempts: [],
        job_runs: [],
        export_log: [],
        notice_retries: [],
        cloud_export_items: [],
        cloud_exports: [],
      },
    });
    await expect(getJobSignals()).rejects.toThrow(/help feedback/);
  });

  // `export-ends`: the downloads' success half is the Worker's own word on the day's mints (a zip it
  // finished, whole or short), never a mint alone; its failure half the error rows the report route writes.
  it("windows the downloads' signal on the zips the Worker finished, and their failures", async () => {
    const now = Date.parse("2026-10-01T12:00:00.000Z");
    const mint = (created: string, outcome: string | null) => ({
      outcome: "minted",
      created_at: created,
      stream_outcome: outcome,
      // The CHECK holds an end time exactly beside an outcome.
      stream_ended_at: outcome === null ? null : created,
    });
    state.fake = createFakePostgrest({
      tables: {
        // (credit-watch) the pass-to-Pro credit's signal reads its claims.
        pass_credits: [],
        sent_emails: [],
        action_attempts: [],
        unlock_attempts: [],
        article_feedback: [],
        notice_retries: [],
        cloud_export_items: [],
        cloud_exports: [],
        export_log: [
          mint("2026-10-01T11:00:00.000000+00:00", "saved"),
          mint("2026-10-01T10:00:00.000000+00:00", "short"),
          // Stopped by her, or broken: not a download the Worker finished.
          mint("2026-10-01T09:00:00.000000+00:00", "stopped"),
          mint("2026-10-01T08:00:00.000000+00:00", "failed"),
          // A mint the Worker never spoke of is not a finished download.
          mint("2026-10-01T07:00:00.000000+00:00", null),
          // Yesterday's.
          mint("2026-09-29T11:00:00.000000+00:00", "saved"),
        ],
        job_runs: [
          runRow(
            1,
            "export_delivery",
            "error",
            "2026-10-01T08:00:00.000000+00:00",
            null,
          ),
        ],
      },
    });
    const signals = await getJobSignals(now);
    // ★ RESHAPED ON PURPOSE (crumbs-75; scar kept: two finished, one failure). The expired reason: the signal was
    // two numbers; it now carries what it still owes too, none here (no mint is past its grace with no end).
    expect(signals.export_delivery).toEqual({
      ok24h: 2,
      failed24h: 1,
      owed: 0,
    });
  });

  /**
   * ★ A DOWNLOAD OWED ITS END (crumbs-75; ROADMAP: an export whose Worker reports never arrived stayed a Started or
   * Checked row and never reached the bell). Owed: a mint the Worker spoke of (its check, or its stream's start) with
   * no end past the six-hour grace, for the day after that. Not owed: an end of any kind, a check that found nothing
   * (no zip is sent), a mint the Worker never spoke of (a local build's, an older Worker's), one still inside its
   * grace, one past the day, a refusal.
   */
  it("★ counts a download the Worker spoke of but never said ended, past its grace, as owed", async () => {
    const now = Date.parse("2026-10-05T12:00:00.000Z");
    const hoursAgo = (h: number) =>
      new Date(now - h * 3_600_000).toISOString().replace("Z", "000+00:00");
    const row = (h: number, worker: Record<string, unknown>) => ({
      outcome: "minted",
      created_at: hoursAgo(h),
      checked_at: null,
      check_found: null,
      stream_started_at: null,
      stream_ended_at: null,
      stream_outcome: null,
      ...worker,
    });
    state.fake = createFakePostgrest({
      tables: {
        // (credit-watch) the pass-to-Pro credit's signal reads its claims.
        pass_credits: [],
        sent_emails: [],
        action_attempts: [],
        unlock_attempts: [],
        article_feedback: [],
        notice_retries: [],
        cloud_export_items: [],
        cloud_exports: [],
        job_runs: [],
        export_log: [
          // Owed: checked and found something, never streamed or never said so.
          row(8, { checked_at: hoursAgo(8), check_found: 12 }),
          // Owed: its stream began and nothing ever said how it ended.
          row(7, {
            checked_at: hoursAgo(7),
            check_found: 3,
            stream_started_at: hoursAgo(7),
          }),
          // Owed: a check the bucket could not answer still sends the zip, and that zip never ended.
          row(20, { checked_at: hoursAgo(20), check_found: null }),
          // Not owed: it ended.
          row(9, {
            checked_at: hoursAgo(9),
            check_found: 2,
            stream_started_at: hoursAgo(9),
            stream_ended_at: hoursAgo(9),
            stream_outcome: "stopped",
          }),
          // Not owed: a check that found nothing sends no zip.
          row(10, { checked_at: hoursAgo(10), check_found: 0 }),
          // Not owed: the Worker never spoke of it (a local build's mint has no report address).
          row(11, {}),
          // Not owed: still inside its grace.
          row(2, {
            checked_at: hoursAgo(2),
            check_found: 5,
            stream_started_at: hoursAgo(2),
          }),
          // Not owed: owed for its day, and that day is over.
          row(31, { checked_at: hoursAgo(31), check_found: 5 }),
          // Not owed: a refusal is not a mint.
          {
            ...row(8, { checked_at: hoursAgo(8), check_found: 4 }),
            outcome: "rejected_cap",
          },
        ],
      },
    });
    const signals = await getJobSignals(now);
    expect(signals.export_delivery).toMatchObject({
      ok24h: 0,
      failed24h: 0,
      owed: 3,
    });
  });

  // ★ crumbs-75: a one-time notice kept for its retry is a host not yet told, however long ago it failed.
  it("★ counts the one-time notices kept for a retry, and when the oldest first failed", async () => {
    const now = Date.parse("2026-10-05T12:00:00.000Z");
    state.fake = createFakePostgrest({
      tables: {
        // (credit-watch) the pass-to-Pro credit's signal reads its claims.
        pass_credits: [],
        sent_emails: [],
        action_attempts: [],
        unlock_attempts: [],
        article_feedback: [],
        export_log: [],
        job_runs: [],
        notice_retries: [
          {
            kind: "inactivity_removed",
            dedupe_key: "e1",
            first_failed_at: "2026-10-04T04:00:00.000000+00:00",
          },
          {
            kind: "over_cap_reduced",
            dedupe_key: "h1",
            first_failed_at: "2026-09-20T04:00:00.000000+00:00",
          },
        ],
        cloud_export_items: [],
        cloud_exports: [],
      },
    });
    const signals = await getJobSignals(now);
    expect(signals.email_delivery).toEqual({
      ok24h: 0,
      failed24h: 0,
      owed: 2,
      owedSinceMs: Date.parse("2026-09-20T04:00:00.000Z"),
    });
  });

  it("★ throws when the kept notices cannot be read, never reading them as none", async () => {
    state.fake = createFakePostgrest({
      tables: {
        // (credit-watch) the pass-to-Pro credit's signal reads its claims.
        pass_credits: [],
        sent_emails: [],
        action_attempts: [],
        unlock_attempts: [],
        article_feedback: [],
        export_log: [],
        job_runs: [],
        cloud_export_items: [],
        cloud_exports: [],
      },
    });
    await expect(getJobSignals()).rejects.toThrow(/kept/);
  });

  // drive-wiring: the transfers' signal. A file in her Drive in the day (a kept one too: it was confirmed there) is
  // the success half, its failure rows the other, and a send stuck an hour with work and no progress is owed.
  it("counts the day's files that reached a Drive, their failures, and the sends stuck", async () => {
    const now = Date.parse("2026-10-05T12:00:00.000Z");
    state.fake = createFakePostgrest({
      tables: {
        // (credit-watch) the pass-to-Pro credit's signal reads its claims.
        pass_credits: [],
        sent_emails: [],
        action_attempts: [],
        unlock_attempts: [],
        article_feedback: [],
        export_log: [],
        notice_retries: [],
        job_runs: [
          runRow(
            1,
            "drive_transfer",
            "error",
            "2026-10-05T08:00:00.000000+00:00",
            null,
          ),
        ],
        cloud_export_items: [
          { status: "sent", sent_at: "2026-10-05T11:00:00.000000+00:00" },
          { status: "sent", sent_at: "2026-10-05T10:00:00.000000+00:00" },
          // Yesterday's, and one still pending.
          { status: "sent", sent_at: "2026-10-03T10:00:00.000000+00:00" },
          { status: "pending", sent_at: null },
        ],
        cloud_exports: [
          {
            status: "sending",
            stuck_since: "2026-10-05T10:00:00.000000+00:00",
          },
          { status: "sending", stuck_since: null },
          // A stuck mark left on a send that has since paused is not owed.
          { status: "paused", stuck_since: "2026-10-05T09:00:00.000000+00:00" },
        ],
      },
    });
    const signals = await getJobSignals(now);
    expect(signals.drive_transfer).toEqual({ ok24h: 2, failed24h: 1, owed: 1 });
  });

  it("throws when Drive's items cannot be read, never reading them as quiet", async () => {
    state.fake = createFakePostgrest({
      tables: {
        // (credit-watch) the pass-to-Pro credit's signal reads its claims.
        pass_credits: [],
        sent_emails: [],
        action_attempts: [],
        unlock_attempts: [],
        article_feedback: [],
        export_log: [],
        notice_retries: [],
        job_runs: [],
        cloud_exports: [],
      },
    });
    await expect(getJobSignals()).rejects.toThrow(/sent to Drive/);
  });

  // credit-watch: the pass-to-Pro credit's signal. A credit converted in the day is the success half (a conversion
  // follows only a grant), its failure rows the other (a credited checkout's delivery that failed), and a claim stuck
  // past its hour is owed: never granted (no live lease), or granted and never converted; a released one never is.
  it("★ counts the day's credits honoured, the credited deliveries that failed, and the credits stuck past their hour", async () => {
    const now = Date.parse("2026-10-05T12:00:00.000Z");
    const claim = (over: Record<string, unknown>) => ({
      stripe_session_id: `cs_${Math.random().toString(36).slice(2)}`,
      profile_id: "44444444-4444-4444-8444-444444444444",
      credit_cents: 1850,
      pass_ids: ["00000000-0000-4000-8000-00000000000a"],
      claimed_until: null,
      balance_transaction_id: null,
      granted_at: null,
      converted_at: null,
      converted_count: null,
      released_at: null,
      created_at: "2026-10-05T11:30:00.000000+00:00",
      ...over,
    });
    state.fake = createFakePostgrest({
      tables: {
        pass_credits: [
          // Honoured in the day, and one honoured yesterday.
          claim({
            balance_transaction_id: "cbtxn_1",
            granted_at: "2026-10-05T09:00:00.000000+00:00",
            converted_at: "2026-10-05T09:00:01.000000+00:00",
            converted_count: 2,
          }),
          claim({
            balance_transaction_id: "cbtxn_2",
            granted_at: "2026-10-03T09:00:00.000000+00:00",
            converted_at: "2026-10-03T09:00:01.000000+00:00",
            converted_count: 1,
          }),
          // Stuck: claimed at 08:00 and never granted, its lease long over.
          claim({
            created_at: "2026-10-05T08:00:00.000000+00:00",
            claimed_until: "2026-10-05T08:10:00.000000+00:00",
          }),
          // Stuck: granted at 10:30, never converted.
          claim({
            created_at: "2026-10-05T10:29:59.000000+00:00",
            balance_transaction_id: "cbtxn_3",
            granted_at: "2026-10-05T10:30:00.000000+00:00",
          }),
          // Not stuck: claimed an hour and a half ago, but a delivery holds it right now (a retry at work).
          claim({
            created_at: "2026-10-05T10:30:00.000000+00:00",
            claimed_until: "2026-10-05T12:05:00.000000+00:00",
          }),
          // Not stuck: claimed twenty minutes ago, lease over, Stripe's retry on its way.
          claim({
            created_at: "2026-10-05T11:40:00.000000+00:00",
            claimed_until: "2026-10-05T11:50:00.000000+00:00",
          }),
          // Not stuck: released (another checkout credited its passes), with and without a grant beside it.
          claim({
            created_at: "2026-10-04T08:00:00.000000+00:00",
            released_at: "2026-10-04T09:00:00.000000+00:00",
          }),
          claim({
            created_at: "2026-10-04T08:00:00.000000+00:00",
            balance_transaction_id: "cbtxn_4",
            granted_at: "2026-10-04T09:00:00.000000+00:00",
            released_at: "2026-10-04T09:00:00.000000+00:00",
          }),
        ],
        sent_emails: [],
        action_attempts: [],
        unlock_attempts: [],
        article_feedback: [],
        export_log: [],
        notice_retries: [],
        cloud_export_items: [],
        cloud_exports: [],
        job_runs: [
          runRow(
            1,
            "pass_credit",
            "error",
            "2026-10-05T08:00:30.000000+00:00",
            null,
          ),
          runRow(
            2,
            "pass_credit",
            "error",
            "2026-10-04T08:00:30.000000+00:00",
            null,
          ),
        ],
      },
    });
    const signals = await getJobSignals(now);
    expect(signals.pass_credit).toEqual({
      ok24h: 1,
      failed24h: 1,
      owed: 2,
      // The oldest owing: the claim never granted, owing since it was taken.
      owedSinceMs: Date.parse("2026-10-05T08:00:00.000Z"),
    });
  });

  it("★ says no owed time when nothing is stuck, and throws when the claims cannot be read, never reading them as none", async () => {
    const tables = {
      sent_emails: [],
      action_attempts: [],
      unlock_attempts: [],
      article_feedback: [],
      export_log: [],
      notice_retries: [],
      cloud_export_items: [],
      cloud_exports: [],
      job_runs: [],
    };
    state.fake = createFakePostgrest({
      tables: { ...tables, pass_credits: [] },
    });
    expect((await getJobSignals()).pass_credit).toEqual({
      ok24h: 0,
      failed24h: 0,
      owed: 0,
      owedSinceMs: null,
    });
    state.fake = createFakePostgrest({ tables });
    await expect(getJobSignals()).rejects.toThrow(/credit/);
  });
});
