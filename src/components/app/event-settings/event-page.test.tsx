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

const { EventPage, PICK_SETTLE_MS } = await import("./event-page");
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

  // RESHAPED ON PURPOSE (crumbs-61, red-team 48's LOW): an end still after the moved date used to stay, which left a start
  // retyped a year earlier with a range 369 days long; the range keeps its length in both directions (`dates.test.ts`).
  it("★ moves the whole range with a moved date, a day earlier, a week on or a year back", async () => {
    const earlier = datesPage({ date: "2026-10-02", end: "2026-10-04" });
    fireEvent.change(earlier.start, { target: { value: "2026-10-01" } });
    await vi.waitFor(() =>
      expect(earlier.updateEvent).toHaveBeenCalledWith("event-1", {
        event_date: "2026-10-01",
        event_end_date: "2026-10-03",
      }),
    );
    cleanup();
    const yearBack = datesPage({ date: "2027-10-05", end: "2027-10-09" });
    fireEvent.change(yearBack.start, { target: { value: "2026-10-05" } });
    await vi.waitFor(() =>
      expect(yearBack.updateEvent).toHaveBeenCalledWith("event-1", {
        event_date: "2026-10-05",
        event_end_date: "2026-10-09",
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

/**
 * ★ A DATE SAVES ONCE SHE HAS FINISHED IT, NEVER ON A KEYSTROKE (crumbs-59, red-team 47's MEDIUM). Chrome's date field
 * fires a COMPLETE date on every keystroke that makes one, so a year typed digit by digit passes 0002, 0020 and 0202 on
 * its way to 2027, and a field that saved each change stored 2027-10-02 to 3851-10-05 after four saves; the day typed
 * as 12 saved 12 to 15 (the "1" made October 1, the end stayed, then the day moved from there); an end day typed as 20
 * closed the range at the "2". Measured on Chrome 154, one real key press at a time: `keydown`, then `input` and
 * `change` with the whole date in the same millisecond, then `keyup`. A change no key made (a picker's choice) is a
 * finished date; one a key made waits to be left, or Entered.
 *
 * What is pinned is the writes, keystroke by keystroke in the order Chrome fires them.
 */
type Press = [key: string, dateAfter: string];

/** Real key presses into a date field: each is the keydown, the complete date it makes, and the keyup. */
function typeInto(field: HTMLInputElement, presses: Press[]) {
  for (const [key, value] of presses) {
    fireEvent.keyDown(field, { key });
    fireEvent.change(field, { target: { value } });
    fireEvent.keyUp(field, { key });
  }
}

/** 2027 into the year of October 2, a digit at a time (the ledger's own walk). */
const TYPE_2027: Press[] = [
  ["2", "0002-10-02"],
  ["0", "0020-10-02"],
  ["2", "0202-10-02"],
  ["7", "2027-10-02"],
];

const rest = (ms: number) => new Promise((r) => setTimeout(r, ms));
const WEEKEND = { date: "2026-10-02", end: "2026-10-04" };

describe("★ a date saves once she has finished it", () => {
  it("saves a year typed digit by digit once, when the field is left: never 0002, 0020 or 0202", async () => {
    const { start, updateEvent } = datesPage(WEEKEND);
    typeInto(start, TYPE_2027);
    // The field shows what she typed, and nothing is on its way while she is still in it, past any beat.
    expect(start.value).toBe("2027-10-02");
    await rest(PICK_SETTLE_MS + 100);
    expect(updateEvent).not.toHaveBeenCalled();
    fireEvent.blur(start);
    await vi.waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(1));
    // The weekend moved a year on, still a weekend: the end follows the saved length, not a keystroke's.
    expect(updateEvent).toHaveBeenCalledWith("event-1", {
      event_date: "2027-10-02",
      event_end_date: "2027-10-04",
    });
  });

  it("saves the day typed as 12 once, October 12 to 14: the weekend it was, never 12 to 15", async () => {
    const { start, updateEvent } = datesPage(WEEKEND);
    typeInto(start, [
      ["1", "2026-10-01"],
      ["2", "2026-10-12"],
    ]);
    expect(updateEvent).not.toHaveBeenCalled();
    fireEvent.blur(start);
    await vi.waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(1));
    expect(updateEvent).toHaveBeenCalledWith("event-1", {
      event_date: "2026-10-12",
      event_end_date: "2026-10-14",
    });
  });

  it("keeps an end day typed as 20 under her fingers: the 2 never closes the range, and the field saves once", async () => {
    const { start, updateEvent } = datesPage(WEEKEND);
    const end = endField();
    fireEvent.keyDown(end, { key: "2" });
    fireEvent.change(end, { target: { value: "2026-10-02" } });
    fireEvent.keyUp(end, { key: "2" });
    // "2" made the end the date itself, which on a finished field is one day; mid-typing it is only a stop on the way.
    await rest(PICK_SETTLE_MS + 100);
    expect(updateEvent).not.toHaveBeenCalled();
    expect(document.body.contains(end)).toBe(true);
    expect(end.value).toBe("2026-10-02");
    typeInto(end, [["0", "2026-10-20"]]);
    fireEvent.blur(end);
    await vi.waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(1));
    expect(updateEvent).toHaveBeenCalledWith("event-1", {
      event_date: "2026-10-02",
      event_end_date: "2026-10-20",
    });
    expect(start.value).toBe("2026-10-02");
  });

  it("saves the arrow keys' year once too: each ArrowUp is a whole date, and none of them is a save", async () => {
    const { start, updateEvent } = datesPage(WEEKEND);
    typeInto(start, [
      ["ArrowUp", "2027-10-02"],
      ["ArrowUp", "2028-10-02"],
    ]);
    expect(updateEvent).not.toHaveBeenCalled();
    fireEvent.blur(start);
    await vi.waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(1));
    expect(updateEvent).toHaveBeenCalledWith("event-1", {
      event_date: "2028-10-02",
      event_end_date: "2028-10-04",
    });
  });

  it("saves on Return, with the focus kept where she is typing", async () => {
    const { start, updateEvent } = datesPage(WEEKEND);
    start.focus();
    typeInto(start, TYPE_2027);
    expect(updateEvent).not.toHaveBeenCalled();
    fireEvent.keyDown(start, { key: "Enter" });
    await vi.waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(1));
    expect(updateEvent).toHaveBeenCalledWith("event-1", {
      event_date: "2027-10-02",
      event_end_date: "2027-10-04",
    });
    expect(document.activeElement).toBe(start);
  });

  it("saves a picker's choice (a change no key made) a beat after it, and a wheel's every notch as the one it rests on", async () => {
    const { start, updateEvent } = datesPage(WEEKEND);
    // One pick: saved, with no need to leave the field.
    fireEvent.change(start, { target: { value: "2026-10-09" } });
    await vi.waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(1));
    expect(updateEvent).toHaveBeenLastCalledWith("event-1", {
      event_date: "2026-10-09",
      event_end_date: "2026-10-11",
    });
    // A wheel that reports each notch as it turns (a phone's picker): one save, the day it rests on, taken from what
    // was last SAVED, so the end's rule never sees a notch on the way.
    for (const day of ["2026-10-08", "2026-10-07", "2026-10-06"]) {
      fireEvent.change(start, { target: { value: day } });
    }
    await rest(PICK_SETTLE_MS - 100);
    expect(updateEvent).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(2));
    await rest(PICK_SETTLE_MS + 100);
    expect(updateEvent).toHaveBeenCalledTimes(2);
  });

  it("★ never saves a year outside the window, and says so under the field in words", async () => {
    const { start, updateEvent } = datesPage(WEEKEND);
    typeInto(start, TYPE_2027.slice(0, 3));
    fireEvent.blur(start);
    expect(
      await screen.findByText("Pick a year from 1900 to 2100."),
    ).toBeTruthy();
    expect(start.getAttribute("aria-invalid")).toBe("true");
    await rest(PICK_SETTLE_MS + 100);
    expect(updateEvent).not.toHaveBeenCalled();
    // The year finished, the words go and the date saves.
    typeInto(start, [["7", "2027-10-02"]]);
    expect(screen.queryByText("Pick a year from 1900 to 2100.")).toBeNull();
    fireEvent.blur(start);
    await vi.waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(1));
    expect(updateEvent).toHaveBeenCalledWith("event-1", {
      event_date: "2027-10-02",
      event_end_date: "2027-10-04",
    });
  });

  it("refuses a year of five digits (a stray key past the fourth) the same way", async () => {
    const { start, updateEvent } = datesPage(WEEKEND);
    typeInto(start, [...TYPE_2027, ["7", "20277-10-02"]]);
    fireEvent.blur(start);
    expect(
      await screen.findByText("Pick a year from 1900 to 2100."),
    ).toBeTruthy();
    await rest(50);
    expect(updateEvent).not.toHaveBeenCalled();
  });

  it("refuses the end's year the same way, under the end", async () => {
    const { updateEvent } = datesPage(WEEKEND);
    const end = endField();
    typeInto(end, [
      ["2", "0002-10-04"],
      ["0", "0020-10-04"],
    ]);
    fireEvent.blur(end);
    expect(
      await screen.findByText("Pick a year from 1900 to 2100."),
    ).toBeTruthy();
    expect(end.getAttribute("aria-invalid")).toBe("true");
    await rest(50);
    expect(updateEvent).not.toHaveBeenCalled();
  });

  it("shows what is saved again once the other field saves: a year left at 0202 never lingers, unsaved and unmarked", async () => {
    const { start, updateEvent } = datesPage(WEEKEND);
    typeInto(start, TYPE_2027.slice(0, 3));
    fireEvent.blur(start);
    expect(
      await screen.findByText("Pick a year from 1900 to 2100."),
    ).toBeTruthy();
    expect(start.value).toBe("0202-10-02");
    // She moves on to the end and picks a day there (a pick comes well after any key she pressed): that is a save, and
    // the start is the saved date again.
    await rest(200);
    fireEvent.change(endField(), { target: { value: "2026-10-06" } });
    await vi.waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(1));
    expect(updateEvent).toHaveBeenCalledWith("event-1", {
      event_date: "2026-10-02",
      event_end_date: "2026-10-06",
    });
    expect(start.value).toBe("2026-10-02");
    expect(screen.queryByText("Pick a year from 1900 to 2100.")).toBeNull();
  });

  it("★ closing the panel mid-year saves nothing, and closing on a finished year saves it", async () => {
    const half = datesPage(WEEKEND);
    typeInto(half.start, TYPE_2027.slice(0, 3));
    half.view.unmount();
    await rest(50);
    expect(half.updateEvent).not.toHaveBeenCalled();
    cleanup();
    const whole = datesPage(WEEKEND);
    typeInto(whole.start, TYPE_2027);
    whole.view.unmount();
    await vi.waitFor(() => expect(whole.updateEvent).toHaveBeenCalledTimes(1));
    expect(whole.updateEvent).toHaveBeenCalledWith("event-1", {
      event_date: "2027-10-02",
      event_end_date: "2027-10-04",
    });
  });

  it("never saves a date she has not finished as a cleared one, and says to finish it or clear it", async () => {
    const { start, updateEvent } = datesPage(WEEKEND);
    // Backspace on a segment: the field's value is empty because it is half empty, not because it was cleared.
    fireEvent.keyDown(start, { key: "Backspace" });
    Object.defineProperty(start, "validity", {
      configurable: true,
      value: { badInput: true },
    });
    fireEvent.change(start, { target: { value: "" } });
    fireEvent.keyUp(start, { key: "Backspace" });
    fireEvent.blur(start);
    expect(
      await screen.findByText("Finish the date, or clear it."),
    ).toBeTruthy();
    expect(start.getAttribute("aria-invalid")).toBe("true");
    await rest(50);
    expect(updateEvent).not.toHaveBeenCalled();
  });
});
