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

/**
 * ★ THE EVENT'S DATES (lane `event-dates`): the date as it always was, and for a weekend, a conference or a trip its
 * end beside it, offered, never asked. A picked day saves at once, the two together whenever a range is in play, so
 * the row never holds half of one; a cleared field waits until it is left; an end before the date is refused where
 * the eye is and never written.
 */
function datesPage(dates: { date: string | null; end?: string | null }) {
  const updateEvent = vi.fn(async () => ({ ok: true as const }));
  const writes = {
    updateEvent,
    setDoor: vi.fn(),
    setReel: vi.fn(),
    setProfile: vi.fn(),
  } as never;
  const event = hostEvent({
    id: "event-1",
    event_date: dates.date,
    event_end_date: dates.end ?? null,
  });
  const view = render(
    <SettingsProvider
      event={event}
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
  const start = screen.getByLabelText(/^Event date/) as HTMLInputElement;
  return { view, start, updateEvent };
}

const endField = () => screen.getByLabelText("End date") as HTMLInputElement;

describe("the event's dates", () => {
  it("saves a date alone as it always has, and offers no end before there is a date", async () => {
    const { start, updateEvent } = datesPage({ date: null });
    expect(
      screen.queryByRole("button", { name: "Add an end date" }),
    ).toBeNull();
    fireEvent.change(start, { target: { value: "2026-10-02" } });
    await vi.waitFor(() =>
      expect(updateEvent).toHaveBeenCalledWith("event-1", {
        event_date: "2026-10-02",
      }),
    );
  });

  it("★ opens an end on asking, and saves the range's two days together", async () => {
    const { updateEvent } = datesPage({ date: "2026-10-02" });
    fireEvent.click(screen.getByRole("button", { name: "Add an end date" }));
    const end = endField();
    expect(end.min).toBe("2026-10-02");
    fireEvent.change(end, { target: { value: "2026-10-04" } });
    await vi.waitFor(() =>
      expect(updateEvent).toHaveBeenCalledWith("event-1", {
        event_date: "2026-10-02",
        event_end_date: "2026-10-04",
      }),
    );
  });

  it("★ keeps an end still after a moved date, and moves one the date passes with it", async () => {
    const earlier = datesPage({ date: "2026-10-02", end: "2026-10-04" });
    fireEvent.change(earlier.start, { target: { value: "2026-10-01" } });
    await vi.waitFor(() =>
      expect(earlier.updateEvent).toHaveBeenCalledWith("event-1", {
        event_date: "2026-10-01",
        event_end_date: "2026-10-04",
      }),
    );
    cleanup();
    const later = datesPage({ date: "2026-10-02", end: "2026-10-04" });
    fireEvent.change(later.start, { target: { value: "2026-10-09" } });
    await vi.waitFor(() =>
      expect(later.updateEvent).toHaveBeenCalledWith("event-1", {
        event_date: "2026-10-09",
        event_end_date: "2026-10-11",
      }),
    );
  });

  it("refuses an end before the date under the field, and never writes it", async () => {
    const { updateEvent } = datesPage({
      date: "2026-10-02",
      end: "2026-10-04",
    });
    const end = endField();
    fireEvent.change(end, { target: { value: "2026-09-30" } });
    expect(
      await screen.findByText("The end date can't be before the event date."),
    ).toBeTruthy();
    expect(end.getAttribute("aria-invalid")).toBe("true");
    await new Promise((r) => setTimeout(r, 20));
    expect(updateEvent).not.toHaveBeenCalled();
  });

  it("takes the end away on ×, and reads an end on the date itself as the one day it is", async () => {
    const removed = datesPage({ date: "2026-10-02", end: "2026-10-04" });
    fireEvent.click(
      screen.getByRole("button", { name: "Remove the end date" }),
    );
    await vi.waitFor(() =>
      expect(removed.updateEvent).toHaveBeenCalledWith("event-1", {
        event_date: "2026-10-02",
        event_end_date: "",
      }),
    );
    cleanup();
    const same = datesPage({ date: "2026-10-02", end: "2026-10-04" });
    fireEvent.change(endField(), { target: { value: "2026-10-02" } });
    await vi.waitFor(() =>
      expect(same.updateEvent).toHaveBeenCalledWith("event-1", {
        event_date: "2026-10-02",
        event_end_date: "",
      }),
    );
  });

  it("★ clears the date only once it is left, and its end goes with it", async () => {
    const { start, updateEvent } = datesPage({
      date: "2026-10-02",
      end: "2026-10-04",
    });
    fireEvent.change(start, { target: { value: "" } });
    await new Promise((r) => setTimeout(r, 20));
    expect(updateEvent).not.toHaveBeenCalled();
    fireEvent.blur(start);
    await vi.waitFor(() =>
      expect(updateEvent).toHaveBeenCalledWith("event-1", {
        event_date: "",
        event_end_date: "",
      }),
    );
  });

  it("commits a cleared date as the panel closes, which leaves the field too", async () => {
    const { view, start, updateEvent } = datesPage({ date: "2026-10-02" });
    fireEvent.change(start, { target: { value: "" } });
    view.unmount();
    await vi.waitFor(() =>
      expect(updateEvent).toHaveBeenCalledWith("event-1", { event_date: "" }),
    );
  });
});
