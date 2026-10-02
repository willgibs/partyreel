import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EventsSection } from "./events-section";
import type { EventListRow, EventSeason } from "@/lib/dashboard/events-view";

/**
 * THE EVENTS LIST'S CONTRACT (home-wiring, 2026-09-20, `density=cover`: "Let's do both"; grouped by
 * when since host-dashboard r1, `events=seasons`). Functions, never looks:
 *
 *   1. THE VIEW THE SERVER CHOSE IS THE VIEW THAT PAINTS, and flipping it persists through the Server
 *      Action, so the cookie is never decorative.
 *   2. THE ROWS' ORDER REORDERS: "Most waiting" is the order a busy host opens the list to get.
 *   3. THE LENS IS ONE ROW OF COUNTS, the bin reachable from the default view, the events you added to
 *      alone under Guest, each with no act of its own.
 *   4. THE GALLERY GROUPS BY WHEN, each group in the server's order, a folded year one press from open.
 *   5. PAST EIGHT EVENTS A SEARCH FINDS ONE BY NAME, across the groups.
 */

const setEventsViewAction = vi.hoisted(() => vi.fn());
vi.mock("@/app/(app)/dashboard/actions", () => ({ setEventsViewAction }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/components/app/restore-event-button", () => ({
  RestoreEventButton: () => <button type="button">Restore</button>,
}));

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
  seasonId: "coming",
  ...over,
});

const ROWS = [
  row({ id: "quiet", name: "Quiet party" }),
  row({
    id: "busy",
    name: "Busy party",
    pending: 9,
    sortDate: "2026-08-01T00:00:00.000Z",
    seasonId: "recent",
    marks: { live: false, state: { tone: "waiting", text: "9 to review" } },
  }),
  row({
    id: "bin",
    name: "Binned party",
    kind: "deleted",
    href: null,
    seasonId: null,
    statusLabel: "Deletes in 18 days",
  }),
  row({
    id: "friend",
    name: "Friend's wedding",
    kind: "guest",
    href: "/e/qr-friend",
    items: 0,
    statusLabel: null,
    byline: "Hosted by Priya",
    marks: null,
    seasonId: "guest",
    sortDate: "2026-07-01T00:00:00.000Z",
  }),
];

const SEASONS: EventSeason[] = [
  { id: "coming", label: "Coming up", size: "medium", ids: ["quiet"] },
  { id: "recent", label: "Just past", size: "large", ids: ["busy"] },
  { id: "guest", label: "As a guest", size: "medium", ids: ["friend"] },
];

function draw(
  initialView: "cards" | "rows" = "cards",
  rows = ROWS,
  seasons = SEASONS,
) {
  return render(
    <EventsSection
      rows={rows}
      seasons={seasons}
      initialView={initialView}
      title="Everything else"
    />,
  );
}

const view = (name: RegExp) => screen.getByRole("radio", { name });
const lens = (name: RegExp) =>
  within(screen.getByRole("group", { name: "Show" })).getByRole("radio", {
    name,
  });

beforeEach(() => setEventsViewAction.mockClear());

describe("the view the server chose", () => {
  it("paints the gallery when the cookie said cards", () => {
    draw("cards");
    expect(view(/by when/i)).toHaveAttribute("aria-checked", "true");
  });

  it("paints rows when the cookie said rows, without being told twice", () => {
    draw("rows");
    expect(view(/^rows$/i)).toHaveAttribute("aria-checked", "true");
  });

  it("persists a flip both ways through the Server Action", () => {
    draw("cards");
    fireEvent.click(view(/^rows$/i));
    expect(setEventsViewAction).toHaveBeenCalledWith("rows");
    fireEvent.click(view(/by when/i));
    expect(setEventsViewAction).toHaveBeenCalledWith("cards");
  });
});

describe("the rows' order", () => {
  it("reorders the list by what is waiting", () => {
    draw("rows");
    const names = () =>
      screen
        .getAllByRole("listitem")
        .map((li) => li.textContent ?? "")
        .filter((t) => t.includes("party"));
    expect(names()[0]).toContain("Quiet party");
    // Radix menus open on pointerdown, never on a plain click.
    fireEvent.pointerDown(screen.getByRole("button", { name: /newest/i }), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.click(
      screen.getByRole("menuitemradio", { name: /most waiting/i }),
    );
    expect(names()[0]).toContain("Busy party");
  });

  it("offers no order in the gallery, which keeps its one order, by when", () => {
    draw("cards");
    expect(screen.queryByRole("button", { name: /newest/i })).toBeNull();
  });
});

describe("the lens", () => {
  it("counts every lens at once and keeps the bin out of the live list", () => {
    draw("cards");
    expect(lens(/^all, 3$/i)).toHaveAttribute("aria-checked", "true");
    expect(lens(/^hosting, 2$/i)).toBeInTheDocument();
    expect(lens(/^guest, 1$/i)).toBeInTheDocument();
    expect(lens(/^deleted, 1$/i)).toBeInTheDocument();
    expect(screen.queryByText("Binned party")).toBeNull();
  });

  it("reaches the bin from the DEFAULT view, with its Restore", () => {
    draw("cards");
    fireEvent.click(lens(/^deleted/i));
    expect(screen.getByText("Binned party")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /restore/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Quiet party")).toBeNull();
  });

  it("shows the events you added to alone under Guest, with no act of their own", () => {
    draw("cards");
    fireEvent.click(lens(/^guest/i));
    expect(screen.getByText("Friend's wedding")).toBeInTheDocument();
    expect(screen.queryByText("Quiet party")).toBeNull();
    expect(screen.queryByRole("button", { name: /restore/i })).toBeNull();
    expect(
      screen.getByRole("link", { name: /friend's wedding/i }),
    ).toHaveAttribute("href", "/e/qr-friend");
  });

  it("leaves a lens with nothing in it out of the row", () => {
    draw("cards", [ROWS[0]!], [SEASONS[0]!]);
    expect(
      within(screen.getByRole("group", { name: "Show" })).getAllByRole("radio"),
    ).toHaveLength(2);
  });
});

describe("the gallery by when", () => {
  it("draws each group in the server's order, its tiles with their marks", () => {
    draw("cards");
    const groups = screen
      .getAllByRole("region")
      .map((r) => r.getAttribute("aria-label"));
    expect(groups).toEqual([
      "Everything else",
      "Coming up",
      "Just past",
      "As a guest",
    ]);
    expect(screen.getAllByText("9 to review").length).toBeGreaterThan(0);
  });

  it("folds an earlier year into one line whose Show opens it in place", () => {
    const years = Array.from({ length: 3 }, (_, i) =>
      row({ id: `y${i}`, name: `Old party ${i}`, seasonId: "year-2025" }),
    );
    draw("cards", years, [
      {
        id: "year-2025",
        label: "2025",
        size: "folded",
        ids: years.map((r) => r.id),
      },
    ]);
    const show = screen.getByRole("button", { name: /show 3/i });
    expect(show).toHaveAttribute("aria-expanded", "false");
    // Folded, each cover is still one press from its event.
    expect(screen.getByRole("link", { name: "Old party 1" })).toHaveAttribute(
      "href",
      "/dashboard/e",
    );
    fireEvent.click(show);
    expect(screen.getByRole("button", { name: /fold/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});

describe("the search", () => {
  const many = Array.from({ length: 9 }, (_, i) =>
    row({ id: `p${i}`, name: i === 4 ? "Ángela's Wedding" : `Party ${i}` }),
  );
  const one: EventSeason[] = [
    {
      id: "coming",
      label: "Coming up",
      size: "medium",
      ids: many.map((r) => r.id),
    },
  ];

  it("arrives past eight events and finds one by name, accents aside", () => {
    draw("cards", many, one);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "angela" },
    });
    expect(screen.getByText("Ángela's Wedding")).toBeInTheDocument();
    expect(screen.queryByText("Party 1")).toBeNull();
  });

  it("is not drawn for a handful", () => {
    draw("cards");
    expect(screen.queryByRole("searchbox")).toBeNull();
  });
});

describe("an empty list", () => {
  it("draws nothing: the page decides what an account with nothing meets", () => {
    const { container } = draw("cards", [], []);
    expect(container.firstChild).toBeNull();
  });
});
