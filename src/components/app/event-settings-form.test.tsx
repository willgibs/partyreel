/**
 * THE SETTINGS SAVE WRITES THE SETTINGS ON THE FORM, AND NEVER THE QR STYLE.
 *
 * The QR style lives in its own designer (`qr-designer-dialog.tsx`), not on this form, so the form
 * never holds it and a save must never carry it: a save that did would reset a custom QR to
 * classic every time a host fixed a typo in the event's name. What reaches the action is re-parsed
 * by `updateEventSchema` on the server, so the pin runs the payload through the same parse.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { HostEvent } from "@/lib/db/queries/events";
import { updateEventSchema } from "@/lib/validation/event";

const updateEventAction = vi.fn();

vi.mock("@/app/(app)/dashboard/actions", () => ({
  updateEventAction: (...args: unknown[]) => updateEventAction(...args),
  setEventPasswordAction: vi.fn(),
  clearEventPasswordAction: vi.fn(),
  deleteEventAction: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const { EventSettingsForm } =
  await import("@/components/app/event-settings-form");

// Built without the legacy identity twin on purpose: the object stands on both sides of the
// identity contract's type regeneration.
const EVENT = {
  id: "event-1",
  host_id: "host-1",
  name: "Backyard party",
  description: null,
  event_date: null,
  visibility: "open",
  accepting_uploads: true,
  require_verified_email: true,
  require_upload_to_view: false,
  moderation_mode: "live",
  max_upload_bytes: null,
  qr_style: "dots",
  qr_token: "0".repeat(32),
  custom_slug: null,
  display_in_profile: false,
  show_guest_list: false,
  created_at: "2026-09-01T00:00:00.000Z",
  updated_at: "2026-09-01T00:00:00.000Z",
  deleted_at: null,
  purge_at: null,
  has_password: false,
} as unknown as HostEvent;

beforeEach(() => {
  updateEventAction.mockReset();
  updateEventAction.mockResolvedValue({ ok: true });
});

describe("EventSettingsForm: a save keeps a custom QR", () => {
  it("sends no QR style, so the server patch leaves the host's custom QR alone", async () => {
    render(<EventSettingsForm event={EVENT} tier="pro" />);

    fireEvent.change(screen.getByDisplayValue("Backyard party"), {
      target: { value: "Backyard party, the sequel" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(updateEventAction).toHaveBeenCalledTimes(1));
    const [eventId, values] = updateEventAction.mock.calls[0];
    expect(eventId).toBe("event-1");
    expect(values).not.toHaveProperty("qr_style");
    // The server's own parse invents nothing either: the patch is the form's fields.
    expect(updateEventSchema.parse(values)).not.toHaveProperty("qr_style");
    expect(values).toMatchObject({
      name: "Backyard party, the sequel",
      visibility: "open",
      accepting_uploads: true,
      moderation_mode: "live",
    });
  });
});
