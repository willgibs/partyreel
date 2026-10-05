"use client";

import {
  SpendWatchReadings,
  SpendWatchSwitches,
  type LatestWatchRun,
} from "@/app/admin/jobs/spend-watch-card";
import type { WatchToggle } from "@/app/admin/jobs/switch-controls";
import type {
  StoredReading,
  StoredRun,
  SwitchStates,
} from "@/lib/jobs/spend-watch";

/**
 * THE SPEND WATCH'S CARD, THE REAL ONE, OVER RUNS WRITTEN BY HAND (`spend-watch-card.tsx`; admin-observability.md, "The
 * spend watch"). /admin/jobs cannot be opened on localhost (the portal needs an operator's session at a second factor), and
 * the card is presentation only: the page reads the watch's last run and the switches and hands them down, so a run written
 * here is the page's own input and nothing is faked past it. The card is drawn as the page draws it, its readings above its
 * switches under one rule.
 *
 * ★ THE TWO SWITCHES ARE PRESSED THROUGH THEIR WHOLE FLOW AND WRITE NOTHING. Pausing guest uploads or lifecycle mail is a
 * platform-wide write and the lab runs against the real project, so the card's `toggle` seam carries a stand-in that answers
 * after a round trip's pause: the OFF edge asks first through the portal's one sheet (what pausing reaches), the verb
 * pauses (the switch goes off, its line changes), and turning it back on is immediate, as in the portal. The Server Function
 * is never reached.
 *
 * ★ FIVE CARDS ON ONE PAGE REPEAT ITS DOM IDS (`#spend-watch-readings`, `#spend-watch-switches`, `#switch-<key>`): harmless in
 * a catalog (the headings they label read the same) and never in the portal, which draws one. Its headings are h3s with ids,
 * which the shell's "On this page" would list as if they were sections of the entry, so each card stands in a
 * `data-toc-skip` (the scan's own way out).
 */

export type SpendWatchState =
  | "healthy"
  | "tripped"
  | "missing"
  | "none"
  | "unreadable";

/** The night the readings were taken (04:00 UTC's run) and the hour before it, so every instant is fixed. */
const AT = Date.parse("2026-10-04T05:00:00.000Z");
const GIB = 1024 ** 3;

const ok = (
  value: number,
  ceiling: number,
  peak: number | null = null,
): StoredReading => ({
  state: "ok",
  value,
  ceiling,
  basis: "floor",
  peak,
});

/** A quiet night: every reading a few percent under its ceiling. */
const QUIET: StoredRun["readings"] = {
  uploads: ok(29.2, 1_000, 41),
  upload_bytes: ok(0.2 * GIB, 10 * GIB),
  album_changes: ok(31, 2_000),
  lifecycle_mail: ok(1, 50),
  resend_mail: { state: "ok", value: 7, ceiling: 80, basis: "cap", peak: 9 },
  sign_ins: ok(2, 200),
  downloads: ok(3, 100, 12),
  purge_runs: ok(1, 4, 2),
};

function latest(
  readings: StoredRun["readings"],
  extra: Partial<StoredRun> = {},
): LatestWatchRun {
  return {
    run: {
      readAtMs: AT,
      fromMs: AT - 24 * 60 * 60 * 1000,
      readings,
      snap: {},
      pausedAt: {},
      ...extra,
    },
    startedAt: new Date(AT).toISOString(),
    status: "ok",
  };
}

/** The instant the watch wrote its pause of Download all: the switch still holds it, so the pause is still the watch's. */
const PAUSED_AT = "2026-10-04T05:00:00.250Z";

const ALL_ON: SwitchStates = {
  uploads_enabled: { enabled: true, updatedAtMs: null },
  lifecycle_mail_enabled: { enabled: true, updatedAtMs: null },
  export_enabled: { enabled: true, updatedAtMs: AT - 1_000 },
  purge_cron_enabled: { enabled: true, updatedAtMs: AT - 1_000 },
};

type Case = {
  latest: LatestWatchRun | null;
  latestError: string | null;
  switches: SwitchStates | null;
  switchesError: string | null;
};

const CASES: Record<SpendWatchState, Case> = {
  // The one card that may say nothing is wrong: every reading under its ceiling, every switch on.
  healthy: {
    latest: latest(QUIET),
    latestError: null,
    switches: ALL_ON,
    switchesError: null,
  },
  // A runaway night: uploads and bytes past their ceilings (the card offers the uploads switch, which only a person
  // presses), and a download loop that the watch has already paused itself, still its pause until someone turns it back.
  tripped: {
    latest: latest(
      {
        ...QUIET,
        uploads: {
          state: "tripped",
          value: 4_210,
          ceiling: 1_000,
          basis: "floor",
          peak: 22,
        },
        upload_bytes: {
          state: "tripped",
          value: 12 * GIB,
          ceiling: 10 * GIB,
          basis: "floor",
          peak: 1 * GIB,
        },
        downloads: {
          state: "tripped",
          value: 900,
          ceiling: 120,
          basis: "peak",
          peak: 12,
        },
      },
      { pausedAt: { export_enabled: PAUSED_AT } },
    ),
    latestError: null,
    switches: {
      ...ALL_ON,
      export_enabled: { enabled: false, updatedAtMs: Date.parse(PAUSED_AT) },
    },
    switchesError: null,
  },
  // A reading the watch could not take is "No reading" and why, in the failure tone, never a number; one still
  // warming says so.
  missing: {
    latest: latest({
      ...QUIET,
      sign_ins: {
        state: "missing",
        value: null,
        ceiling: 200,
        basis: "floor",
        peak: null,
        why: "permission denied for table users",
      },
      uploads: {
        state: "warming",
        value: null,
        why: "a first reading: the next run measures from this one",
      },
    }),
    latestError: null,
    switches: ALL_ON,
    switchesError: null,
  },
  // The watch has not run: said in words, never a calm table.
  none: {
    latest: null,
    latestError: null,
    switches: ALL_ON,
    switchesError: null,
  },
  // Neither could be read: said in words, and no switch is drawn as on.
  unreadable: {
    latest: null,
    latestError: "spend watch: its own history: connection reset",
    switches: null,
    switchesError: "connection reset",
  },
};

/** A round trip's wait: what the Server Function takes before it answers. */
const ROUND_TRIP_MS = 700;

/** The write the two switches make, answering after a round trip and changing nothing. */
const INERT_TOGGLE: WatchToggle = () =>
  new Promise((resolve) =>
    setTimeout(() => resolve({ ok: true }), ROUND_TRIP_MS),
  );

export function SpendWatchDemo({ state }: { state: SpendWatchState }) {
  const c = CASES[state];
  return (
    <div data-toc-skip="" data-library-demo={`spend-watch-${state}`}>
      <div className="space-y-5 rounded-float border bg-card p-4">
        <SpendWatchReadings latest={c.latest} unreadable={c.latestError} />
        <SpendWatchSwitches
          switches={c.switches}
          latest={c.latest?.run ?? null}
          unreadable={c.switchesError}
          toggle={INERT_TOGGLE}
        />
      </div>
    </div>
  );
}
