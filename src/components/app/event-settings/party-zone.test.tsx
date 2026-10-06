/**
 * THE PARTY'S TIME ZONE, ONE QUIET CHOICE (`party-zone.tsx`, event-zone): a host who never travels never sees a zone; a
 * party on another clock says whose, with the clock there; the choice opens on her own zone and a search that finds a
 * city, a country or a destination, and a pick is the one save that moves the party's zone. Her browser's zone is named
 * for each case (`browserZone`), so none reads the machine's.
 */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/reel/defaults-action", () => ({ setReelDefaults: vi.fn() }));
vi.mock("@/app/(app)/dashboard/actions", () => ({
  updateEventAction: vi.fn(),
  updateEventSocialSettingsAction: vi.fn(),
}));
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  setEventDoorAction: vi.fn(),
}));

const { SettingsProvider } = await import("./settings-state");
type Writes = NonNullable<
  React.ComponentProps<typeof SettingsProvider>["writes"]
>;
const { hostEvent, NO_COUNTS } = await import("./testing/host-event");
const { PartyZoneLine } = await import("./party-zone");
const { browserZone } = await import("@/lib/event/zone");

/** 22:12 UTC: 4:12 PM in Mexico City, 3:12 PM in Los Angeles. */
const NOW = new Date("2026-10-05T22:12:00Z");

function mount(timeZone: string | null) {
  const updateEvent = vi.fn().mockResolvedValue({ ok: true });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SettingsProvider
      event={hostEvent({ time_zone: timeZone })}
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
  render(<PartyZoneLine />, { wrapper });
  return updateEvent;
}

const search = () => screen.getByRole("combobox", { name: /search a city/i });
const options = () =>
  within(screen.getByRole("listbox", { name: "Places" })).queryAllByRole(
    "option",
  );

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.spyOn(browserZone, "zoneName").mockReturnValue("America/Los_Angeles");
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("★ a host who never travels never sees a zone", () => {
  it("asks one quiet question and names no zone where the party's zone is hers", () => {
    mount("America/Los_Angeles");
    expect(
      screen.getByRole("button", { name: "Party in another time zone?" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Los Angeles/)).toBeNull();
    expect(screen.queryByText(/ time ·/)).toBeNull();
  });

  it("an event from before the column reads as hers too: the same quiet question", () => {
    mount(null);
    expect(
      screen.getByRole("button", { name: "Party in another time zone?" }),
    ).toBeInTheDocument();
  });
});

describe("a party on another clock", () => {
  it("★ says whose clock, with the time there now, and offers a change", () => {
    mount("America/Mexico_City");
    expect(
      screen.getByText("On Mexico City time · 4:12 PM there now"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Change the party's time zone" }),
    ).toBeInTheDocument();
  });
});

describe("the choice", () => {
  it("★ opens on her own zone, never a raw list: her city, 'Your time zone', the clock there", () => {
    mount("America/Los_Angeles");
    fireEvent.click(
      screen.getByRole("button", { name: "Party in another time zone?" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Where's the party?" }),
    ).toBeInTheDocument();
    const [own] = options();
    expect(options()).toHaveLength(1);
    expect(own).toHaveTextContent("Los Angeles");
    expect(own).toHaveTextContent("Your time zone");
    expect(own).toHaveTextContent("3:12 PM");
  });

  it("★ finds a destination by the name she knows, says it beside the city, and a pick is the one save of the zone", async () => {
    const updateEvent = mount("America/Los_Angeles");
    fireEvent.click(
      screen.getByRole("button", { name: "Party in another time zone?" }),
    );
    fireEvent.change(search(), { target: { value: "bali" } });
    const [first] = options();
    expect(first).toHaveTextContent("Makassar");
    expect(first).toHaveTextContent("Bali");
    await act(async () => {
      fireEvent.keyDown(search(), { key: "Enter" });
    });
    expect(updateEvent).toHaveBeenCalledWith(hostEvent().id, {
      time_zone: "Asia/Makassar",
    });
    // The dialog is gone, and the line says the party's clock at once (the save lays it over the row).
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText(/^On Makassar time/)).toBeInTheDocument();
  });

  it("the arrows move through what answers, and a press picks too", async () => {
    const updateEvent = mount("America/Mexico_City");
    fireEvent.click(
      screen.getByRole("button", { name: "Change the party's time zone" }),
    );
    // Her own zone first, then the party's (marked as the party's now).
    expect(options().map((o) => o.textContent)).toEqual([
      expect.stringContaining("Los Angeles"),
      expect.stringContaining("Mexico City"),
    ]);
    fireEvent.change(search(), { target: { value: "lon" } });
    fireEvent.keyDown(search(), { key: "ArrowDown" });
    const second = options()[1]!;
    expect(second).toHaveAttribute("aria-selected", "true");
    await act(async () => {
      fireEvent.click(options()[0]!);
    });
    expect(updateEvent).toHaveBeenCalledWith(hostEvent().id, {
      time_zone: expect.stringMatching(/^Europe\/London$/),
    });
  });

  it("says so where nothing answers", () => {
    mount("America/Los_Angeles");
    fireEvent.click(
      screen.getByRole("button", { name: "Party in another time zone?" }),
    );
    fireEvent.change(search(), { target: { value: "Atlantis Prime" } });
    expect(options()).toHaveLength(0);
    expect(
      screen.getByText(
        "No place by that name. Try its country, or a city near it.",
      ),
    ).toBeInTheDocument();
  });
});
