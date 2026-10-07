/**
 * SETTINGS' ONE STATE, ITS SAVES SETTLING (crumbs-81). Every save lays its value over the row, writes it, and settles
 * one of two ways the rows can rely on: kept, or put back with a sentence. A write that THROWS (a dropped connection
 * rejects the call instead of answering it) is the second: it used to leave `run` through its `finally` with the key
 * busy for good and the value she never saved still on the page, and its caller a rejected promise nobody caught.
 *
 * Here the provider is driven bare (`useSettings` read through `renderHook`, the writes stood in): the panel-level pin
 * is `event-settings-sheet.test.tsx`'s, this one holds the sequencing under a throw, which only the provider knows.
 */
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { HostEvent } from "@/lib/db/queries/events";

const { toast } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/reel/defaults-action", () => ({ setReelDefaults: vi.fn() }));
vi.mock("@/app/(app)/dashboard/actions", () => ({
  updateEventAction: vi.fn(),
  updateEventSocialSettingsAction: vi.fn(),
}));
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  setEventDoorAction: vi.fn(),
}));

const { SettingsProvider, useSettings } = await import("./settings-state");
const { browserZone } = await import("@/lib/event/zone");
type Writes = NonNullable<
  React.ComponentProps<typeof SettingsProvider>["writes"]
>;
const { hostEvent, NO_COUNTS } = await import("./testing/host-event");

const NEVER_REACHED = "Check your connection and try again.";

/** The provider around `useSettings`, whose `current` is always the newest state it rendered. */
function mount(writes: Partial<Writes>) {
  const event = hostEvent();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SettingsProvider
      event={event}
      tier="pro"
      counts={NO_COUNTS}
      pendingCount={0}
      social={null}
      reelSample={null}
      writes={writes as Writes}
    >
      {children}
    </SettingsProvider>
  );
  return renderHook(() => useSettings(), { wrapper }).result;
}

/** A write that answers (or throws) only when told to, so two saves can be in the air together. */
function held() {
  let settle: (how: { ok: true } | { throws: unknown }) => void = () => {};
  const call = vi.fn(
    () =>
      new Promise((resolve, reject) => {
        settle = (how) =>
          "throws" in how ? reject(how.throws) : resolve({ ok: true });
      }),
  );
  return { call, settle: (how: Parameters<typeof settle>[0]) => settle(how) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("a write that throws settles as a refusal", () => {
  it("★ puts the value back, frees the key, says it did not save, and answers false rather than rejecting", async () => {
    const settings = mount({
      updateEvent: vi
        .fn()
        .mockRejectedValue(
          new TypeError("Failed to fetch"),
        ) as Writes["updateEvent"],
    });
    let answer: boolean | undefined;
    await act(async () => {
      answer = await settings.current.saveEvent({ name: "Maya's 31st" });
    });
    expect(answer).toBe(false);
    expect(settings.current.values.name).toBe("Maya's 30th");
    expect(settings.current.saving("name")).toBe(false);
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith("Couldn't save that setting.", {
      description: NEVER_REACHED,
    });
  });

  it("★ the door's save answers null when it throws, as a refused one does, and puts the door back", async () => {
    const settings = mount({
      setDoor: vi
        .fn()
        .mockRejectedValue(
          new TypeError("Failed to fetch"),
        ) as Writes["setDoor"],
    });
    let answer: unknown = "unanswered";
    await act(async () => {
      answer = await settings.current.saveDoor("closed");
    });
    expect(answer).toBeNull();
    expect(settings.current.values.door).toBe("open");
    expect(settings.current.saving("door")).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't change who can get in.",
      {
        description: NEVER_REACHED,
      },
    );
  });

  it("★ the reel's and the profile's saves settle the same way", async () => {
    const settings = mount({
      setReel: vi
        .fn()
        .mockRejectedValue(new Error("boom")) as Writes["setReel"],
      setProfile: vi
        .fn()
        .mockRejectedValue(new Error("boom")) as Writes["setProfile"],
    });
    await act(async () => {
      expect(await settings.current.saveReel({ showReel: false })).toBe(false);
      expect(await settings.current.saveProfile(true)).toBe(false);
    });
    expect(settings.current.values.showReel).toBe(true);
    expect(settings.current.saving("showReel")).toBe(false);
    expect(settings.current.saving("displayInProfile")).toBe(false);
    expect(toast.error).toHaveBeenCalledTimes(2);
  });

  it("★ what waits on the saves (a page move) is released by a throw, never wedged behind it", async () => {
    const write = held();
    const settings = mount({
      updateEvent: write.call as unknown as Writes["updateEvent"],
    });
    const moved = vi.fn();
    let saving!: Promise<boolean>;
    act(() => {
      saving = settings.current.saveEvent({ name: "Maya's 31st" });
    });
    expect(settings.current.afterSaves(moved)).toBe(false);
    expect(moved).not.toHaveBeenCalled();
    await act(async () => {
      write.settle({ throws: new TypeError("Failed to fetch") });
      await saving;
    });
    expect(moved).toHaveBeenCalledTimes(1);
    expect(settings.current.afterSaves(vi.fn())).toBe(true);
  });
});

describe("only the newest save of a setting answers for it, a throw included", () => {
  it("★ an older save's throw never undoes a newer save that is on its way or has landed", async () => {
    const first = held();
    const second = held();
    const settings = mount({
      updateEvent: vi
        .fn()
        .mockImplementationOnce(first.call)
        .mockImplementationOnce(
          second.call,
        ) as unknown as Writes["updateEvent"],
    });
    let older!: Promise<boolean>;
    let newer!: Promise<boolean>;
    act(() => {
      older = settings.current.saveEvent({ name: "Maya's 31st" });
    });
    act(() => {
      newer = settings.current.saveEvent({ name: "Maya's 32nd" });
    });
    expect(settings.current.values.name).toBe("Maya's 32nd");

    // The older one throws while the newer is still in the air: the name stays the newer's, still saving.
    await act(async () => {
      first.settle({ throws: new TypeError("Failed to fetch") });
      await older;
    });
    expect(settings.current.values.name).toBe("Maya's 32nd");
    expect(settings.current.saving("name")).toBe(true);

    // The newer lands: it is kept, and the key is free.
    await act(async () => {
      second.settle({ ok: true });
      await newer;
    });
    expect(settings.current.values.name).toBe("Maya's 32nd");
    expect(settings.current.saving("name")).toBe(false);
  });
});

/* ★ THE PARTY'S ZONE RIDES ONLY WHERE IT IS MISSING (event-zone): a save of a time on an event from before the column
   carries her own zone, for the server to write where the row still has none; on a party that has a zone, a date saved
   from anywhere carries none, so a date edit never moves the party's zone. Only the chosen city does. */
describe("the party's zone on a save of a time", () => {
  /** Her browser names `zone`, for the save's capture. */
  function deviceSays(zone: string) {
    vi.spyOn(browserZone, "zoneName").mockReturnValue(zone);
  }
  function mountZoned(timeZone: string | null) {
    const updateEvent = vi.fn().mockResolvedValue({ ok: true });
    const event = hostEvent({ time_zone: timeZone });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SettingsProvider
        event={event}
        tier="pro"
        counts={NO_COUNTS}
        pendingCount={0}
        social={null}
        reelSample={null}
        writes={{ updateEvent } as unknown as Writes}
      >
        {children}
      </SettingsProvider>
    );
    return {
      settings: renderHook(() => useSettings(), { wrapper }).result,
      updateEvent,
    };
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads the party's stored zone into the values (null for an event from before the column)", () => {
    expect(
      mountZoned("Pacific/Auckland").settings.current.values.timeZone,
    ).toBe("Pacific/Auckland");
    expect(mountZoned(null).settings.current.values.timeZone).toBeNull();
  });

  it("★ an event with no zone takes hers with a save of its dates, or of its develop time", async () => {
    deviceSays("Europe/London");
    const { settings, updateEvent } = mountZoned(null);
    await act(async () => {
      await settings.current.saveEvent({ eventDate: "2026-10-10" });
    });
    expect(updateEvent).toHaveBeenLastCalledWith(hostEvent().id, {
      event_date: "2026-10-10",
      captured_zone: "Europe/London",
    });
    await act(async () => {
      await settings.current.saveEvent({
        developsAt: "2026-10-11T08:00:00.000Z",
      });
    });
    expect(updateEvent).toHaveBeenLastCalledWith(hostEvent().id, {
      develops_at: "2026-10-11T08:00:00.000Z",
      captured_zone: "Europe/London",
    });
  });

  it("★ a party with a zone: a date saved from another zone carries none", async () => {
    deviceSays("Europe/London");
    const { settings, updateEvent } = mountZoned("Pacific/Auckland");
    await act(async () => {
      await settings.current.saveEvent({
        eventDate: "2026-10-10",
        eventEndDate: "2026-10-12",
      });
    });
    expect(updateEvent).toHaveBeenCalledWith(hostEvent().id, {
      event_date: "2026-10-10",
      event_end_date: "2026-10-12",
    });
  });

  it("a save of anything else carries no zone, and the chosen city is the save that names one", async () => {
    deviceSays("Europe/London");
    const { settings, updateEvent } = mountZoned(null);
    await act(async () => {
      await settings.current.saveEvent({ name: "Maya's 31st" });
    });
    expect(updateEvent).toHaveBeenLastCalledWith(hostEvent().id, {
      name: "Maya's 31st",
    });
    await act(async () => {
      await settings.current.saveEvent({ timeZone: "America/Mexico_City" });
    });
    expect(updateEvent).toHaveBeenLastCalledWith(hostEvent().id, {
      time_zone: "America/Mexico_City",
    });
  });
});

/* ★ A GATE THAT LETS GO GIVES HER CHOICE BACK, AND THE DATABASE DOES IT (crumbs-89, red-team 57b's MEDIUM; crumbs-87's
   Q1). Letting each person in and the invite list hold "An email first" on ("On while you let each person in"). A gate
   that turned it on from off is remembered by the event (`events.email_held`), and the door's leaving it gives her names
   only back in the same write (`events_email_held`, 20261007140000), whichever page, device or load moved it, the
   password's first set included. So the page says it from the save's own answer, never a later read of the hub's row.
   ★ RESHAPED ON PURPOSE (scar kept: a host's names-only door comes back when the gate goes, said in the row's words).
   The expired reason: "the provider notes on this device, and writes the switch back off when the ROW shows the door
   has left". The row stops taking the saves after a load (red-team 57b, 7 of 12), so the note was lost to a reload, a
   restored tab and the phone's door page, and it never reached another device or the password's first set. */
describe("the email step a gate held on", () => {
  /** The provider over a row the test moves, as the server's revalidation would (when it lands). */
  function mountRow(first: HostEvent, writes: Partial<Writes>) {
    let event = first;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SettingsProvider
        event={event}
        tier="pro"
        counts={NO_COUNTS}
        pendingCount={0}
        social={null}
        reelSample={null}
        writes={writes as Writes}
      >
        {children}
      </SettingsProvider>
    );
    const view = renderHook(() => useSettings(), { wrapper });
    return {
      view,
      settings: view.result,
      /** The server's next row for this event. */
      row(over: Partial<HostEvent>) {
        event = hostEvent(over);
        act(() => view.rerender());
      },
    };
  }

  /** A row as the database holds it, with its memory of a hold (`email_held`). */
  const rowOf = (over: Partial<HostEvent>) => hostEvent(over);

  /** `set_event_door`'s answers, as the database gives them (20261007140000). */
  const held = { ok: true, emailHeld: true, emailRestored: false, admitted: 0 };
  const moved = {
    ok: true,
    emailHeld: false,
    emailRestored: false,
    admitted: 0,
  };
  const restored = {
    ok: true,
    emailHeld: false,
    emailRestored: true,
    admitted: 0,
  };
  const flush = () => act(async () => {});

  it("★ names only, a gate, then Public: the switch is off at once, from the save's own answer, and she is told in the row's words", async () => {
    const updateEvent = vi.fn();
    const setDoor = vi
      .fn()
      .mockResolvedValueOnce(held)
      .mockResolvedValueOnce(restored);
    const { settings } = mountRow(rowOf({ require_verified_email: false }), {
      setDoor,
      updateEvent,
    } as unknown as Partial<Writes>);

    await act(async () => {
      await settings.current.saveDoor("approve");
    });
    expect(settings.current.values.requireVerifiedEmail).toBe(true);
    expect(settings.current.values.emailHeld).toBe(true);
    expect(toast.success).not.toHaveBeenCalled();

    // ★ The hub's row never moves here (a hard load's stale row): the answer alone says what the database did.
    await act(async () => {
      await settings.current.saveDoor("open");
    });
    expect(settings.current.values.door).toBe("open");
    expect(settings.current.values.requireVerifiedEmail).toBe(false);
    expect(settings.current.values.emailHeld).toBe(false);
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("An email first is off again.", {
      description: "It was only on while you let each person in.",
    });
    // The database gave it back: the page writes nothing of its own.
    expect(updateEvent).not.toHaveBeenCalled();
  });

  it("says the invite list's own words when that was the gate, and gives back on every way out (Only me here)", async () => {
    const setDoor = vi
      .fn()
      .mockResolvedValueOnce(held)
      .mockResolvedValueOnce(restored);
    const { settings } = mountRow(rowOf({ require_verified_email: false }), {
      setDoor,
    } as unknown as Partial<Writes>);
    await act(async () => {
      await settings.current.saveDoor("invite");
    });
    await act(async () => {
      await settings.current.saveDoor("private");
    });
    expect(settings.current.values.requireVerifiedEmail).toBe(false);
    expect(toast.success).toHaveBeenCalledWith("An email first is off again.", {
      description: "It was only on while your invite list was the way in.",
    });
  });

  it("★ from one gate to the other the memory stands, and the second gate's own leave is said in its words (the live walk's catch)", async () => {
    // As the database answers: the first gate turned the step on, the second found it on and turned nothing on.
    const setDoor = vi
      .fn()
      .mockResolvedValueOnce(held)
      .mockResolvedValueOnce(moved)
      .mockResolvedValueOnce(restored);
    const { settings } = mountRow(rowOf({ require_verified_email: false }), {
      setDoor,
    } as unknown as Partial<Writes>);
    await act(async () => {
      await settings.current.saveDoor("approve");
    });
    await act(async () => {
      await settings.current.saveDoor("invite");
    });
    expect(settings.current.values.requireVerifiedEmail).toBe(true);
    expect(settings.current.values.emailHeld).toBe(true);
    expect(toast.success).not.toHaveBeenCalled();

    await act(async () => {
      await settings.current.saveDoor("closed");
    });
    expect(settings.current.values.requireVerifiedEmail).toBe(false);
    expect(toast.success).toHaveBeenCalledWith("An email first is off again.", {
      description: "It was only on while your invite list was the way in.",
    });
  });

  it("★ another device, or a load after the hold: the row's memory is read, and the leave's answer is said", async () => {
    // The hold was made elsewhere; this page loads onto it.
    const { settings } = mountRow(
      rowOf({
        door: "approve",
        require_verified_email: true,
        email_held: true,
      }),
      {
        setDoor: vi.fn().mockResolvedValue(restored),
      } as unknown as Partial<Writes>,
    );
    expect(settings.current.values.emailHeld).toBe(true);
    await act(async () => {
      await settings.current.saveDoor("open");
    });
    expect(settings.current.values.requireVerifiedEmail).toBe(false);
    expect(toast.success).toHaveBeenCalledWith("An email first is off again.", {
      description: "It was only on while you let each person in.",
    });
  });

  it("★ a door this page never saw holding it (another device's gate) is said without naming a gate", async () => {
    const { settings } = mountRow(rowOf({ require_verified_email: false }), {
      setDoor: vi.fn().mockResolvedValue(restored),
    } as unknown as Partial<Writes>);
    await act(async () => {
      await settings.current.saveDoor("closed");
    });
    expect(toast.success).toHaveBeenCalledWith("An email first is off again.", {
      description:
        "It was only on while the door asked for a confirmed address.",
    });
  });

  it("★ gives nothing back to a host whose step was already on: the gate turned nothing on, and nothing is said", async () => {
    const setDoor = vi
      .fn()
      .mockResolvedValueOnce(moved)
      .mockResolvedValueOnce(moved);
    const { settings } = mountRow(hostEvent(), {
      setDoor,
    } as unknown as Partial<Writes>);
    await act(async () => {
      await settings.current.saveDoor("approve");
    });
    expect(settings.current.values.emailHeld).toBe(false);
    await act(async () => {
      await settings.current.saveDoor("open");
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(settings.current.values.requireVerifiedEmail).toBe(true);
  });

  it("★ the password's first set while held: its success lays the password door and the step off, and says so", async () => {
    const { settings } = mountRow(rowOf({ require_verified_email: false }), {
      setDoor: vi.fn().mockResolvedValue(held),
    } as unknown as Partial<Writes>);
    await act(async () => {
      await settings.current.saveDoor("approve");
    });
    // `set_event_password` answered success alone; it cleared the gate, and the event gave her names only back.
    act(() => settings.current.passwordSet());
    expect(settings.current.values.door).toBe("password");
    expect(settings.current.values.hasPassword).toBe(true);
    expect(settings.current.values.requireVerifiedEmail).toBe(false);
    expect(settings.current.values.emailHeld).toBe(false);
    expect(toast.success).toHaveBeenCalledWith("An email first is off again.", {
      description: "It was only on while you let each person in.",
    });
  });

  it("a password set with nothing held moves the door and says nothing of the email step; Remove turns a password door Public", async () => {
    const { settings } = mountRow(hostEvent(), {} as Partial<Writes>);
    act(() => settings.current.passwordSet());
    expect(settings.current.values.door).toBe("password");
    expect(settings.current.values.requireVerifiedEmail).toBe(true);
    expect(toast.success).not.toHaveBeenCalled();
    act(() => settings.current.passwordCleared());
    expect(settings.current.values.door).toBe("open");
    expect(settings.current.values.hasPassword).toBe(false);
  });

  it("Remove under a gate keeps the gate: only the password goes", async () => {
    const { settings } = mountRow(
      rowOf({ door: "approve", has_password: true }),
      {} as Partial<Writes>,
    );
    act(() => settings.current.passwordCleared());
    expect(settings.current.values.door).toBe("approve");
    expect(settings.current.values.hasPassword).toBe(false);
  });

  it("★ a database that remembers nothing (before 20261007140000) gives nothing back, and nothing is claimed", async () => {
    // Its answer carries no `emailRestored`: the switch stays as the database left it (on, live, one tap from off).
    const setDoor = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, emailHeld: true, admitted: 0 })
      .mockResolvedValueOnce({ ok: true, emailHeld: false, admitted: 0 });
    const { settings } = mountRow(rowOf({ require_verified_email: false }), {
      setDoor,
    } as unknown as Partial<Writes>);
    await act(async () => {
      await settings.current.saveDoor("approve");
    });
    expect(settings.current.values.requireVerifiedEmail).toBe(true);
    expect(settings.current.values.emailHeld).toBe(false);
    await act(async () => {
      await settings.current.saveDoor("open");
    });
    act(() => settings.current.passwordSet());
    expect(settings.current.values.requireVerifiedEmail).toBe(true);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("the row catching up lets every key the answers laid go, the memory's included", async () => {
    const setDoor = vi
      .fn()
      .mockResolvedValueOnce(held)
      .mockResolvedValueOnce(restored);
    const { settings, row } = mountRow(
      rowOf({ require_verified_email: false }),
      {
        setDoor,
      } as unknown as Partial<Writes>,
    );
    await act(async () => {
      await settings.current.saveDoor("approve");
    });
    row({ door: "approve", require_verified_email: true, email_held: true });
    await act(async () => {
      await settings.current.saveDoor("open");
    });
    row({ door: "open", require_verified_email: false, email_held: false });
    await flush();
    expect(settings.current.values).toMatchObject({
      door: "open",
      requireVerifiedEmail: false,
      emailHeld: false,
    });
    // A later change from elsewhere reaches the page: nothing of the overlay stands over the row.
    row({ door: "approve", require_verified_email: true, email_held: true });
    expect(settings.current.values).toMatchObject({
      door: "approve",
      requireVerifiedEmail: true,
      emailHeld: true,
    });
  });
});
