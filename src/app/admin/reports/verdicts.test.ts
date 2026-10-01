/**
 * REPORTS' ACTS, ROUND TWO (admin-triage r2, Will 2026-09-29), against an in-memory PostgREST. The reopen's own
 * rules live in actions.test.ts; this file pins what round two added:
 *
 *  - ★ a verdict answers its whole ENTRY: every report still open on the same item (or the album's own, or the
 *    person's) closes with one verdict, and nothing else's does;
 *  - ★ a dismissal says a report was false, so the item a child-abuse report's instant hide took goes back where
 *    the hide found it (the guards in the write), and the dismissal's Undo hides it again;
 *  - the sweep's one press dismisses every ticked entry once, skipping what is already decided;
 *  - Remove takes the item down and closes the entry at one instant; a phone's Take it down leaves the reports
 *    open and its Undo restores only that press's removal;
 *  - ★ Hold for forensics takes down everything it reaches BEFORE a single copy starts, and unticked it is the
 *    quiet hold: nothing leaves the album;
 *  - ★ Ask for proof waits for its switch, is never asked of the worst kind, keeps only the link's hash, and a
 *    mail that never went takes the ask back;
 *  - every act refuses an operator below AAL2 before it reads anything.
 */
import { createHash } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { PROOF_OFF_LINE } from "@/lib/admin/reports";
import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

let fake: FakePostgrest;
const state = vi.hoisted(() => ({
  authOk: true,
  proofOn: false,
  sendFails: false,
  sent: [] as { to: string; text: string; kind: string }[],
  preserved: [] as {
    mediaId: string;
    reason: string;
    /** Which of the hold's items were already an operator's removal when this copy started. */
    downAtStart: string[];
  }[],
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@/app/(app)/dashboard/actions", () => ({}));
vi.mock("@/lib/auth/admin-context", () => ({
  requireAdminAction: async () =>
    state.authOk
      ? { ok: true, ctx: { userId: "operator-1", aal: "aal2" } }
      : {
          ok: false,
          result: {
            ok: false,
            code: "forbidden",
            message: "Verify with your authenticator first.",
          },
        },
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: () => {},
  captureWarning: () => {},
}));
vi.mock("@/lib/forensics/preserve", () => ({
  preserveMedia: async (args: { mediaId: string; reason: string }) => {
    state.preserved.push({
      mediaId: args.mediaId,
      reason: args.reason,
      downAtStart: fake.tables.media
        .filter((m) => m.removed_by_admin === true)
        .map((m) => String(m.id)),
    });
    return { ok: true };
  },
}));
vi.mock("@/lib/env", () => ({ env: {}, serverEnv: {} }));
vi.mock("@/lib/email/send", () => ({
  sendOnce: async (args: { to: string; text: string; kind: string }) => {
    if (state.sendFails) throw new Error("resend down");
    state.sent.push(args);
    return true;
  },
}));
vi.mock("@/lib/db/queries/reports", () => ({
  readProofMailEnabled: async () => state.proofOn,
  // The strike rule's lapse (`lapse_seconds`); every reopen here is inside the 30 days, so it is never asked.
  readStrikeLapse: async () => 180 * 86_400_000,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));

const actions = await import("./actions");

/** A report id the actions' uuid schema takes. */
const R = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const HID_AT = "2026-09-27T22:12:00.000Z";
const EARLIER = "2026-09-26T10:00:00.000Z";

function report(n: number, over: FakeRow = {}): FakeRow {
  return {
    id: R(n),
    status: "open",
    media_id: "m1",
    event_id: "e1",
    profile_id: null,
    resolved_by: null,
    resolved_at: null,
    resolution_note: null,
    kind: "other",
    hid_at: null,
    reporter_email: null,
    proof_asked_at: null,
    proof_question: null,
    proof_token_hash: null,
    proof_answered_at: null,
    proof_answer: null,
    ...over,
  };
}

function item(id: string, over: FakeRow = {}): FakeRow {
  return {
    id,
    event_id: "e1",
    guest_id: "g1",
    type: "photo",
    status: "approved",
    removed_at: null,
    removed_by_admin: false,
    removed_by_uploader: false,
    legal_hold_at: null,
    purge_asked_at: null,
    ...over,
  };
}

function world(reports: FakeRow[], media: FakeRow[] = [item("m1")]) {
  fake = createFakePostgrest({
    tables: {
      reports,
      media,
      events: [{ id: "e1", name: "Priya & Sam's baby shower" }],
      guests: [
        { id: "g1", event_id: "e1", user_id: "u1" },
        { id: "g2", event_id: "e1", user_id: "u1" },
        { id: "g3", event_id: "e1", user_id: "u3" },
      ],
    },
  });
}

const reportRow = (n: number) =>
  fake.tables.reports.find((r) => r.id === R(n))!;
const mediaRow = (id: string) => fake.tables.media.find((m) => m.id === id)!;
const mediaWrites = () =>
  fake.requests.filter((r) => r.name === "media" && r.method === "PATCH");

beforeEach(() => {
  state.authOk = true;
  state.proofOn = false;
  state.sendFails = false;
  state.sent.length = 0;
  state.preserved.length = 0;
});

describe("a verdict answers its whole entry", () => {
  it("★ Dismiss closes every open report on the item with one verdict, and no one else's", async () => {
    world([
      report(1),
      report(2),
      report(3, {
        status: "dismissed",
        resolved_at: EARLIER,
        resolution_note: "older",
      }),
      report(4, { media_id: "m2" }),
      report(5, { media_id: null }),
    ]);
    await expect(
      actions.dismissReportAction(R(2), "Not harm: a blurry photo."),
    ).resolves.toEqual({ ok: true, reportIds: [R(1), R(2)], restored: false });
    for (const n of [1, 2]) {
      expect(reportRow(n)).toMatchObject({
        status: "dismissed",
        resolved_by: "operator-1",
        resolution_note: "Not harm: a blurry photo.",
      });
    }
    expect(reportRow(3).resolution_note).toBe("older");
    expect(reportRow(4).status).toBe("open");
    expect(reportRow(5).status).toBe("open");
    expect(mediaWrites()).toHaveLength(0);
  });

  it("an album report's verdict closes the album's own reports, never its items'", async () => {
    world([
      report(1),
      report(5, { media_id: null }),
      report(6, { media_id: null }),
    ]);
    await expect(actions.dismissReportAction(R(5))).resolves.toEqual({
      ok: true,
      reportIds: [R(5), R(6)],
      restored: false,
    });
    expect(reportRow(1).status).toBe("open");
  });

  it("answers a report already decided in words, and writes nothing", async () => {
    world([report(1, { status: "actioned", resolved_at: EARLIER })]);
    await expect(actions.dismissReportAction(R(1))).resolves.toMatchObject({
      ok: false,
      message: expect.stringMatching(/already decided/),
    });
    expect(fake.requests.some((r) => r.method === "PATCH")).toBe(false);
  });
});

describe("the instant hide's way back", () => {
  const hidden = () =>
    item("m1", {
      status: "removed",
      removed_by_admin: true,
      removed_at: HID_AT,
    });

  it("★ a dismissal puts back what a false report's hide took, the guards in the write", async () => {
    world([report(1, { kind: "child", hid_at: HID_AT })], [hidden()]);
    await expect(actions.dismissReportAction(R(1))).resolves.toEqual({
      ok: true,
      reportIds: [R(1)],
      restored: true,
    });
    expect(mediaRow("m1")).toMatchObject({
      status: "approved",
      removed_by_admin: false,
      removed_at: null,
    });
    const [write] = mediaWrites();
    expect(write.filters).toEqual(
      expect.arrayContaining([
        { column: "removed_by_admin", op: "eq", value: true },
        { column: "removed_at", op: "eq", value: HID_AT },
        { column: "legal_hold_at", op: "is", value: null },
        { column: "purge_asked_at", op: "is", value: null },
      ]),
    );
  });

  it("a hide that found the item in her Deleted leaves it in her Deleted", async () => {
    world(
      [report(1, { kind: "child", hid_at: HID_AT })],
      [
        item("m1", {
          status: "removed",
          removed_by_admin: true,
          removed_at: EARLIER,
        }),
      ],
    );
    await expect(actions.dismissReportAction(R(1))).resolves.toMatchObject({
      ok: true,
      restored: true,
    });
    expect(mediaRow("m1")).toMatchObject({
      status: "removed",
      removed_by_admin: false,
      removed_at: EARLIER,
    });
  });

  it("★ a held item stays down whatever the dismissal says", async () => {
    world(
      [report(1, { kind: "child", hid_at: HID_AT })],
      [{ ...hidden(), legal_hold_at: "2026-09-27T22:30:00.000Z" }],
    );
    await expect(actions.dismissReportAction(R(1))).resolves.toEqual({
      ok: true,
      reportIds: [R(1)],
      restored: false,
    });
    expect(mediaWrites()).toHaveLength(0);
    expect(mediaRow("m1").status).toBe("removed");
  });

  it("★ the dismissal's Undo hides it again, and the report knows the new removal as its hide", async () => {
    world([report(1, { kind: "child", hid_at: HID_AT })], [hidden()]);
    const dismissed = await actions.dismissReportAction(R(1));
    expect(dismissed).toMatchObject({ ok: true, restored: true });
    await expect(actions.reopenReportsAction([R(1)])).resolves.toEqual({
      ok: true,
    });
    const m1 = mediaRow("m1");
    expect(m1).toMatchObject({ status: "removed", removed_by_admin: true });
    expect(reportRow(1).status).toBe("open");
    expect(reportRow(1).hid_at).toBe(m1.removed_at);
    // ...so a second dismissal puts it back again.
    await expect(actions.dismissReportAction(R(1))).resolves.toMatchObject({
      restored: true,
    });
    expect(mediaRow("m1").status).toBe("approved");
  });

  it("an Undo whose item she has since deleted makes it the operator's in her Deleted", async () => {
    world([report(1, { kind: "child", hid_at: HID_AT })], [hidden()]);
    await actions.dismissReportAction(R(1));
    Object.assign(mediaRow("m1"), {
      status: "removed",
      removed_at: "2026-09-28T09:00:00.000Z",
    });
    await actions.reopenReportsAction([R(1)]);
    expect(mediaRow("m1")).toMatchObject({
      status: "removed",
      removed_by_admin: true,
      removed_at: "2026-09-28T09:00:00.000Z",
    });
  });
});

describe("the sweep's one press", () => {
  it("★ dismisses every ticked entry once, two ticks on one item counting once, and skips what is decided", async () => {
    world(
      [
        report(1),
        report(2),
        report(3, { status: "dismissed", resolved_at: EARLIER }),
        report(4, { media_id: "m2" }),
      ],
      [item("m1"), item("m2")],
    );
    await expect(
      actions.dismissReportsAction([R(1), R(2), R(3), R(4)]),
    ).resolves.toEqual({
      ok: true,
      reportIds: [R(1), R(2), R(4)],
      restored: false,
    });
    expect(fake.tables.reports.every((r) => r.status === "dismissed")).toBe(
      true,
    );
  });

  it("refuses an empty sweep and one past its cap before any read", async () => {
    world([report(1)]);
    await expect(actions.dismissReportsAction([])).resolves.toMatchObject({
      ok: false,
      code: "validation",
    });
    await expect(
      actions.dismissReportsAction(
        Array.from({ length: 201 }, (_, i) => R(i + 1)),
      ),
    ).resolves.toMatchObject({ ok: false, code: "validation" });
    expect(fake.requests).toHaveLength(0);
  });
});

describe("Remove, and a phone's Take it down", () => {
  it("★ Remove takes the item down and closes the entry as Actioned at the same instant", async () => {
    world([report(1), report(2)]);
    await expect(
      actions.actionReportAction(R(1), "Cropped a stranger's child."),
    ).resolves.toEqual({ ok: true });
    const m1 = mediaRow("m1");
    expect(m1).toMatchObject({ status: "removed", removed_by_admin: true });
    for (const n of [1, 2]) {
      expect(reportRow(n)).toMatchObject({
        status: "actioned",
        resolution_note: "Cropped a stranger's child.",
      });
      expect(Date.parse(String(reportRow(n).resolved_at))).toBe(
        Date.parse(String(m1.removed_at)),
      );
    }
  });

  it("makes an item she had already removed the operator's, its window unchanged", async () => {
    world(
      [report(1)],
      [item("m1", { status: "removed", removed_at: EARLIER })],
    );
    await actions.actionReportAction(R(1));
    expect(mediaRow("m1")).toMatchObject({
      status: "removed",
      removed_by_admin: true,
      removed_at: EARLIER,
    });
  });

  it("★ Take it down leaves every report open, and its Undo restores only that press's removal", async () => {
    world([report(1), report(2)]);
    const down = await actions.takeDownAction(R(1));
    expect(down).toMatchObject({ ok: true });
    const at = down.ok ? down.at : "";
    expect(mediaRow("m1")).toMatchObject({
      status: "removed",
      removed_by_admin: true,
      removed_at: at,
    });
    expect(reportRow(1).status).toBe("open");
    expect(reportRow(2).status).toBe("open");

    await expect(
      actions.undoTakeDownAction(R(1), "2026-09-27T23:59:00.000Z"),
    ).resolves.toMatchObject({ ok: false });
    expect(mediaRow("m1").status).toBe("removed");

    await expect(actions.undoTakeDownAction(R(1), at)).resolves.toEqual({
      ok: true,
    });
    expect(mediaRow("m1")).toMatchObject({
      status: "approved",
      removed_by_admin: false,
    });
  });

  it("offers an album report nothing to take down", async () => {
    world([report(5, { media_id: null })]);
    await expect(actions.takeDownAction(R(5))).resolves.toMatchObject({
      ok: false,
    });
    expect(mediaWrites()).toHaveLength(0);
  });
});

describe("Hold for forensics", () => {
  // The reported item (g1), the same account's other device (g2) and her other upload, one of them already in the
  // host's Deleted; another guest's upload and the host's own upload are not the hold's.
  const album = () => [
    item("m1"),
    item("m3", { guest_id: "g2" }),
    item("m4", { status: "removed", removed_at: EARLIER }),
    item("m5", { guest_id: "g3" }),
    item("m6", { guest_id: null }),
  ];

  it("★ takes down everything it reaches BEFORE a single copy starts, and the report stays open", async () => {
    world([report(1, { kind: "child" })], album());
    await expect(actions.holdFromReportAction(R(1))).resolves.toEqual({
      ok: true,
    });
    expect(state.preserved.map((p) => p.mediaId)).toEqual(["m1", "m3", "m4"]);
    for (const p of state.preserved) {
      expect([...p.downAtStart].sort()).toEqual(["m1", "m3", "m4"]);
    }
    expect(mediaRow("m1")).toMatchObject({
      status: "removed",
      removed_by_admin: true,
    });
    expect(mediaRow("m4")).toMatchObject({
      status: "removed",
      removed_by_admin: true,
      removed_at: EARLIER,
    });
    expect(mediaRow("m5").removed_by_admin).toBe(false);
    expect(mediaRow("m6").removed_by_admin).toBe(false);
    expect(reportRow(1).status).toBe("open");
  });

  it("★ unticked, it is the quiet hold: every copy made, nothing leaves the album", async () => {
    world([report(1)], album());
    await expect(
      actions.holdFromReportAction(
        R(1),
        "Police preservation request 1142",
        false,
      ),
    ).resolves.toEqual({ ok: true });
    expect(mediaWrites()).toHaveLength(0);
    expect(state.preserved.map((p) => [p.mediaId, p.reason])).toEqual([
      ["m1", "Police preservation request 1142"],
      [
        "m3",
        "Police preservation request 1142 (the same uploader's other upload)",
      ],
      [
        "m4",
        "Police preservation request 1142 (the same uploader's other upload)",
      ],
    ]);
    expect(mediaRow("m1").status).toBe("approved");
  });
});

describe("Ask for proof", () => {
  const asked = (n = 2) =>
    report(n, { kind: "consent", reporter_email: "mia@example.com" });

  it("★ while its switch is off, refuses in words and writes and sends nothing", async () => {
    world([asked()]);
    await expect(
      actions.askProofAction(R(2), "Which photo is it?"),
    ).resolves.toEqual({
      ok: false,
      code: "validation",
      message: PROOF_OFF_LINE,
    });
    expect(fake.requests.some((r) => r.method === "PATCH")).toBe(false);
    expect(state.sent).toHaveLength(0);
  });

  it("★ once on, mails the operator's question to the confirmed address and keeps only the link's hash", async () => {
    state.proofOn = true;
    world([asked()]);
    await expect(
      actions.askProofAction(R(2), "  Which photo is it?  "),
    ).resolves.toEqual({ ok: true });
    const row = reportRow(2);
    expect(row.proof_question).toBe("Which photo is it?");
    expect(row.proof_asked_at).toEqual(expect.any(String));
    const [mail] = state.sent;
    expect(mail).toMatchObject({ to: "mia@example.com", kind: "report_proof" });
    const token = /\/report\/([0-9a-f]{64})/.exec(mail.text)?.[1];
    expect(token).toBeDefined();
    expect(row.proof_token_hash).toBe(
      createHash("sha256").update(token!).digest("hex"),
    );
    expect(JSON.stringify(fake.tables.reports)).not.toContain(token!);
  });

  it("is never asked of a child-abuse report, nor of a reporter with no address to ask", async () => {
    state.proofOn = true;
    world([
      report(1, { kind: "child", reporter_email: "mia@example.com" }),
      report(4, { media_id: "m2", kind: "consent" }),
    ]);
    await expect(
      actions.askProofAction(R(1), "Which photo?"),
    ).resolves.toMatchObject({ ok: false, code: "validation" });
    await expect(
      actions.askProofAction(R(4), "Which photo?"),
    ).resolves.toMatchObject({ ok: false, code: "validation" });
    expect(state.sent).toHaveLength(0);
    expect(fake.requests.some((r) => r.method === "PATCH")).toBe(false);
  });

  it("★ a mail that never went takes the ask back, so the report never says it asked", async () => {
    state.proofOn = true;
    state.sendFails = true;
    world([asked()]);
    await expect(
      actions.askProofAction(R(2), "Which photo is it?"),
    ).resolves.toMatchObject({ ok: false });
    expect(reportRow(2)).toMatchObject({
      proof_asked_at: null,
      proof_question: null,
      proof_token_hash: null,
    });
  });
});

describe("the operator's authority", () => {
  it("★ every act refuses an operator below AAL2 before it reads anything", async () => {
    world([report(1), report(2)]);
    state.authOk = false;
    const answers = await Promise.all([
      actions.dismissReportAction(R(1)),
      actions.dismissReportsAction([R(1)]),
      actions.reopenReportsAction([R(1)]),
      actions.actionReportAction(R(1)),
      actions.undoReportAction(R(1)),
      actions.takeDownAction(R(1)),
      actions.undoTakeDownAction(R(1), HID_AT),
      actions.holdScopeAction(R(1)),
      actions.holdFromReportAction(R(1)),
      actions.askProofAction(R(2), "Which photo?"),
    ]);
    for (const answer of answers) {
      expect(answer).toMatchObject({ ok: false, code: "forbidden" });
    }
    expect(fake.requests).toHaveLength(0);
  });
});
