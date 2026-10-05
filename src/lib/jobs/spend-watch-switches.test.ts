/**
 * THE SWITCHES' DIRECTIONS, red first: guest uploads fail OPEN (a switch nobody can read never stops a party),
 * lifecycle mail fails CLOSED for what it holds (and says so in the email signal), a row not seeded yet reads ON for
 * both, and the watch's pause never re-stamps a switch an operator already turned off.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

type Result = { data: unknown; error: { message: string } | null };

/** Each call to the fake answers the next queued result; every chain method returns the chain. */
const answers: Result[] = [];
const calls: { table: string; ops: [string, unknown[]][] }[] = [];

function chain(table: string) {
  const record = { table, ops: [] as [string, unknown[]][] };
  calls.push(record);
  const next = () =>
    Promise.resolve(answers.shift() ?? { data: null, error: null });
  const builder: Record<string, unknown> = {};
  for (const op of ["select", "eq", "in", "limit", "update", "insert"]) {
    builder[op] = (...args: unknown[]) => {
      record.ops.push([op, args]);
      return builder;
    };
  }
  builder.maybeSingle = () => {
    record.ops.push(["maybeSingle", []]);
    return next();
  };
  builder.then = (
    resolve: (r: Result) => unknown,
    reject: (e: unknown) => unknown,
  ) => next().then(resolve, reject);
  return builder;
}

let throwOnCreate = false;
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    if (throwOnCreate) throw new Error("SUPABASE_SECRET_KEY is not set");
    return { from: (table: string) => chain(table) };
  },
}));
const captureWarning = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: (...args: unknown[]) => captureWarning(...args),
  captureError: vi.fn(),
}));
const recordSignalFailure = vi.fn();
vi.mock("@/lib/jobs/failure-log", () => ({
  recordSignalFailure: (...args: unknown[]) => recordSignalFailure(...args),
}));

const {
  guestUploadsOpen,
  lifecycleMailFlowing,
  pauseSwitch,
  readSwitches,
  resetSwitchThrottle,
} = await import("@/lib/jobs/spend-watch-switches");

beforeEach(() => {
  answers.length = 0;
  calls.length = 0;
  throwOnCreate = false;
  vi.clearAllMocks();
  resetSwitchThrottle();
});

describe("guest uploads fail OPEN", () => {
  it("reads the switch: on lets the upload go, off stops it", async () => {
    answers.push({ data: { enabled: true }, error: null });
    expect(await guestUploadsOpen()).toBe(true);
    answers.push({ data: { enabled: false }, error: null });
    expect(await guestUploadsOpen()).toBe(false);
    expect(calls[0].ops).toContainEqual(["eq", ["key", "uploads_enabled"]]);
  });

  it("reads a row not seeded yet as on", async () => {
    answers.push({ data: null, error: null });
    expect(await guestUploadsOpen()).toBe(true);
  });

  it("★ lets the upload go when the switch cannot be read, and tells Sentry once a quarter hour", async () => {
    answers.push({ data: null, error: { message: "connection refused" } });
    expect(await guestUploadsOpen()).toBe(true);
    answers.push({ data: null, error: { message: "connection refused" } });
    expect(await guestUploadsOpen()).toBe(true);
    throwOnCreate = true;
    expect(await guestUploadsOpen()).toBe(true);
    expect(captureWarning).toHaveBeenCalledTimes(1);
    expect(captureWarning).toHaveBeenCalledWith(
      "upload",
      "uploads_switch_unreadable",
      expect.objectContaining({ failed: "open" }),
    );
  });
});

describe("lifecycle mail fails CLOSED for what it holds", () => {
  it("reads the switch: on sends, off holds, a row not seeded yet sends", async () => {
    answers.push({ data: { enabled: true }, error: null });
    expect(await lifecycleMailFlowing("over_cap_reminder")).toBe(true);
    answers.push({ data: { enabled: false }, error: null });
    expect(await lifecycleMailFlowing("over_cap_reminder")).toBe(false);
    answers.push({ data: null, error: null });
    expect(await lifecycleMailFlowing("over_cap_reminder")).toBe(true);
    expect(calls[0].ops).toContainEqual([
      "eq",
      ["key", "lifecycle_mail_enabled"],
    ]);
  });

  it("★ holds when the switch cannot be read, and records the hold in the email signal", async () => {
    answers.push({ data: null, error: { message: "timeout" } });
    expect(await lifecycleMailFlowing("renewal_nudge")).toBe(false);
    expect(recordSignalFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        job: "email_delivery",
        operation: "lifecycle mail switch unreadable, held (renewal_nudge)",
      }),
    );
  });
});

describe("reading the switches whole", () => {
  it("answers each switch with the instant it last changed, a row not seeded yet as on", async () => {
    answers.push({
      data: [
        {
          key: "uploads_enabled",
          enabled: true,
          updated_at: "2026-10-01T00:00:00+00:00",
        },
        {
          key: "export_enabled",
          enabled: false,
          updated_at: "2026-10-02T05:00:01.234+00:00",
        },
        {
          key: "purge_cron_enabled",
          enabled: true,
          updated_at: "2026-09-02T00:00:00+00:00",
        },
      ],
      error: null,
    });
    expect(await readSwitches()).toEqual({
      uploads_enabled: {
        enabled: true,
        updatedAtMs: Date.parse("2026-10-01T00:00:00Z"),
      },
      lifecycle_mail_enabled: { enabled: true, updatedAtMs: null },
      export_enabled: {
        enabled: false,
        updatedAtMs: Date.parse("2026-10-02T05:00:01.234Z"),
      },
      purge_cron_enabled: {
        enabled: true,
        updatedAtMs: Date.parse("2026-09-02T00:00:00Z"),
      },
      drive_export_enabled: { enabled: true, updatedAtMs: null },
    });
  });

  it("throws rather than drawing an unreadable switch as on", async () => {
    answers.push({ data: null, error: { message: "permission denied" } });
    await expect(readSwitches()).rejects.toThrow(/permission denied/);
  });
});

describe("the watch's own pause", () => {
  const at = new Date("2026-10-03T05:00:00.250Z");

  it("pauses a switch that is on, and answers the instant it wrote", async () => {
    answers.push({ data: [{ key: "export_enabled" }], error: null });
    expect(await pauseSwitch("export_enabled", at)).toBe(at.toISOString());
    expect(calls[0].ops).toEqual([
      ["update", [{ enabled: false, updated_at: at.toISOString() }]],
      ["eq", ["key", "export_enabled"]],
      ["eq", ["enabled", true]],
      ["select", ["key"]],
    ]);
  });

  it("★ never re-stamps a switch an operator already turned off", async () => {
    answers.push({ data: [], error: null });
    answers.push({ data: { enabled: false }, error: null });
    expect(await pauseSwitch("purge_cron_enabled", at)).toBeNull();
    // One update that matched nothing, one read, and no insert.
    expect(calls.map((c) => c.ops[0][0])).toEqual(["update", "select"]);
  });

  it("writes a switch never seeded as off", async () => {
    answers.push({ data: [], error: null });
    answers.push({ data: null, error: null });
    answers.push({ data: null, error: null });
    expect(await pauseSwitch("lifecycle_mail_enabled", at)).toBe(
      at.toISOString(),
    );
    expect(calls[2].ops).toEqual([
      [
        "insert",
        [
          {
            key: "lifecycle_mail_enabled",
            enabled: false,
            updated_at: at.toISOString(),
          },
        ],
      ],
    ]);
  });

  it("throws on a write that failed, so the run names it", async () => {
    answers.push({ data: null, error: { message: "deadlock detected" } });
    await expect(pauseSwitch("export_enabled", at)).rejects.toThrow(
      /deadlock detected/,
    );
  });
});
