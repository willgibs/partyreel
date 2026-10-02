/**
 * DEVELOP IS A WRITE, ON THE READ THAT NEEDS IT (20261002200000): the album's first read after its develop time asks
 * `develop_due` once (the event read's `develop_due` says when), and a develop that fails never fails the read.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const rpc = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: (...a: unknown[]) => rpc(...a) }),
}));
const captureError = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureError: (...a: unknown[]) => captureError(...a),
}));

const { developDue, developIfDue } = await import("@/lib/disposable/develop.server");

beforeEach(() => {
  rpc.mockReset().mockResolvedValue({ data: 3, error: null });
  captureError.mockReset();
});

describe("developDue", () => {
  it("asks the one function for this album and answers how many rows it moved", async () => {
    expect(await developDue("e1")).toBe(3);
    expect(rpc).toHaveBeenCalledWith("develop_due", { p_event_id: "e1" });
  });

  it("an answer it cannot read is nothing moved; a failed call throws, labelled", async () => {
    rpc.mockResolvedValueOnce({ data: "3", error: null });
    expect(await developDue("e1")).toBe(0);
    rpc.mockResolvedValueOnce({ data: null, error: { message: "boom", code: "XX000" } });
    await expect(developDue("e1")).rejects.toThrow("disposable: develop_due");
  });
});

describe("developIfDue", () => {
  it("does nothing for an album the read says is not due (the steady poll pays nothing)", async () => {
    await developIfDue({ id: "e1", develop_due: false });
    await developIfDue({ id: "e1" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("★ develops a due album once per event object, however many reads of one request ask", async () => {
    const event = { id: "e1", develop_due: true };
    await developIfDue(event);
    await developIfDue(event);
    expect(rpc).toHaveBeenCalledTimes(1);
    // The next request reads its own event object, and asks again if the read still says so.
    await developIfDue({ id: "e1", develop_due: true });
    expect(rpc).toHaveBeenCalledTimes(2);
  });

  it("★ a develop that fails is reported and the read goes on (the next read, or the sweep, develops it)", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: "deadlock detected", code: "40P01" } });
    await expect(developIfDue({ id: "e2", develop_due: true })).resolves.toBeUndefined();
    expect(captureError).toHaveBeenCalledWith(
      "media",
      expect.anything(),
      expect.objectContaining({ seam: "develop_due_on_read", eventId: "e2" }),
    );
  });
});
