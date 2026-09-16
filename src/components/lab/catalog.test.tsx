// @contract-for: src/components/lab/catalog.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  EMPTY_REVIEW,
  getReviewStore,
  setReviewStore,
} from "@/app/(dev)/design/(shell)/lab/_desk/review-store";
import { itemHoldId } from "@/app/(dev)/design/(shell)/lab/_desk/step-id";

import { type BoardSpec, defineBoard } from "./board-spec";
import { Catalog } from "./catalog";

/**
 * THE CATALOG'S CONTRACT (the revamp, 2026-09-16).
 *
 * What is pinned is what makes a catalog a catalog rather than a grid of
 * pictures: one card per declared candidate, every control on a card driving a
 * PAGE-WIDE declared control (Will, 2026-09-16: "the GUI control should be
 * fixed so that variants can be toggled on different previews anywhere on the
 * page"), a pick that can be unpicked, and the reviewer's verdict row on every
 * card. Nothing about the grid, the spacing or the card's look is asserted:
 * that is precedent and the next round may rebuild it.
 */
const SPEC: BoardSpec = defineBoard({
  id: "fixture",
  title: "A fixture board",
  question: "Which of these?",
  round: { n: 2, date: "2026-09-16", changed: "the first round" },
  verdict: { recommendation: "The first one.", because: "It is." },
  asks: [],
  candidates: [
    {
      id: "one",
      name: "The first",
      one: "What the first one is.",
      verdict: "ship",
      recommended: true,
      facts: [["Cost", "nothing"]],
      rationale: "Why the first might win.",
      library: "button",
    },
    {
      id: "two",
      name: "The second",
      one: "What the second one is.",
      verdict: "kill",
      rationale: "Why the second might not.",
      library: "not-a-component",
    },
  ],
  departures: [],
  assets: [],
  sections: [{ id: "catalog", title: "The catalog", lede: "The two." }],
  catalog: {
    section: "catalog",
    control: "pick",
    compare: ["compare-a", "compare-b"],
  },
  controls: [
    {
      id: "pick",
      label: "Pick",
      options: [
        { id: "none", label: "Nothing picked" },
        { id: "one", label: "The first" },
        { id: "two", label: "The second" },
      ],
      default: "none",
      clearable: true,
    },
    {
      id: "compare-a",
      label: "A",
      options: [
        { id: "one", label: "The first" },
        { id: "two", label: "The second" },
      ],
      default: "one",
    },
    {
      id: "compare-b",
      label: "B",
      options: [
        { id: "one", label: "The first" },
        { id: "two", label: "The second" },
      ],
      default: "two",
    },
  ],
  links: { bible: [] },
});

function grid(
  state: Record<string, string> = { pick: "none" },
  setState = vi.fn(),
) {
  const result = render(
    <Catalog
      spec={SPEC}
      state={state}
      setState={setState}
      render={(candidate) => <p>preview of {candidate.name}</p>}
    />,
  );
  return { ...result, setState };
}

beforeEach(() => {
  setReviewStore(EMPTY_REVIEW);
});

describe("the catalog", () => {
  it("draws one card per declared candidate, with its own line and verdict", () => {
    grid();
    for (const c of SPEC.candidates) {
      expect(screen.getByText(c.name)).toBeInTheDocument();
      expect(screen.getByText(c.one!)).toBeInTheDocument();
      expect(screen.getByText(`preview of ${c.name}`)).toBeInTheDocument();
    }
    // The builder's own call, as the card's pill. "kill" is also a verdict
    // button on every row, so the pill is found by its own element.
    const pills = screen
      .getAllByText(/^(ship|refine|kill)$/)
      .filter((el) => el.tagName === "SPAN")
      .map((el) => el.textContent);
    expect(pills).toEqual(["ship", "kill"]);
  });

  it("folds the rationale away, because a catalog is read by looking", () => {
    grid();
    const fold = screen.getAllByText("Why it might win")[0].closest("details");
    expect(fold).not.toBeNull();
    expect(fold).not.toHaveAttribute("open");
  });

  it("marks the preview a specimen, so the reading budget counts what is read", () => {
    // pnpm lab:smoke skips `data-lab-specimen`; a preview counted as prose
    // would make every catalog board read as a paper.
    const { container } = grid();
    expect(container.querySelectorAll("[data-lab-specimen]").length).toBe(
      SPEC.candidates.length,
    );
  });

  it("picks into the board's declared control, never into the card", async () => {
    const { setState } = grid();
    await userEvent.click(
      screen.getByRole("button", { name: /^Pick The first/ }),
    );
    expect(setState).toHaveBeenCalledWith({ pick: "one" });
  });

  it("unpicks the picked card back to a clearable control's default", async () => {
    const { setState } = grid({ pick: "one" });
    await userEvent.click(
      screen.getByRole("button", { name: /^Pick The first/ }),
    );
    expect(setState).toHaveBeenCalledWith({ pick: "none" });
  });

  it("puts a card on either side of the comparison below", async () => {
    const { setState } = grid();
    await userEvent.click(
      screen.getByRole("button", {
        name: "Put The first on side A of the comparison",
      }),
    );
    await userEvent.click(
      screen.getByRole("button", {
        name: "Put The second on side B of the comparison",
      }),
    );
    expect(setState).toHaveBeenNthCalledWith(1, { "compare-a": "one" });
    expect(setState).toHaveBeenNthCalledWith(2, { "compare-b": "two" });
  });

  it("rules a card where it stands, under the board's own round", async () => {
    grid();
    await userEvent.click(
      screen.getByRole("button", { name: "refine: The first" }),
    );
    expect(
      getReviewStore().items[itemHoldId("fixture", SPEC.round.n, "one")],
    ).toEqual({ verdict: "refine", note: "" });
  });

  it("links a card to the Library only once its entry really exists", () => {
    grid();
    const links = screen.getAllByRole("link", { name: "now in the Library" });
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toContain("/design/library/button");
  });

  it("draws nothing at all for a board that declares no catalog", () => {
    const { container } = render(
      <Catalog
        spec={{ ...SPEC, catalog: undefined }}
        state={{}}
        setState={vi.fn()}
        render={() => <p>never</p>}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
