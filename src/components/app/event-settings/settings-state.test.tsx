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
    vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({
      ...new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
      }).resolvedOptions(),
      timeZone: zone,
    });
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
