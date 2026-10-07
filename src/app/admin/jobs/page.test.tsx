/**
 * THE JOBS CONSOLE, RENDERED WHOLE ON STUBBED READS (crumbs-75). The portal's sign-in and MFA complete only on a real
 * host, so no lane can open `/admin/jobs` locally; this renders the page itself, its reads stubbed, to hold what the
 * lane added to it: a signal's owed line (the notices waiting to send, the downloads with no end) and the backup's
 * lone copies as a card of their own beside the dead letters, failing at any count with the restore path said; and
 * (durability-restore) the backup restore's own card: its mode, what its last pass copied back and what it could not,
 * and Restore now, drawn wired only where the app knows the Worker's door.
 */
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JobSignals, JobState } from "@/lib/db/queries/jobs";

const NOW = Date.parse("2026-10-05T12:00:00.000Z");

const state = vi.hoisted(() => ({
  signals: {} as JobSignals,
  states: [] as JobState[],
  wired: true,
  sums: null as unknown,
  sumsUnreadable: false,
  names: new Map<string, string>(),
  namesUnreadable: false,
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/admin-context", () => ({
  requireAdmin: async () => ({ aal: "aal2" }),
}));
vi.mock("@/lib/db/queries/jobs", () => ({
  getJobFlags: async () => ({}),
  getJobStates: async () => state.states,
  listRecentJobRuns: async () => [],
  getJobSignals: async () => state.signals,
}));
vi.mock("@/lib/jobs/limits-watch-run", () => ({
  readLatestLimits: async () => null,
}));
vi.mock("@/lib/jobs/spend-watch-run", () => ({
  readLatestWatchRun: async () => null,
}));
vi.mock("@/lib/jobs/spend-watch-switches", () => ({
  readSwitches: async () => null,
}));
vi.mock("@/lib/db/queries/storage-sums", () => ({
  readLatestStorageSumsCounts: async () => {
    if (state.sumsUnreadable) throw new Error("job_runs unreachable");
    return state.sums;
  },
  readHostLabels: async () => {
    if (state.namesUnreadable) throw new Error("profiles unreachable");
    return state.names;
  },
}));
vi.mock("@/app/admin/jobs/prune-hold", () => ({
  readLastPruneReport: async () => null,
  readPruneHoldReleasedAtMs: async () => null,
}));
vi.mock("@/app/admin/jobs/actions", () => ({
  toggleJobAction: vi.fn(),
  toggleWatchSwitchAction: vi.fn(),
  releasePruneHoldAction: vi.fn(),
  runJobNowAction: vi.fn(),
  restoreNowAction: vi.fn(),
  rebuildStorageSumsAction: vi.fn(),
}));
vi.mock("@/app/admin/jobs/restore-now", () => ({
  restoreNowWired: () => state.wired,
}));

const { default: JobsPage } = await import("@/app/admin/jobs/page");

/** A run of `job`, closed `status` `agoMs` ago, carrying these counts. */
function runOf(
  job: JobState["job"],
  counts: Record<string, unknown>,
  opts: {
    status?: "ok" | "error" | "skipped";
    agoMs?: number;
    note?: string;
  } = {},
): JobState {
  const at = new Date(NOW - (opts.agoMs ?? 60 * 60 * 1000)).toISOString();
  const status = opts.status ?? "ok";
  return {
    job,
    lastRun: {
      status,
      startedAtMs: Date.parse(at),
      finishedAtMs: Date.parse(at),
      stoppedEarly: false,
      breakerTripped: false,
    },
    lastRunRow: {
      id: `r-${job}`,
      job,
      status,
      triggered_by: "schedule",
      started_at: at,
      finished_at: at,
      duration_ms: 1_000,
      counts: counts as never,
      note: opts.note ?? null,
    },
    lastFinishedAtMs: Date.parse(at),
  };
}

/** A prune run an hour ago, closed ok, carrying these counts. */
function pruneRun(counts: Record<string, unknown>): JobState {
  return runOf("backup_prune", counts);
}

function card(id: string): HTMLElement {
  const el = document.getElementById(`job-${id}`);
  if (!el) throw new Error(`no card for ${id}`);
  return el;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  state.signals = {};
  state.states = [];
  state.wired = true;
  state.sums = null;
  state.sumsUnreadable = false;
  state.names = new Map();
  state.namesUnreadable = false;
});

describe("the jobs console (crumbs-75)", () => {
  it("★ says what a signal still owes, under its 24 hours, and reads it as Needs a look", async () => {
    state.signals = {
      email_delivery: {
        ok24h: 4,
        failed24h: 0,
        owed: 2,
        owedSinceMs: Date.parse("2026-10-03T04:00:00.000Z"),
      },
      export_delivery: { ok24h: 9, failed24h: 0, owed: 1 },
      abuse_limiter: { ok24h: 3, failed24h: 0 },
    };
    render(await JobsPage());

    const mail = card("email_delivery");
    expect(within(mail).getByText("Needs a look")).toBeInTheDocument();
    expect(within(mail).getByText("Waiting")).toBeInTheDocument();
    expect(
      within(mail).getByText(
        /^2 one-time notices to send, the oldest failing since Oct 3, 2026, 04:00 UTC\./,
      ),
    ).toBeInTheDocument();

    const zips = card("export_delivery");
    expect(within(zips).getByText("Needs a look")).toBeInTheDocument();
    expect(within(zips).getByText("No end")).toBeInTheDocument();
    expect(
      within(zips).getByText(/^1 download the Worker checked or began/),
    ).toBeInTheDocument();

    // A signal that owes nothing draws no such line.
    expect(within(card("abuse_limiter")).queryByText("Waiting")).toBeNull();
    expect(
      within(card("abuse_limiter")).getByText("Healthy"),
    ).toBeInTheDocument();
  });

  it("★ draws the backup's lone copies beside the dead letters, a failure at any count, with the restore path", async () => {
    state.states = [pruneRun({ primary_missing: 3, scanned: 4_000 })];
    render(await JobsPage());

    const lone = card("backup_primary_missing");
    // Beside the dead letters, in the console's order.
    expect(card("backup_dead_letters").nextElementSibling).toBe(lone);
    expect(
      within(lone).getByText("Held by the backup alone"),
    ).toBeInTheDocument();
    expect(within(lone).getByText("Last run failed")).toBeInTheDocument();
    expect(within(lone).getByText("Keys")).toBeInTheDocument();
    expect(
      within(lone).getByText("3 held by the backup alone"),
    ).toBeInTheDocument();
    // The remedy is the restore now, said where the alert is; a key it cannot copy back is still a copy by hand.
    expect(
      within(lone).getByText(
        /^The backup restore below copies each back on its own while its RESTORE_MODE is on/,
      ),
    ).toBeInTheDocument();
    expect(
      within(lone).getByText(
        /copied by hand from partyreel-backup into partyreel at the same key/,
      ),
    ).toBeInTheDocument();
  });

  it("reads a quiet week as healthy, and a run that never counted as no reading, never as none missing", async () => {
    state.states = [pruneRun({ primary_missing: 0, scanned: 4_000 })];
    const { unmount } = render(await JobsPage());
    expect(
      within(card("backup_primary_missing")).getByText("Healthy"),
    ).toBeInTheDocument();
    unmount();

    // An older Worker's run (or an aborted one) carries no count at all.
    state.states = [pruneRun({ scanned: 4_000 })];
    render(await JobsPage());
    const lone = card("backup_primary_missing");
    expect(within(lone).getAllByText("No reading").length).toBeGreaterThan(0);
    expect(within(lone).queryByText(/^The backup restore below/)).toBeNull();
  });
});

describe("the backup restore's card (durability-restore)", () => {
  it("★ says its mode, what its last pass copied back and what it could not, each why, in place of the raw counts", async () => {
    state.states = [
      runOf(
        "backup_restore",
        {
          restore_mode: "on",
          restored: 2,
          restored_bytes: 6 * 1024 * 1024,
          checked: 3,
          too_large: 1,
          primary_missing: 1,
        },
        { status: "error", note: "Restored 2 keys (6 MB) from the backup." },
      ),
    ];
    render(await JobsPage());
    const restore = card("backup_restore");
    // Right after the lone copies it restores.
    expect(card("backup_primary_missing").nextElementSibling).toBe(restore);
    expect(within(restore).getByText("Last run failed")).toBeInTheDocument();
    expect(within(restore).getByText("Mode")).toBeInTheDocument();
    expect(
      within(restore).getByText("On: it copies the backup's lone copies back"),
    ).toBeInTheDocument();
    expect(
      within(restore).getByText("Restored 2 keys (6 MB)"),
    ).toBeInTheDocument();
    expect(
      within(restore).getByText(
        "1 key over the 4.99 GB one conditional write takes: copy by hand",
      ),
    ).toBeInTheDocument();
    expect(within(restore).queryByText("Reported")).toBeNull();
    expect(
      within(restore).getByText("Restored 2 keys (6 MB) from the backup."),
    ).toBeInTheDocument();
    const press = within(restore).getByRole("button", { name: "Restore now" });
    expect((press as HTMLButtonElement).disabled).toBe(false);
    expect(
      within(restore).getByText(
        /^Restore now asks its Worker for a pass at once/,
      ),
    ).toBeInTheDocument();
  });

  it("★ lets the restore's pass outrank the prune that found them: copied back, the lone copies read healthy", async () => {
    state.states = [
      runOf(
        "backup_prune",
        { primary_missing: 2, scanned: 4_000 },
        { agoMs: 2 * 3_600_000 },
      ),
      runOf(
        "backup_restore",
        { restore_mode: "on", restored: 2, checked: 2, primary_missing: 0 },
        { agoMs: 3_600_000 },
      ),
    ];
    render(await JobsPage());
    expect(
      within(card("backup_primary_missing")).getByText("Healthy"),
    ).toBeInTheDocument();
    expect(
      within(card("backup_restore")).getByText("Healthy"),
    ).toBeInTheDocument();
  });

  it("draws Restore now disabled, and says why, while the app does not know the Worker's door", async () => {
    state.wired = false;
    render(await JobsPage());
    const restore = card("backup_restore");
    const press = within(restore).getByRole("button", { name: "Restore now" });
    expect((press as HTMLButtonElement).disabled).toBe(true);
    expect(
      within(restore).getByText(
        /^Restore now is not wired here: set BACKUP_WORKER_URL/,
      ),
    ).toBeInTheDocument();
    expect(within(restore).getByText("No runs yet")).toBeInTheDocument();
  });
});

describe("the backup reconcile's card (backup-reconcile)", () => {
  it("★ says its pass in words: this run ended it, when the last whole pass ended, and what it found, in place of the raw counts", async () => {
    state.states = [
      runOf(
        "backup_reconcile",
        {
          checked: 5_862,
          copied: 0,
          mismatched: 2,
          breaker_tripped: true,
          absent_from_primary: 654,
          young_absent: 611,
          lone_found: 0,
          primary_missing: 0,
          pass_complete: true,
          pass_walked: 5_862,
          pass_started_at: "2026-10-05T05:00:00.000Z",
          last_pass_at: "2026-10-05T05:00:12.000Z",
          last_pass_walked: 5_862,
        },
        {
          note: "The pass reached the end: 5,862 keys compared with the backup's, every one backed up.",
        },
      ),
    ];
    state.states[0].lastRun!.breakerTripped = true;
    render(await JobsPage());
    const reconcile = card("backup_reconcile");
    expect(within(reconcile).getByText("Needs a look")).toBeInTheDocument();
    expect(within(reconcile).getByText("Pass")).toBeInTheDocument();
    expect(
      within(reconcile).getByText(
        "Complete: 5,862 keys compared with the backup, every one backed up",
      ),
    ).toBeInTheDocument();
    expect(within(reconcile).getByText("Last full pass")).toBeInTheDocument();
    expect(
      within(reconcile).getByText("Oct 5, 2026, 05:00 UTC, 5,862 keys"),
    ).toBeInTheDocument();
    expect(
      within(reconcile).getByText(
        /^2 keys differ between the buckets \(size or checksum\): left as they are, never overwritten/,
      ),
    ).toBeInTheDocument();
    expect(within(reconcile).queryByText("Reported")).toBeNull();
  });

  it("★ reads a pass carried across runs as one in progress, from when it began, with no whole pass yet", async () => {
    state.states = [
      runOf("backup_reconcile", {
        checked: 40_000,
        copied: 0,
        pass_complete: false,
        pass_walked: 80_000,
        pass_started_at: "2026-10-04T05:00:00.000Z",
        stopped_early: true,
        lone_found: 0,
      }),
    ];
    state.states[0].lastRun!.stoppedEarly = true;
    render(await JobsPage());
    const reconcile = card("backup_reconcile");
    expect(within(reconcile).getByText("Needs a look")).toBeInTheDocument();
    expect(
      within(reconcile).getByText(
        "In progress: 80,000 keys compared since Oct 4, 2026, 05:00 UTC; the next run carries on",
      ),
    ).toBeInTheDocument();
    expect(
      within(reconcile).getByText("None has reached the end yet"),
    ).toBeInTheDocument();
  });

  it("keeps the raw counts of a run from before the pass", async () => {
    state.states = [
      runOf("backup_reconcile", {
        capped: false,
        copied: 0,
        failed: 0,
        checked: 3_419,
      }),
    ];
    render(await JobsPage());
    const reconcile = card("backup_reconcile");
    expect(within(reconcile).getByText("Reported")).toBeInTheDocument();
    expect(within(reconcile).getByText("checked 3,419")).toBeInTheDocument();
    expect(within(reconcile).queryByText("Pass")).toBeNull();
  });
});

describe("the storage sums' card (storage-sums-signal)", () => {
  const HOST = "6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b";
  const drifted = {
    checked: 3,
    drifted: 1,
    rows_failed: 1,
    pass_checked: 3,
    pass_complete: true,
    last_pass_at: "2026-10-07T04:01:00.000Z",
    last_pass_checked: 3,
    findings: [
      {
        host_id: HOST,
        summary_active: 5_242_880,
        summary_deleted: 40,
        summary_system: 0,
        walk_active: 5_242_881,
        walk_deleted: 40,
        walk_system: 0,
        events: 1,
        total: false,
        since: "2026-10-07T04:01:00.000Z",
      },
    ],
  };

  it("★ names each drifted host, what parts her sums from her walk, and her Rebuild, from the check's record", async () => {
    state.sums = drifted;
    state.names = new Map([[HOST, "willg97@gmail.com"]]);
    state.states = [
      runOf("storage_sums", drifted, {
        status: "error",
        note: "1 host's storage sums differ from her items walked: Rebuild her on this card.",
      }),
    ];
    render(await JobsPage());
    const sums = card("storage_sums");
    expect(within(sums).getByText("Last run failed")).toBeInTheDocument();
    expect(
      within(sums).getByText(
        "Complete: 3 hosts checked, 1 host drifted (below)",
      ),
    ).toBeInTheDocument();
    expect(
      within(sums).getByText("Oct 7, 2026, 04:01 UTC, 3 hosts"),
    ).toBeInTheDocument();
    const list = within(sums).getByRole("region", {
      name: "Hosts whose storage sums drifted",
    });
    const name = within(list).getByRole("link", { name: "willg97@gmail.com" });
    expect(name).toHaveAttribute("href", `/admin/accounts/${HOST}`);
    expect(
      within(list).getByText(
        "Albums 5 MB (5,242,880 B) by the sums, 5 MB (5,242,881 B) walked",
      ),
    ).toBeInTheDocument();
    expect(
      within(list).getByText(
        "1 of her event rows differs from her items by event",
      ),
    ).toBeInTheDocument();
    expect(
      within(list).getByRole("button", {
        name: "Rebuild the storage sums of willg97@gmail.com",
      }),
    ).toBeInTheDocument();
    // Its own words stand in for the raw tally.
    expect(within(sums).queryByText("Reported")).toBeNull();
  });

  it("counts the drifted hosts past the list, and says what a drift that wide is", async () => {
    state.sums = { ...drifted, drifted: 3, rows_failed: 3, unlisted: 2 };
    render(await JobsPage());
    expect(
      within(card("storage_sums")).getByText(
        /^2 more drifted, not listed: a drift this wide is the sums’ trigger missing a writer/,
      ),
    ).toBeInTheDocument();
  });

  it("reads a whole clean pass as done, with nothing to rebuild", async () => {
    state.sums = {
      checked: 3,
      drifted: 0,
      rows_failed: 0,
      pass_checked: 3,
      pass_complete: true,
      last_pass_at: "2026-10-07T04:01:00.000Z",
      last_pass_checked: 3,
    };
    state.states = [
      runOf("storage_sums", state.sums as Record<string, unknown>),
    ];
    render(await JobsPage());
    const sums = card("storage_sums");
    expect(within(sums).getByText("Healthy")).toBeInTheDocument();
    expect(
      within(sums).getByText(
        "Complete: 3 hosts checked, every one's sums the walk",
      ),
    ).toBeInTheDocument();
    expect(within(sums).queryByRole("button", { name: /^Rebuild/ })).toBeNull();
  });

  it("gives each host her id when names cannot be read, and says No reading when the record cannot", async () => {
    state.sums = drifted;
    state.namesUnreadable = true;
    render(await JobsPage());
    expect(
      within(card("storage_sums")).getByRole("link", { name: HOST }),
    ).toBeInTheDocument();

    document.body.innerHTML = "";
    state.sumsUnreadable = true;
    render(await JobsPage());
    expect(
      within(card("storage_sums")).getByText(
        /^No reading: its record could not be read \(job_runs unreachable\)\.$/,
      ),
    ).toBeInTheDocument();
  });
});

// Keep `screen` in use for a failing render's own debugging.
void screen;
