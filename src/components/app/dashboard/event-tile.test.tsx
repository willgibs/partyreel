import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EventTile } from "./event-tile";
import type { EventListRow } from "@/lib/dashboard/events-view";

/**
 * AN EVENT'S TILE (host-dashboard r1, the carried `tile` call): its photograph or its date, its name and
 * when, at most a mark in each top corner. Pinned as function: what a tile carries and what it no
 * longer does (the QR chip and the pills moved off), never how it looks.
 */

const row = (over: Partial<EventListRow> = {}): EventListRow => ({
  id: "e1",
  kind: "hosted",
  name: "Ines & Tom's Wedding",
  href: "/dashboard/e1",
  coverUrl: null,
  stills: [],
  dateLabel: "October 3, 2026",
  when: "Tomorrow",
  face: { weekday: "Sat", month: "Oct", day: "3" },
  sortDate: "2026-09-01T00:00:00.000Z",
  items: 0,
  pending: 0,
  waiting: 0,
  statusLabel: "Open",
  byline: null,
  marks: { live: false, state: null },
  day: "2026-10-03",
  dated: true,
  openedAt: null,
  ...over,
});

describe("a hosted tile", () => {
  it("opens its event and says its name and when, its date face before a photograph", () => {
    const { container } = render(<EventTile row={row()} size="md" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/dashboard/e1");
    expect(screen.getByText("Ines & Tom's Wedding")).toBeInTheDocument();
    expect(screen.getByText("Tomorrow")).toBeInTheDocument();
    expect(
      container
        .querySelector("[data-tile-face]")
        ?.getAttribute("data-tile-face"),
    ).toBe("date");
    expect(screen.getByText("Sat · Oct")).toBeInTheDocument();
  });

  it("★ carries no QR chip and no pills: no Open, no item count, no date pill", () => {
    render(
      <EventTile row={row({ items: 12, statusLabel: "Open" })} size="md" />,
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByText("Open")).toBeNull();
    expect(screen.queryByText(/items/)).toBeNull();
    expect(screen.queryByText("October 3, 2026")).toBeNull();
  });

  it("wears Live and its one state, in words where it has room and as a dot where it has not", () => {
    render(
      <EventTile
        row={row({
          marks: {
            live: true,
            state: { tone: "waiting", text: "2 at the door" },
          },
        })}
        size="md"
      />,
    );
    // Both forms are drawn; a container query shows one. The dot keeps the words for a reader.
    expect(screen.getByText("2 at the door")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "2 at the door" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Live" })).toBeInTheDocument();
  });

  it("keeps a thumbnail's state as a dot alone", () => {
    render(
      <EventTile
        row={row({
          marks: {
            live: false,
            state: { tone: "setup", text: "Print the code" },
          },
        })}
        size="sm"
      />,
    );
    expect(screen.queryByText("Print the code")).toBeNull();
    expect(
      screen.getByRole("img", { name: "Print the code" }),
    ).toBeInTheDocument();
  });

  it("says No date for an undated album with nothing in it", () => {
    const { container } = render(
      <EventTile row={row({ face: null, when: "No date" })} size="md" />,
    );
    expect(
      container
        .querySelector("[data-tile-face]")
        ?.getAttribute("data-tile-face"),
    ).toBe("undated");
  });
});

describe("a guest tile and a binned one", () => {
  it("marks the events you added to as Guest, its host's name under it", () => {
    render(
      <EventTile
        row={row({
          kind: "guest",
          href: "/e/qr-1",
          byline: "Hosted by Priya",
          marks: null,
          coverUrl: "https://r2.test/c.webp",
        })}
        size="md"
      />,
    );
    expect(screen.getByText("Guest")).toBeInTheDocument();
    expect(screen.getByText("Hosted by Priya")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/e/qr-1");
  });

  it("locks a guest album its host closed: no link, no cover", () => {
    const { container } = render(
      <EventTile
        row={row({
          kind: "guest",
          href: null,
          name: "Private event",
          marks: null,
        })}
        size="md"
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(
      container
        .querySelector("[data-tile-face]")
        ?.getAttribute("data-tile-face"),
    ).toBe("locked");
  });

  it("holds a binned event's countdown and its Restore, and opens nothing", () => {
    render(
      <EventTile
        row={row({
          kind: "deleted",
          href: null,
          marks: null,
          statusLabel: "Deletes in 18 days",
          coverUrl: "https://r2.test/c.webp",
        })}
        size="md"
        action={<button type="button">Restore</button>}
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByRole("button", { name: "Restore" })).toBeInTheDocument();
    expect(screen.getByText(/Deletes in 18 days/)).toBeInTheDocument();
  });
});
