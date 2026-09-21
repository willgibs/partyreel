// @contract-for: src/components/app/dashboard/next-step-band.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NextStepBand } from "./next-step-band";
import type { NextStep } from "@/lib/dashboard/next-step";

/**
 * THE BAND'S FOLD, PINNED (`busy=collapsed`, app-shape round two, 2026-09-20):
 * a genuinely busy host's band shows the top three by tone and folds the rest
 * behind one "N more" chip that expands in place, `aria-expanded` on the
 * control. Three things are contract and none of them is wording: the band
 * never renders as a void, three or fewer steps show with no fold control at
 * all, and past three the control both discloses and reverses.
 */

const step = (over: Partial<NextStep>): NextStep => ({
  kind: "review",
  eventId: "e",
  label: "Event",
  short: "short",
  href: "/dashboard/e",
  tone: "quiet",
  ...over,
});

describe("a settled band", () => {
  it("reads calm rather than rendering nothing", () => {
    render(<NextStepBand steps={[]} />);
    expect(screen.getByText(/nothing needs you/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("a band of three or fewer", () => {
  it("shows every step with no fold control", () => {
    render(
      <NextStepBand
        steps={[
          step({ eventId: "a", label: "A" }),
          step({ eventId: "b", label: "B" }),
        ]}
      />,
    );
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("a busy band, past three", () => {
  // Maya's Saturday: two queues waiting, a shelf at 96%, three quiet
  // suggestions — six steps, ranked to exactly Will's picture.
  const busy: NextStep[] = [
    step({ eventId: "wedding", label: "A", tone: "waiting" }),
    step({ eventId: "trivia", label: "B", tone: "waiting" }),
    step({ eventId: "rooftop", label: "C", tone: "quiet", kind: "reel" }),
    step({ eventId: "sixtieth", label: "D", tone: "quiet", kind: "paused" }),
    step({ eventId: "bonfire", label: "E", tone: "quiet", kind: "print" }),
    step({ eventId: null, label: "F", tone: "warning", kind: "storage" }),
  ];

  it("folds to the top three by tone, behind a closed count", () => {
    render(<NextStepBand steps={busy} />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("A"),
        expect.stringContaining("B"),
        expect.stringContaining("F"),
      ]),
    );
    expect(links).toHaveLength(3);

    const toggle = screen.getByRole("button", { name: /3 more/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("expands in place on a click, and the control reflects it", () => {
    render(<NextStepBand steps={busy} />);
    fireEvent.click(screen.getByRole("button", { name: /3 more/i }));

    expect(screen.getAllByRole("link")).toHaveLength(6);
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });

  it("reverses on a second click", () => {
    render(<NextStepBand steps={busy} />);
    const toggle = screen.getByRole("button");
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
