import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EventsSection } from "./events-section";
import { DISPLAY_DEFAULT, type Display } from "@/lib/dashboard/display";
import type { EventListRow } from "@/lib/dashboard/events-view";

/**
 * YOUR EVENTS, SHAPED BY HER (host-dashboard r3, `events=menu`), pinned as function, never as look:
 *
 *   1. HER KEPT CHOICES PAINT FIRST, and what differs from the defaults is counted on the Display button and said
 *      in a line under the head, with the one press that undoes it.
 *   2. A CHOICE LAYS THE LIST OUT AT ONCE AND IS KEPT BESIDE IT through the Server Function, never before it, and a
 *      save that fails says so once.
 *   3. THE BIN STAYS REACHABLE, with its Restore, at one event as at forty: Restore lives only here.
 *   4. A SEARCH ARRIVES AT NINE EVENTS and finds one by name across whatever her filters keep.
 *   5. THE RECENT ROW folds to pills and unfolds, and her fold is kept with her choices.
 */

const setEventsDisplayAction = vi.hoisted(() =>
  vi.fn(
    async (_display: unknown) =>
      ({ ok: true }) as { ok: boolean; message?: string },
  ),
);
vi.mock("@/app/(app)/dashboard/actions", () => ({ setEventsDisplayAction }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/components/app/restore-event-button", () => ({
  RestoreEventButton: () => <button type="button">Restore</button>,
}));

const TODAY = "2026-10-02";

const row = (over: Partial<EventListRow>): EventListRow => ({
  id: "e",
  kind: "hosted",
  name: "Event",
  href: "/dashboard/e",
  coverUrl: null,
  stills: [],
  dateLabel: "No date set",
  when: "No date",
  face: null,
  sortDate: "2026-09-01T00:00:00.000Z",
  items: 3,
  pending: 0,
  waiting: 0,
  statusLabel: "Open",
  byline: null,
  marks: { live: false, state: null },
  day: null,
  dated: false,
  openedAt: null,
  ...over,
});

const ROWS = [
  row({
    id: "quiet",
    name: "Quiet party",
    href: "/dashboard/quiet",
    day: "2026-10-09",
    dated: true,
    dateLabel: "October 9, 2026",
    items: 10,
  }),
  row({
    id: "busy",
    name: "Busy party",
    href: "/dashboard/busy",
    day: "2026-08-01",
    dated: true,
    dateLabel: "August 1, 2026",
    items: 400,
    pending: 9,
    sortDate: "2026-08-01T00:00:00.000Z",
    marks: { live: false, state: { tone: "waiting", text: "9 to review" } },
  }),
  row({
    id: "friend",
    name: "Friend's wedding",
    kind: "guest",
    href: "/e/qr-friend",
    day: "2025-07-01",
    dated: true,
    dateLabel: "July 1, 2025",
    items: 0,
    statusLabel: null,
    byline: "Hosted by Priya",
    marks: null,
    sortDate: "2025-07-01T00:00:00.000Z",
  }),
  row({
    id: "bin",
    name: "Binned party",
    kind: "deleted",
    href: null,
    day: "2026-03-01",
    dated: true,
    statusLabel: "Deletes in 18 days",
    marks: null,
    sortDate: "2026-09-20T00:00:00.000Z",
  }),
];

// Each draw is another account's, so what the section remembers of one never reaches the next test.
let accounts = 0;
function draw(over: Partial<Parameters<typeof EventsSection>[0]> = {}) {
  return render(
    <EventsSection
      rows={ROWS}
      today={TODAY}
      owner={`host-${++accounts}`}
      initial={DISPLAY_DEFAULT}
      recent={[]}
      {...over}
    />,
  );
}

const kept = (over: Partial<Display>): Display => ({
  ...DISPLAY_DEFAULT,
  ...over,
});
const openMenu = () =>
  fireEvent.click(screen.getByRole("button", { name: /^display/i }));
const choose = (group: string, name: RegExp | string) =>
  fireEvent.click(
    within(
      within(screen.getByRole("dialog")).getByRole("group", { name: group }),
    ).getByRole("radio", { name }),
  );
const layout = () =>
  document.querySelector("[data-arranged]")?.getAttribute("data-arranged");
/** The table's lines, in the order they stand. */
const lines = () =>
  [...document.querySelectorAll("[data-event-line]")].map((el) =>
    el.getAttribute("data-event-line"),
  );
const said = () => document.querySelector("[data-display-said]");

beforeEach(() => {
  setEventsDisplayAction.mockClear();
  setEventsDisplayAction.mockResolvedValue({ ok: true });
  vi.mocked(toast.error).mockClear();
});

describe("her kept choices paint first", () => {
  it("opens on covers when nothing is kept, with nothing counted and nothing said", () => {
    draw();
    expect(layout()).toBe("gallery");
    expect(screen.getByRole("button", { name: "Display" })).toBeInTheDocument();
    expect(said()).toBeNull();
    expect(
      screen.getByRole("heading", { name: /your events/i }),
    ).toHaveTextContent("Your events 3");
  });

  it("paints the layout she kept, counts what differs on the button and says it under the head", () => {
    draw({ initial: kept({ layout: "table", sort: "date", year: "2026" }) });
    expect(layout()).toBe("table");
    expect(
      screen.getByRole("button", { name: /^display, 3 set$/i }),
    ).toBeInTheDocument();
    expect(said()).toHaveTextContent("Table · Event date · 2026");
    // Her year keeps the two events of 2026 and leaves the guest album of 2025 out, the latest first.
    expect(lines()).toEqual(["quiet", "busy"]);
  });

  it("draws the list layout as rows and the gallery as tiles", () => {
    const { unmount } = draw({ initial: kept({ layout: "list" }) });
    expect(layout()).toBe("list");
    expect(document.querySelectorAll("[data-tile]")).toHaveLength(0);
    unmount();
    draw();
    expect(document.querySelectorAll("[data-tile]")).toHaveLength(3);
  });
});

describe("a choice lays the list out at once, and is kept beside it", () => {
  it("lays out a layout she presses and keeps exactly what she chose", () => {
    draw();
    openMenu();
    choose("Layout", /table/i);
    expect(layout()).toBe("table");
    expect(setEventsDisplayAction).toHaveBeenCalledTimes(1);
    expect(setEventsDisplayAction).toHaveBeenCalledWith(
      kept({ layout: "table" }),
    );
  });

  it("orders by what she presses, and turns the order round with its direction", () => {
    draw({ initial: kept({ layout: "table" }) });
    openMenu();
    choose("Sort by", /^name$/i);
    expect(lines()).toEqual(["busy", "friend", "quiet"]);
    fireEvent.click(screen.getByRole("button", { name: /a to z/i }));
    expect(setEventsDisplayAction).toHaveBeenLastCalledWith(
      kept({ layout: "table", sort: "name", desc: true }),
    );
    expect(lines()).toEqual(["quiet", "friend", "busy"]);
    expect(screen.getByRole("button", { name: /z to a/i })).toBeInTheDocument();
  });

  it("says what is set, and one Reset undoes all of it", () => {
    draw({ initial: kept({ layout: "table", lens: "hosting" }) });
    expect(said()).toHaveTextContent("Table · Hosting");
    fireEvent.click(
      within(said() as HTMLElement).getByRole("button", { name: "Reset" }),
    );
    expect(layout()).toBe("gallery");
    expect(said()).toBeNull();
    expect(setEventsDisplayAction).toHaveBeenLastCalledWith(DISPLAY_DEFAULT);
  });

  it("presses a table head to sort by it and again to turn it round, keeping each", () => {
    draw({ initial: kept({ layout: "table" }) });
    const table = document.querySelector("[data-events-table]") as HTMLElement;
    fireEvent.click(within(table).getByRole("button", { name: /^date$/i }));
    expect(setEventsDisplayAction).toHaveBeenLastCalledWith(
      kept({ layout: "table", sort: "date" }),
    );
    expect(lines()).toEqual(["quiet", "busy", "friend"]);
    fireEvent.click(within(table).getByRole("button", { name: /^date$/i }));
    expect(setEventsDisplayAction).toHaveBeenLastCalledWith(
      kept({ layout: "table", sort: "date", desc: false }),
    );
    expect(lines()).toEqual(["friend", "busy", "quiet"]);
  });

  it("says what waits in the table's line twice over, in its own column and, for a phone, under the name", () => {
    draw({ initial: kept({ layout: "table" }) });
    const line = document.querySelector(
      "[data-event-line='busy']",
    ) as HTMLElement;
    expect(line.textContent?.match(/9 to review/g)).toHaveLength(2);
    expect(
      (document.querySelector("[data-event-line='quiet']") as HTMLElement)
        .textContent,
    ).not.toContain("to review");
  });

  it("groups by year under a head each, in the order her order reaches them", () => {
    draw({ initial: kept({ group: "year", sort: "date" }) });
    expect(
      screen.getAllByRole("region").map((r) => r.getAttribute("aria-label")),
    ).toEqual(["Your events", "2026", "2025"]);
    expect(
      within(screen.getByRole("region", { name: "2025" })).getByText(
        "Friend's wedding",
      ),
    ).toBeInTheDocument();
  });

  it("says a save that failed, once, and keeps what she sees", async () => {
    setEventsDisplayAction.mockResolvedValue({
      ok: false,
      message: "Couldn't keep that.",
    });
    draw();
    openMenu();
    choose("Layout", /list/i);
    expect(layout()).toBe("list");
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't keep that.", {
        id: "events-display",
      }),
    );
  });

  it("says a save that never answered the same way", async () => {
    setEventsDisplayAction.mockRejectedValue(new Error("offline"));
    draw();
    openMenu();
    choose("Layout", /list/i);
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(layout()).toBe("list");
  });
});

/**
 * ★ BACK BRINGS THE PAGE BACK FROM THE ROUTER CACHE, drawn from before her last choice (verified in a browser: the same
 * server render stamp, her layout reset). So a remount finds what this tab last showed, for her account alone.
 */
describe("the page restored by Back", () => {
  it("finds her last choice again, where the cached page says an older one", () => {
    const first = draw({ owner: "back-1" });
    openMenu();
    choose("Layout", /table/i);
    expect(layout()).toBe("table");
    first.unmount();
    // The page the router cache hands back was drawn before her choice: the default.
    draw({ owner: "back-1", initial: DISPLAY_DEFAULT });
    expect(layout()).toBe("table");
    expect(said()).toHaveTextContent("Table");
  });

  it("finds the search she typed, for the length of a visit", () => {
    const many = Array.from({ length: 9 }, (_, i) =>
      row({ id: `p${i}`, name: `Party ${i}`, href: `/dashboard/p${i}` }),
    );
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-04T10:00:00.000Z"));
    const first = draw({ owner: "back-2", rows: many });
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "party 3" },
    });
    first.unmount();
    const second = draw({ owner: "back-2", rows: many });
    expect(screen.getByRole("searchbox")).toHaveValue("party 3");
    second.unmount();
    // Hours on, a fresh visit meets no stale filter.
    vi.setSystemTime(new Date("2026-10-04T10:11:00.000Z"));
    draw({ owner: "back-2", rows: many });
    expect(screen.getByRole("searchbox")).toHaveValue("");
    vi.useRealTimers();
  });

  it("never hands one account's choice to another that signs in on the same tab", () => {
    const first = draw({ owner: "mine" });
    openMenu();
    choose("Layout", /list/i);
    first.unmount();
    draw({ owner: "someone-else" });
    expect(layout()).toBe("gallery");
  });
});

describe("the bin and the events she was added to", () => {
  it("reaches the bin through Show, with its Restore, and leaves it out of All", () => {
    draw();
    expect(screen.queryByText("Binned party")).toBeNull();
    openMenu();
    choose("Whose", /^deleted 1$/i);
    expect(screen.getByText("Binned party")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /restore/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Quiet party")).toBeNull();
  });

  it("restores from the table's line too, the line itself no link", () => {
    draw({ initial: kept({ layout: "table", lens: "deleted" }) });
    const line = document.querySelector(
      "[data-event-line='bin']",
    ) as HTMLElement;
    expect(line.querySelector("a")).toBeNull();
    expect(
      within(line).getByRole("button", { name: /restore/i }),
    ).toBeInTheDocument();
  });

  it("shows the events she added to alone under Guest, with no act of their own", () => {
    draw();
    openMenu();
    choose("Whose", /^guest 1$/i);
    expect(screen.getByText("Friend's wedding")).toBeInTheDocument();
    expect(screen.queryByText("Quiet party")).toBeNull();
    expect(screen.queryByRole("button", { name: /restore/i })).toBeNull();
    expect(
      screen.getByRole("link", { name: /friend's wedding/i }),
    ).toHaveAttribute("href", "/e/qr-friend");
  });

  it("leaves a lens with nothing in it out of Show, All always in", () => {
    draw({ rows: [ROWS[0]!, ROWS[1]!] });
    openMenu();
    const whose = within(
      within(screen.getByRole("dialog")).getByRole("group", { name: "Whose" }),
    ).getAllByRole("radio");
    expect(whose.map((r) => r.textContent)).toEqual(["All 2", "Hosting 2"]);
  });

  it("offers Display from a second event or whenever the bin holds one, never for one alone", () => {
    const { unmount } = draw({ rows: [ROWS[0]!] });
    expect(screen.queryByRole("button", { name: /^display/i })).toBeNull();
    unmount();
    // One live event and a deleted one: Restore lives only here, so Display must show.
    draw({ rows: [ROWS[0]!, ROWS[3]!] });
    expect(
      screen.getByRole("button", { name: /^display/i }),
    ).toBeInTheDocument();
  });

  it("says what a host with only deleted events meets, and one press to them", () => {
    draw({ rows: [ROWS[3]!] });
    expect(screen.getByText(/no events right now/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /show deleted/i }));
    expect(screen.getByText("Binned party")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /restore/i }),
    ).toBeInTheDocument();
    expect(setEventsDisplayAction).toHaveBeenLastCalledWith(
      kept({ lens: "deleted" }),
    );
  });
});

describe("the search", () => {
  const many = Array.from({ length: 9 }, (_, i) =>
    row({
      id: `p${i}`,
      name: i === 4 ? "Ángela's Wedding" : `Party ${i}`,
      href: `/dashboard/p${i}`,
    }),
  );

  it("arrives at nine events and finds one by name, accents aside", () => {
    draw({ rows: many });
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "angela" },
    });
    expect(screen.getByText("Ángela's Wedding")).toBeInTheDocument();
    expect(screen.queryByText("Party 1")).toBeNull();
  });

  it("says when nothing holds the words, and one press brings every event back", () => {
    draw({ rows: many });
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "zzz" },
    });
    expect(
      screen.getByText(/no event's name holds “zzz”/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /show every event/i }));
    expect(screen.getByText("Party 1")).toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });

  it("is not drawn for a handful", () => {
    draw();
    expect(screen.queryByRole("searchbox")).toBeNull();
  });
});

describe("the Recent row", () => {
  const recent = [ROWS[0]!, ROWS[1]!];

  it("shows the events she opened lately as tiles, and Hide folds them to pills, kept", () => {
    draw({ recent });
    const region = screen.getByRole("region", { name: "Recent" });
    expect(region.querySelectorAll("[data-tile]")).toHaveLength(2);
    fireEvent.click(within(region).getByRole("button", { name: /hide/i }));
    expect(region.querySelectorAll("[data-tile]")).toHaveLength(0);
    expect(
      within(region).getByRole("link", { name: /quiet party/i }),
    ).toHaveAttribute("href", "/dashboard/quiet");
    expect(setEventsDisplayAction).toHaveBeenLastCalledWith(
      kept({ recent: "folded" }),
    );
    // Folding is her own press, never one of the menu's choices.
    expect(said()).toBeNull();
    fireEvent.click(within(region).getByRole("button", { name: /show/i }));
    expect(region.querySelectorAll("[data-tile]")).toHaveLength(2);
  });

  it("opens as she left it: folded stays folded", () => {
    draw({ recent, initial: kept({ recent: "folded" }) });
    const region = screen.getByRole("region", { name: "Recent" });
    expect(region.querySelectorAll("[data-tile]")).toHaveLength(0);
    expect(within(region).getAllByRole("link")).toHaveLength(2);
  });

  it("is not drawn when nothing is recent", () => {
    draw();
    expect(screen.queryByRole("region", { name: "Recent" })).toBeNull();
  });
});

describe("an empty list", () => {
  it("draws nothing: the page decides what an account with nothing meets", () => {
    const { container } = draw({ rows: [] });
    expect(container.firstChild).toBeNull();
  });
});
