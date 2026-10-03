/**
 * THE UPLOAD GATE'S ROLL (20261002200000): `get_upload_gate` answers the camera's roll for this viewer beside the
 * gate's own facts; read through the roll's one parser, so an answer it cannot read is no roll (the presign and
 * `create_media` hold the line), and a failed read fails open as it always has, with no roll.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const rpc = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: (...a: unknown[]) => rpc(...a) }),
}));
const captureWarning = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: (...a: unknown[]) => captureWarning(...a),
}));

const { getUploadGate } = await import("@/lib/db/queries/guest-gate");

const ASK = { eventId: "e1", sessionToken: "t".repeat(64), userId: null };

beforeEach(() => {
  rpc.mockReset();
  captureWarning.mockReset();
});

describe("getUploadGate: the roll", () => {
  it("reads {used, cap, taken, ceiling} beside the gate's facts", async () => {
    rpc.mockResolvedValue({
      data: {
        contributed: true,
        album_full: false,
        event_gone: false,
        roll: { used: 3, cap: 24, taken: 5, ceiling: 72 },
      },
      error: null,
    });
    expect(await getUploadGate(ASK)).toEqual({
      contributed: true,
      albumFull: false,
      eventGone: false,
      roll: { used: 3, cap: 24, taken: 5, ceiling: 72 },
    });
    expect(rpc).toHaveBeenCalledWith("get_upload_gate", {
      p_event_id: "e1",
      p_session_token: ASK.sessionToken,
    });
  });

  it("free uploads, a database before the migration, or an answer it cannot read: no roll", async () => {
    for (const roll of [null, undefined, { used: 3, cap: 24 }, "24"]) {
      rpc.mockResolvedValue({
        data: { contributed: false, album_full: false, event_gone: false, roll },
        error: null,
      });
      expect((await getUploadGate(ASK)).roll).toBeNull();
    }
  });

  it("a failed read fails open, loudly, with no roll", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "XX000" } });
    expect(await getUploadGate(ASK)).toMatchObject({ albumFull: true, roll: null });
    expect(captureWarning).toHaveBeenCalledTimes(1);
  });
});
