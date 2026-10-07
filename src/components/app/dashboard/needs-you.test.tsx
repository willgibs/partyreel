/**
 * ★ A COUNT THAT WAITS ON HER WEARS ONE STATUS, ON EVERY SURFACE (crumbs-87, from event-header-wiring-2). The hub's
 * badges and the code's corner wear `--needs-you` (globals.css: solid and hard-edged, the red the palette already holds),
 * and the dashboard's own marks, the events' rows, the card's review chip and the stage's figures still wore the
 * waiting amber, so one count (people at the door, uploads in Review) read as two colours on two screens. What expired
 * with the amber: a waiting mark in `--warning`, the row's tinted amber pill and the stage's amber figure. What stays:
 * `--warning` itself, which the storage meter and the settings' warnings keep for what is not a person waiting.
 * (The stage's figures are pinned in `stage.test.tsx`, Review's own count in `event-feed/review-section.test.tsx`.)
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EventCard } from "@/components/app/event-card";
import { EventsRowList } from "@/components/app/dashboard/events-row-list";
import { Mark, StateDot } from "@/components/app/dashboard/marks";
import type { EventListRow } from "@/lib/dashboard/events-view";

const NEEDS_YOU = "bg-(--needs-you)";

/** The outer markup of whatever a surface drew, for what it must and must not wear. */
const markup = (el: Element | null) => el?.outerHTML ?? "";

describe("the waiting dot", () => {
  it("wears the needs-you status where someone waits, and an open ring where only a step is left", () => {
    const { container } = render(
      <>
        <StateDot tone="waiting" />
        <StateDot tone="setup" />
      </>,
    );
    const [waiting, setup] = [...container.querySelectorAll("span")];
    expect(waiting?.className).toContain(NEEDS_YOU);
    expect(waiting?.className).not.toContain("warning");
    expect(setup?.className).not.toContain("needs-you");
    expect(setup?.className).toContain("border");
  });

  it("is the one a mark carries", () => {
    render(
      <Mark tone="waiting" on="photo">
        2 at the door
      </Mark>,
    );
    const mark = screen.getByText("2 at the door").closest("[data-mark]");
    expect(markup(mark)).toContain(NEEDS_YOU);
    expect(markup(mark)).not.toContain("warning");
  });
});

describe("the hosted card's review chip", () => {
  it("is the needs-you status, solid, with its own figures' token", () => {
    render(
      <EventCard
        variant="hosted"
        href="/dashboard/e1"
        name="Maya and Jay"
        coverUrl={null}
        dateLabel="June 14"
        pendingCount={3}
      />,
    );
    const chip = screen.getByText("3 to review");
    expect(chip.style.background).toBe("var(--needs-you)");
    expect(chip.style.color).toBe("var(--needs-you-foreground)");
  });
});

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

describe("an events row", () => {
  it("says what waits in a solid needs-you pill with no dot of its own, and a step to set up in the ink", () => {
    render(
      <EventsRowList
        rows={[
          row(),
          row({
            id: "e2",
            name: "Quiet one",
            href: "/dashboard/e2",
            marks: {
              live: false,
              state: { tone: "setup", text: "Print the code" },
            },
          }),
        ]}
      />,
    );
    const pill = screen.getByText("9 to review");
    expect(pill.className).toContain(NEEDS_YOU);
    expect(pill.className).toContain("text-(color:--needs-you-foreground)");
    expect(pill.className).not.toContain("warning");
    expect(pill.querySelector("span")).toBeNull();
    const setup = screen.getByText("Print the code");
    expect(setup.className).not.toContain("needs-you");
  });
});
