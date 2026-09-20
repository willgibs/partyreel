// @contract-for: src/components/app/dashboard/events-section.tsx
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EventsSection } from "./events-section";
import type { EventListRow } from "@/lib/dashboard/events-view";

/**
 * THE EVENTS LIST'S CONTRACT (home-wiring, 2026-09-20), from `density=cover`:
 * "Let's do both... a toggle opposite 'your events' (aligned right side)."
 *
 * Four functions are pinned, and not one of them is a look:
 *
 *   1. THE VIEW THE SERVER CHOSE IS THE VIEW THAT PAINTS. `initialView` comes
 *      from a cookie read during render; if this component ignored it and
 *      started on its own default, the cookie would be decorative and every
 *      cold load would flip the list after hydration, which is the exact
 *      failure the cookie exists to prevent.
 *   2. FLIPPING IT PERSISTS. The toggle calls the Server Action. Without this
 *      the choice survives until the next navigation and no further.
 *   3. THE SORT REORDERS. "Most waiting" is the order a host with several
 *      events opens this list to get.
 *   4. THE BIN IS A LENS ON THIS LIST, NOT A CHIP ROW, and it is reachable
 *      from the DEFAULT view — a filter that only existed in the row view
 *      would leave a cover-cards host with no door to their own bin.
 *
 * Labels, icons and chrome are precedent: a contract guards function, never
 * look, and never pins copy.
 */

const setEventsViewAction = vi.hoisted(() => vi.fn());
vi.mock("@/app/(app)/dashboard/actions", () => ({ setEventsViewAction }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
// The card's QR chip opens the share dialog, which drags in a live QR renderer;
// this test is about the list, not the chip.
vi.mock("@/components/app/event-card-qr", () => ({
  EventCardQr: () => <span data-testid="qr" />,
}));
vi.mock("@/components/app/unsave-button", () => ({
  UnsaveButton: () => <button type="button">Unsave</button>,
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
  dateLabel: "No date set",
  sortDate: "2026-09-01T00:00:00.000Z",
  items: 3,
  guests: null,
  pending: 0,
  statusLabel: "Open",
  byline: null,
  needs: null,
  qr: { token: "t", style: "classic" },
  ...over,
});

const ROWS = [
  row({ id: "quiet", name: "Quiet party", pending: 0 }),
  row({
    id: "busy",
    name: "Busy party",
    pending: 9,
    sortDate: "2026-08-01T00:00:00.000Z",
  }),
  row({ id: "bin", name: "Binned party", kind: "deleted", href: null }),
];

function draw(initialView: "cards" | "rows" = "cards") {
  return render(
    <EventsSection
      rows={ROWS}
      newestByEvent={new Map()}
      initialView={initialView}
      siteUrl="https://partyreel.com"
    />,
  );
}

/** The toggle's two buttons, by their accessible names. */
const cardsButton = () => screen.getByRole("radio", { name: /cover cards/i });
const rowsButton = () => screen.getByRole("radio", { name: /^rows$/i });

/** Radix menus open on pointerdown, not click (the profile menu's test says so
 *  too). A plain click never opens them and the assertion that follows reads as
 *  "the menu has no items" rather than "the menu never opened". */
function openMenu(name: RegExp) {
  fireEvent.pointerDown(screen.getByRole("button", { name }), {
    ctrlKey: false,
    button: 0,
  });
}

beforeEach(() => setEventsViewAction.mockClear());

describe("the view the server chose", () => {
  it("paints cards when the cookie said cards", () => {
    draw("cards");
    expect(cardsButton()).toHaveAttribute("aria-checked", "true");
  });

  it("paints rows when the cookie said rows, without being told twice", () => {
    draw("rows");
    expect(rowsButton()).toHaveAttribute("aria-checked", "true");
  });
});

describe("flipping the view", () => {
  it("persists the choice through the Server Action", () => {
    draw("cards");
    fireEvent.click(rowsButton());
    expect(setEventsViewAction).toHaveBeenCalledWith("rows");
    expect(rowsButton()).toHaveAttribute("aria-checked", "true");
  });

  it("persists the way back too", () => {
    draw("rows");
    fireEvent.click(cardsButton());
    expect(setEventsViewAction).toHaveBeenCalledWith("cards");
  });
});

describe("the order", () => {
  it("reorders the list by what is waiting", () => {
    draw("rows");
    const names = () =>
      screen
        .getAllByRole("listitem")
        .map((li) => li.textContent ?? "")
        .filter((t) => t.includes("party"));

    // Newest first to begin with: the quiet party is the more recent row.
    expect(names()[0]).toContain("Quiet party");

    openMenu(/newest/i);
    fireEvent.click(screen.getByRole("menuitemradio", { name: /most waiting/i }));
    expect(names()[0]).toContain("Busy party");
  });

  it("offers the order with the rows, where he expects it", () => {
    draw("cards");
    expect(screen.queryByRole("button", { name: /newest/i })).toBeNull();
  });
});

describe("the lens", () => {
  it("keeps the bin out of the live list", () => {
    draw("cards");
    expect(screen.queryByText("Binned party")).toBeNull();
    expect(screen.getByText("Quiet party")).toBeInTheDocument();
  });

  it("reaches the bin from the DEFAULT view, not only from the rows", () => {
    draw("cards");
    openMenu(/all events/i);
    fireEvent.click(screen.getByRole("menuitemradio", { name: /deleted/i }));
    expect(screen.getByText("Binned party")).toBeInTheDocument();
    expect(screen.queryByText("Quiet party")).toBeNull();
  });

  it("offers the create hero only to a host with nothing at all", () => {
    const { container } = render(
      <EventsSection
        rows={[]}
        newestByEvent={new Map()}
        initialView="cards"
        siteUrl="https://partyreel.com"
      />,
    );
    expect(within(container).getByText(/your events land here/i)).toBeInTheDocument();
  });
});
