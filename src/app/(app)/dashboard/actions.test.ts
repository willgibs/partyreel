/**
 * THE GENERAL EVENT SAVE APPROVES HELD UPLOADS ONLY WHEN THE SAVE SAYS LIVE.
 *
 * `updateEventAction` runs `approveAllPending` whenever the parsed save carries
 * `moderation_mode: "live"` (the host's consent to live mode, enforced server-side). So the parsed
 * save must carry the mode only when the caller SENT it: a QR style save on an event under review
 * that parsed to `moderation_mode: "live"` would approve every held upload behind the host's back.
 * The mutations are mocked; what is pinned is the action's own decision and what it hands down.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateEvent = vi.fn();
const approveAllPending = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/db/mutations/events", () => ({
  updateEvent: (...args: unknown[]) => updateEvent(...args),
  clearEventPassword: vi.fn(),
  clearEventSlug: vi.fn(),
  createEvent: vi.fn(),
  setEventPassword: vi.fn(),
  setEventSlug: vi.fn(),
  softDeleteEvent: vi.fn(),
}));
vi.mock("@/lib/db/mutations/media", () => ({
  approveAllPending: (...args: unknown[]) => approveAllPending(...args),
}));
vi.mock("@/lib/db/mutations/my-uploads", () => ({ removeMyUpload: vi.fn() }));
vi.mock("@/lib/db/mutations/social", () => ({
  setEventSocialSettings: vi.fn(),
}));
vi.mock("@/lib/observability/sentry", () => ({ captureError: vi.fn() }));

const { updateEventAction } = await import("@/app/(app)/dashboard/actions");

beforeEach(() => {
  updateEvent.mockReset();
  approveAllPending.mockReset();
  updateEvent.mockResolvedValue({ ok: true, data: { id: "event-1" } });
  approveAllPending.mockResolvedValue({ ok: true, data: { count: 0 } });
});

describe("updateEventAction: a one-field save is that field", () => {
  it("approves nothing when a review event saves its QR style", async () => {
    const result = await updateEventAction("event-1", { qr_style: "bold" });
    expect(result).toEqual({ ok: true });
    expect(updateEvent).toHaveBeenCalledWith("event-1", { qr_style: "bold" });
    expect(approveAllPending).not.toHaveBeenCalled();
  });

  it("hands the review room's switch down alone and approves nothing", async () => {
    await updateEventAction("event-1", {
      moderation_mode: "hold_for_approval",
    });
    expect(updateEvent).toHaveBeenCalledWith("event-1", {
      moderation_mode: "hold_for_approval",
    });
    expect(approveAllPending).not.toHaveBeenCalled();
  });

  it("approves the held uploads when the save turns live mode on", async () => {
    await updateEventAction("event-1", { moderation_mode: "live" });
    expect(approveAllPending).toHaveBeenCalledWith("event-1");
  });

  it("refuses a malformed save before it writes anything", async () => {
    const result = await updateEventAction("event-1", {
      qr_style: "neon" as never,
    });
    expect(result).toMatchObject({ ok: false, code: "validation" });
    expect(updateEvent).not.toHaveBeenCalled();
  });
});
