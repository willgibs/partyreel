/**
 * ★ THE TABLE'S PHONE LINE SAYS WHAT WAITS THE WAY ITS DESK COLUMN DOES (crumbs-91, red-team 57b's NIT). At a phone the
 * Waiting column is hidden and what waits folds under the name with the date, and that line said it in words alone, so
 * the 375 Table was the one dashboard view where a count that waits on her wore no needs-you mark (the List's pill and
 * Recent's dot kept theirs). The fold wears the column's dot now, only where a hosted row waits on her, before the same
 * words; a step to set up, a quiet row, a guest's album and the bin wear none. Which box shows at which width is the
 * breakpoint's, read off the classes that make it (`sm:hidden` the phone's, `max-sm:hidden` the desk's), since jsdom
 * runs no media query. (The dot's own status is `needs-you.test.tsx`'s.)
 */
import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EventsTable } from "@/components/app/dashboard/events-table";
import type { EventListRow } from "@/lib/dashboard/events-view";

const DOT = '[class*="bg-(--needs-you)"]';
/** The line under the name shows below `sm` only; the desk's columns above it only. */
const PHONE = '[class~="sm:hidden"]';
const DESK = '[class~="max-sm:hidden"]';

function row(over: Partial<EventListRow> = {}): EventListRow {
  return {
    id: "e1",
    kind: "hosted",
    name: "Maya and Jay",
    href: "/dashboard/e1",
    coverUrl: null,
    stills: [],
    dateLabel: "June 14, 2026",
    when: "Today",
    face: null,
    sortDate: "2026-06-14T00:00:00Z",
    items: 12,
    pending: 9,
    waiting: 0,
    statusLabel: "Open",
    byline: null,
    marks: { live: false, state: { tone: "waiting", text: "9 to review" } },
    day: "2026-06-14",
    dated: true,
    openedAt: null,
    ...over,
  };
}

function table(rows: EventListRow[]) {
  render(<EventsTable rows={rows} sort="date" desc onSort={() => {}} />);
}

const lineOf = (id: string) =>
  document.querySelector<HTMLElement>(`[data-event-line="${id}"]`)!;
const phoneLineOf = (id: string) =>
  lineOf(id).querySelector<HTMLElement>(PHONE)!;

describe("a row that waits on her, at a phone", () => {
  it("★ wears the Waiting column's needs-you dot under its name, before the same words in the ink", () => {
    table([row()]);
    const phone = phoneLineOf("e1");
    const dots = phone.querySelectorAll(DOT);
    expect(dots).toHaveLength(1);
    const dot = dots[0]!;
    const words = within(phone).getByText("9 to review");
    expect(
      dot.compareDocumentPosition(words) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // The red is the dot's, as on every mark: the words stay in the ink.
    expect(words).toHaveClass("text-foreground");
    expect(words.className).not.toContain("needs-you");

    // The desk's column wears the same dot, at the same size.
    const column = [...lineOf("e1").querySelectorAll<HTMLElement>(DESK)].find(
      (box) => box.textContent?.includes("9 to review"),
    )!;
    const deskDots = column.querySelectorAll(DOT);
    expect(deskDots).toHaveLength(1);
    expect(dot).toHaveClass("size-1.5");
    expect(deskDots[0]).toHaveClass("size-1.5");
  });

  it("reads as it did: the dot is a mark, never a word", () => {
    table([row()]);
    const phone = phoneLineOf("e1");
    expect(phone.querySelector(DOT)).toHaveAttribute("aria-hidden", "true");
    expect(phone.textContent).toBe("June 14, 2026 · 9 to review");
  });

  it("keeps the words after the date of an undated row too", () => {
    table([row({ dateLabel: "No date set", dated: false })]);
    const phone = phoneLineOf("e1");
    expect(phone.querySelectorAll(DOT)).toHaveLength(1);
    expect(phone.textContent).toBe("No date · 9 to review");
  });
});

describe("a row that does not wait on her", () => {
  it("wears no dot at either width: a step to set up, a quiet row, a guest's album and the bin", () => {
    table([
      row({
        id: "setup",
        marks: {
          live: false,
          state: { tone: "setup", text: "Print the code" },
        },
      }),
      row({ id: "quiet", pending: 0, marks: { live: false, state: null } }),
      row({
        id: "guest",
        kind: "guest",
        href: "/e/tok",
        byline: "Hosted by Ana",
        statusLabel: null,
        marks: null,
      }),
      row({
        id: "bin",
        kind: "deleted",
        href: null,
        statusLabel: "Deleted · 29 days left",
        marks: null,
      }),
    ]);
    expect(document.querySelectorAll(DOT)).toHaveLength(0);
    // Each phone line still says what it said: the date, the album's host, the bin's countdown.
    expect(phoneLineOf("setup").textContent).toBe("June 14, 2026");
    expect(phoneLineOf("quiet").textContent).toBe("June 14, 2026");
    expect(phoneLineOf("guest").textContent).toBe("Hosted by Ana");
    expect(phoneLineOf("bin").textContent).toBe("Deleted · 29 days left");
  });
});
