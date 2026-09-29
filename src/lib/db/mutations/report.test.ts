/**
 * THE REPORT'S WRITES (admin-triage r2, 20260929140000), against an in-memory PostgREST:
 *
 *  - `createReport` hands `create_report` the form's kind and the ROUTE's reporter, an address only beside its
 *    keyed hash (the instant hide's limits count by the hash, so an address without one is never sent);
 *  - ★ the seam until the apply: a database without the new signature files the report the old way, never
 *    hiding anything, and says so;
 *  - `answerProof` lands the reporter's words on an open, unanswered report its link's hash names, and the link
 *    dies with them: a second use, a closed report and an unknown link are all `gone`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  FakeRpcError,
  type FakePostgrest,
} from "@/lib/db/testing/fake-postgrest";

let fake: FakePostgrest;

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));

const { answerProof, createReport } = await import("./report");

const MEDIA = "0a8b3c2d-1e4f-4a6b-8c9d-0e1f2a3b4c5d";

/** The migration's create_report: it answers what the route reads, recording what it was handed. */
function liveWorld(answer: Record<string, unknown> = {}) {
  const calls: Record<string, unknown>[] = [];
  fake = createFakePostgrest({
    rpc: {
      create_report: (args) => {
        calls.push(args);
        return { report_id: "r1", hid: false, event_id: "e1", ...answer };
      },
    },
  });
  return calls;
}

describe("createReport", () => {
  beforeEach(() => {
    liveWorld();
  });

  it("★ sends the kind, and a confirmed reporter's address only beside its hash", async () => {
    const calls = liveWorld({ hid: true });
    const result = await createReport({
      qrToken: "tok",
      mediaId: MEDIA,
      reason: "not ok",
      kind: "child",
      reporter: {
        userId: "u1",
        confirmedEmail: "mia@example.com",
        addressHash: "h1",
      },
    });
    expect(result).toEqual({
      ok: true,
      data: { report_id: "r1", hid: true, event_id: "e1" },
      schemaMissing: false,
    });
    expect(calls[0]).toMatchObject({
      p_qr_token: "tok",
      p_media_id: MEDIA,
      p_reason: "not ok",
      p_kind: "child",
      p_reporter_user_id: "u1",
      p_reporter_email: "mia@example.com",
      p_reporter_hash: "h1",
    });
  });

  it("★ sends no address at all for an unconfirmed session, or one whose hash could not be taken", async () => {
    const calls = liveWorld();
    await createReport({
      qrToken: "tok",
      kind: "child",
      reporter: { userId: "u2", confirmedEmail: null, addressHash: null },
    });
    await createReport({
      qrToken: "tok",
      kind: "child",
      reporter: {
        userId: "u3",
        confirmedEmail: "sam@example.com",
        addressHash: null,
      },
    });
    for (const call of calls) {
      expect(call.p_reporter_email).toBeUndefined();
      expect(call.p_reporter_hash).toBeUndefined();
    }
    expect(calls.map((c) => c.p_reporter_user_id)).toEqual(["u2", "u3"]);
  });

  it("files a signed-out report as Something else when no kind is given", async () => {
    const calls = liveWorld();
    await createReport({ qrToken: "tok" });
    expect(calls[0]).toMatchObject({ p_kind: "other" });
    expect(calls[0].p_reporter_user_id).toBeUndefined();
  });

  it("maps the RPC's raises to what the route answers", async () => {
    fake = createFakePostgrest({
      rpc: {
        create_report: (args) => {
          throw args.p_qr_token === "old"
            ? new FakeRpcError("P0002", "event not found")
            : args.p_media_id
              ? new FakeRpcError("23514", "media not in event")
              : new FakeRpcError("P0001", "report limit");
        },
      },
    });
    await expect(createReport({ qrToken: "old" })).resolves.toMatchObject({
      ok: false,
      code: "not_found",
    });
    await expect(
      createReport({ qrToken: "tok", mediaId: MEDIA }),
    ).resolves.toMatchObject({ ok: false, code: "invalid_media" });
    await expect(createReport({ qrToken: "tok" })).resolves.toMatchObject({
      ok: false,
      code: "unknown",
    });
  });

  it("★ through the seam, files the old way: no kind, no reporter, never a hide, and says so", async () => {
    const calls: Record<string, unknown>[] = [];
    fake = createFakePostgrest({
      rpc: {
        // The pre-migration function takes three names; PostgREST resolves by names, so the new call misses.
        create_report: (args) => {
          calls.push(args);
          if (args.p_kind !== undefined)
            throw new FakeRpcError(
              "PGRST202",
              "Could not find the function public.create_report",
            );
          return { report_id: "r9", hid: true };
        },
      },
    });
    const result = await createReport({
      qrToken: "tok",
      mediaId: MEDIA,
      kind: "child",
      reporter: {
        userId: "u1",
        confirmedEmail: "mia@example.com",
        addressHash: "h1",
      },
    });
    expect(result).toEqual({
      ok: true,
      data: { report_id: "r9", hid: false, event_id: null },
      schemaMissing: true,
    });
    expect(Object.keys(calls[1]).sort()).toEqual([
      "p_media_id",
      "p_qr_token",
      "p_reason",
    ]);
  });
});

describe("answerProof", () => {
  function world(over: Record<string, unknown> = {}) {
    fake = createFakePostgrest({
      tables: {
        reports: [
          {
            id: "r1",
            status: "open",
            proof_token_hash: "hash-1",
            proof_answered_at: null,
            proof_answer: null,
            ...over,
          },
        ],
      },
    });
  }
  const row = () => fake.tables.reports[0];

  it("★ lands her answer on the report and kills the link with it", async () => {
    world();
    await expect(
      answerProof({ tokenHash: "hash-1", answer: "The one of the toast." }),
    ).resolves.toEqual({ ok: true });
    expect(row()).toMatchObject({
      proof_answer: "The one of the toast.",
      proof_token_hash: null,
    });
    expect(row().proof_answered_at).toEqual(expect.any(String));
    // The same link again finds nothing.
    await expect(
      answerProof({ tokenHash: "hash-1", answer: "Again." }),
    ).resolves.toEqual({ ok: false, code: "gone" });
    expect(row().proof_answer).toBe("The one of the toast.");
  });

  it("★ answers a closed report and an unknown link as gone, and writes neither", async () => {
    world({ status: "dismissed" });
    await expect(
      answerProof({ tokenHash: "hash-1", answer: "Here." }),
    ).resolves.toEqual({ ok: false, code: "gone" });
    world();
    await expect(
      answerProof({ tokenHash: "hash-2", answer: "Here." }),
    ).resolves.toEqual({ ok: false, code: "gone" });
    expect(row().proof_answer).toBeNull();
  });
});
