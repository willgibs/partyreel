/**
 * THE ONE SEND PATH, ON THE POSTGREST FAKE (its two tables given their real keys: `sent_emails`' unique claim answers
 * 23505, and `notice_retries`' `first_failed_at` is written only by its default, on the row's first insert).
 *
 *  - THE LIFECYCLE-MAIL PAUSE (the spend watch). While `lifecycle_mail_enabled` is off a re-sent lifecycle mail is
 *    HELD: no claim (so its sweep sends it the night the switch is back on) and no send. A one-time notice and every
 *    operator mail always go, and the switch is not even asked for them.
 *  - ★ A ONE-TIME NOTICE IS KEPT UNTIL IT SENDS (crumbs-75). Its sweep never sends it again, so one refused send used
 *    to lose it for good; it is kept, rendered and with no address, its sweep retries it each night through the same
 *    claim, and it is given up, loudly, 30 days after its first failure.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";
import { readMigrations } from "@/lib/db/testing/migrations";

const send = vi.fn();
const lifecycleMailFlowing = vi.fn();
const recordSignalFailure = vi.fn(async (_failure: unknown) => {});
const state = vi.hoisted(() => ({
  fake: null as FakePostgrest | null,
  /** The instant the fake's `first_failed_at` default writes. */
  nowIso: "2026-10-05T04:00:00.000000+00:00",
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  assertResendEnv: () => ({
    RESEND_API_KEY: "re_test",
    EMAIL_FROM: "Partyreel <noreply@partyreel.com>",
  }),
}));
vi.mock("@/lib/email/client", () => ({
  getResend: () => ({ emails: { send: (...a: unknown[]) => send(...a) } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => keyed(state.fake!),
}));
vi.mock("@/lib/jobs/failure-log", () => ({
  recordSignalFailure: (failure: unknown) => recordSignalFailure(failure),
}));
vi.mock("@/lib/jobs/spend-watch-switches", () => ({
  lifecycleMailFlowing: (...a: unknown[]) => lifecycleMailFlowing(...a),
}));

type Builder = Record<string, (...a: never[]) => unknown>;

/**
 * The fake with the two tables' real keys: a second claim of one (kind, dedupe_key) is refused as Postgres refuses it,
 * and a kept notice's first insert takes `first_failed_at` from its default, which no upsert names.
 */
function keyed(fake: FakePostgrest) {
  return {
    from(table: string) {
      const builder = fake.from(table) as unknown as Builder;
      if (table === "sent_emails") {
        const insert = builder.insert.bind(builder);
        builder.insert = ((value: FakeRow) => {
          const taken = fake.tables.sent_emails.some(
            (r) => r.kind === value.kind && r.dedupe_key === value.dedupe_key,
          );
          return taken
            ? Promise.resolve({
                data: null,
                error: { code: "23505", message: "duplicate key value" },
              })
            : insert(value as never);
        }) as never;
      }
      if (table === "notice_retries" && fake.tables.notice_retries) {
        const upsert = builder.upsert.bind(builder);
        builder.upsert = ((value: FakeRow, options: unknown) => {
          const known = fake.tables.notice_retries.some(
            (r) => r.kind === value.kind && r.dedupe_key === value.dedupe_key,
          );
          return upsert(
            (known
              ? value
              : { first_failed_at: state.nowIso, ...value }) as never,
            options as never,
          );
        }) as never;
      }
      return builder;
    },
  };
}

const { NOTICE_RETRIES_A_RUN, SendFailedError, retryParkedNotices, sendOnce } =
  await import("@/lib/email/send");
const { NOTICE_RETRY_DAYS } = await import("@/lib/email/send-kinds");

const NOW = new Date("2026-10-05T04:00:00.000Z");
const HOST = "11111111-1111-4111-8111-111111111111";

const mail = (kind: string, over: Record<string, unknown> = {}) => ({
  kind,
  dedupeKey: `${kind}:host-1`,
  profileId: HOST,
  to: "host@example.com",
  subject: "Subject",
  html: "<p>Hi</p>",
  text: "Hi",
  ...over,
});

const refused = {
  data: null,
  error: { name: "validation_error", message: "no" },
};

function world(tables: Record<string, FakeRow[]> = {}) {
  state.fake = createFakePostgrest({
    tables: {
      sent_emails: [],
      notice_retries: [],
      profiles: [{ id: HOST, email: "host@now.example" }],
      ...tables,
    },
  });
  return state.fake;
}

/** A notice kept by an earlier failure. */
function keptRow(over: Partial<FakeRow> = {}): FakeRow {
  return {
    kind: "inactivity_removed",
    dedupe_key: "event-1",
    profile_id: HOST,
    subject: "Your event is in Deleted",
    html: "<p>Restore it until 4 November.</p>",
    text: "Restore it until 4 November.",
    first_failed_at: "2026-10-03T04:00:00.000000+00:00",
    last_failed_at: "2026-10-04T04:00:00.000000+00:00",
    ...over,
  };
}

const daysBefore = (days: number) =>
  new Date(NOW.getTime() - days * 86_400_000).toISOString();

beforeEach(() => {
  vi.clearAllMocks();
  world();
  send.mockResolvedValue({ data: { id: "e_1" }, error: null });
  lifecycleMailFlowing.mockResolvedValue(true);
});

describe("a paused lifecycle mail", () => {
  it("★ holds the mail its sweep sends again: no claim, no send, and false back", async () => {
    const fake = world();
    lifecycleMailFlowing.mockResolvedValue(false);
    for (const kind of [
      "inactivity_warning",
      "over_cap_reminder",
      "renewal_nudge",
    ]) {
      expect(await sendOnce(mail(kind))).toBe(false);
    }
    expect(fake.tables.sent_emails).toEqual([]);
    expect(send).not.toHaveBeenCalled();
    expect(lifecycleMailFlowing).toHaveBeenCalledWith("renewal_nudge");
  });

  it("sends it as ever while the switch is on", async () => {
    const fake = world();
    lifecycleMailFlowing.mockResolvedValue(true);
    expect(await sendOnce(mail("over_cap_reminder"))).toBe(true);
    expect(fake.tables.sent_emails).toHaveLength(1);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("★ never holds a one-time notice or an operator mail, and never asks the switch for them", async () => {
    lifecycleMailFlowing.mockResolvedValue(false);
    for (const kind of [
      "inactivity_removed",
      "over_cap_grace_start",
      "over_cap_reduced",
      "orphan_breaker",
      "report_urgent",
      "spend_watch",
    ]) {
      expect(await sendOnce(mail(kind)), kind).toBe(true);
    }
    expect(send).toHaveBeenCalledTimes(6);
    expect(lifecycleMailFlowing).not.toHaveBeenCalled();
  });

  it("answers false for a mail its claim says already went, and sends nothing", async () => {
    world({
      sent_emails: [{ kind: "spend_watch", dedupe_key: "spend_watch:host-1" }],
    });
    expect(await sendOnce(mail("spend_watch"))).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });
});

describe("★ a one-time notice whose send fails", () => {
  it("★ is kept, rendered, for its retry: the claim released, no address kept, the throw unchanged", async () => {
    const fake = world();
    send.mockResolvedValue(refused);
    const thrown = await sendOnce(
      mail("inactivity_removed", { dedupeKey: "event-1" }),
    ).catch((e: unknown) => e);
    expect(thrown).toBeInstanceOf(SendFailedError);
    expect(thrown).toBeInstanceOf(Error);
    expect(String(thrown)).toMatch(/resend send \(inactivity_removed\): no/);

    // The claim is released, as for every refused send.
    expect(fake.tables.sent_emails).toEqual([]);
    // And the notice is kept: what it says and whose it is, never where it was going.
    expect(fake.tables.notice_retries).toHaveLength(1);
    const kept = fake.tables.notice_retries[0];
    expect(kept).toMatchObject({
      kind: "inactivity_removed",
      dedupe_key: "event-1",
      profile_id: HOST,
      subject: "Subject",
      html: "<p>Hi</p>",
      text: "Hi",
      first_failed_at: state.nowIso,
    });
    expect(JSON.stringify(kept)).not.toContain("host@example.com");
    // The send's refusal is said once, in the signal.
    expect(recordSignalFailure).toHaveBeenCalledTimes(1);
    expect(recordSignalFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        job: "email_delivery",
        operation: "resend send (inactivity_removed)",
      }),
    );
  });

  it("keeps the first failure's instant when the same notice fails again, so the give-up clock never restarts", async () => {
    const fake = world({
      notice_retries: [
        keptRow({ kind: "over_cap_reduced", dedupe_key: "host-1:grace" }),
      ],
    });
    send.mockResolvedValue(refused);
    await expect(
      sendOnce(mail("over_cap_reduced", { dedupeKey: "host-1:grace" })),
    ).rejects.toThrow(/resend send/);
    expect(fake.tables.notice_retries).toHaveLength(1);
    expect(fake.tables.notice_retries[0].first_failed_at).toBe(
      "2026-10-03T04:00:00.000000+00:00",
    );
    expect(fake.tables.notice_retries[0].last_failed_at).not.toBe(
      "2026-10-04T04:00:00.000000+00:00",
    );
  });

  it("keeps a notice whose claim could not be written, since nothing went", async () => {
    const fake = world();
    // A claim refused for any reason but the unique key: the database refused the write.
    const from = fake.from.bind(fake);
    fake.from = ((table: string) => {
      const builder = from(table);
      if (table === "sent_emails") {
        (builder as unknown as Record<string, unknown>).insert = () =>
          Promise.resolve({
            data: null,
            error: { code: "08006", message: "connection failure" },
          });
      }
      return builder;
    }) as typeof fake.from;
    await expect(sendOnce(mail("over_cap_grace_start"))).rejects.toThrow(
      /sent_emails claim \(over_cap_grace_start\)/,
    );
    expect(send).not.toHaveBeenCalled();
    expect(fake.tables.notice_retries.map((r) => r.kind)).toEqual([
      "over_cap_grace_start",
    ]);
  });

  it("never keeps a re-sent mail or an operator mail: its sweep calls again, or an operator sees it fail", async () => {
    const fake = world();
    send.mockResolvedValue(refused);
    for (const kind of ["over_cap_reminder", "spend_watch", "report_urgent"]) {
      await expect(sendOnce(mail(kind)), kind).rejects.toThrow(/resend send/);
    }
    expect(fake.tables.notice_retries).toEqual([]);
  });

  it("says a notice with no account to retry it for is lost, the one way it still can be", async () => {
    const fake = world();
    send.mockResolvedValue(refused);
    await expect(
      sendOnce(mail("inactivity_removed", { profileId: null })),
    ).rejects.toThrow(/resend send/);
    expect(fake.tables.notice_retries).toEqual([]);
    expect(recordSignalFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        operation:
          "notice lost: no account to retry it for (inactivity_removed)",
      }),
    );
  });
});

describe("★ retryParkedNotices", () => {
  type Notice =
    | "inactivity_removed"
    | "over_cap_grace_start"
    | "over_cap_reduced";
  const retry = (
    kinds: Notice[] = ["inactivity_removed"],
    stopWhen?: () => boolean,
  ) => retryParkedNotices({ kinds, now: NOW, stopWhen });

  it("★ sends a kept notice again, to the account's address as it stands, and lets it go", async () => {
    const fake = world({ notice_retries: [keptRow()] });
    const tally = await retry();
    expect(tally).toEqual({
      notices_resent: 1,
      notices_failed: 0,
      notices_dropped: 0,
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "host@now.example",
        subject: "Your event is in Deleted",
        html: "<p>Restore it until 4 November.</p>",
        text: "Restore it until 4 November.",
      }),
    );
    expect(fake.tables.notice_retries).toEqual([]);
    // Sent through the claim, so it stays single.
    expect(fake.tables.sent_emails).toMatchObject([
      { kind: "inactivity_removed", dedupe_key: "event-1", profile_id: HOST },
    ]);
  });

  it("keeps a notice that fails again, counted, and said once (by the send itself)", async () => {
    const fake = world({ notice_retries: [keptRow()] });
    send.mockResolvedValue(refused);
    const tally = await retry();
    expect(tally).toEqual({
      notices_resent: 0,
      notices_failed: 1,
      notices_dropped: 0,
    });
    expect(fake.tables.notice_retries).toHaveLength(1);
    expect(fake.tables.notice_retries[0].first_failed_at).toBe(
      "2026-10-03T04:00:00.000000+00:00",
    );
    expect(fake.tables.sent_emails).toEqual([]);
    expect(recordSignalFailure).toHaveBeenCalledTimes(1);
    expect(recordSignalFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "resend send (inactivity_removed)",
      }),
    );
  });

  it("lets a notice go when its claim says it already went (another run's retry), and sends nothing", async () => {
    const fake = world({
      notice_retries: [keptRow()],
      sent_emails: [{ kind: "inactivity_removed", dedupe_key: "event-1" }],
    });
    const tally = await retry();
    expect(tally).toEqual({
      notices_resent: 0,
      notices_failed: 0,
      notices_dropped: 0,
    });
    expect(send).not.toHaveBeenCalled();
    expect(fake.tables.notice_retries).toEqual([]);
  });

  it(`gives a notice up ${NOTICE_RETRY_DAYS} days after its first failure, and says so`, async () => {
    const fake = world({
      notice_retries: [
        keptRow({ dedupe_key: "old", first_failed_at: daysBefore(31) }),
        keptRow({ dedupe_key: "young", first_failed_at: daysBefore(29) }),
      ],
    });
    const tally = await retry();
    expect(tally).toEqual({
      notices_resent: 1,
      notices_failed: 0,
      notices_dropped: 1,
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(fake.tables.notice_retries).toEqual([]);
    expect(recordSignalFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        job: "email_delivery",
        operation: `notice given up after ${NOTICE_RETRY_DAYS} days of failed sends (inactivity_removed)`,
      }),
    );
  });

  it("lets a notice go quietly when its account has no address left (anonymised on its way out)", async () => {
    const fake = world({
      notice_retries: [keptRow()],
      profiles: [{ id: HOST, email: null }],
    });
    const tally = await retry();
    expect(tally).toMatchObject({ notices_dropped: 1, notices_resent: 0 });
    expect(send).not.toHaveBeenCalled();
    expect(fake.tables.notice_retries).toEqual([]);
    expect(recordSignalFailure).not.toHaveBeenCalled();
  });

  it("stops after three failures in a row: Resend is down, not an address, and the rest wait", async () => {
    const fake = world({
      notice_retries: Array.from({ length: 5 }, (_, i) =>
        keptRow({ dedupe_key: `event-${i}` }),
      ),
    });
    send.mockResolvedValue(refused);
    const tally = await retry();
    expect(tally.notices_failed).toBe(3);
    expect(send).toHaveBeenCalledTimes(3);
    expect(fake.tables.notice_retries).toHaveLength(5);
  });

  it("asks its sweep's deadline before every notice", async () => {
    world({ notice_retries: [keptRow()] });
    const tally = await retry(["inactivity_removed"], () => true);
    expect(tally).toEqual({
      notices_resent: 0,
      notices_failed: 0,
      notices_dropped: 0,
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("retries only the kinds its sweep owns, the oldest first, a bounded batch a night", async () => {
    const fake = world({
      notice_retries: [
        keptRow({ kind: "inactivity_removed", dedupe_key: "theirs" }),
        ...Array.from({ length: NOTICE_RETRIES_A_RUN + 2 }, (_, i) =>
          keptRow({
            kind: "over_cap_grace_start",
            dedupe_key: `host-${String(i).padStart(2, "0")}`,
            // Each a little newer than the one before.
            first_failed_at: new Date(
              NOW.getTime() - 10 * 86_400_000 + i * 60_000,
            ).toISOString(),
          }),
        ),
      ],
    });
    const tally = await retry(["over_cap_grace_start", "over_cap_reduced"]);
    expect(tally.notices_resent).toBe(NOTICE_RETRIES_A_RUN);
    // The newest two wait for the next night; the inactivity sweep's notice was never touched.
    expect(fake.tables.notice_retries.map((r) => r.dedupe_key).sort()).toEqual(
      [
        `host-${NOTICE_RETRIES_A_RUN}`,
        `host-${NOTICE_RETRIES_A_RUN + 1}`,
        "theirs",
      ].sort(),
    );
  });

  it("never throws: a kept-notice table it cannot read is said, and its sweep carries on", async () => {
    const fake = world();
    delete (fake.tables as Record<string, unknown>).notice_retries;
    const tally = await retry(["inactivity_removed"]);
    expect(tally).toEqual({
      notices_resent: 0,
      notices_failed: 0,
      notices_dropped: 0,
    });
    expect(recordSignalFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "notice retry: the kept notices (inactivity_removed)",
      }),
    );
  });

  // ★ A late notice must still be true: "your event is in Deleted" to a host who restored it, or "you are over your
  // plan" to one who upgraded, is a wrong mail, worse than none.
  it("★ lets a notice go quietly when its sweep says what it says is no longer so, asking by the notice's own key", async () => {
    const fake = world({
      notice_retries: [
        keptRow({ dedupe_key: "restored" }),
        keptRow({ dedupe_key: "still-deleted" }),
      ],
    });
    const asked: unknown[] = [];
    const tally = await retryParkedNotices({
      kinds: ["inactivity_removed"],
      now: NOW,
      stillTrue: (notice) => {
        asked.push(notice);
        return notice.dedupeKey !== "restored";
      },
    });
    expect(tally).toEqual({
      notices_resent: 1,
      notices_failed: 0,
      notices_dropped: 1,
    });
    expect(asked).toEqual([
      { kind: "inactivity_removed", dedupeKey: "restored", profileId: HOST },
      {
        kind: "inactivity_removed",
        dedupeKey: "still-deleted",
        profileId: HOST,
      },
    ]);
    expect(send).toHaveBeenCalledTimes(1);
    expect(fake.tables.notice_retries).toEqual([]);
    // Nothing failed: the state moved on.
    expect(recordSignalFailure).not.toHaveBeenCalled();
  });

  it("keeps a notice whose sweep could not say whether it is still so, and says so once", async () => {
    const fake = world({ notice_retries: [keptRow()] });
    const tally = await retryParkedNotices({
      kinds: ["inactivity_removed"],
      now: NOW,
      stillTrue: () => {
        throw new Error("the event could not be read");
      },
    });
    expect(tally).toEqual({
      notices_resent: 0,
      notices_failed: 1,
      notices_dropped: 0,
    });
    expect(send).not.toHaveBeenCalled();
    expect(fake.tables.notice_retries).toHaveLength(1);
    expect(recordSignalFailure).toHaveBeenCalledTimes(1);
    expect(recordSignalFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "notice retry (inactivity_removed)",
      }),
    );
  });
});

/**
 * ★ THE KEPT NOTICES' TABLE, PINNED IN ITS SQL (crumbs-75, 20261005060000): the facts this send path and the console's
 * read stand on, held across the whole migration set (a later file that adds a policy, a client grant or a column the
 * code names differently fails here). Its behavior on the live schema is the migration's own rolled-back check.
 */
describe("★ notice_retries, as the migrations leave it", () => {
  const sql = readMigrations()
    .map((f) => f.sql.replace(/--[^\n]*/g, ""))
    .join("\n")
    .replace(/\s+/g, " ");
  const table = /create table public\.notice_retries \(([\s\S]*?)\);/.exec(
    sql,
  )?.[1];

  it("keys a notice on sent_emails' own key, carries the rendered mail and whose it is, and never an address", () => {
    expect(table).toBeTruthy();
    for (const column of [
      "kind text not null",
      "dedupe_key text not null",
      "profile_id uuid not null references public.profiles (id) on delete cascade",
      "subject text not null",
      "html text not null",
      "text text not null",
      "first_failed_at timestamptz not null default now()",
      "last_failed_at timestamptz not null default now()",
      "primary key (kind, dedupe_key)",
    ]) {
      expect(table, column).toContain(column);
    }
    expect(table).not.toMatch(/\b(email|to_address|recipient)\b/);
  });

  it("is deny-all: RLS on, no policy, no client grant, so the service role alone reaches it", () => {
    expect(sql).toContain(
      "alter table public.notice_retries enable row level security;",
    );
    expect(sql).toContain(
      "revoke all on table public.notice_retries from anon, authenticated;",
    );
    expect(sql).not.toMatch(/create policy [^;]* on public\.notice_retries/);
    expect(sql).not.toMatch(
      /grant [^;]* on (?:table )?public\.notice_retries to [^;]*(anon|authenticated)/,
    );
  });
});
