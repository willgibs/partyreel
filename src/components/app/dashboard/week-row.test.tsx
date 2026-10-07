import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WeekRow, weekTally } from "./week-row";
import type { Item } from "@/lib/dashboard/attention";
import type { WeekCard } from "@/lib/dashboard/home-view";

/**
 * THIS WEEK (host-dashboard r1, `needs=week`): each party near its date with its one act, or its quiet
 * state, and the row's count of what needs her. Function, never look.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/components/app/share/code-card", () => ({
  CodeCard: ({ trigger }: { trigger: React.ReactNode }) => trigger,
  readableLink: (url: string) => url,
}));

const share = { joinUrl: "https://partyreel.com/e/tok", qrStyle: "classic" };
const card = (over: Partial<WeekCard>): WeekCard => ({
  id: "e1",
  name: "Ines & Tom's Wedding",
  href: "/dashboard/e1",
  when: "Tomorrow",
  coverUrl: null,
  face: { weekday: "Sat", month: "Oct", day: "3" },
  live: false,
  item: null,
  quiet: "Ready for guests",
  share,
  ...over,
});

describe("WeekRow", () => {
  it("★ says a range's when with its 'to' at a desk and in a hand (Q2)", () => {
    const { container } = render(
      <WeekRow cards={[card({ when: "Fri–Sun" })]} />,
    );
    // Once under the name at a desk, once in the line a phone reads: both carry the hidden "to".
    expect(container.querySelectorAll(".sr-only")).toHaveLength(2);
    for (const to of container.querySelectorAll(".sr-only")) {
      expect(to.textContent?.trim()).toBe("to");
    }
  });

  it("draws nothing for a week with no other party", () => {
    const { container } = render(<WeekRow cards={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("gives each party its act where it asks for one, and its quiet state where it does not", () => {
    render(
      <WeekRow
        cards={[
          card({
            id: "a",
            name: "Wedding",
            item: {
              kind: "print",
              eventId: "a",
              line: "Print the code",
              short: "Print the code",
              act: "Print",
              to: "print",
              tone: "setup",
            },
          }),
          card({
            id: "b",
            name: "Gala",
            when: "Sat, Sep 26",
            item: {
              kind: "review",
              eventId: "b",
              line: "18 uploads to review",
              short: "18 to review",
              act: "Review",
              to: "review",
              tone: "waiting",
            },
          }),
          card({ id: "c", name: "Christening" }),
        ]}
      />,
    );
    expect(screen.getByText("2 of 3 need you")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Print" })).toHaveAttribute(
      "href",
      "/dashboard/a/print",
    );
    // Review stands over the hub (event-header r2, `rooms=over`): the hub's own address with the room on it.
    expect(screen.getByRole("link", { name: "Review" })).toHaveAttribute(
      "href",
      "/dashboard/b?room=review",
    );
    const quiet = screen.getByText("Christening").closest("li")!;
    expect(
      within(quiet).getAllByText(/Ready for guests/).length,
    ).toBeGreaterThan(0);
    expect(within(quiet).queryByRole("button")).toBeNull();
  });

  it("says nothing needs her when nothing does", () => {
    render(<WeekRow cards={[card({})]} />);
    expect(screen.getByText("Nothing needs you")).toBeInTheDocument();
  });

  it("★ counts the stage's own event among the week's parties, which stands above the cards and so is not one", () => {
    render(
      <WeekRow
        cards={[card({}), card({ id: "e2", name: "Christening" })]}
        stage={{ inWeek: true, needsYou: true }}
      />,
    );
    // Three parties this week, one of them on the stage, and it is the one asking: never "Nothing needs you".
    expect(screen.getByText("1 of 3 needs you")).toBeInTheDocument();
    expect(screen.queryByText("Nothing needs you")).toBeNull();
  });
});

describe("weekTally", () => {
  const asks: Item = {
    kind: "review",
    eventId: "x",
    line: "9 uploads to review",
    short: "9 to review",
    act: "Review",
    to: "review",
    tone: "waiting",
  };
  const quiet = card({});
  const asking = card({ id: "e2", item: asks });

  it.each([
    // The cards alone, as before the stage was counted.
    ["no stage, nobody asks", [quiet], null, "Nothing needs you"],
    ["no stage, one asks", [quiet, asking], null, "1 of 2 needs you"],
    ["no stage, two ask", [asking, asking], null, "2 of 2 need you"],
    // The stage is one of the week's parties: counted, and counted as asking only where it does.
    [
      "the week's stage, quiet",
      [quiet],
      { inWeek: true, needsYou: false },
      "Nothing needs you",
    ],
    [
      "the week's stage asks, nobody else does",
      [quiet],
      { inWeek: true, needsYou: true },
      "1 of 2 needs you",
    ],
    [
      "the week's stage asks, and so does a card",
      [asking, quiet],
      { inWeek: true, needsYou: true },
      "2 of 3 need you",
    ],
    // A stage that is not the week's (a far party, an undated album busy today) is not counted, but it still asks.
    [
      "a stage outside the week asks, the cards are quiet",
      [quiet],
      { inWeek: false, needsYou: true },
      "Nothing else needs you",
    ],
    [
      "a stage outside the week asks, and a card does",
      [asking, quiet],
      { inWeek: false, needsYou: true },
      "1 of 2 needs you",
    ],
    [
      "a stage outside the week, quiet",
      [quiet],
      { inWeek: false, needsYou: false },
      "Nothing needs you",
    ],
  ] as const)("%s", (_name, cards, stage, words) => {
    expect(weekTally(cards, stage)).toBe(words);
  });
});
