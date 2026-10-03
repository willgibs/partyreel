/**
 * THE DEVELOP SWEEP (20261002200000): the nightly backstop drains every album whose sealed rows disagree with its
 * event, a batch a call, asks the deadline only between calls, says what it left, never spins, and never reads a
 * malformed answer as a quiet night.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { DEVELOP_BATCH, parseDevelopAnswer, sweepDevelop } = await import(
  "@/lib/lifecycle/sweeps/develop"
);

type Answer = { events: number; developed: number; more: boolean };

/** An admin client whose RPC answers the batches in turn, and whose head count answers `left`. */
function adminOf(answers: (Answer | { error: string })[], left = 0) {
  const calls: unknown[] = [];
  let i = 0;
  const count = {
    select: () => count,
    not: () => count,
    lte: () => count,
    then: (resolve: (v: unknown) => void) => resolve({ count: left, error: null, data: null }),
  };
  const admin = {
    rpc: vi.fn(async (name: string, args: unknown) => {
      calls.push([name, args]);
      const a = answers[Math.min(i++, answers.length - 1)];
      return "error" in a
        ? { data: null, error: { message: a.error, code: "XX000" } }
        : { data: a, error: null };
    }),
    from: vi.fn(() => count),
  };
  return { admin: admin as never, calls };
}

const deadline = (passedAfter: number) => {
  let asked = 0;
  return { passed: () => asked++ >= passedAfter, remainingMs: () => 1000 } as never;
};

describe("parseDevelopAnswer", () => {
  it("reads {events, developed, more}", () => {
    expect(parseDevelopAnswer({ events: 2, developed: 40, more: false })).toEqual({ events: 2, developed: 40, more: false });
  });

  it("an answer this code does not know fails the run, never reads as a quiet night", () => {
    for (const bad of [null, [], "ok", { events: 1, developed: 2 }, { events: -1, developed: 0, more: false }, { events: 1, developed: 1.5, more: false }, { events: 1, developed: 1, more: "no" }]) {
      expect(() => parseDevelopAnswer(bad)).toThrow(TypeError);
    }
  });
});

describe("sweepDevelop", () => {
  it("drains batch after batch until nothing disagrees, a batch of DEVELOP_BATCH albums a call", async () => {
    const { admin, calls } = adminOf([
      { events: 50, developed: 900, more: true },
      { events: 7, developed: 70, more: false },
    ]);
    expect(await sweepDevelop(admin)).toEqual({ events: 57, developed: 970 });
    expect(calls).toEqual([
      ["develop_due_sweep", { p_limit: DEVELOP_BATCH }],
      ["develop_due_sweep", { p_limit: DEVELOP_BATCH }],
    ]);
  });

  it("★ asks the deadline only between calls, and says what it left: tomorrow's run starts on it", async () => {
    const { admin, calls } = adminOf([{ events: 3, developed: 30, more: true }], 12);
    const tally = await sweepDevelop(admin, { deadline: deadline(1), batch: 3 });
    expect(calls).toHaveLength(1);
    expect(tally).toMatchObject({ events: 3, developed: 30 });
    expect(JSON.stringify(tally)).toContain("12");
  });

  it("★ never spins: a batch that moved nothing while more remain stops the run", async () => {
    const { admin, calls } = adminOf([{ events: 0, developed: 0, more: true }]);
    expect(await sweepDevelop(admin)).toEqual({ events: 0, developed: 0 });
    expect(calls).toHaveLength(1);
  });

  it("a failed call fails the run, labelled", async () => {
    const { admin } = adminOf([{ error: "boom" }]);
    await expect(sweepDevelop(admin)).rejects.toThrow("cron/purge: develop_due_sweep");
  });
});
