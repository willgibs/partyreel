/**
 * THE STORAGE SUMS' RECORD (storage-sums-signal): the check's answer read defensively, the host before a host in
 * Postgres's order (the one-host check), the run row's shape both ways (what it keeps, what the next run reads back),
 * and the Rebuild's own row: she leaves the list only when the check after the Rebuild reads her at parity.
 */
import { describe, expect, it } from "vitest";

import { RESUME_KEY } from "@/lib/jobs/sweep-tally";
import {
  EMPTY_STATE,
  FINDINGS_KEY,
  FINDINGS_MAX,
  driftNote,
  findingOf,
  listFindings,
  parseDriftPage,
  readStorageSumsState,
  rebuildOutcome,
  recheckOf,
  storageSumsCounts,
  uuidBefore,
  type DriftFinding,
  type DriftedHost,
  type StorageSumsState,
} from "@/lib/lifecycle/sweeps/storage-sums-state";

const HOST = "6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b";
const OTHER = "3fcf6405-ce4d-46ea-a11c-9ed68194b630";
const NOW = new Date("2026-10-07T04:00:00.000Z");

const figures = (active: number, deleted = 0, system = 0) => ({
  active_bytes: active,
  standby_bytes: deleted,
  system_bytes: system,
});

/** One drifted host as `storage_sums_drift` answers her. */
function answered(hostId: string, summary = 1_001, walk = 1_000) {
  return {
    host_id: hostId,
    summary: figures(summary, 40),
    walk: figures(walk, 40),
    events: 1,
    total: true,
  };
}

function drifted(
  hostId: string,
  since = "2026-10-06T04:00:00.000Z",
): DriftFinding {
  const host: DriftedHost = {
    hostId,
    summary: { active: 1_001, deleted: 40, system: 0 },
    walk: { active: 1_000, deleted: 40, system: 0 },
    events: 1,
    total: true,
  };
  return findingOf(host, since);
}

describe("parseDriftPage", () => {
  it("reads the function's answer: what it checked, where to go on, and each drifted host's two figures", () => {
    const page = parseDriftPage({
      checked: 50,
      next_after: HOST.toUpperCase(),
      drifted: [answered(OTHER)],
    });
    expect(page).toEqual({
      checked: 50,
      nextAfter: HOST,
      drifted: [
        {
          hostId: OTHER,
          summary: { active: 1_001, deleted: 40, system: 0 },
          walk: { active: 1_000, deleted: 40, system: 0 },
          events: 1,
          total: true,
        },
      ],
    });
    expect(
      parseDriftPage({ checked: 3, next_after: null, drifted: [] }),
    ).toEqual({
      checked: 3,
      nextAfter: null,
      drifted: [],
    });
  });

  it.each([
    ["no answer", null],
    ["a list", []],
    ["no count", { next_after: null, drifted: [] }],
    ["a fractional count", { checked: 1.5, next_after: null, drifted: [] }],
    ["a cursor that is no id", { checked: 1, next_after: "next", drifted: [] }],
    ["no list of drifted hosts", { checked: 1, next_after: null }],
    [
      "a drifted host with no id",
      {
        checked: 1,
        next_after: null,
        drifted: [{ ...answered(OTHER), host_id: 7 }],
      },
    ],
    [
      "a figure that is no number",
      {
        checked: 1,
        next_after: null,
        drifted: [{ ...answered(OTHER), walk: { active_bytes: "1" } }],
      },
    ],
    [
      "a total that is no boolean",
      {
        checked: 1,
        next_after: null,
        drifted: [{ ...answered(OTHER), total: null }],
      },
    ],
  ])("★ fails on %s, never reading it as a clean night", (_name, data) => {
    expect(() => parseDriftPage(data)).toThrow(TypeError);
  });
});

describe("uuidBefore", () => {
  it.each([
    [HOST, "6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0a"],
    // A borrow across a group, and across every group.
    [
      "6cb5fdb5-ac8a-4c82-83ce-000000000000",
      "6cb5fdb5-ac8a-4c82-83cd-ffffffffffff",
    ],
    [
      "10000000-0000-0000-0000-000000000000",
      "0fffffff-ffff-ffff-ffff-ffffffffffff",
    ],
    [
      "00000000-0000-0000-0000-000000000001",
      "00000000-0000-0000-0000-000000000000",
    ],
    [
      "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF",
      "ffffffff-ffff-ffff-ffff-fffffffffffe",
    ],
  ])("puts the host just before %s at %s", (id, before) => {
    expect(uuidBefore(id)).toBe(before);
  });

  it("has nothing before the first id, and refuses what is no id", () => {
    expect(uuidBefore("00000000-0000-0000-0000-000000000000")).toBeNull();
    expect(() => uuidBefore("not-a-uuid")).toThrow(TypeError);
  });
});

describe("recheckOf", () => {
  it("★ reads a one-host check as hers only when its page names her", () => {
    const at = (drifted: unknown[], next: string | null) =>
      parseDriftPage({ checked: next ? 1 : 0, next_after: next, drifted });
    expect(recheckOf(HOST, at([], HOST))).toEqual({ kind: "parity" });
    expect(recheckOf(HOST, at([answered(HOST)], HOST)).kind).toBe("drifted");
    // Her account gone: the call checked the next host, whose figures are not hers to read.
    expect(recheckOf(HOST, at([answered(OTHER)], OTHER))).toEqual({
      kind: "gone",
    });
    expect(recheckOf(HOST, at([], null))).toEqual({ kind: "gone" });
  });
});

describe("the run row, both ways", () => {
  it("keeps the flat tally and the findings, and never a note's text", () => {
    const counts = storageSumsCounts({
      checked: 3,
      drifted: 1,
      rows_failed: 1,
      rows_note: "1 host's storage sums differ",
      pass_complete: true,
      pass_checked: 3,
      [FINDINGS_KEY]: [drifted(HOST)],
      stray: { nested: true },
    }) as Record<string, unknown>;
    expect(counts).toEqual({
      checked: 3,
      drifted: 1,
      rows_failed: 1,
      pass_complete: true,
      pass_checked: 3,
      [FINDINGS_KEY]: [drifted(HOST)],
    });
  });

  it("drops a malformed finding and keeps at most the list's bound", () => {
    const many = Array.from({ length: FINDINGS_MAX + 5 }, (_, i) =>
      drifted(`00000000-0000-4000-8000-${String(i).padStart(12, "0")}`),
    );
    const counts = storageSumsCounts({
      checked: 1,
      [FINDINGS_KEY]: [{ host_id: "x" }, ...many],
    }) as Record<string, unknown[]>;
    expect(counts[FINDINGS_KEY]).toHaveLength(FINDINGS_MAX);
    expect(storageSumsCounts(null)).toBeNull();
  });

  it("reads back what the next run resumes from, and nothing it cannot read", () => {
    const state = readStorageSumsState({
      [RESUME_KEY]: HOST.toUpperCase(),
      [FINDINGS_KEY]: [drifted(OTHER), { host_id: OTHER }],
      unlisted: 2,
      pass_started_at: "2026-10-05T04:00:00.000Z",
      pass_checked: 900,
      pass_complete: false,
      last_pass_at: "2026-10-01T04:01:00.000Z",
      last_pass_checked: 1_200,
      stopped_early: true,
      remaining: 300,
    });
    expect(state).toEqual({
      resumeAfter: HOST,
      findings: [drifted(OTHER)],
      unlisted: 2,
      passStartedAt: "2026-10-05T04:00:00.000Z",
      passChecked: 900,
      passComplete: false,
      lastPassAt: "2026-10-01T04:01:00.000Z",
      lastPassChecked: 1_200,
      stoppedEarly: true,
      remaining: 300,
    });
    // No row, or one of another shape: a pass from the first host with nobody carried.
    expect(readStorageSumsState(null)).toEqual(EMPTY_STATE);
    expect(
      readStorageSumsState({ [RESUME_KEY]: "nope", [FINDINGS_KEY]: "nope" }),
    ).toMatchObject({
      resumeAfter: null,
      findings: [],
    });
  });

  it("lists the known drifted hosts once each, by id, the freshest figures and the first date a check named her", () => {
    const fresh = {
      ...drifted(HOST, "2026-10-07T04:00:00.000Z"),
      walk_active: 999,
    };
    const { listed, unlisted } = listFindings([
      drifted(HOST),
      drifted(OTHER),
      fresh,
    ]);
    expect(listed.map((f) => f.host_id)).toEqual([OTHER, HOST]);
    expect(listed[1]).toMatchObject({
      walk_active: 999,
      since: "2026-10-06T04:00:00.000Z",
    });
    expect(unlisted).toBe(0);
  });

  it("counts past the bound what it cannot name", () => {
    const many = Array.from({ length: FINDINGS_MAX + 3 }, (_, i) =>
      drifted(`00000000-0000-4000-8000-${String(i).padStart(12, "0")}`),
    );
    const { listed, unlisted } = listFindings(many);
    expect(listed).toHaveLength(FINDINGS_MAX);
    expect(unlisted).toBe(3);
  });

  it("words the run's note in hosts", () => {
    expect(driftNote(1)).toMatch(/^1 host's storage sums differ/);
    expect(driftNote(1_200)).toMatch(/^1,200 hosts' storage sums differ/);
  });
});

describe("rebuildOutcome", () => {
  const state: StorageSumsState = {
    ...EMPTY_STATE,
    resumeAfter: OTHER,
    findings: [drifted(HOST), drifted(OTHER)],
    passStartedAt: "2026-10-06T04:00:00.000Z",
    passChecked: 40,
    lastPassAt: "2026-10-01T04:00:00.000Z",
    lastPassChecked: 39,
    stoppedEarly: true,
    remaining: 7,
  };
  const before = { active: 1_001, deleted: 40, system: 0 };
  const after = { active: 1_000, deleted: 40, system: 0 };

  it("★ takes her off the list once the check after it reads her at parity, and carries the pass as it stood", () => {
    const outcome = rebuildOutcome({
      state,
      hostId: HOST.toUpperCase(),
      answer: { ok: true, before, after },
      recheck: { kind: "parity" },
      now: NOW,
    });
    expect(outcome.settled).toBe(true);
    // Another host still stands named, so the bell keeps ringing.
    expect(outcome.status).toBe("error");
    expect(outcome.counts).toMatchObject({
      checked: 1,
      drifted: 1,
      rows_failed: 1,
      rebuilt_host: HOST,
      pass_checked: 40,
      pass_complete: false,
      pass_started_at: "2026-10-06T04:00:00.000Z",
      last_pass_at: "2026-10-01T04:00:00.000Z",
      last_pass_checked: 39,
      [RESUME_KEY]: OTHER,
      stopped_early: true,
      remaining: 7,
    });
    const listed = (outcome.counts as Record<string, DriftFinding[]>)[
      FINDINGS_KEY
    ];
    expect(listed.map((f) => f.host_id)).toEqual([OTHER]);
    expect(outcome.note).toContain(
      "albums 1,001 B, Deleted 40 B, the system's 0 B before",
    );
    expect(outcome.note).toContain("her sums are the walk again");
  });

  it("closes ok when she was the last host named", () => {
    const outcome = rebuildOutcome({
      state: { ...state, findings: [drifted(HOST)], stoppedEarly: false },
      hostId: HOST,
      answer: { ok: true, before, after },
      recheck: { kind: "parity" },
      now: NOW,
    });
    expect(outcome.status).toBe("ok");
    expect(outcome.counts).not.toHaveProperty(FINDINGS_KEY);
    expect(outcome.counts).not.toHaveProperty("rows_failed");
    expect(outcome.counts).toMatchObject({ drifted: 0 });
  });

  it("★ keeps her, with her first date and her new figures, when the check after it still reads a drift", () => {
    const stillHost: DriftedHost = {
      hostId: HOST,
      summary: { active: 1_000, deleted: 41, system: 0 },
      walk: { active: 1_000, deleted: 40, system: 0 },
      events: 0,
      total: false,
    };
    const outcome = rebuildOutcome({
      state,
      hostId: HOST,
      answer: { ok: true, before, after },
      recheck: { kind: "drifted", host: stillHost },
      now: NOW,
    });
    expect(outcome.settled).toBe(false);
    expect(outcome.status).toBe("error");
    const kept = (outcome.counts as Record<string, DriftFinding[]>)[
      FINDINGS_KEY
    ].find((f) => f.host_id === HOST);
    expect(kept).toMatchObject({
      summary_deleted: 41,
      since: "2026-10-06T04:00:00.000Z",
    });
    expect(outcome.note).toContain("still different from the walk");
  });

  it("lets a host whose account is gone leave the list", () => {
    const outcome = rebuildOutcome({
      state: { ...state, findings: [drifted(HOST)], unlisted: 2 },
      hostId: HOST,
      answer: { ok: false, reason: "no_host" },
      recheck: { kind: "gone" },
      now: NOW,
    });
    expect(outcome.settled).toBe(true);
    // The hosts counted past the last list stand until a whole pass meets them.
    expect(outcome.counts).toMatchObject({ drifted: 2, unlisted: 2 });
    expect(outcome.note).toContain("no account holds her any more");
  });
});
