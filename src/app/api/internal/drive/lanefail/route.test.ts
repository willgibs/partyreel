/**
 * ★ A DYING LANE COUNTS ONCE A MESSAGE (`POST /api/internal/drive/lanefail`): the one internal word whose replay was no
 * no-op, since three of it inside its five minutes paused her sends until an operator's Resume. The word names its
 * Queue message, the route hands it to `cloud_connection_lane_failed` (a model here, counting once a message as the SQL
 * does: the migration's rolled-back check proves the SQL), and a message already counted records nothing either. A
 * word without its message is refused before anything is counted.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { signDriveWord } from "@/lib/drive/protocol";

const SECRET = "lanefail-route-secret";
const CONNECTION = "33333333-4444-4555-8666-777777777777";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  driveConfigured: () => true,
  serverEnv: { DRIVE_WORKER_SECRET: "lanefail-route-secret" },
}));
vi.mock("@/lib/observability/sentry", () => ({ captureWarning: vi.fn() }));
const recordSignalFailure = vi.fn(async () => undefined);
vi.mock("@/lib/jobs/failure-log", () => ({
  recordSignalFailure: (...a: unknown[]) =>
    (recordSignalFailure as (...b: unknown[]) => Promise<void>)(...a),
}));

/** The SQL's count, modelled: one a message, three a day pausing the connection. */
const counted = new Set<string>();
const recordLaneFailed = vi.fn(
  async (input: { connectionId: string; messageId: string; error: string }) => {
    if (counted.has(input.messageId))
      return { failures: counted.size, paused: 0, repeat: true, userId: "u" };
    counted.add(input.messageId);
    return {
      failures: counted.size,
      paused: counted.size >= 3 ? 1 : 0,
      repeat: false,
      userId: "u",
    };
  },
);
vi.mock("@/lib/db/queries/drive", () => ({
  recordLaneFailed: (input: never) => recordLaneFailed(input),
}));

const { POST } = await import("./route");

function word(payload: Record<string, unknown>): Request {
  return new Request("https://app.test/api/internal/drive/lanefail", {
    method: "POST",
    body: signDriveWord(SECRET, {
      v: 1,
      at: Date.now(),
      kind: "lanefail",
      connectionId: CONNECTION,
      error: "TypeError: boom",
      ...payload,
    }),
  });
}

beforeEach(() => {
  counted.clear();
  recordLaneFailed.mockClear();
  recordSignalFailure.mockClear();
});

describe("a dying lane's word", () => {
  it("★ said twice counts once, and its second saying records no failure", async () => {
    const said = word({ messageId: "0123456789abcdef0123456789abcdef" });
    const again = said.clone();
    const first = await (await POST(said)).json();
    const second = await (await POST(again)).json();
    expect(recordLaneFailed).toHaveBeenNthCalledWith(1, {
      connectionId: CONNECTION,
      messageId: "0123456789abcdef0123456789abcdef",
      error: "TypeError: boom",
    });
    expect(first).toMatchObject({ ok: true, failures: 1, repeat: false });
    expect(second).toMatchObject({ ok: true, failures: 1, repeat: true });
    expect(recordSignalFailure).toHaveBeenCalledTimes(1);
  });

  it("three of one word pause nothing; three lanes do", async () => {
    for (let i = 0; i < 3; i++)
      await POST(word({ messageId: "aaaaaaaaaaaaaaaa" }));
    expect(counted.size).toBe(1);
    await POST(word({ messageId: "bbbbbbbbbbbbbbbb" }));
    const third = await (
      await POST(word({ messageId: "cccccccccccccccc" }))
    ).json();
    expect(third).toMatchObject({ failures: 3, paused: true });
  });

  it("is refused without its message, counting nothing", async () => {
    const res = await POST(word({}));
    expect(res.status).toBe(400);
    expect(recordLaneFailed).not.toHaveBeenCalled();
  });
});
