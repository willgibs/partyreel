/**
 * WHO FILED A REPORT, AS THE SERVER KNOWS IT (admin-triage r2, `proof=confirm`), and the operator told at once.
 *
 *  - ★ an address counts only beside `email_confirmed_at`: a bare `user.email` is what an unconfirmed sign-up
 *    carries too, and the instant hide keys on a confirmed address;
 *  - the address's hash is one value per address (case and spaces aside) and lives in its own domain, so it can
 *    never equal the rate limiter's hash of anything else;
 *  - a report that cannot wait warns every time and mails the ops inbox once per album per ten minutes, and a
 *    failed mail never fails the report.
 */
import { createHmac } from "node:crypto";

import type { User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  secret: "test-secret" as string | undefined,
  sent: [] as { kind: string; dedupeKey: string; to: string; text: string }[],
  sendFails: false,
  warnings: [] as { message: string; extra: unknown }[],
  errors: [] as unknown[],
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
}));
vi.mock("@/lib/auth/admin-host", () => ({ ADMIN_HOST: "admin.partyreel.com" }));
vi.mock("@/lib/email/send", () => ({
  sendOnce: async (args: {
    kind: string;
    dedupeKey: string;
    to: string;
    text: string;
  }) => {
    if (state.sendFails) throw new Error("resend down");
    state.sent.push(args);
    return true;
  },
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

  it("★ warns every time and mails the ops inbox once per album per ten minutes", async () => {
    await alertUrgentReport({
      reportId: "r1",
      eventId: "e1",
      eventName: "The shower",
      hidden: true,
      now: at,
    });
    await alertUrgentReport({
      reportId: "r2",
      eventId: "e1",
      eventName: "The shower",
      hidden: false,
      now: new Date(at.getTime() + 60_000),
    });
    expect(state.warnings.map((w) => w.message)).toEqual([
      "urgent_report_filed",
      "urgent_report_filed",
    ]);
    // Both sends share one key, so the second is the ledger's to drop.
    expect(state.sent.map((s) => s.dedupeKey)).toEqual([
      state.sent[0].dedupeKey,
      state.sent[0].dedupeKey,
    ]);
    expect(state.sent[0]).toMatchObject({
      kind: "report_urgent",
      to: "ops@example.com",
    });
    expect(state.sent[0].text).toContain(
      "https://admin.partyreel.com/admin/reports",
    );
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
