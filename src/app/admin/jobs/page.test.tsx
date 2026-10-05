/**
 * THE JOBS CONSOLE, RENDERED WHOLE ON STUBBED READS (crumbs-75). The portal's sign-in and MFA complete only on a real
 * host, so no lane can open `/admin/jobs` locally; this renders the page itself, its reads stubbed, to hold what the
 * lane added to it: a signal's owed line (the notices waiting to send, the downloads with no end) and the backup's
 * lone copies as a card of their own beside the dead letters, failing at any count with the restore path said.
 */
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JobSignals, JobState } from "@/lib/db/queries/jobs";

const NOW = Date.parse("2026-10-05T12:00:00.000Z");

const state = vi.hoisted(() => ({
  signals: {} as JobSignals,
  states: [] as JobState[],
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
vi.mock("@/app/admin/jobs/prune-hold", () => ({
  readLastPruneReport: async () => null,
  readPruneHoldReleasedAtMs: async () => null,
}));
vi.mock("@/app/admin/jobs/actions", () => ({
  toggleJobAction: vi.fn(),
  toggleWatchSwitchAction: vi.fn(),
  releasePruneHoldAction: vi.fn(),
  runJobNowAction: vi.fn(),
}));

const { default: JobsPage } = await import("@/app/admin/jobs/page");

/** A prune run an hour ago, closed ok, carrying these counts. */
function pruneRun(counts: Record<string, unknown>): JobState {
  const at = new Date(NOW - 60 * 60 * 1000).toISOString();
  return {
    job: "backup_prune",
    lastRun: {
      status: "ok",
      startedAtMs: Date.parse(at),
      finishedAtMs: Date.parse(at),
      stoppedEarly: false,
      breakerTripped: false,
    },
    lastRunRow: {
      id: "r1",
      job: "backup_prune",
      status: "ok",
      triggered_by: "schedule",
      started_at: at,
      finished_at: at,
      duration_ms: 1_000,
      counts: counts as never,
      note: null,
    },
    lastFinishedAtMs: Date.parse(at),
  };
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
    expect(
      within(lone).getByText(
        /^Restore each from the backup: copy it from partyreel-backup into partyreel at the same key/,
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
    expect(within(lone).queryByText(/^Restore each/)).toBeNull();
  });
});

// Keep `screen` in use for a failing render's own debugging.
void screen;
