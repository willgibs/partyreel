/**
 * WHO FILED A REPORT, AS THE SERVER KNOWS IT (admin-triage r2, `proof=confirm`), and the operator told at once.
 *
 *  - ★ an address counts only beside `email_confirmed_at`: a bare `user.email` is what an unconfirmed sign-up
 *    carries too, and the instant hide keys on a confirmed address;
 *  - the address's hash is one value per address (case and spaces aside) and lives in its own domain, so it can
 *    never equal the rate limiter's hash of anything else;
 *  - a report that cannot wait warns every time and mails the ops inbox at most once per album in any ten minutes
 *    (a window from the album's last mail, through the real `sendOnce` ledger over an in-memory `sent_emails`), and
 *    a failed mail never fails the report.
 */
import { createHmac } from "node:crypto";

import type { User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

type LedgerRow = {
  id: string;
  kind: string;
  dedupe_key: string;
  sent_at: string;
};

const state = vi.hoisted(() => ({
  secret: "test-secret" as string | undefined,
  /** What Resend was handed. */
  sent: [] as { to: string; text: string; subject: string }[],
  sendFails: false,
  warnings: [] as { message: string; extra: unknown }[],
  errors: [] as unknown[],
  /** `sent_emails`, in memory: unique (kind, dedupe_key), stamped with the database's clock. */
  ledger: [] as LedgerRow[],
  /** The database's now(), set by each test to the report's own clock. */
  dbNow: "2026-09-27T22:12:00.000Z",
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  env: {},
  serverEnv: {
    get UNLOCK_COOKIE_SECRET() {
      return state.secret;
    },
    CONTACT_NOTIFY_EMAIL: "ops@example.com",
  },
  assertResendEnv: () => ({
    RESEND_API_KEY: "re_test",
    EMAIL_FROM: "Partyreel <noreply@example.com>",
  }),
}));
vi.mock("@/lib/auth/admin-host", () => ({ ADMIN_HOST: "admin.partyreel.com" }));
vi.mock("@/lib/email/client", () => ({
  getResend: () => ({
    emails: {
      send: async (mail: { to: string; text: string; subject: string }) => {
        if (state.sendFails) {
          return { error: { message: "resend down", name: "api_error" } };
        }
        state.sent.push(mail);
        return { error: null };
      },
    },
  }),
}));
vi.mock("@/lib/jobs/failure-log", () => ({
  recordSignalFailure: async () => {},
}));
/** The admin client, as far as `sent_emails` goes: the claim, its release, and the window's read of the last mail. */
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table !== "sent_emails") throw new Error(`unexpected ${table}`);
      return {
        insert: async (row: { kind: string; dedupe_key: string }) => {
          if (
            state.ledger.some(
              (r) => r.kind === row.kind && r.dedupe_key === row.dedupe_key,
            )
          ) {
            return { error: { code: "23505", message: "duplicate key" } };
          }
          state.ledger.push({
            id: `row-${state.ledger.length + 1}`,
            kind: row.kind,
            dedupe_key: row.dedupe_key,
            sent_at: state.dbNow,
          });
          return { error: null };
        },
        delete: () => {
          const where: Record<string, string> = {};
          const chain = {
            eq: (column: string, value: string) => {
              where[column] = value;
              return Object.keys(where).length < 2
                ? chain
                : Promise.resolve().then(() => {
                    state.ledger = state.ledger.filter(
                      (r) =>
                        r.kind !== where.kind ||
                        r.dedupe_key !== where.dedupe_key,
                    );
                    return { error: null };
                  });
            },
          };
          return chain;
        },
        select: () => {
          let kind = "";
          let prefix = "";
          const chain = {
            eq: (_column: string, value: string) => ((kind = value), chain),
            like: (_column: string, pattern: string) => {
              // `<literal>:%`, the scope's prefix: un-escape the literal, drop the wildcard.
              prefix = pattern.slice(0, -1).replace(/\\(.)/g, "$1");
              return chain;
            },
            order: () => chain,
            limit: () => chain,
            maybeSingle: async () => {
              const rows = state.ledger
                .filter(
                  (r) => r.kind === kind && r.dedupe_key.startsWith(prefix),
                )
                .sort((a, b) => b.sent_at.localeCompare(a.sent_at));
              return { data: rows[0] ?? null, error: null };
            },
          };
          return chain;
        },
      };
    },
  }),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: (_area: string, message: string, extra: unknown) =>
    state.warnings.push({ message, extra }),
  captureError: (_area: string, e: unknown) => state.errors.push(e),
}));

const { alertUrgentReport, readReporter, reporterAddressHash } =
  await import("./reporter.server");

function user(over: Partial<User>): User {
  return {
    id: "u1",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-09-01T00:00:00Z",
    ...over,
  } as User;
}

beforeEach(() => {
  state.secret = "test-secret";
  state.sent.length = 0;
  state.sendFails = false;
  state.warnings.length = 0;
  state.errors.length = 0;
  state.ledger = [];
});

describe("readReporter", () => {
  it("is nobody when nobody is signed in", () => {
    expect(readReporter(null)).toBeNull();
  });

  it("★ keeps an address only beside email_confirmed_at", () => {
    expect(
      readReporter(
        user({ email: "mia@example.com", email_confirmed_at: undefined }),
      ),
    ).toEqual({ userId: "u1", confirmedEmail: null, addressHash: null });
    expect(
      readReporter(
        user({
          email: " Mia@Example.com ",
          email_confirmed_at: "2026-09-29T10:00:00Z",
        }),
      ),
    ).toEqual({
      userId: "u1",
      confirmedEmail: "mia@example.com",
      addressHash: reporterAddressHash("mia@example.com"),
    });
  });

  it("files without the address when its hash cannot be taken, so the report is never gated", () => {
    state.secret = undefined;
    expect(
      readReporter(
        user({
          email: "mia@example.com",
          email_confirmed_at: "2026-09-29T10:00:00Z",
        }),
      ),
    ).toEqual({ userId: "u1", confirmedEmail: null, addressHash: null });
    expect(state.errors).toHaveLength(1);
  });
});

describe("reporterAddressHash", () => {
  it("is one value per address, case and spaces aside, and never the bare address's HMAC", () => {
    const a = reporterAddressHash("Mia@Example.com ");
    expect(a).toBe(reporterAddressHash("mia@example.com"));
    expect(a).not.toBe(reporterAddressHash("sam@example.com"));
    // Its own domain: the same secret over the same address without the prefix is a different value.
    expect(a).not.toBe(
      createHmac("sha256", "test-secret")
        .update("mia@example.com")
        .digest("hex"),
    );
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("alertUrgentReport", () => {
  const at = new Date("2026-09-27T22:12:00Z");

  /** A child-abuse report on album `e1`, filed at `when` (the database's clock reads the same). */
  function report(when: Date, eventId = "e1") {
    state.dbNow = when.toISOString();
    return alertUrgentReport({
      reportId: `r-${when.getTime()}`,
      eventId,
      eventName: "The shower",
      hidden: true,
      now: when,
    });
  }
  const minutes = (n: number) => new Date(at.getTime() + n * 60_000);

  // Reshaped on purpose (crumbs-40): this pinned that the two sends shared one key and left the second to the
  // ledger's unique claim; the window is read from the album's last mail now, so the second never sends at all. The
  // scar it keeps: one warning a report, one mail for the burst, to the ops inbox, with the portal's link.
  it("★ warns every time and mails the ops inbox once for a burst on one album", async () => {
    await report(at);
    await report(minutes(1));
    expect(state.warnings.map((w) => w.message)).toEqual([
      "urgent_report_filed",
      "urgent_report_filed",
    ]);
    expect(state.sent).toHaveLength(1);
    expect(state.sent[0]).toMatchObject({ to: "ops@example.com" });
    expect(state.sent[0].text).toContain(
      "https://admin.partyreel.com/admin/reports",
    );
    expect(state.ledger.map((r) => r.kind)).toEqual(["report_urgent"]);
  });

  // ★ A WINDOW PER ALBUM, NEVER A CLOCK BUCKET (crumbs-40, build 35's red-team): two child-abuse reports on one album
  // at 06:39:51 and 06:43:50 mailed the ops inbox twice, since the key was the ten-minute bucket of the clock and
  // 06:40 lay between them. The window runs from the album's last mail.
  it("★ one mail in any ten minutes per album, across a clock boundary", async () => {
    const first = new Date("2026-10-01T06:39:51Z");
    await report(first);
    await report(new Date("2026-10-01T06:43:50Z"));
    expect(state.sent).toHaveLength(1);

    // Ten minutes after the last mail, the next report mails again, and its own window begins.
    await report(new Date("2026-10-01T06:49:52Z"));
    expect(state.sent).toHaveLength(2);
    await report(new Date("2026-10-01T06:55:00Z"));
    expect(state.sent).toHaveLength(2);

    // Another album keeps its own window.
    await report(new Date("2026-10-01T06:55:00Z"), "e2");
    expect(state.sent).toHaveLength(3);
  });

  it("two reports racing past the same last mail send one mail", async () => {
    await Promise.all([report(at), report(at)]);
    expect(state.sent).toHaveLength(1);
    await Promise.all([report(minutes(11)), report(minutes(11))]);
    expect(state.sent).toHaveLength(2);
  });

  it("a mail that failed leaves the window open for the next report", async () => {
    state.sendFails = true;
    await report(at);
    expect(state.sent).toHaveLength(0);
    state.sendFails = false;
    await report(minutes(1));
    expect(state.sent).toHaveLength(1);
  });

  it("names no reporter and no content in what it sends", async () => {
    await alertUrgentReport({
      reportId: "r1",
      eventId: "e1",
      eventName: "The shower",
      hidden: true,
      now: at,
    });
    expect(state.warnings[0].extra).toEqual({
      report_id: "r1",
      event_id: "e1",
      hidden: true,
    });
  });

  it("never throws when the mail cannot go", async () => {
    state.sendFails = true;
    await expect(
      alertUrgentReport({
        reportId: "r1",
        eventId: "e1",
        eventName: "The shower",
        hidden: true,
        now: at,
      }),
    ).resolves.toBeUndefined();
    expect(state.errors).toHaveLength(1);
  });
});
