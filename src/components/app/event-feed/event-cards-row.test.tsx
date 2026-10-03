/**
 * EVERY DOOR OPENS ITS ROOM OVER THE HUB, ONE WAY (Will, event-header r2 `rooms=over`: "This feels phenomenally more
 * fluid, natural, and intuitive"). Driven through the real row: each room's door is a real link to the room's own
 * address on the hub (so a modified click is a tab of its own), an ordinary press opens the room in place, See it as
 * a guest is the fifth door at the row's end, and a room's code and what it will show are asked for on intent, so
 * the panel opens on the room rather than on a wait.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const openSheet = vi.fn();
vi.mock("@/components/app/share/event-share-provider", () => ({
  useEventShare: () => ({
    openSheet,
    openCode: vi.fn(),
    headerCodeHidden: false,
    morphNameFor: () => undefined,
  }),
}));
const warmRoom = vi.hoisted(() => vi.fn());
vi.mock("@/components/app/share/room-chunks", () => ({ warmRoom }));
const prefetchGuestsRoom = vi.hoisted(() => vi.fn());
vi.mock("@/components/app/share/guests-panel", () => ({ prefetchGuestsRoom }));
// The hub's album: two uploads waiting in Review, one decided.
const ensure = vi.hoisted(() => vi.fn(async () => {}));
const album = vi.hoisted(() => ({
  store: {
    getSnapshot: () => ({
      status: "ready",
      entries: [
        ["m1", 4, 3, 16, 1],
        ["m2", 4, 3, 0, 2],
        ["m3", 4, 3, 16, 3],
      ],
    }),
    subscribe: () => () => {},
    links: { ensure, subscribe: () => () => {}, revision: () => 0 },
  },
  seedSnapshot: { entries: [] },
  linkOf: () => undefined,
}));
vi.mock("@/components/app/event-feed/host-album", () => ({
  useHostAlbum: () => album,
  useHubCounts: () => null,
  useHubEntries: () => null,
}));
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  refreshHubReelAction: vi.fn(),
}));

const { EventCardsRow } = await import("./event-cards-row");

const EVENT = "00000000-0000-4000-8000-0000000000e1";

function row() {
  return render(
    <EventCardsRow
      eventId={EVENT}
      cards={[
        { id: "guests", value: "6 guests" },
        { id: "review", value: "2 waiting", amber: true, count: 2 },
        { id: "settings", value: "Public" },
      ]}
      reel={{
        state: "off",
        have: 0,
        of: 2,
        stills: [],
        viewHref: "/e/probe?reel",
        moderated: true,
        pending: 2,
      }}
    />,
  );
}

const door = (name: RegExp) => screen.getByRole("link", { name });

// jsdom lays nothing out and observes nothing: the row's stick asks both, and here it simply rests.
class Unobserved {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("IntersectionObserver", Unobserved);
vi.stubGlobal("ResizeObserver", Unobserved);

beforeEach(() => {
  openSheet.mockClear();
  warmRoom.mockClear();
  prefetchGuestsRoom.mockClear();
  ensure.mockClear();
});

describe("the doors into her rooms", () => {
  it.each([
    [/^Guests/, "guests"],
    [/^Review/, "review"],
    [/^Settings/, "settings"],
    [/^As a guest/, "as-guest"],
  ])(
    "★ %s is a real link to its room on the hub, and a press opens it there",
    (name, room) => {
      row();
      const link = door(name);
      expect(link).toHaveAttribute("href", `/dashboard/${EVENT}?room=${room}`);
      const press = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
      });
      link.dispatchEvent(press);
      expect(press.defaultPrevented).toBe(true);
      expect(openSheet).toHaveBeenCalledWith(room);
    },
  );

  it("leaves a modified click to the browser: the room in a tab of its own", () => {
    row();
    fireEvent.click(door(/^Review/), { metaKey: true });
    fireEvent.click(door(/^Guests/), { ctrlKey: true });
    expect(openSheet).not.toHaveBeenCalled();
  });

  it("★ ends on See it as a guest, the payoff after Settings", () => {
    row();
    const group = screen.getByRole("group", { name: "This event" });
    const links = [...group.querySelectorAll("a, button")].map(
      (el) => el.textContent ?? "",
    );
    expect(links.at(-1)).toMatch(/^As a guest/);
    expect(links.at(-2)).toMatch(/^Settings/);
    expect(door(/^As a guest/)).toHaveTextContent("What they see");
  });
});

describe("a room's code and what it shows, asked for on intent", () => {
  it("warms a room's chunk as a pointer comes over its door, or a keyboard lands on it", () => {
    row();
    fireEvent.pointerEnter(door(/^Review/));
    fireEvent.focus(door(/^Guests/));
    fireEvent.pointerEnter(door(/^As a guest/));
    expect(warmRoom.mock.calls.map(([room]) => room)).toEqual([
      "review",
      "guests",
      "as-guest",
    ]);
  });

  it("asks for the Guests room's read as the press begins", () => {
    row();
    fireEvent.pointerDown(door(/^Guests/), { button: 0 });
    expect(prefetchGuestsRoom).toHaveBeenCalledWith(EVENT);
  });

  it("asks for the links of every upload waiting in Review as the press begins, and nothing else", () => {
    row();
    fireEvent.pointerDown(door(/^Review/), { button: 0 });
    expect(ensure).toHaveBeenCalledWith(["m1", "m3"]);
  });

  it("a press that is not the main button asks for nothing", () => {
    row();
    fireEvent.pointerDown(door(/^Guests/), { button: 2 });
    fireEvent.pointerDown(door(/^Review/), { button: 1 });
    expect(prefetchGuestsRoom).not.toHaveBeenCalled();
    expect(ensure).not.toHaveBeenCalled();
  });
});
