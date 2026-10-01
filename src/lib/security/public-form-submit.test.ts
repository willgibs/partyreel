/**
 * THE PUBLIC FORMS' SERVER FUNCTIONS, END TO END (mkt-polish: "an end-to-end test for the actions (none
 * exists)"). Each test drives the REAL action (`submitContactForm`, `submitApplication`) through the real
 * schema, the real pipeline (`public-form-submit.ts`) and the real email templates; only the edges a test
 * cannot cross are stood in for: the request's headers, the rate gate's store, the service-role client
 * and Resend. What each step must hold:
 *
 *   ★ the server validates again, and an invalid note touches nothing;
 *   ★ a filled honeypot answers success and stores and sends nothing, BEFORE the limiter, so a bot never
 *     spends a real person's budget on a shared address;
 *   ★ a closed role is refused before the limiter too (careers);
 *   ★ the gate fails closed, in each form's own words, and a refused note writes nothing;
 *   ★ the row is authoritative: its exact columns, and a failed insert is a failed send with no mail;
 *   ★ the mail is best effort: keyed on the row's id, replying to the sender, and a failed send still
 *     answers success, because the row is already saved.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FormRateGate } from "@/lib/security/public-form-limit";

const state = vi.hoisted(() => ({
  steps: [] as string[],
  gate: { allowed: true } as FormRateGate,
  insertError: null as null | { message: string },
  rows: [] as { table: string; row: Record<string, unknown> }[],
  sends: [] as Record<string, unknown>[],
  sendThrows: false,
  headers: new Map<string, string>([
    ["user-agent", "Mozilla/5.0 (test)"],
    ["x-forwarded-for", "203.0.113.7"],
  ]),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: (k: string) => state.headers.get(k) ?? null }),
}));
vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_SITE_URL: "https://partyreel.com" },
  serverEnv: { CONTACT_NOTIFY_EMAIL: "inbox@partyreel.test" },
}));
vi.mock("@/lib/security/public-form-limit", () => ({
  checkPublicFormRate: async (kind: string) => {
    state.steps.push(`limit:${kind}`);
    return state.gate;
  },
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      insert: (row: Record<string, unknown>) => ({
        select: () => ({
          single: async () => {
            state.steps.push(`insert:${table}`);
            if (state.insertError)
              return { data: null, error: state.insertError };
            state.rows.push({ table, row });
            return { data: { id: `row-${state.rows.length}` }, error: null };
          },
        }),
      }),
    }),
  }),
}));
vi.mock("@/lib/email/send", () => ({
  sendOnce: async (args: Record<string, unknown>) => {
    state.steps.push(`send:${String(args.kind)}`);
    if (state.sendThrows) throw new Error("Resend is down");
    state.sends.push(args);
    return true;
  },
}));

const { submitContactForm } =
  await import("@/app/(marketing)/(cinema)/contact/actions");
const { submitApplication } =
  await import("@/app/(marketing)/(cinema)/careers/actions");
const { HONEYPOT_FIELD } = await import("@/lib/validation/public-form");
const { JOB_SLUGS, getJob } = await import("@/lib/constants/careers");

const NOTE = {
  topic: "billing" as const,
  name: "  Sam Okafor ",
  email: "sam@example.com",
  subject: "  Storage for a big wedding  ",
  message: "Working out which plan covers a full weekend of video.",
};

const APPLICATION = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  links: " github.com/ada ",
  message: "I would love to own the reel's rendering pipeline.",
};

const ROLE = JOB_SLUGS[0];

beforeEach(() => {
  state.steps = [];
  state.gate = { allowed: true };
  state.insertError = null;
  state.rows = [];
  state.sends = [];
  state.sendThrows = false;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("both forms, step by step", () => {
  const forms = [
    {
      name: "the contact form",
      valid: NOTE,
      send: (input: Record<string, unknown>) =>
        submitContactForm(input as typeof NOTE),
    },
    {
      name: "a job application",
      valid: APPLICATION,
      send: (input: Record<string, unknown>) =>
        submitApplication(ROLE, input as typeof APPLICATION),
    },
  ];

  for (const form of forms) {
    it(`${form.name}: an invalid note is refused and touches nothing`, async () => {
      expect(await form.send({ ...form.valid, email: "nope" })).toEqual({
        ok: false,
        code: "validation",
      });
      expect(state.steps).toEqual([]);
    });

    it(`${form.name}: a filled honeypot answers success, before the limiter, storing and sending nothing`, async () => {
      expect(
        await form.send({
          ...form.valid,
          [HONEYPOT_FIELD]: "https://spam.example",
        }),
      ).toEqual({ ok: true });
      expect(state.steps).toEqual([]);
    });

    it(`${form.name}: an empty honeypot is a person, and the note goes through`, async () => {
      expect(
        await form.send({ ...form.valid, [HONEYPOT_FIELD]: "  " }),
      ).toEqual({ ok: true });
      expect(state.rows).toHaveLength(1);
    });

    it(`${form.name}: the gate's refusal writes nothing, in the form's own words`, async () => {
      state.gate = {
        allowed: false,
        reason: "rate_limited",
        retryAfterSec: 60,
      };
      const limited = await form.send(form.valid);
      expect(limited).toMatchObject({ ok: false, code: "rate_limited" });
      expect(limited.ok ? "" : limited.message).toMatch(
        /That is a lot of (messages|applications) from this network/,
      );

      state.gate = { allowed: false, reason: "unavailable", retryAfterSec: 60 };
      expect(await form.send(form.valid)).toEqual({
        ok: false,
        code: "rate_limited",
        message:
          "We could not accept that just now. Please try again in a minute.",
      });
      expect(state.steps.every((step) => step.startsWith("limit:"))).toBe(true);
      expect(state.rows).toEqual([]);
    });

    it(`${form.name}: a failed insert is a failed send, and no mail goes out`, async () => {
      state.insertError = { message: "permission denied" };
      expect(await form.send(form.valid)).toEqual({
        ok: false,
        code: "send_failed",
      });
      expect(state.sends).toEqual([]);
      expect(state.steps.some((step) => step.startsWith("send:"))).toBe(false);
    });

    it(`${form.name}: a send that fails still answers success, the row saved`, async () => {
      state.sendThrows = true;
      expect(await form.send(form.valid)).toEqual({ ok: true });
      expect(state.rows).toHaveLength(1);
    });
  }
});

describe("the contact form's note", () => {
  it("is validated, gated, written, then mailed, in that order", async () => {
    expect(await submitContactForm(NOTE)).toEqual({ ok: true });
    expect(state.steps).toEqual([
      "limit:contact",
      "insert:contact_submissions",
      "send:contact_form",
    ]);
  });

  it("writes exactly the row /admin/support reads", async () => {
    await submitContactForm(NOTE);
    expect(state.rows).toEqual([
      {
        table: "contact_submissions",
        row: {
          name: "Sam Okafor",
          email: "sam@example.com",
          subject: "Storage for a big wedding",
          message: NOTE.message,
          topic: "billing",
          source: "marketing_contact",
          user_agent: "Mozilla/5.0 (test)",
        },
      },
    ]);
  });

  it("stores no subject as a null, and caps the user agent", async () => {
    state.headers.set("user-agent", "x".repeat(900));
    try {
      await submitContactForm({ ...NOTE, subject: "   " });
    } finally {
      state.headers.set("user-agent", "Mozilla/5.0 (test)");
    }
    expect(state.rows[0].row.subject).toBeNull();
    expect(String(state.rows[0].row.user_agent)).toHaveLength(500);
  });

  it("mails the inbox once per row, replying to the sender, the topic in the subject", async () => {
    await submitContactForm(NOTE);
    expect(state.sends).toHaveLength(1);
    expect(state.sends[0]).toMatchObject({
      kind: "contact_form",
      dedupeKey: "row-1",
      to: "inbox@partyreel.test",
      replyTo: "sam@example.com",
    });
    expect(String(state.sends[0].subject)).toContain("Plans & billing");
    expect(String(state.sends[0].text)).toContain(NOTE.message);
  });
});

describe("a job application", () => {
  it("is validated, gated, written, then mailed, in that order", async () => {
    expect(await submitApplication(ROLE, APPLICATION)).toEqual({ ok: true });
    expect(state.steps).toEqual([
      "limit:careers",
      "insert:job_applications",
      "send:job_application",
    ]);
  });

  it("refuses a role that has closed before the limiter spends anything", async () => {
    expect(await submitApplication("no-such-role", APPLICATION)).toEqual({
      ok: false,
      code: "not_found",
      message: "That role is no longer open.",
    });
    expect(state.steps).toEqual([]);
  });

  it("writes exactly the row /admin/applicants reads", async () => {
    await submitApplication(ROLE, APPLICATION);
    expect(state.rows).toEqual([
      {
        table: "job_applications",
        row: {
          role_slug: ROLE,
          name: "Ada Lovelace",
          email: "ada@example.com",
          links: "github.com/ada",
          message: APPLICATION.message,
          source: "marketing_careers",
          user_agent: "Mozilla/5.0 (test)",
        },
      },
    ]);
  });

  it("mails the inbox once per row, replying to the applicant, the role in the subject", async () => {
    await submitApplication(ROLE, APPLICATION);
    expect(state.sends[0]).toMatchObject({
      kind: "job_application",
      dedupeKey: "row-1",
      to: "inbox@partyreel.test",
      replyTo: "ada@example.com",
    });
    expect(String(state.sends[0].subject)).toContain(getJob(ROLE)!.title);
  });
});
