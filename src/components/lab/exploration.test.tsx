import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CarriedCalls } from "./carried-calls";
import { type Decision, defineExploration } from "./exploration";

/**
 * THE CONSTRUCTOR'S CONTRACT (lab-tides, 2026-09-19).
 *
 * `defineExploration` takes the questions and emits an ordinary `BoardSpec`, so
 * everything downstream (the desk, the walk, the step, the ledger, `lab:review`,
 * `lab:demo`) keeps working with no seam. What is pinned here is what seven
 * boards had to work around by hand, and what a board should not have to know:
 * one knob per id, every other axis drawn as TODAY rather than as somebody's
 * candidate, and the calls the lane carried reaching the page.
 *
 * Nothing about the look is asserted: a contract guards function.
 */
const SCREEN = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375" },
    { id: "1440", label: "1440" },
  ],
  default: "375",
} as const;

const ask = (over: Partial<Decision> & Pick<Decision, "id">): Decision => ({
  question: "Which one?",
  context: "A decision on a real surface.",
  options: [
    { id: "today", label: "As today" },
    { id: "new", label: "The candidate" },
  ],
  recommended: "new",
  ...over,
});

const board = (
  asks: Decision[],
  carried?: Parameters<typeof defineExploration>[0]["carried"],
) =>
  defineExploration({
    id: "fixture",
    title: "A fixture exploration",
    round: { n: 1, date: "2026-09-19", changed: "The first round." },
    asks: asks as unknown as Parameters<typeof defineExploration>[0]["asks"],
    carried,
  });

describe("defineExploration's controls", () => {
  it("declares one knob per id, however many decisions share it", () => {
    const spec = board([
      ask({ id: "head", configs: [SCREEN] }),
      ask({ id: "foot", configs: [SCREEN] }),
      ask({ id: "body", configs: [SCREEN] }),
    ]);
    const screens = (spec.controls ?? []).filter((c) => c.id === "screen");
    expect(screens).toHaveLength(1);
    // Seven boards filtered this by hand; deduping twice is deduping once.
    expect((spec.controls ?? []).map((c) => c.id)).toEqual([
      "head",
      "foot",
      "body",
      "screen",
    ]);
  });

  it("never lets a config displace the derived control of the same id", () => {
    const spec = board([
      ask({
        id: "screen",
        configs: [{ ...SCREEN, label: "A second screen", default: "1440" }],
      }),
    ]);
    const control = (spec.controls ?? []).find((c) => c.id === "screen")!;
    // The derived one wins: it is the channel the step presses through.
    expect(control.options.map((o) => o.id)).toEqual(["today", "new"]);
  });

  /**
   * ★ EVERY OTHER AXIS STARTS AT TODAY. The control's default is the state the
   * board is READ in, so defaulting each to its own recommendation draws the
   * seven decisions around the one being asked already wearing candidates:
   * app-shape caught "one urgency-ordered scroll, AS TODAY" drawn with the
   * candidate share block in it. The step still opens on the recommendation
   * for its OWN question, which is what makes this safe.
   */
  it("starts a decision's control at today when the decision names one", () => {
    const spec = board([
      ask({ id: "head", today: "today" }),
      ask({ id: "foot" }),
    ]);
    const by = (id: string) => (spec.controls ?? []).find((c) => c.id === id)!;
    expect(by("head").default).toBe("today");
    // Left out, nothing changes: every standing board keeps its behaviour.
    expect(by("foot").default).toBe("new");
  });

  it("still recommends what the decision recommends", () => {
    const spec = board([ask({ id: "head", today: "today" })]);
    expect(spec.asks[0].recommended).toBe("new");
  });
});

describe("the calls a lane carried", () => {
  const CALLS = [
    {
      id: "base",
      question: "Should the script refuse to run without a base?",
      taken: "It refuses, and says why.",
      overrule: "One flag per run is the cost; an env var is the same fix.",
    },
    {
      id: "layers",
      question: "Should the lab compile a superset of production's utilities?",
      taken: "No: it changes how every standing board draws.",
      overrule: "A wiring round blocked on a breakpoint would change that.",
    },
  ];

  it("rides the constructor onto the board's spec", () => {
    expect(board([ask({ id: "head" })], CALLS).carried).toEqual(CALLS);
    expect(board([ask({ id: "head" })]).carried).toBeUndefined();
  });

  it("draws one short row per call, with what was taken and what would change it", () => {
    render(<CarriedCalls calls={CALLS} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText(CALLS[0].question)).toBeInTheDocument();
    expect(
      within(rows[0]).getByText(/It refuses, and says why/),
    ).toBeInTheDocument();
    expect(
      within(rows[1]).getByText(/it changes how every standing board draws/),
    ).toBeInTheDocument();
  });

  it("counts against the reading budget: nothing here is folded away", () => {
    const { container } = render(<CarriedCalls calls={CALLS} />);
    // `lab:smoke` weighs what a reviewer MEETS and skips a closed <details>,
    // which is exactly what a lane with fifteen carried calls would reach for.
    expect(container.querySelector("details")).toBeNull();
    expect(container.querySelector("[hidden]")).toBeNull();
  });

  it("renders nothing at all for a board that carried none", () => {
    const { container } = render(<CarriedCalls calls={[]} />);
    expect(container).toBeEmptyDOMElement();
    const { container: none } = render(<CarriedCalls />);
    expect(none).toBeEmptyDOMElement();
  });
});
