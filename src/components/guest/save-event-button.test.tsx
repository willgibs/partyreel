/**
 * THE SAVE A DOOR PROMISED, FINISHED ON THE WAY BACK. Google and a magic link
 * leave the page, and every door that saves an event writes its intent before
 * it opens; the event page mounts `CompletePendingSave` once so the promise
 * lands after the round trip. It used to be read only by the offer card's own
 * button, which is never on the page by then (the card is a signed-out guest's).
 */
import { render, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession, rpc } = vi.hoisted(() => ({
  getSession: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getSession }, rpc }),
}));

import { CompletePendingSave } from "./save-event-button";

const KEY = "pr_pending_save_evt-1";
const SIGNED_IN = { data: { session: { user: { id: "u-1" } } } };

beforeEach(() => {
  vi.clearAllMocks();
  rpc.mockResolvedValue({ data: "evt-1", error: null });
});

describe("CompletePendingSave", () => {
  it("finishes the save a door promised before the sign-in, and says so once", async () => {
    localStorage.setItem(KEY, "1");
    getSession.mockResolvedValue(SIGNED_IN);
    render(<CompletePendingSave eventId="evt-1" qrToken="tok-1" />);
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Saved to your dashboard."),
    );
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("save_event", { p_qr_token: "tok-1" });
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("waits, intent kept, while the visitor is still signed out", async () => {
    localStorage.setItem(KEY, "1");
    getSession.mockResolvedValue({ data: { session: null } });
    render(<CompletePendingSave eventId="evt-1" qrToken="tok-1" />);
    await waitFor(() => expect(getSession).toHaveBeenCalled());
    expect(rpc).not.toHaveBeenCalled();
    expect(localStorage.getItem(KEY)).toBe("1");
  });

  it("saves nothing when no door asked", async () => {
    getSession.mockResolvedValue(SIGNED_IN);
    render(<CompletePendingSave eventId="evt-1" qrToken="tok-1" />);
    await waitFor(() => expect(getSession).toHaveBeenCalled());
    expect(rpc).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});
