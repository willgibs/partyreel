/**
 * THE LIFECYCLE-MAIL PAUSE, AT THE ONE SEND PATH (the spend watch). While `lifecycle_mail_enabled` is off a re-sent
 * lifecycle mail is HELD: no claim (so its sweep sends it the night the switch is back on) and no send. A one-time
 * notice and every operator mail always go, and the switch is not even asked for them.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn();
const send = vi.fn();
const lifecycleMailFlowing = vi.fn();

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
  createAdminClient: () => ({
    from: () => ({ insert: (...a: unknown[]) => insert(...a) }),
  }),
}));
vi.mock("@/lib/jobs/failure-log", () => ({ recordSignalFailure: vi.fn() }));
vi.mock("@/lib/jobs/spend-watch-switches", () => ({
  lifecycleMailFlowing: (...a: unknown[]) => lifecycleMailFlowing(...a),
}));

const { sendOnce } = await import("@/lib/email/send");

const mail = (kind: string) => ({
  kind,
  dedupeKey: `${kind}:host-1`,
  to: "host@example.com",
  subject: "Subject",
  html: "<p>Hi</p>",
  text: "Hi",
});

beforeEach(() => {
  vi.clearAllMocks();
  insert.mockResolvedValue({ error: null });
  send.mockResolvedValue({ data: { id: "e_1" }, error: null });
});

describe("a paused lifecycle mail", () => {
  it("★ holds the mail its sweep sends again: no claim, no send, and false back", async () => {
    lifecycleMailFlowing.mockResolvedValue(false);
    for (const kind of [
      "inactivity_warning",
      "over_cap_reminder",
      "renewal_nudge",
    ]) {
      expect(await sendOnce(mail(kind))).toBe(false);
    }
    expect(insert).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(lifecycleMailFlowing).toHaveBeenCalledWith("renewal_nudge");
  });

  it("sends it as ever while the switch is on", async () => {
    lifecycleMailFlowing.mockResolvedValue(true);
    expect(await sendOnce(mail("over_cap_reminder"))).toBe(true);
    expect(insert).toHaveBeenCalledTimes(1);
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
});
