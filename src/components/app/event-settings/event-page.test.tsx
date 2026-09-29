/**
 * THE EVENT PAGE'S TYPED FIELDS SAVE WHEN THEY ARE LEFT, AND A CLOSED PANEL LEAVES THEM TOO.
 *
 * Every control in Settings saves itself (event-settings r1: the form's one Save retired), and a typed
 * field writes when it is left. Escape or Back takes the page away with focus still inside it, and a
 * field removed from the page never blurs, so the field commits what was typed as it unmounts. Pinned
 * through the one write (`updateEvent`, injected): a blur saves exactly its field, an unmount saves
 * what the blur never did, a refused value (an empty name) never reaches the write, and a value that
 * did not change is never sent at all.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/app/(app)/dashboard/actions", () => ({
  updateEventAction: vi.fn(),
  updateEventSocialSettingsAction: vi.fn(),
}));
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  setEventDoorAction: vi.fn(),
}));
vi.mock("@/lib/reel/defaults-action", () => ({ setReelDefaults: vi.fn() }));

const { EventPage } = await import("./event-page");
const { SettingsProvider } = await import("./settings-state");
const { hostEvent, NO_COUNTS } = await import("./testing/host-event");

afterEach(cleanup);

function page() {
  const updateEvent = vi.fn(async () => ({ ok: true as const }));
  const writes = {
    updateEvent,
    setDoor: vi.fn(),
    setReel: vi.fn(),
    setProfile: vi.fn(),
  } as never;
  const view = render(
    <SettingsProvider
      event={hostEvent({ id: "event-1", name: "Maya & Jay's Wedding" })}
      tier="pro"
      counts={NO_COUNTS}
      pendingCount={0}
      social={null}
      reelSample={null}
      writes={writes}
    >
      <EventPage />
    </SettingsProvider>,
  );
  const name = screen.getByLabelText(/^Event name/) as HTMLInputElement;
  return { view, name, updateEvent };
}

describe("a typed field saves itself", () => {
  it("writes its own field when it is left", async () => {
    const { name, updateEvent } = page();
    fireEvent.change(name, { target: { value: "  Maya & Jay  " } });
    fireEvent.blur(name);
    await vi.waitFor(() =>
      expect(updateEvent).toHaveBeenCalledWith("event-1", {
        name: "Maya & Jay",
      }),
    );
  });

  it("★ commits what was typed when the page closes before the field is left", async () => {
    const { view, name, updateEvent } = page();
    fireEvent.change(name, { target: { value: "The Chens' anniversary" } });
    // Escape, or Back: the page goes away with focus still in the field, and no blur ever comes.
    view.unmount();
    await vi.waitFor(() =>
      expect(updateEvent).toHaveBeenCalledWith("event-1", {
        name: "The Chens' anniversary",
      }),
    );
    expect(updateEvent).toHaveBeenCalledTimes(1);
  });

  it("saves once when a left field then closes, and never sends what did not change", async () => {
    const { view, name, updateEvent } = page();
    fireEvent.change(name, { target: { value: "Saved on leaving" } });
    fireEvent.blur(name);
    view.unmount();
    await vi.waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(1));

    const again = page();
    fireEvent.change(again.name, { target: { value: "Maya & Jay's Wedding" } });
    again.view.unmount();
    await new Promise((r) => setTimeout(r, 20));
    expect(again.updateEvent).not.toHaveBeenCalled();
  });

  it("never writes a refused value, on leaving or on closing", async () => {
    const { view, name, updateEvent } = page();
    fireEvent.change(name, { target: { value: "   " } });
    fireEvent.blur(name);
    expect(await screen.findByText("Give your event a name.")).toBeTruthy();
    expect(name.getAttribute("aria-invalid")).toBe("true");
    fireEvent.change(name, { target: { value: "" } });
    view.unmount();
    await new Promise((r) => setTimeout(r, 20));
    expect(updateEvent).not.toHaveBeenCalled();
  });
});
